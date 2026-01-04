import { sql } from "./db"
import { EventEmitter } from "events"

class ConnectionStateManager extends EventEmitter {
  private initialized = false
  private stateCache: Map<string, any> = new Map()

  async initialize() {
    if (this.initialized) return

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS connection_state (
          connection_id TEXT PRIMARY KEY,
          is_active BOOLEAN DEFAULT false,
          volume_factor_live REAL DEFAULT 1.0,
          volume_factor_preset REAL DEFAULT 1.0,
          test_results JSONB,
          last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS connection_sync_log (
          id SERIAL PRIMARY KEY,
          connection_id TEXT,
          action TEXT NOT NULL,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      this.initialized = true
      console.log("[ConnectionStateManager] Initialized with database backend")
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to initialize:", error)
      throw error
    }
  }

  async getActiveConnection(): Promise<string | null> {
    try {
      await this.initialize()

      const [active] = await sql`
        SELECT connection_id FROM connection_state
        WHERE is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `

      return active?.connection_id || null
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get active connection:", error)
      return null
    }
  }

  async setActiveConnection(connectionId: string): Promise<void> {
    try {
      await this.initialize()

      await sql.begin(async (sql) => {
        // Deactivate all other connections
        await sql`
          UPDATE connection_state SET is_active = false, updated_at = CURRENT_TIMESTAMP
        `

        // Activate the specified connection
        await sql`
          INSERT INTO connection_state (connection_id, is_active, updated_at)
          VALUES (${connectionId}, true, CURRENT_TIMESTAMP)
          ON CONFLICT (connection_id) 
          DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
        `

        // Log the change
        await sql`
          INSERT INTO connection_sync_log (connection_id, action, data)
          VALUES (${connectionId}, 'set_active', ${JSON.stringify({ timestamp: new Date().toISOString() })})
        `
      })

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

      const [state] = await sql`
        SELECT volume_factor_live, volume_factor_preset
        FROM connection_state
        WHERE connection_id = ${connectionId}
      `

      if (!state) return null

      return {
        live: Number.parseFloat(state.volume_factor_live),
        preset: Number.parseFloat(state.volume_factor_preset),
      }
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get volume factor:", error)
      return null
    }
  }

  async setVolumeFactor(connectionId: string, live: number, preset: number): Promise<void> {
    try {
      await this.initialize()

      await sql`
        INSERT INTO connection_state (connection_id, volume_factor_live, volume_factor_preset, updated_at)
        VALUES (${connectionId}, ${live}, ${preset}, CURRENT_TIMESTAMP)
        ON CONFLICT (connection_id)
        DO UPDATE SET 
          volume_factor_live = ${live},
          volume_factor_preset = ${preset},
          updated_at = CURRENT_TIMESTAMP
      `

      await sql`
        INSERT INTO connection_sync_log (connection_id, action, data)
        VALUES (${connectionId}, 'update_volume', ${JSON.stringify({ live, preset, timestamp: new Date().toISOString() })})
      `

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

      const [state] = await sql`
        SELECT test_results FROM connection_state
        WHERE connection_id = ${connectionId}
      `

      return state?.test_results || null
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get test results:", error)
      return null
    }
  }

  async setTestResults(connectionId: string, results: any): Promise<void> {
    try {
      await this.initialize()

      const resultsWithTimestamp = {
        ...results,
        timestamp: new Date().toISOString(),
      }

      await sql`
        INSERT INTO connection_state (connection_id, test_results, updated_at)
        VALUES (${connectionId}, ${JSON.stringify(resultsWithTimestamp)}, CURRENT_TIMESTAMP)
        ON CONFLICT (connection_id)
        DO UPDATE SET 
          test_results = ${JSON.stringify(resultsWithTimestamp)},
          updated_at = CURRENT_TIMESTAMP
      `

      this.emit("testResultsUpdated", connectionId, results)
      console.log("[ConnectionStateManager] Test results saved:", connectionId)
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to set test results:", error)
      throw error
    }
  }

  async getSyncLog(limit = 100): Promise<any[]> {
    try {
      await this.initialize()

      const logs = await sql`
        SELECT * FROM connection_sync_log
        ORDER BY created_at DESC
        LIMIT ${limit}
      `

      return logs
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
      await sql`
        UPDATE connection_state
        SET last_sync_at = CURRENT_TIMESTAMP
        WHERE connection_id = ${connectionId}
      `
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to update heartbeat:", error)
    }
  }

  async getStaleConnections(): Promise<string[]> {
    try {
      const stale = await sql`
        SELECT connection_id FROM connection_state
        WHERE last_sync_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
          AND is_active = true
      `

      return stale.map((row) => row.connection_id)
    } catch (error) {
      console.error("[ConnectionStateManager] Failed to get stale connections:", error)
      return []
    }
  }
}

export const connectionStateManager = new ConnectionStateManager()
