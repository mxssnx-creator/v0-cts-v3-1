import fs from "fs"
import path from "path"
import { EventEmitter } from "events"

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "data")
    : path.join(process.cwd(), "data")

const CONNECTION_STATE_FILE = path.join(DATA_DIR, "connection-state.json")
const CONNECTION_SYNC_LOG_FILE = path.join(DATA_DIR, "connection-sync-log.json")

interface ConnectionState {
  connection_id: string
  is_active: boolean
  volume_factor_live: number
  volume_factor_preset: number
  test_results: any
  last_sync_at: string
  created_at: string
  updated_at: string
}

interface SyncLogEntry {
  id: number
  connection_id: string
  action: string
  data: any
  created_at: string
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch (error) {
    console.error("[ConnectionStateManager] Failed to create data directory:", error)
  }
}

function loadStateFromFile(): ConnectionState[] {
  try {
    ensureDataDir()
    if (fs.existsSync(CONNECTION_STATE_FILE)) {
      const data = fs.readFileSync(CONNECTION_STATE_FILE, "utf-8")
      if (data && data.trim()) {
        return JSON.parse(data)
      }
    }
    return []
  } catch (error) {
    console.error("[ConnectionStateManager] Failed to load state from file:", error)
    return []
  }
}

function saveStateToFile(states: ConnectionState[]): void {
  try {
    ensureDataDir()
    fs.writeFileSync(CONNECTION_STATE_FILE, JSON.stringify(states, null, 2), "utf-8")
  } catch (error) {
    console.error("[ConnectionStateManager] Failed to save state to file:", error)
    throw error
  }
}

function loadSyncLogFromFile(): SyncLogEntry[] {
  try {
    ensureDataDir()
    if (fs.existsSync(CONNECTION_SYNC_LOG_FILE)) {
      const data = fs.readFileSync(CONNECTION_SYNC_LOG_FILE, "utf-8")
      if (data && data.trim()) {
        return JSON.parse(data)
      }
    }
    return []
  } catch (error) {
    console.error("[ConnectionStateManager] Failed to load sync log from file:", error)
    return []
  }
}

function saveSyncLogToFile(logs: SyncLogEntry[]): void {
  try {
    ensureDataDir()
    // Keep only last 1000 entries
    const trimmedLogs = logs.slice(-1000)
    fs.writeFileSync(CONNECTION_SYNC_LOG_FILE, JSON.stringify(trimmedLogs, null, 2), "utf-8")
  } catch (error) {
    console.error("[ConnectionStateManager] Failed to save sync log to file:", error)
  }
}

class ConnectionStateManager extends EventEmitter {
  private initialized = false
  private stateCache: Map<string, any> = new Map()

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      ensureDataDir()

      // Ensure files exist
      if (!fs.existsSync(CONNECTION_STATE_FILE)) {
        saveStateToFile([])
      }
      if (!fs.existsSync(CONNECTION_SYNC_LOG_FILE)) {
        saveSyncLogToFile([])
      }

      this.initialized = true
      console.log("[ConnectionStateManager] Initialized with file-based backend")
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to initialize:", error)
      throw error
    }
  }

  async getActiveConnection(): Promise<string | null> {
    try {
      await this.initialize()

      const states = loadStateFromFile()
      const activeState = states
        .filter((s) => s.is_active)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

      return activeState?.connection_id || null
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get active connection:", error)
      return null
    }
  }

  async setActiveConnection(connectionId: string): Promise<void> {
    try {
      await this.initialize()

      const states = loadStateFromFile()

      // Deactivate all connections
      states.forEach((s) => {
        s.is_active = false
        s.updated_at = new Date().toISOString()
      })

      // Find or create the connection state
      const state = states.find((s) => s.connection_id === connectionId)
      if (state) {
        state.is_active = true
        state.updated_at = new Date().toISOString()
      } else {
        states.push({
          connection_id: connectionId,
          is_active: true,
          volume_factor_live: 1.0,
          volume_factor_preset: 1.0,
          test_results: null,
          last_sync_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      saveStateToFile(states)

      // Log the action
      const logs = loadSyncLogFromFile()
      logs.push({
        id: logs.length + 1,
        connection_id: connectionId,
        action: "set_active",
        data: { timestamp: new Date().toISOString() },
        created_at: new Date().toISOString(),
      })
      saveSyncLogToFile(logs)

      this.stateCache.set("active", connectionId)
      this.emit("activeConnectionChanged", connectionId)
      console.log("[ConnectionStateManager] Active connection set:", connectionId)
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to set active connection:", error)
      throw error
    }
  }

  async getVolumeFactor(connectionId: string): Promise<{ live: number; preset: number } | null> {
    try {
      await this.initialize()

      const states = loadStateFromFile()
      const state = states.find((s) => s.connection_id === connectionId)

      if (!state) return null

      return {
        live: Number(state.volume_factor_live),
        preset: Number(state.volume_factor_preset),
      }
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get volume factor:", error)
      return null
    }
  }

  async setVolumeFactor(connectionId: string, live: number, preset: number): Promise<void> {
    try {
      await this.initialize()

      const states = loadStateFromFile()
      const state = states.find((s) => s.connection_id === connectionId)

      if (state) {
        state.volume_factor_live = live
        state.volume_factor_preset = preset
        state.updated_at = new Date().toISOString()
      } else {
        states.push({
          connection_id: connectionId,
          is_active: false,
          volume_factor_live: live,
          volume_factor_preset: preset,
          test_results: null,
          last_sync_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      saveStateToFile(states)

      // Log the action
      const logs = loadSyncLogFromFile()
      logs.push({
        id: logs.length + 1,
        connection_id: connectionId,
        action: "update_volume",
        data: { live, preset, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString(),
      })
      saveSyncLogToFile(logs)

      this.emit("volumeFactorChanged", connectionId, live, preset)
      console.log("[ConnectionStateManager] Volume factor updated:", connectionId, { live, preset })
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to set volume factor:", error)
      throw error
    }
  }

  async getTestResults(connectionId: string): Promise<any> {
    try {
      await this.initialize()

      const states = loadStateFromFile()
      const state = states.find((s) => s.connection_id === connectionId)

      return state?.test_results || null
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get test results:", error)
      return null
    }
  }

  async setTestResults(connectionId: string, results: any): Promise<void> {
    try {
      await this.initialize()

      const states = loadStateFromFile()
      const state = states.find((s) => s.connection_id === connectionId)

      const resultsWithTimestamp = {
        ...results,
        timestamp: new Date().toISOString(),
      }

      if (state) {
        state.test_results = resultsWithTimestamp
        state.updated_at = new Date().toISOString()
      } else {
        states.push({
          connection_id: connectionId,
          is_active: false,
          volume_factor_live: 1.0,
          volume_factor_preset: 1.0,
          test_results: resultsWithTimestamp,
          last_sync_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      saveStateToFile(states)

      this.emit("testResultsUpdated", connectionId, results)
      console.log("[ConnectionStateManager] Test results saved:", connectionId)
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to set test results:", error)
      throw error
    }
  }

  async getSyncLog(limit = 100): Promise<SyncLogEntry[]> {
    try {
      await this.initialize()

      const logs = loadSyncLogFromFile()
      return logs.slice(-limit).reverse()
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get sync log:", error)
      return []
    }
  }

  async clearCache(): Promise<void> {
    this.stateCache.clear()
    console.log("[ConnectionStateManager] Memory cache cleared")
  }

  async updateHeartbeat(connectionId: string): Promise<void> {
    try {
      const states = loadStateFromFile()
      const state = states.find((s) => s.connection_id === connectionId)

      if (state) {
        state.last_sync_at = new Date().toISOString()
        saveStateToFile(states)
      }
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to update heartbeat:", error)
    }
  }

  async getStaleConnections(): Promise<string[]> {
    try {
      const states = loadStateFromFile()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      return states.filter((s) => s.is_active && new Date(s.last_sync_at) < fiveMinutesAgo).map((s) => s.connection_id)
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get stale connections:", error)
      return []
    }
  }
}

const connectionStateManager = new ConnectionStateManager()

export { ConnectionStateManager }
export default connectionStateManager
