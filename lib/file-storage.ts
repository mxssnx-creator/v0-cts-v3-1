import fs from "fs"
import path from "path"
import { nanoid } from "nanoid"

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const DATA_DIR = IS_SERVERLESS ? path.join("/tmp", "data") : path.join(process.cwd(), "data")

const CONNECTIONS_FILE = path.join(DATA_DIR, "connections.json")
const ACTIVE_CONNECTIONS_FILE = path.join(DATA_DIR, "active-connections.json")
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json")
const MAIN_INDICATIONS_FILE = path.join(DATA_DIR, "main-indications.json")
const COMMON_INDICATIONS_FILE = path.join(DATA_DIR, "common-indications.json")

let memoryConnections: Connection[] | null = null
let memoryActiveConnections: Connection[] | null = null
let memorySettings: Settings | null = null

const connectionCache = new Map<string, { data: Connection[]; timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      console.log("[v0] Created data directory:", DATA_DIR)
    }
  } catch (error) {
    console.error("[v0] Error creating data directory:", error)
    // Don't throw - we'll use memory storage
  }
}

function getFromCache(key: string): Connection[] | null {
  const cached = connectionCache.get(key)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    connectionCache.delete(key)
    return null
  }

  return cached.data
}

function setInCache(key: string, data: Connection[]): void {
  connectionCache.set(key, { data, timestamp: Date.now() })

  // Cleanup old cache entries (keep only last 50)
  if (connectionCache.size > 50) {
    const entries = Array.from(connectionCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, entries.length - 50)
    toRemove.forEach(([key]) => connectionCache.delete(key))
  }
}

export function loadConnections(): Connection[] {
  try {
    if (memoryConnections && memoryConnections.length > 0) {
      console.log("[v0] Loaded", memoryConnections.length, "connections from memory")
      return memoryConnections
    }

    // Check cache
    const cached = getFromCache("all_connections")
    if (cached && cached.length > 0) {
      console.log("[v0] Loaded", cached.length, "connections from cache")
      memoryConnections = cached
      return cached
    }

    // Try file system
    ensureDataDir()
    if (fs.existsSync(CONNECTIONS_FILE)) {
      try {
        const data = fs.readFileSync(CONNECTIONS_FILE, "utf-8")
        if (data && data.trim()) {
          const connections = JSON.parse(data)
          if (Array.isArray(connections) && connections.length > 0) {
            console.log("[v0] Loaded", connections.length, "connections from file")
            memoryConnections = connections
            setInCache("all_connections", connections)
            return connections
          }
        }
      } catch (parseError) {
        console.error("[v0] Error parsing connections file:", parseError)
      }
    }

    console.log("[v0] No valid connections found, initializing with defaults")
    const defaults = getDefaultConnections()
    memoryConnections = defaults
    setInCache("all_connections", defaults)

    // Try to persist to file but don't fail if it doesn't work
    try {
      ensureDataDir()
      fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(defaults, null, 2), "utf-8")
      console.log("[v0] Saved default connections to file")
    } catch (writeError) {
      console.log("[v0] Could not persist defaults to file (serverless mode)")
    }

    return defaults
  } catch (error) {
    console.error("[v0] Error loading connections:", error)
    return []
  }
}

export function saveConnections(connections: Connection[]): void {
  memoryConnections = connections
  setInCache("all_connections", connections)
  connectionCache.clear()
  setInCache("all_connections", connections)

  // Try to persist to file
  try {
    ensureDataDir()
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), "utf-8")
    console.log("[v0] Saved", connections.length, "connections to file")
  } catch (error) {
    console.log("[v0] Could not save to file (serverless mode), saved to memory")
    // Don't throw - memory storage is sufficient for current session
  }
}

export function checkDuplicateApiKey(apiKey: string, excludeId?: string): Connection | null {
  if (!apiKey || apiKey.trim() === "") return null

  const connections = loadConnections()
  return connections.find((c) => c.api_key === apiKey && c.api_key !== "" && c.id !== excludeId) || null
}

export function loadSettings(): Settings {
  try {
    if (memorySettings && Object.keys(memorySettings).length > 0) {
      console.log("[v0] Loaded settings from memory")
      return memorySettings
    }

    ensureDataDir()

    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8")
      if (data && data.trim()) {
        try {
          const settings = JSON.parse(data)
          console.log("[v0] Loaded settings from file")
          memorySettings = settings
          return settings
        } catch (parseError) {
          console.error("[v0] Error parsing settings file:", parseError)
        }
      }
    }

    console.log("[v0] No settings file found, returning empty object")
    return {}
  } catch (error) {
    console.error("[v0] Error loading settings from file:", error)
    return {}
  }
}

export function saveSettings(settings: Settings): void {
  memorySettings = settings

  try {
    ensureDataDir()
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8")
    console.log("[v0] Saved settings to file")
  } catch (error) {
    console.log("[v0] Could not save settings to file (serverless mode), saved to memory")
    // Don't throw - memory storage is sufficient for current session
  }
}

export function loadConnectionsByExchange(exchange: string): Connection[] {
  const cacheKey = `exchange:${exchange}`

  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log("[v0] Loaded", cached.length, "connections for", exchange, "from cache")
    return cached
  }

  // Load all and filter
  const allConnections = loadConnections()
  const filtered = allConnections.filter((c) => c.exchange === exchange)

  // Cache the filtered result
  setInCache(cacheKey, filtered)

  return filtered
}

export function loadConnectionsByIds(ids: string[]): Map<string, Connection> {
  const connections = loadConnections()
  const result = new Map<string, Connection>()

  const idSet = new Set(ids)
  for (const conn of connections) {
    if (idSet.has(conn.id)) {
      result.set(conn.id, conn)
    }
  }

  return result
}

export function batchUpdateConnections(updates: (Partial<Connection> & { id: string })[]): void {
  const connections = loadConnections()

  for (const update of updates) {
    const index = connections.findIndex((c) => c.id === update.id)
    if (index >= 0) {
      connections[index] = { ...connections[index], ...update, updated_at: new Date().toISOString() }
    }
  }

  saveConnections(connections)
}

export function updateConnection(id: string, updates: Partial<Connection>): Connection | null {
  const connections = loadConnections()
  const index = connections.findIndex((c) => c.id === id)

  if (index < 0) {
    return null
  }

  connections[index] = { ...connections[index], ...updates, updated_at: new Date().toISOString() }
  saveConnections(connections)

  return connections[index]
}

export function deleteConnection(id: string): boolean {
  const connections = loadConnections()
  const index = connections.findIndex((c) => c.id === id)

  if (index < 0) {
    return false
  }

  connections.splice(index, 1)
  saveConnections(connections)

  return true
}

export function getConnectionById(id: string): Connection | null {
  const connections = loadConnections()
  return connections.find((c) => c.id === id) || null
}

export function loadMainIndicationSettings(): MainIndicationSettings {
  try {
    ensureDataDir()

    if (fs.existsSync(MAIN_INDICATIONS_FILE)) {
      const data = fs.readFileSync(MAIN_INDICATIONS_FILE, "utf-8")
      if (data && data.trim()) {
        try {
          const settings = JSON.parse(data)
          console.log("[v0] Loaded main indication settings from file")
          return settings
        } catch (parseError) {
          console.error("[v0] Error parsing main indications file:", parseError)
        }
      }
    }

    console.log("[v0] No main indications file found, returning defaults")
    const defaults = getDefaultMainIndicationSettings()
    saveMainIndicationSettings(defaults)
    return defaults
  } catch (error) {
    console.error("[v0] Error loading main indication settings:", error)
    return getDefaultMainIndicationSettings()
  }
}

export function saveMainIndicationSettings(settings: MainIndicationSettings): void {
  try {
    ensureDataDir()
    fs.writeFileSync(MAIN_INDICATIONS_FILE, JSON.stringify(settings, null, 2), "utf-8")
    console.log("[v0] Saved main indication settings to file")
  } catch (error) {
    console.error("[v0] Error saving main indication settings:", error)
    throw error
  }
}

export function loadCommonIndicationSettings(): CommonIndicationSettings {
  try {
    ensureDataDir()

    if (fs.existsSync(COMMON_INDICATIONS_FILE)) {
      const data = fs.readFileSync(COMMON_INDICATIONS_FILE, "utf-8")
      if (data && data.trim()) {
        try {
          const settings = JSON.parse(data)
          console.log("[v0] Loaded common indication settings from file")
          return settings
        } catch (parseError) {
          console.error("[v0] Error parsing common indications file:", parseError)
        }
      }
    }

    console.log("[v0] No common indications file found, returning defaults")
    const defaults = getDefaultCommonIndicationSettings()
    saveCommonIndicationSettings(defaults)
    return defaults
  } catch (error) {
    console.error("[v0] Error loading common indication settings:", error)
    return getDefaultCommonIndicationSettings()
  }
}

export function saveCommonIndicationSettings(settings: CommonIndicationSettings): void {
  try {
    ensureDataDir()
    fs.writeFileSync(COMMON_INDICATIONS_FILE, JSON.stringify(settings, null, 2), "utf-8")
    console.log("[v0] Saved common indication settings to file")
  } catch (error) {
    console.error("[v0] Error saving common indication settings:", error)
    throw error
  }
}

export async function exportConnectionsToFile() {
  try {
    const { query } = await import("@/lib/db")
    const connections = await query(`
      SELECT 
        ec.*,
        vc.base_volume_factor as volume_factor
      FROM exchange_connections ec
      LEFT JOIN volume_configuration vc ON ec.id = vc.connection_id
      WHERE ec.is_active = true
      ORDER BY ec.created_at DESC
    `)

    if (connections.length > 0) {
      saveConnections(connections)
      console.log("[v0] Exported", connections.length, "connections to file")
    }
  } catch (error) {
    console.error("[v0] Error exporting connections:", error)
  }
}

export async function exportSettingsToFile() {
  try {
    const { query } = await import("@/lib/db")
    const settings = await query(`
      SELECT category, subcategory, key, value, value_type
      FROM system_settings
      ORDER BY category, subcategory, key
    `)

    const settingsObject: Settings = {}
    for (const setting of settings) {
      const key = setting.key
      let value = setting.value

      if (setting.value_type === "number") {
        value = Number.parseFloat(value)
      } else if (setting.value_type === "boolean") {
        value = value === "true"
      } else if (setting.value_type === "json") {
        try {
          value = JSON.parse(value)
        } catch {
          value = setting.value
        }
      }

      settingsObject[key] = value
    }

    if (Object.keys(settingsObject).length > 0) {
      saveSettings(settingsObject)
      console.log("[v0] Exported", Object.keys(settingsObject).length, "settings to file")
    }
  } catch (error) {
    console.error("[v0] Error exporting settings:", error)
  }
}

export function clearConnectionCache(exchangeOrId?: string): void {
  if (!exchangeOrId) {
    // Clear all cache
    connectionCache.clear()
    console.log("[v0] Cleared all connection cache")
    return
  }

  // Clear specific exchange or all if it's a connection ID
  if (connectionCache.has(`exchange:${exchangeOrId}`)) {
    connectionCache.delete(`exchange:${exchangeOrId}`)
    console.log("[v0] Cleared cache for exchange:", exchangeOrId)
  } else {
    // It's a connection ID, need to clear all as we don't know which exchange
    connectionCache.clear()
    console.log("[v0] Cleared all connection cache (connection update)")
  }
}

export function getDefaultConnections(): Connection[] {
  const now = new Date().toISOString()
  return [
    {
      id: "bybit-main-perpetual",
      user_id: 1,
      name: "Bybit Main (Perpetual)",
      exchange: "bybit",
      exchange_id: 2,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false,
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      connection_settings: {},
      last_test_at: "",
      last_test_status: "",
      last_test_balance: 0,
      last_test_error: "",
      last_test_log: [],
      api_capabilities: "",
      created_at: now,
      updated_at: now,
    },
    {
      id: "bingx-main-perpetual",
      user_id: 1,
      name: "BingX Main (Perpetual)",
      exchange: "bingx",
      exchange_id: 9,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false,
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      connection_settings: {},
      last_test_at: "",
      last_test_status: "",
      last_test_balance: 0,
      last_test_error: "",
      last_test_log: [],
      api_capabilities: "",
      created_at: now,
      updated_at: now,
    },
    {
      id: "pionex-main-perpetual",
      user_id: 1,
      name: "Pionex Main (Perpetual)",
      exchange: "pionex",
      exchange_id: 10,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false,
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      connection_settings: {},
      last_test_at: "",
      last_test_status: "",
      last_test_balance: 0,
      last_test_error: "",
      last_test_log: [],
      api_capabilities: "",
      created_at: now,
      updated_at: now,
    },
    {
      id: "orangex-main-perpetual",
      user_id: 1,
      name: "OrangeX Main (Perpetual)",
      exchange: "orangex",
      exchange_id: 11,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false,
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      connection_settings: {},
      last_test_at: "",
      last_test_status: "",
      last_test_balance: 0,
      last_test_error: "",
      last_test_log: [],
      api_capabilities: "",
      created_at: now,
      updated_at: now,
    },
  ]
}

function getDefaultSettings(): Settings {
  return {
    // Overall / Main
    base_volume_factor: 1.0,
    positions_average: 50,
    max_leverage: 125,
    risk_percentage: 20,

    prehistoricDataDays: 5, // Default 5 days of historical data (1-15 range)
    marketTimeframe: 1, // Default 1 second update interval (1,2,3,5,10,15 options)

    mainTradeInterval: 1, // Main trade execution interval in seconds (default: 1, range: 1-10)
    presetTradeInterval: 2, // Preset trade execution interval in seconds (default: 2, range: 1-10)

    maxPositionsPerExchange: {
      bybit: 500, // High capacity - 120 req/min, robust WebSocket
      binance: 500, // High capacity - 1200 req/min, best API limits
      okx: 150, // Medium-high capacity - 600 req/min
      bingx: 100, // Standard capacity - 100 req/min
      kucoin: 150, // Medium capacity - 900 req/min
      huobi: 100, // Standard capacity - 300 req/min
      pionex: 50, // Lower capacity - 100 req/min, smaller exchange
      orangex: 100, // Standard capacity - 100 req/min
      gate: 150, // Medium capacity
      bitget: 150, // Medium capacity
      mexc: 100, // Standard capacity
    },

    mainSymbols: ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "LTC", "BCH", "LINK"],
    forcedSymbols: ["XRP", "BCH"], // Always included regardless of settings

    // Overall / Connection
    default_margin_type: "cross",
    default_position_mode: "hedge",
    testnet_enabled: false,

    // Overall / System
    auto_restart: true,
    log_level: "info",
    database_backup: true,
    backup_interval: "24h",

    // Overall / Monitoring
    enable_monitoring: true,
    metrics_retention_days: 30,

    // Exchange
    use_main_symbols: false,
    symbols_count: 30,
    min_volume_enforcement: true,

    // Indication
    indication_time_interval: 1,
    indication_range_min: 3,
    indication_range_max: 30,
    indication_min_profit_factor: 0.7,

    // Strategy
    strategy_time_interval: 1,
    strategy_min_profit_factor: 0.5,
    trailing_enabled: true,
    dca_enabled: true,

    // Notification
    enable_notifications: true,
    enable_telegram: false,
    telegram_token: "",
    telegram_chat_id: "",
  }
}

function getDefaultMainIndicationSettings(): MainIndicationSettings {
  return {
    direction: {
      enabled: true,
      range: { from: 3, to: 30, step: 1 },
      drawdown_ratio: { from: 0.1, to: 0.5, step: 0.1 },
      market_change_range: { from: 1, to: 10, step: 2 }, // 5 variations: 1, 3, 5, 7, 9
      market_change_lastpart_base: 20, // 20% = 0.2 ratio
      market_change_lastpart_ratios: { from: 1.0, to: 2.5, step: 0.5 }, // 1.0, 1.5, 2.0, 2.5 (4 variations)
      min_calculation_time: 3, // 3 seconds minimum
      interval: 1,
      timeout: 3,
    },
    move: {
      enabled: true,
      range: { from: 3, to: 30, step: 1 },
      drawdown_ratio: { from: 0.1, to: 0.5, step: 0.1 },
      market_change_range: { from: 1, to: 10, step: 2 }, // 5 variations: 1, 3, 5, 7, 9
      market_change_lastpart_base: 20, // 20% = 0.2 ratio
      market_change_lastpart_ratios: { from: 1.0, to: 2.5, step: 0.5 }, // 1.0, 1.5, 2.0, 2.5 (4 variations)
      min_calculation_time: 3, // 3 seconds minimum
      interval: 1,
      timeout: 3,
    },
    active: {
      enabled: false,
      range: { from: 1, to: 10, step: 1 },
      activity_calculated: { from: 10, to: 90, step: 10 },
      activity_lastpart: { from: 10, to: 90, step: 10 },
      market_change_range: { from: 1, to: 10, step: 1 }, // 10 variations: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
      market_change_lastpart_base: 20, // 20% = 0.2 ratio
      market_change_lastpart_ratios: { from: 1.0, to: 2.5, step: 0.5 }, // 1.0, 1.5, 2.0, 2.5 (4 variations)
      interval: 1,
      timeout: 3,
      min_calculation_time: 3,
    },
    optimal: {
      enabled: false,
      range: { from: 3, to: 30, step: 1 },
      drawdown_ratio: { from: 0.1, to: 0.5, step: 0.1 },
      market_change_range: { from: 1, to: 10, step: 2 },
      market_change_lastpart_base: 20,
      market_change_lastpart_ratios: { from: 1.0, to: 2.5, step: 0.5 },
      min_calculation_time: 3,
      base_positions_limit: 250,
      interval: 1,
      timeout: 3,
      // Performance thresholds
      initial_min_win_rate: 0.4,
      expanded_min_win_rate: 0.45,
      expanded_min_profit_ratio: 1.2,
      production_min_win_rate: 0.42,
      production_max_drawdown: 0.3,
    },
  }
}

function getDefaultCommonIndicationSettings(): CommonIndicationSettings {
  return {
    rsi: {
      enabled: false,
      period: { from: 8, to: 20, step: 1 },
      overbought: { from: 65, to: 80, step: 1 },
      oversold: { from: 20, to: 35, step: 1 },
      interval: 1,
      timeout: 3,
    },
    macd: {
      enabled: false,
      fastPeriod: { from: 8, to: 16, step: 1 },
      slowPeriod: { from: 20, to: 32, step: 1 },
      signalPeriod: { from: 6, to: 12, step: 1 },
      interval: 1,
      timeout: 3,
    },
    bollinger: {
      enabled: true,
      period: { from: 14, to: 26, step: 1 },
      stdDev: { from: 1.5, to: 2.5, step: 0.1 },
      interval: 1,
      timeout: 3,
    },
    ema: {
      enabled: true,
      period: { from: 8, to: 50, step: 2 },
      interval: 1,
      timeout: 3,
    },
    sma: {
      enabled: true,
      period: { from: 10, to: 50, step: 2 },
      interval: 1,
      timeout: 3,
    },
    stochastic: {
      enabled: true,
      kPeriod: { from: 10, to: 18, step: 1 },
      dPeriod: { from: 2, to: 6, step: 1 },
      overbought: { from: 75, to: 85, step: 1 },
      oversold: { from: 15, to: 25, step: 1 },
      interval: 1,
      timeout: 3,
    },
    atr: {
      enabled: true,
      period: { from: 10, to: 18, step: 1 },
      multiplier: { from: 1.5, to: 3.0, step: 0.1 },
      interval: 1,
      timeout: 3,
    },
    parabolicSAR: {
      enabled: true,
      acceleration: { from: 0.012, to: 0.024, step: 0.001 },
      maximum: { from: 0.12, to: 0.24, step: 0.01 },
      interval: 1,
      timeout: 3,
    },
    adx: {
      enabled: true,
      period: { from: 10, to: 18, step: 1 },
      threshold: { from: 20, to: 30, step: 1 },
      interval: 1,
      timeout: 3,
    },
  }
}

export function loadActiveConnections(): Connection[] {
  try {
    // Check memory first
    if (memoryActiveConnections && memoryActiveConnections.length > 0) {
      console.log("[v0] Loaded", memoryActiveConnections.length, "active connections from memory")
      return memoryActiveConnections
    }

    // Try file system
    ensureDataDir()
    if (fs.existsSync(ACTIVE_CONNECTIONS_FILE)) {
      try {
        const data = fs.readFileSync(ACTIVE_CONNECTIONS_FILE, "utf-8")
        if (data && data.trim()) {
          const connections = JSON.parse(data)
          if (Array.isArray(connections)) {
            console.log("[v0] Loaded", connections.length, "active connections from file")
            memoryActiveConnections = connections
            return connections
          }
        }
      } catch (parseError) {
        console.error("[v0] Error parsing active connections file:", parseError)
      }
    }

    // Initialize with default active connections (Bybit and BingX) ONLY on first load
    console.log("[v0] No active connections file found, initializing with Bybit and BingX")
    const defaults = getDefaultActiveConnections()
    memoryActiveConnections = defaults

    // Try to persist to file
    try {
      ensureDataDir()
      fs.writeFileSync(ACTIVE_CONNECTIONS_FILE, JSON.stringify(defaults, null, 2), "utf-8")
      console.log("[v0] Saved default active connections to file")
    } catch (writeError) {
      console.log("[v0] Could not persist active connections to file (serverless mode)")
    }

    return defaults
  } catch (error) {
    console.error("[v0] Error loading active connections:", error)
    return []
  }
}

export function saveActiveConnections(connections: Connection[]): boolean {
  try {
    memoryActiveConnections = connections

    ensureDataDir()
    fs.writeFileSync(ACTIVE_CONNECTIONS_FILE, JSON.stringify(connections, null, 2), "utf-8")
    console.log("[v0] Saved", connections.length, "active connections to file")
    return true
  } catch (error) {
    console.error("[v0] Error saving active connections:", error)
    // Still update memory even if file write fails
    memoryActiveConnections = connections
    return false
  }
}

function getDefaultActiveConnections(): Connection[] {
  return [
    {
      id: nanoid(),
      user_id: 1,
      name: "Bybit Main",
      exchange: "bybit",
      exchange_id: 2,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false, // Not enabled by default
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: nanoid(),
      user_id: 1,
      name: "BingX Main",
      exchange: "bingx",
      exchange_id: 9,
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "rest",
      api_key: "",
      api_secret: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
      is_enabled: false, // Not enabled by default
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: true,
      volume_factor: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

export interface Connection {
  id: string
  user_id: number
  name: string
  exchange: string
  exchange_id: number | null
  api_type: string
  connection_method: string
  connection_library: string
  api_key: string
  api_secret: string
  api_passphrase?: string
  margin_type: string
  position_mode: string
  is_testnet: boolean
  is_enabled: boolean
  is_live_trade: boolean
  is_preset_trade: boolean
  is_active: boolean
  is_predefined: boolean
  volume_factor?: number
  connection_settings?: any
  last_test_at?: string
  last_test_status?: string
  last_test_balance?: number
  last_test_error?: string
  last_test_log?: string[]
  api_capabilities?: string
  created_at: string
  updated_at: string
}

export interface Settings {
  [key: string]: any
}

export interface MainIndicationSettings {
  direction: {
    enabled: boolean
    range: { from: number; to: number; step: number }
    drawdown_ratio: { from: number; to: number; step: number }
    market_change_range: { from: number; to: number; step: number } // Values: 1, 3, 5, 7, 9 (5 variations)
    market_change_lastpart_base: number // Last 20% activity base (0.2 ratio)
    market_change_lastpart_ratios: { from: number; to: number; step: number } // 1.0, 1.5, 2.0, 2.5 (4 variations)
    min_calculation_time: number // Minimum time for market change calculations
    interval: number
    timeout: number
  }
  move: {
    enabled: boolean
    range: { from: number; to: number; step: number }
    drawdown_ratio: { from: number; to: number; step: number }
    market_change_range: { from: number; to: number; step: number } // Values: 1, 3, 5, 7, 9 (5 variations)
    market_change_lastpart_base: number // Last 20% activity base (0.2 ratio)
    market_change_lastpart_ratios: { from: number; to: number; step: number } // 1.0, 1.5, 2.0, 2.5 (4 variations)
    min_calculation_time: number // Minimum time for market change calculations
    interval: number
    timeout: number
  }
  active: {
    enabled: boolean
    range: { from: number; to: number; step: number }
    activity_calculated: { from: number; to: number; step: number }
    activity_lastpart: { from: number; to: number; step: number }
    market_change_range: { from: number; to: number; step: number } // Values: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (10 variations)
    market_change_lastpart_base: number // Last 20% activity base (0.2 ratio)
    market_change_lastpart_ratios: { from: number; to: number; step: number } // 1.0, 1.5, 2.0, 2.5 (4 variations)
    interval: number
    timeout: number
    min_calculation_time: number
  }
  optimal: {
    enabled: boolean
    range: { from: number; to: number; step: number }
    drawdown_ratio: { from: number; to: number; step: number }
    market_change_range: { from: number; to: number; step: number }
    market_change_lastpart_base: number
    market_change_lastpart_ratios: { from: number; to: number; step: number }
    min_calculation_time: number
    base_positions_limit: number // 250 base pseudo positions max
    interval: number
    timeout: number
    // Performance thresholds
    initial_min_win_rate: number
    expanded_min_win_rate: number
    expanded_min_profit_ratio: number
    production_min_win_rate: number
    production_max_drawdown: number
  }
}

export interface CommonIndicationSettings {
  rsi: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    overbought: { from: number; to: number; step: number }
    oversold: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  macd: {
    enabled: boolean
    fastPeriod: { from: number; to: number; step: number }
    slowPeriod: { from: number; to: number; step: number }
    signalPeriod: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  bollinger: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    stdDev: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  ema: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  sma: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  stochastic: {
    enabled: boolean
    kPeriod: { from: number; to: number; step: number }
    dPeriod: { from: number; to: number; step: number }
    overbought: { from: number; to: number; step: number }
    oversold: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  atr: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    multiplier: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  parabolicSAR: {
    enabled: boolean
    acceleration: { from: number; to: number; step: number }
    maximum: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
  adx: {
    enabled: boolean
    period: { from: number; to: number; step: number }
    threshold: { from: number; to: number; step: number }
    interval: number
    timeout: number
  }
}
