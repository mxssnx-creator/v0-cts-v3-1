import { getClient, getDatabaseType } from "./db"
import type { Pool } from "./pg-compat"
import type Database from "better-sqlite3"
import { DynamicOperationHandler } from "./core/dynamic-operations"
import { EntityTypes, ConfigSubTypes } from "./core/entity-types"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 8000 // 8 seconds

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  attempt = 1,
): Promise<T> {
  try {
    console.log(`[v0] Database initialization attempt ${attempt}/${MAX_RETRIES}`)
    return await fn()
  } catch (error) {
    if (attempt >= retries) {
      console.error(`[v0] Database initialization failed after ${retries} attempts:`, error)
      throw error
    }

    const nextDelay = Math.min(delay * 2, MAX_RETRY_DELAY)
    console.log(`[v0] Retrying in ${nextDelay}ms...`)
    await new Promise((resolve) => setTimeout(resolve, nextDelay))
    return retryWithBackoff(fn, retries, nextDelay, attempt + 1)
  }
}

class DatabaseManager {
  private static instance: DatabaseManager
  private initialized = false
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5000 // 5 seconds cache
  private dynamicOps: DynamicOperationHandler | null = null

  private constructor() {
    if (isBuildPhase) {
      console.log("[v0] Skipping database initialization during build phase")
      return
    }

    try {
      const client = getClient()
      const dbType = getDatabaseType()
      const isPostgres = dbType === "postgresql" || dbType === "remote"

      this.dynamicOps = new DynamicOperationHandler(client, isPostgres)
      this.initializeTables()
    } catch (error) {
      console.error("[v0] Failed to initialize DatabaseManager:", error)
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private async initializeTables() {
    if (isBuildPhase || this.initialized) return

    try {
      await retryWithBackoff(async () => {
        const client = getClient()
        const dbType = getDatabaseType()
        const isPostgres = dbType === "postgresql" || dbType === "remote"

        // Exchange connections table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS exchange_connections (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              exchange TEXT NOT NULL,
              api_type TEXT NOT NULL,
              connection_method TEXT NOT NULL,
              api_key TEXT NOT NULL,
              api_secret TEXT NOT NULL,
              is_enabled BOOLEAN DEFAULT false,
              is_live_trade BOOLEAN DEFAULT false,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS exchange_connections (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              exchange TEXT NOT NULL,
              api_type TEXT NOT NULL,
              connection_method TEXT NOT NULL,
              api_key TEXT NOT NULL,
              api_secret TEXT NOT NULL,
              is_enabled BOOLEAN DEFAULT 0,
              is_live_trade BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }

        // Pseudo positions table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS pseudo_positions (
              id TEXT PRIMARY KEY,
              connection_id TEXT NOT NULL,
              symbol TEXT NOT NULL,
              indication_type TEXT NOT NULL,
              takeprofit_factor REAL NOT NULL,
              stoploss_ratio REAL NOT NULL,
              trailing_enabled BOOLEAN DEFAULT false,
              trail_start REAL,
              trail_stop REAL,
              entry_price REAL NOT NULL,
              current_price REAL NOT NULL,
              profit_factor REAL NOT NULL,
              position_cost REAL NOT NULL,
              status TEXT DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              
              indication_range INTEGER,
              indication_interval INTEGER,
              indication_timeout INTEGER,
              strategy_type TEXT,
              strategy_step INTEGER,
              strategy_interval INTEGER,
              
              position_age_seconds INTEGER,
              last_update_interval INTEGER,
              avg_update_interval INTEGER,
              total_updates INTEGER DEFAULT 0,
              
              initial_profit_factor REAL,
              max_profit_factor REAL,
              min_profit_factor REAL,
              avg_profit_factor REAL,
              profit_factor_volatility REAL,
              
              last_check_timestamp TIMESTAMP,
              checks_per_minute REAL,
              price_updates_count INTEGER DEFAULT 0,
              
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS pseudo_positions (
              id TEXT PRIMARY KEY,
              connection_id TEXT NOT NULL,
              symbol TEXT NOT NULL,
              indication_type TEXT NOT NULL,
              takeprofit_factor REAL NOT NULL,
              stoploss_ratio REAL NOT NULL,
              trailing_enabled BOOLEAN DEFAULT 0,
              trail_start REAL,
              trail_stop REAL,
              entry_price REAL NOT NULL,
              current_price REAL NOT NULL,
              profit_factor REAL NOT NULL,
              position_cost REAL NOT NULL,
              status TEXT DEFAULT 'active',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              
              indication_range INTEGER,
              indication_interval INTEGER,
              indication_timeout INTEGER,
              strategy_type TEXT,
              strategy_step INTEGER,
              strategy_interval INTEGER,
              
              position_age_seconds INTEGER,
              last_update_interval INTEGER,
              avg_update_interval INTEGER,
              total_updates INTEGER DEFAULT 0,
              
              initial_profit_factor REAL,
              max_profit_factor REAL,
              min_profit_factor REAL,
              avg_profit_factor REAL,
              profit_factor_volatility REAL,
              
              last_check_timestamp DATETIME,
              checks_per_minute REAL,
              price_updates_count INTEGER DEFAULT 0,
              
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        }

        // Real positions table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS real_positions (
              id TEXT PRIMARY KEY,
              connection_id TEXT NOT NULL,
              exchange_position_id TEXT,
              symbol TEXT NOT NULL,
              strategy_type TEXT NOT NULL,
              volume REAL NOT NULL,
              entry_price REAL NOT NULL,
              current_price REAL NOT NULL,
              takeprofit REAL,
              stoploss REAL,
              profit_loss REAL NOT NULL,
              status TEXT DEFAULT 'open',
              opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              closed_at TIMESTAMP,
              
              indication_type TEXT,
              indication_range INTEGER,
              indication_interval INTEGER,
              strategy_interval INTEGER,
              
              position_duration_seconds INTEGER,
              avg_check_interval_ms INTEGER,
              total_checks INTEGER DEFAULT 0,
              
              initial_profit_loss REAL,
              max_profit REAL,
              max_loss REAL,
              profit_volatility REAL,
              
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS real_positions (
              id TEXT PRIMARY KEY,
              connection_id TEXT NOT NULL,
              exchange_position_id TEXT,
              symbol TEXT NOT NULL,
              strategy_type TEXT NOT NULL,
              volume REAL NOT NULL,
              entry_price REAL NOT NULL,
              current_price REAL NOT NULL,
              takeprofit REAL,
              stoploss REAL,
              profit_loss REAL NOT NULL,
              status TEXT DEFAULT 'open',
              opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              closed_at DATETIME,
              
              indication_type TEXT,
              indication_range INTEGER,
              indication_interval INTEGER,
              strategy_interval INTEGER,
              
              position_duration_seconds INTEGER,
              avg_check_interval_ms INTEGER,
              total_checks INTEGER DEFAULT 0,
              
              initial_profit_loss REAL,
              max_profit REAL,
              max_loss REAL,
              profit_volatility REAL,
              
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        }

        // Market data table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS market_data (
              id SERIAL PRIMARY KEY,
              connection_id TEXT NOT NULL,
              symbol TEXT NOT NULL,
              price REAL NOT NULL,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS market_data (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              connection_id TEXT NOT NULL,
              symbol TEXT NOT NULL,
              price REAL NOT NULL,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
            )
          `)
        }

        // System settings table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS system_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS system_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }

        // Logs table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS logs (
              id SERIAL PRIMARY KEY,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              details TEXT,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              details TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }

        // Errors table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS errors (
              id SERIAL PRIMARY KEY,
              type TEXT NOT NULL,
              message TEXT NOT NULL,
              stack TEXT,
              context TEXT,
              resolved BOOLEAN DEFAULT false,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS errors (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              message TEXT NOT NULL,
              stack TEXT,
              context TEXT,
              resolved BOOLEAN DEFAULT 0,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }

        // Site logs table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS site_logs (
              id SERIAL PRIMARY KEY,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              details TEXT,
              stack TEXT,
              metadata TEXT,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS site_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              details TEXT,
              stack TEXT,
              metadata TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }

        // Auto-optimal configurations table
        if (isPostgres) {
          await (client as Pool).query(`
            CREATE TABLE IF NOT EXISTS auto_optimal_configurations (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              symbol_mode TEXT NOT NULL,
              exchange_order_by TEXT NOT NULL,
              symbol_limit INTEGER NOT NULL,
              indication_type TEXT NOT NULL,
              indication_params JSON NOT NULL,
              takeprofit_min REAL NOT NULL,
              takeprofit_max REAL NOT NULL,
              stoploss_min REAL NOT NULL,
              stoploss_max REAL NOT NULL,
              trailing_enabled BOOLEAN DEFAULT false,
              trailing_only BOOLEAN DEFAULT false,
              min_profit_factor REAL NOT NULL,
              min_profit_factor_positions INTEGER NOT NULL,
              max_drawdown_time_hours INTEGER NOT NULL,
              use_block BOOLEAN DEFAULT false,
              use_dca BOOLEAN DEFAULT false,
              additional_strategies_only BOOLEAN DEFAULT false,
              calculation_days INTEGER NOT NULL,
              max_positions_per_direction INTEGER NOT NULL,
              max_positions_per_symbol INTEGER NOT NULL
            )
          `)
        } else {
          ;(client as Database.Database).exec(`
            CREATE TABLE IF NOT EXISTS auto_optimal_configurations (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              symbol_mode TEXT NOT NULL,
              exchange_order_by TEXT NOT NULL,
              symbol_limit INTEGER NOT NULL,
              indication_type TEXT NOT NULL,
              indication_params TEXT NOT NULL,
              takeprofit_min REAL NOT NULL,
              takeprofit_max REAL NOT NULL,
              stoploss_min REAL NOT NULL,
              stoploss_max REAL NOT NULL,
              trailing_enabled BOOLEAN DEFAULT 0,
              trailing_only BOOLEAN DEFAULT 0,
              min_profit_factor REAL NOT NULL,
              min_profit_factor_positions INTEGER NOT NULL,
              max_drawdown_time_hours INTEGER NOT NULL,
              use_block BOOLEAN DEFAULT 0,
              use_dca BOOLEAN DEFAULT 0,
              additional_strategies_only BOOLEAN DEFAULT 0,
              calculation_days INTEGER NOT NULL,
              max_positions_per_direction INTEGER NOT NULL,
              max_positions_per_symbol INTEGER NOT NULL
            )
          `)
        }

        if (isPostgres) {
          await (client as Pool).query(`
            ALTER TABLE preset_configuration_sets
            ADD COLUMN IF NOT EXISTS last_evaluation_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS auto_disabled_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS auto_disabled_reason TEXT,
            ADD COLUMN IF NOT EXISTS total_completed_positions INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS winning_positions INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS losing_positions INTEGER DEFAULT 0
          `)
        } else {
          const sqliteDb = client as Database.Database

          // Check which columns exist and add only missing ones
          const columns = [
            "last_evaluation_at",
            "auto_disabled_at",
            "auto_disabled_reason",
            "total_completed_positions",
            "winning_positions",
            "losing_positions",
          ]

          for (const column of columns) {
            try {
              let alterSQL = ""
              if (column === "last_evaluation_at" || column === "auto_disabled_at") {
                alterSQL = `ALTER TABLE preset_configuration_sets ADD COLUMN ${column} DATETIME`
              } else if (column === "auto_disabled_reason") {
                alterSQL = `ALTER TABLE preset_configuration_sets ADD COLUMN ${column} TEXT`
              } else {
                alterSQL = `ALTER TABLE preset_configuration_sets ADD COLUMN ${column} INTEGER DEFAULT 0`
              }
              sqliteDb.exec(alterSQL)
            } catch (error: any) {
              // Column might already exist, which is fine
              if (!error.message?.includes("duplicate column")) {
                console.error(`[v0] Error adding column ${column}:`, error)
              }
            }
          }
        }

        await this.insertDefaultSettings()

        this.initialized = true
        console.log("[v0] Database initialization completed successfully")
      })
    } catch (error) {
      console.error("[v0] Failed to initialize database tables:", error)
      throw error
    }
  }

  private async insertDefaultSettings() {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    console.log("[v0] Inserting default settings...")

    const defaultSettings = [
      { key: "baseVolumeFactor", value: "1.0" },
      { key: "minimalProfitFactor", value: "0.5" },
      { key: "positionCost", value: "0.1" },
      { key: "symbolsExchangeCount", value: "30" },
      { key: "positionsAverage", value: "50" },
      { key: "tradeEngineInterval", value: "1.0" },
      { key: "realPositionsInterval", value: "0.3" },
      { key: "timeRangeHistoryDays", value: "5" },
      { key: "prehistoricDataDays", value: "5" },
      { key: "marketTimeframe", value: "1" },
      { key: "databaseSizePseudo", value: "250" },
      { key: "percentRearrange", value: "20" },
      { key: "mainSymbols", value: JSON.stringify(["bch", "xrp", "eth", "link", "doge", "h"]) },
      { key: "forcedSymbols", value: JSON.stringify(["xrp", "bch"]) },
      {
        key: "maxPositionsPerExchange",
        value: JSON.stringify({
          bybit: 500,
          binance: 500,
          okx: 150,
          kucoin: 150,
          gateio: 150,
          bitget: 150,
          mexc: 100,
          bingx: 100,
          coinex: 75,
          lbank: 50,
          bitmart: 50,
        }),
      },
      { key: "validationCooldown", value: "10000" },
      { key: "positionTimeout", value: "15000" },
      { key: "maxActivePerConfig", value: "1" },

      { key: "autoRestart", value: "true" },
      { key: "maxPositions", value: "250" },
      { key: "rearrangeThreshold", value: "20" },
      { key: "logLevel", value: "info" },

      { key: "enableNotifications", value: "true" },
      { key: "enableTelegram", value: "false" },
      { key: "telegramToken", value: "" },
      { key: "telegramChatId", value: "" },

      { key: "databaseBackup", value: "true" },
      { key: "backupInterval", value: "24h" },
      { key: "minActiveStateDuration", value: "20" },

      { key: "indicationRangeMin", value: "3" },
      { key: "indicationRangeMax", value: "30" },
      { key: "indicationRangeStep", value: "1" },
      { key: "takeProfitRangeDivisor", value: "3" },
      { key: "indicationMinProfitFactor", value: "0.7" },
      { key: "strategyMinProfitFactor", value: "0.5" },

      { key: "marginMode", value: "cross" },
      { key: "hedgingMode", value: "single" },
      { key: "leverageDefault", value: "10" },

      { key: "adjustStrategyTimeIntervals", value: JSON.stringify([4, 12, 24, 48]) },
      { key: "adjustStrategyDrawdownPositions", value: "80" },

      { key: "blockAdjustmentRatio", value: "1" },
      { key: "blockAutoDisableEnabled", value: "true" },
      { key: "blockAutoDisableMinBlocks", value: "2" },
      { key: "blockAutoDisableComparisonWindow", value: "50" },

      { key: "useMainSymbols", value: "true" },
      { key: "exchangeSymbolCount", value: "30" },
      { key: "symbolOrderType", value: "volume24h" },
      { key: "exchangeSymbolOrder", value: "marketcap" },

      { key: "strategyTrailingEnabled", value: "true" },
      { key: "strategyBlockEnabled", value: "true" },
      { key: "strategyDcaEnabled", value: "true" },
      { key: "profitFactorMultiplier", value: "1.0" },

      { key: "apiMarketType", value: "unified" },
      { key: "apiSource", value: "exchange" },
      { key: "connectionMethod", value: "rest" },
      { key: "libraryPackage", value: "" },
      { key: "documentationLink", value: "" },
      { key: "testnet", value: "false" },

      { key: "mainEngineEnabled", value: "true" },
      { key: "presetEngineEnabled", value: "true" },
      { key: "mainEngineIntervalMs", value: "100" },
      { key: "presetEngineIntervalMs", value: "100" },
      { key: "activeOrderHandlingIntervalMs", value: "50" },
      { key: "positionCooldownMs", value: "100" },
      { key: "maxPositionsPerConfigDirection", value: "1" },
      { key: "maxConcurrentOperations", value: "100" },

      { key: "negativeChangePercent", value: "20" },
      { key: "leveragePercentage", value: "100" },
      { key: "useMaximalLeverage", value: "true" },
      { key: "minVolumeEnforcement", value: "true" },

      { key: "marketActivityEnabled", value: "true" },
      { key: "directionEnabled", value: "true" },
      { key: "moveEnabled", value: "true" },
      { key: "activeEnabled", value: "true" },

      { key: "databaseSizeBase", value: "250" },
      { key: "databaseSizeMain", value: "250" },
      { key: "databaseSizeReal", value: "250" },
      { key: "databaseSizePreset", value: "250" },

      { key: "tradeMode", value: "preset" },

      // CHANGE: activeIndicationInterval to 100ms (coordinated with main engine, not 50ms)
      { key: "directionIndicationInterval", value: "100" },
      { key: "moveIndicationInterval", value: "100" },
      { key: "activeIndicationInterval", value: "100" },
      { key: "optimalIndicationInterval", value: "1000" },
      { key: "autoIndicationInterval", value: "2000" },

      // CHANGE: Add indication configuration defaults after line ~545
      // Direction Indication Configuration
      { key: "directionRangeFrom", value: "3" },
      { key: "directionRangeTo", value: "30" },
      { key: "directionRangeStep", value: "1" },
      { key: "directionDrawdownValues", value: "10,20,30,40,50" },
      { key: "directionMarketChangeFrom", value: "1" },
      { key: "directionMarketChangeTo", value: "9" },
      { key: "directionMarketChangeStep", value: "2" },
      { key: "directionMinCalcTime", value: "3" },
      { key: "directionLastPartRatio", value: "0.2" },
      { key: "directionRatioFactorFrom", value: "1.0" },
      { key: "directionRatioFactorTo", value: "2.5" },
      { key: "directionRatioFactorStep", value: "0.5" },

      // Move Indication Configuration
      { key: "moveRangeFrom", value: "3" },
      { key: "moveRangeTo", value: "30" },
      { key: "moveRangeStep", value: "1" },
      { key: "moveDrawdownValues", value: "10,20,30,40,50" },
      { key: "moveMarketChangeFrom", value: "1" },
      { key: "moveMarketChangeTo", value: "9" },
      { key: "moveMarketChangeStep", value: "2" },
      { key: "moveMinCalcTime", value: "3" },
      { key: "moveLastPartRatio", value: "0.2" },
      { key: "moveRatioFactorFrom", value: "1.0" },
      { key: "moveRatioFactorTo", value: "2.5" },
      { key: "moveRatioFactorStep", value: "0.5" },

      // Active Indication Configuration
      { key: "activeRangeFrom", value: "1" },
      { key: "activeRangeTo", value: "10" },
      { key: "activeRangeStep", value: "1" },
      { key: "activeDrawdownValues", value: "10,20,30,40,50" },
      { key: "activeMarketChangeFrom", value: "1" },
      { key: "activeMarketChangeTo", value: "10" },
      { key: "activeMarketChangeStep", value: "1" },
      { key: "activeMinCalcTime", value: "3" },
      { key: "activeLastPartRatio", value: "0.2" },
      { key: "activeRatioFactorFrom", value: "1.0" },
      { key: "activeRatioFactorTo", value: "2.5" },
      { key: "activeRatioFactorStep", value: "0.5" },
      { key: "activeCalculatedFrom", value: "10" },
      { key: "activeCalculatedTo", value: "90" },
      { key: "activeCalculatedStep", value: "10" },
      { key: "activeLastPartFrom", value: "10" },
      { key: "activeLastPartTo", value: "90" },
      { key: "activeLastPartStep", value: "10" },
    ]

    if (isPostgres) {
      await Promise.all(
        defaultSettings.map(async (setting) => {
          await (client as Pool).query(
            `INSERT INTO system_settings (key, value) VALUES ($1, $2)
            ON CONFLICT (key) DO NOTHING`,
            [setting.key, setting.value],
          )
          console.log(`[v0] Setting inserted: ${setting.key}`)
        }),
      )
    } else {
      const insertSetting = (client as Database.Database).prepare(`
        INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
      `)

      defaultSettings.forEach((setting) => {
        insertSetting.run(setting.key, setting.value)
        console.log(`[v0] Setting inserted: ${setting.key}`)
      })
    }

    console.log("[v0] Default settings inserted successfully")
  }

  public async insert(
    entityType: (typeof EntityTypes)[keyof typeof EntityTypes],
    subType: (typeof ConfigSubTypes)[keyof typeof ConfigSubTypes] | null,
    data: Record<string, any>,
  ) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.insert(entityType, subType, data)
  }

  public async update(
    entityType: (typeof EntityTypes)[keyof typeof EntityTypes],
    id: string | number,
    updates: Record<string, any>,
  ) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.update(entityType, id, updates)
  }

  public async query(entityType: (typeof EntityTypes)[keyof typeof EntityTypes], options?: any) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.query(entityType, options)
  }

  public async delete(entityType: (typeof EntityTypes)[keyof typeof EntityTypes], id: string | number) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.delete(entityType, id)
  }

  public async batchInsert(
    entityType: (typeof EntityTypes)[keyof typeof EntityTypes],
    dataArray: Record<string, any>[],
  ) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.batchInsert(entityType, dataArray)
  }

  public async batchUpdate(
    entityType: (typeof EntityTypes)[keyof typeof EntityTypes],
    updates: Array<{ id: string | number; data: Record<string, any> }>,
  ) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.batchUpdate(entityType, updates)
  }

  public async count(entityType: (typeof EntityTypes)[keyof typeof EntityTypes], options?: any) {
    if (!this.dynamicOps) throw new Error("[v0] Dynamic operations not initialized")
    return await this.dynamicOps.count(entityType, options)
  }

  public async executeQuery(query: string, params: any[] = []) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(query, params)
    } else {
      const stmt = (client as Database.Database).prepare(query)
      if (query.trim().toUpperCase().startsWith("SELECT")) {
        return stmt.all(...params)
      } else {
        return stmt.run(...params)
      }
    }
  }

  // Connection methods
  public async insertConnection(connection: any) {
    return await this.insert(EntityTypes.CONNECTION, null, connection)
  }

  public async getConnections() {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query("SELECT * FROM exchange_connections ORDER BY created_at DESC")
      return result.rows
    } else {
      const stmt = (client as Database.Database).prepare("SELECT * FROM exchange_connections ORDER BY created_at DESC")
      return stmt.all()
    }
  }

  public async updateConnectionStatus(id: string, is_enabled: boolean, is_live_trade: boolean) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query(
        `UPDATE exchange_connections 
        SET is_enabled = $1, is_live_trade = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3 RETURNING *`,
        [is_enabled, is_live_trade, id],
      )
      return result.rows[0]
    } else {
      const stmt = (client as Database.Database).prepare(`
        UPDATE exchange_connections 
        SET is_enabled = ?, is_live_trade = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `)
      return stmt.run(is_enabled ? 1 : 0, is_live_trade ? 1 : 0, id)
    }
  }

  // Pseudo position methods
  public async insertPseudoPosition(position: any) {
    return await this.insert(EntityTypes.PSEUDO_POSITION, null, position)
  }

  public async getPseudoPositions(connection_id?: string, limit = 250) {
    const options: any = {
      filters: [{ field: "status", operator: "=", value: "active" }],
      orderBy: [{ field: "created_at", direction: "DESC" }],
      limit,
    }

    if (connection_id) {
      options.filters.push({ field: "connection_id", operator: "=", value: connection_id })
    }

    return await this.query(EntityTypes.PSEUDO_POSITION, options)
  }

  public async batchInsertPseudoPositions(positions: any[]): Promise<void> {
    return await this.batchInsert(EntityTypes.PSEUDO_POSITION, positions)
  }

  public async batchUpdatePositions(
    updates: Array<{ id: string; current_price: number; profit_factor: number }>,
  ): Promise<void> {
    const updateData = updates.map((u) => ({
      id: u.id,
      data: { current_price: u.current_price, profit_factor: u.profit_factor },
    }))
    return await this.batchUpdate(EntityTypes.PSEUDO_POSITION, updateData)
  }

  public async getPseudoPositionsByConnection(connectionIds: string[], limit = 250): Promise<Map<string, any[]>> {
    const cacheKey = `positions:${connectionIds.join(",")}`

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    const result = new Map<string, any[]>()

    if (isPostgres) {
      const query = `
        SELECT * FROM pseudo_positions 
        WHERE status = $1 AND connection_id = ANY($2)
        ORDER BY connection_id, created_at DESC
        LIMIT $3
      `
      const rows = await (client as Pool).query(query, ["active", connectionIds, limit])

      // Group results by connection_id
      for (const row of rows.rows as any[]) {
        if (!result.has(row.connection_id)) {
          result.set(row.connection_id, [])
        }
        result.get(row.connection_id)!.push(row)
      }
    } else {
      const placeholders = connectionIds.map(() => "?").join(",")
      const stmt = (client as Database.Database).prepare(`
        SELECT * FROM pseudo_positions 
        WHERE status = "active" AND connection_id IN (${placeholders})
        ORDER BY connection_id, created_at DESC
        LIMIT ?
      `)
      const rows = stmt.all(...connectionIds, limit)

      // Group results by connection_id
      for (const row of rows as any[]) {
        if (!result.has(row.connection_id)) {
          result.set(row.connection_id, [])
        }
        result.get(row.connection_id)!.push(row)
      }
    }

    // Cache the result
    this.setInCache(cacheKey, result)

    return result
  }

  // Real position methods
  public async insertRealPosition(position: any) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(
        `INSERT INTO real_positions 
        (id, connection_id, exchange_position_id, symbol, strategy_type, volume, 
         entry_price, current_price, takeprofit, stoploss, profit_loss)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          position.id,
          position.connection_id,
          position.exchange_position_id,
          position.symbol,
          position.strategy_type,
          position.volume,
          position.entry_price,
          position.current_price,
          position.takeprofit,
          position.stoploss,
          position.profit_loss,
        ],
      )
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT INTO real_positions 
        (id, connection_id, exchange_position_id, symbol, strategy_type, volume, 
         entry_price, current_price, takeprofit, stoploss, profit_loss)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      return stmt.run(
        position.id,
        position.connection_id,
        position.exchange_position_id,
        position.symbol,
        position.strategy_type,
        position.volume,
        position.entry_price,
        position.current_price,
        position.takeprofit,
        position.stoploss,
        position.profit_loss,
      )
    }
  }

  public async getRealPositions(connection_id?: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      let query = "SELECT * FROM real_positions WHERE status = $1"
      const params: any[] = ["open"]

      if (connection_id) {
        query += " AND connection_id = $2"
        params.push(connection_id)
      }

      query += " ORDER BY opened_at DESC"

      const result = await (client as Pool).query(query, params)
      return result.rows
    } else {
      let query = 'SELECT * FROM real_positions WHERE status = "open"'
      const params: any[] = []

      if (connection_id) {
        query += " AND connection_id = ?"
        params.push(connection_id)
      }

      query += " ORDER BY opened_at DESC"

      const stmt = (client as Database.Database).prepare(query)
      return stmt.all(...params)
    }
  }

  // Settings methods
  public async getSetting(key: string): Promise<string | null> {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query("SELECT value FROM system_settings WHERE key = $1", [key])
      return result.rows[0]?.value || null
    } else {
      const stmt = (client as Database.Database).prepare("SELECT value FROM system_settings WHERE key = ?")
      const result = stmt.get(key) as { value: string } | undefined
      return result?.value || null
    }
  }

  public async setSetting(key: string, value: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query(
        `INSERT INTO system_settings (key, value, updated_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [key, value],
      )
      return result.rows[0]
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT OR REPLACE INTO system_settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `)
      return stmt.run(key, value)
    }
  }

  public async getAllSettings(): Promise<Record<string, string>> {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query("SELECT key, value FROM system_settings")
      const settings: Record<string, string> = {}
      result.rows.forEach((row: any) => {
        settings[row.key] = row.value
      })
      return settings
    } else {
      const stmt = (client as Database.Database).prepare("SELECT key, value FROM system_settings")
      const rows = stmt.all() as Array<{ key: string; value: string }>
      const settings: Record<string, string> = {}
      rows.forEach((row) => {
        settings[row.key] = row.value
      })
      return settings
    }
  }

  // Market data methods
  public async insertMarketData(connection_id: string, symbol: string, price: number) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(
        `INSERT INTO market_data (connection_id, symbol, price) VALUES ($1, $2, $3)`,
        [connection_id, symbol, price],
      )
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT INTO market_data (connection_id, symbol, price) VALUES (?, ?, ?)
      `)
      return stmt.run(connection_id, symbol, price)
    }
  }

  public async getMarketData(connection_id: string, symbol: string, hours = 24) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query(
        `SELECT * FROM market_data 
        WHERE connection_id = $1 AND symbol = $2 
        AND timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp DESC`,
        [connection_id, symbol],
      )
      return result.rows
    } else {
      const stmt = (client as Database.Database).prepare(`
        SELECT * FROM market_data 
        WHERE connection_id = ? AND symbol = ? 
        AND timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
      `)
      return stmt.all(connection_id, symbol)
    }
  }

  public async batchInsertMarketData(
    dataPoints: Array<{ connection_id: string; symbol: string; price: number }>,
  ): Promise<void> {
    if (dataPoints.length === 0) return

    console.log(`[v0] Batch inserting ${dataPoints.length} market data points`)

    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const values = dataPoints
        .map((_, i) => {
          const offset = i * 3
          return `($${offset + 1}, $${offset + 2}, $${offset + 3})`
        })
        .join(", ")

      const params = dataPoints.flatMap((d) => [d.connection_id, d.symbol, d.price])

      await (client as Pool).query(`INSERT INTO market_data (connection_id, symbol, price) VALUES ${values}`, params)
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT INTO market_data (connection_id, symbol, price) VALUES (?, ?, ?)
      `)

      const insertMany = (client as Database.Database).transaction((dataPoints: any[]) => {
        for (const d of dataPoints) {
          stmt.run(d.connection_id, d.symbol, d.price)
        }
      })

      insertMany(dataPoints)
    }
  }

  public async getMarketDataByConnection(
    connectionIds: string[],
    symbol: string,
    hours = 24,
  ): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>()
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const query = `
        SELECT * FROM market_data 
        WHERE connection_id = ANY($1) AND symbol = $2 
        AND timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY connection_id, timestamp DESC
      `
      const rows = await (client as Pool).query(query, [connectionIds, symbol])

      for (const row of rows.rows as any[]) {
        if (!result.has(row.connection_id)) {
          result.set(row.connection_id, [])
        }
        result.get(row.connection_id)!.push(row)
      }
    } else {
      const placeholders = connectionIds.map(() => "?").join(",")
      const stmt = (client as Database.Database).prepare(`
        SELECT * FROM market_data 
        WHERE connection_id IN (${placeholders}) AND symbol = ? 
        AND timestamp > datetime('now', '-${hours} hours')
        ORDER BY connection_id, timestamp DESC
      `)
      const rows = stmt.all(...connectionIds, symbol)

      for (const row of rows as any[]) {
        if (!result.has(row.connection_id)) {
          result.set(row.connection_id, [])
        }
        result.get(row.connection_id)!.push(row)
      }
    }

    return result
  }

  // Logging methods for monitoring
  public async insertLog(level: string, category: string, message: string, details?: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(
        `INSERT INTO logs (level, category, message, details) VALUES ($1, $2, $3, $4)`,
        [level, category, message, details || null],
      )
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT INTO logs (level, category, message, details) VALUES (?, ?, ?, ?)
      `)
      return stmt.run(level, category, message, details || null)
    }
  }

  public async getLogs(limit = 100, level?: string, category?: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      let query = "SELECT * FROM logs WHERE 1=1"
      const params: any[] = []

      if (level) {
        query += " AND level = $" + (params.length + 1)
        params.push(level)
      }

      if (category) {
        query += " AND category = $" + (params.length + 1)
        params.push(category)
      }

      query += " ORDER BY timestamp DESC LIMIT $" + (params.length + 1)
      params.push(limit)

      const result = await (client as Pool).query(query, params)
      return result.rows
    } else {
      let query = "SELECT * FROM logs WHERE 1=1"
      const params: any[] = []

      if (level) {
        query += " AND level = ?"
        params.push(level)
      }

      if (category) {
        query += " AND category = ?"
        params.push(category)
      }

      query += " ORDER BY timestamp DESC LIMIT ?"
      params.push(limit)

      const stmt = (client as Database.Database).prepare(query)
      return stmt.all(...params)
    }
  }

  public async clearOldLogs(days = 7) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(`
        DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '${days} days'
      `)
    } else {
      const stmt = (client as Database.Database).prepare(`
        DELETE FROM logs WHERE timestamp < datetime('now', '-${days} days')
      `)
      return stmt.run()
    }
  }

  public async insertError(type: string, message: string, stack?: string, context?: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(
        `INSERT INTO errors (type, message, stack, context) VALUES ($1, $2, $3, $4)`,
        [type, message, stack || null, context || null],
      )
    } else {
      const stmt = (client as Database.Database).prepare(`
        INSERT INTO errors (type, message, stack, context) VALUES (?, ?, ?, ?)
      `)
      return stmt.run(type, message, stack || null, context || null)
    }
  }

  public async getErrors(limit = 50, resolved = false) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as Pool).query(
        `SELECT * FROM errors WHERE resolved = $1 ORDER BY timestamp DESC LIMIT $2`,
        [resolved, limit],
      )
      return result.rows
    } else {
      const stmt = (client as Database.Database).prepare(`
        SELECT * FROM errors WHERE resolved = ? ORDER BY timestamp DESC LIMIT ?
      `)
      return stmt.all(resolved ? 1 : 0, limit)
    }
  }

  public async resolveError(id: number) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(`UPDATE errors SET resolved = true WHERE id = $1`, [id])
    } else {
      const stmt = (client as Database.Database).prepare(`
        UPDATE errors SET resolved = 1 WHERE id = ?
      `)
      return stmt.run(id)
    }
  }

  public async clearOldErrors(days = 30) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      return await (client as Pool).query(`
        DELETE FROM errors WHERE resolved = true AND timestamp < NOW() - INTERVAL '${days} days'
      `)
    } else {
      const stmt = (client as Database.Database).prepare(`
        DELETE FROM errors WHERE resolved = 1 AND timestamp < datetime('now', '-${days} days')
      `)
      return stmt.run()
    }
  }

  public async getConnectionStatistics(connectionId: string): Promise<any> {
    const cacheKey = `stats:${connectionId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    const stats: any = {}

    if (isPostgres) {
      const [positionStats] = (
        await (client as Pool).query(
          `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'closed') as closed,
          AVG(profit_factor) as avg_profit_factor
         FROM pseudo_positions WHERE connection_id = $1`,
          [connectionId],
        )
      ).rows

      const [marketDataCount] = (
        await (client as Pool).query(
          `SELECT COUNT(*) as count FROM market_data 
         WHERE connection_id = $1 AND timestamp > NOW() - INTERVAL '24 hours'`,
          [connectionId],
        )
      ).rows

      stats.positions = positionStats
      stats.marketDataPoints = marketDataCount.count
    } else {
      const positionStats = (client as Database.Database)
        .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          AVG(profit_factor) as avg_profit_factor
        FROM pseudo_positions WHERE connection_id = ?
      `)
        .get(connectionId)

      const marketDataCount = (client as Database.Database)
        .prepare(`
        SELECT COUNT(*) as count FROM market_data 
        WHERE connection_id = ? AND timestamp > datetime('now', '-24 hours')
      `)
        .get(connectionId) as { count: number } | undefined

      stats.positions = positionStats
      stats.marketDataPoints = (marketDataCount as any)?.count || 0
    }

    this.setInCache(cacheKey, stats)
    return stats
  }

  public async getPositionStats(connectionId: string) {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    // Query adapted to use available columns: profit_factor, position_cost, status ('active'/'closed')
    // PnL is estimated as (profit_factor - 1) * position_cost
    const query = `
      SELECT 
        COUNT(*) as total_positions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_positions,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_positions,
        SUM(CASE WHEN status = 'active' THEN (profit_factor - 1) * position_cost ELSE 0 END) as total_pnl,
        AVG(CASE WHEN status = 'closed' AND profit_factor > 1 THEN (profit_factor - 1) * position_cost ELSE NULL END) as avg_profit,
        AVG(CASE WHEN status = 'closed' AND profit_factor < 1 THEN (profit_factor - 1) * position_cost ELSE NULL END) as avg_loss,
        (SUM(CASE WHEN status = 'closed' AND profit_factor > 1 THEN 1 ELSE 0 END) * 100.0 / 
         NULLIF(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0)) as win_rate
      FROM pseudo_positions
      WHERE connection_id = ?
    `

    if (isPostgres) {
      const pgQuery = query.replace(/\?/g, "$1")
      const result = await (client as Pool).query(pgQuery, [connectionId])
      return result.rows[0]
    } else {
      const stmt = (client as Database.Database).prepare(query)
      return stmt.get(connectionId)
    }
  }

  public async getGlobalPositionStats() {
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    const query = `
      SELECT 
        COUNT(*) as total_positions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_positions,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_positions,
        SUM(CASE WHEN status = 'active' THEN (profit_factor - 1) * position_cost ELSE 0 END) as total_pnl,
        AVG(CASE WHEN status = 'closed' AND profit_factor > 1 THEN (profit_factor - 1) * position_cost ELSE NULL END) as avg_profit,
        AVG(CASE WHEN status = 'closed' AND profit_factor < 1 THEN (profit_factor - 1) * position_cost ELSE NULL END) as avg_loss,
        (SUM(CASE WHEN status = 'closed' AND profit_factor > 1 THEN 1 ELSE 0 END) * 100.0 / 
         NULLIF(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0)) as win_rate
      FROM pseudo_positions
    `

    if (isPostgres) {
      const result = await (client as Pool).query(query)
      return result.rows[0]
    } else {
      const stmt = (client as Database.Database).prepare(query)
      return stmt.get()
    }
  }

  public async insertAutoOptimalConfig(config: any) {
    return await this.insert(EntityTypes.CONFIG, ConfigSubTypes.AUTO_OPTIMAL, config)
  }

  private groupByConnectionId<T extends { connection_id: string }>(items: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>()

    for (const item of items) {
      if (!grouped.has(item.connection_id)) {
        grouped.set(item.connection_id, [])
      }
      grouped.get(item.connection_id)!.push(item)
    }

    return grouped
  }

  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.queryCache.delete(key)
      return null
    }

    return cached.data
  }

  private setInCache(key: string, data: any): void {
    this.queryCache.set(key, { data, timestamp: Date.now() })

    // Cleanup old cache entries (keep only last 100)
    if (this.queryCache.size > 100) {
      const entries = Array.from(this.queryCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = entries.slice(0, entries.length - 100)
      toRemove.forEach(([key]) => this.queryCache.delete(key))
    }
  }

  public clearConnectionCache(connectionId: string): void {
    for (const [key] of this.queryCache.entries()) {
      if (key.includes(connectionId)) {
        this.queryCache.delete(key)
      }
    }
  }

  public close() {
    // No-op as client is managed by lib/db.ts
  }
}

export default DatabaseManager

export const db = DatabaseManager.getInstance()
