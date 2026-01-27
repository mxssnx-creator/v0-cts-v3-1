/**
 * Database Initialization & Validation Module
 * Ensures all required tables and schemas exist with proper structure
 */

import { execute, query, queryOne, getDatabaseType } from "@/lib/db"

export class DatabaseInitializer {
  private static initialized = false

  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }

    try {
      console.log("[v0] Initializing database schema...")

      const dbType = getDatabaseType()
      console.log(`[v0] Using ${dbType} database`)

      // Create critical tables if they don't exist
      await this.ensureTradeEngineStateTables()
      await this.ensureConnectionTables()
      await this.ensureIndicationTables()

      this.initialized = true
      console.log("[v0] Database initialization completed successfully")
      return true
    } catch (error) {
      console.error("[v0] Database initialization failed:", error)
      return false
    }
  }

  private static async ensureTradeEngineStateTables(): Promise<void> {
    const dbType = getDatabaseType()
    const isSQLite = dbType === "sqlite"

    try {
      // Create trade_engine_state table
      const tradeEngineStateSQL = isSQLite
        ? `
        CREATE TABLE IF NOT EXISTS trade_engine_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          connection_id TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'stopped',
          is_running INTEGER DEFAULT 0,
          error_message TEXT,
          prehistoric_data_loaded INTEGER DEFAULT 0,
          prehistoric_data_start TEXT,
          prehistoric_data_end TEXT,
          last_indication_run TEXT,
          indication_cycle_count INTEGER DEFAULT 0,
          indication_avg_duration_ms REAL DEFAULT 0,
          last_strategy_run TEXT,
          strategy_cycle_count INTEGER DEFAULT 0,
          strategy_avg_duration_ms REAL DEFAULT 0,
          last_realtime_run TEXT,
          realtime_cycle_count INTEGER DEFAULT 0,
          realtime_avg_duration_ms REAL DEFAULT 0,
          manager_health_status TEXT DEFAULT 'healthy',
          indications_health TEXT DEFAULT 'healthy',
          strategies_health TEXT DEFAULT 'healthy',
          realtime_health TEXT DEFAULT 'healthy',
          last_manager_health_check TEXT,
          balance REAL DEFAULT 0,
          active_positions INTEGER DEFAULT 0,
          active_symbols INTEGER DEFAULT 0,
          loading_progress REAL DEFAULT 0,
          is_loading INTEGER DEFAULT 0,
          loading_stage TEXT DEFAULT 'idle',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
        : `
        CREATE TABLE IF NOT EXISTS trade_engine_state (
          id SERIAL PRIMARY KEY,
          connection_id TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'stopped',
          is_running BOOLEAN DEFAULT false,
          error_message TEXT,
          prehistoric_data_loaded BOOLEAN DEFAULT false,
          prehistoric_data_start TIMESTAMP,
          prehistoric_data_end TIMESTAMP,
          last_indication_run TIMESTAMP,
          indication_cycle_count INTEGER DEFAULT 0,
          indication_avg_duration_ms FLOAT DEFAULT 0,
          last_strategy_run TIMESTAMP,
          strategy_cycle_count INTEGER DEFAULT 0,
          strategy_avg_duration_ms FLOAT DEFAULT 0,
          last_realtime_run TIMESTAMP,
          realtime_cycle_count INTEGER DEFAULT 0,
          realtime_avg_duration_ms FLOAT DEFAULT 0,
          manager_health_status TEXT DEFAULT 'healthy',
          indications_health TEXT DEFAULT 'healthy',
          strategies_health TEXT DEFAULT 'healthy',
          realtime_health TEXT DEFAULT 'healthy',
          last_manager_health_check TIMESTAMP,
          balance FLOAT DEFAULT 0,
          active_positions INTEGER DEFAULT 0,
          active_symbols INTEGER DEFAULT 0,
          loading_progress FLOAT DEFAULT 0,
          is_loading BOOLEAN DEFAULT false,
          loading_stage TEXT DEFAULT 'idle',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      await execute(tradeEngineStateSQL)
      console.log("[v0] trade_engine_state table created/verified")
    } catch (error) {
      console.warn("[v0] Error creating trade_engine_state table:", error)
    }
  }

  private static async ensureConnectionTables(): Promise<void> {
    const dbType = getDatabaseType()
    const isSQLite = dbType === "sqlite"

    try {
      // Create exchange_connections table
      const exchangeConnectionsSQL = isSQLite
        ? `
        CREATE TABLE IF NOT EXISTS exchange_connections (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          name TEXT NOT NULL,
          exchange TEXT NOT NULL,
          exchange_id INTEGER,
          api_type TEXT,
          connection_method TEXT,
          connection_library TEXT,
          api_key TEXT,
          api_secret TEXT,
          api_passphrase TEXT,
          margin_type TEXT,
          position_mode TEXT,
          is_testnet INTEGER DEFAULT 0,
          is_enabled INTEGER DEFAULT 0,
          is_live_trade INTEGER DEFAULT 0,
          is_preset_trade INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 0,
          is_predefined INTEGER DEFAULT 0,
          volume_factor REAL DEFAULT 1.0,
          connection_settings TEXT,
          last_test_at TEXT,
          last_test_status TEXT,
          last_test_balance REAL,
          last_test_error TEXT,
          last_test_log TEXT,
          api_capabilities TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
        : `
        CREATE TABLE IF NOT EXISTS exchange_connections (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          name TEXT NOT NULL,
          exchange TEXT NOT NULL,
          exchange_id INTEGER,
          api_type TEXT,
          connection_method TEXT,
          connection_library TEXT,
          api_key TEXT,
          api_secret TEXT,
          api_passphrase TEXT,
          margin_type TEXT,
          position_mode TEXT,
          is_testnet BOOLEAN DEFAULT false,
          is_enabled BOOLEAN DEFAULT false,
          is_live_trade BOOLEAN DEFAULT false,
          is_preset_trade BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT false,
          is_predefined BOOLEAN DEFAULT false,
          volume_factor FLOAT DEFAULT 1.0,
          connection_settings JSONB,
          last_test_at TIMESTAMP,
          last_test_status TEXT,
          last_test_balance FLOAT,
          last_test_error TEXT,
          last_test_log TEXT ARRAY,
          api_capabilities TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      await execute(exchangeConnectionsSQL)
      console.log("[v0] exchange_connections table created/verified")
    } catch (error) {
      console.warn("[v0] Error creating exchange_connections table:", error)
    }
  }

  private static async ensureIndicationTables(): Promise<void> {
    const dbType = getDatabaseType()
    const isSQLite = dbType === "sqlite"

    try {
      // Create indications table
      const indicationsSQL = isSQLite
        ? `
        CREATE TABLE IF NOT EXISTS indications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          connection_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          indication_type TEXT NOT NULL,
          timeframe TEXT,
          mode TEXT,
          value REAL,
          profit_factor REAL,
          confidence REAL,
          metadata TEXT,
          calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
        : `
        CREATE TABLE IF NOT EXISTS indications (
          id SERIAL PRIMARY KEY,
          connection_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          indication_type TEXT NOT NULL,
          timeframe TEXT,
          mode TEXT,
          value FLOAT,
          profit_factor FLOAT,
          confidence FLOAT,
          metadata JSONB,
          calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      await execute(indicationsSQL)
      console.log("[v0] indications table created/verified")
    } catch (error) {
      console.warn("[v0] Error creating indications table:", error)
    }
  }

  /**
   * Verify database integrity
   */
  static async verifyIntegrity(): Promise<{
    isValid: boolean
    missingTables: string[]
    errors: string[]
  }> {
    const missingTables: string[] = []
    const errors: string[] = []
    const requiredTables = ["trade_engine_state", "exchange_connections", "indications"]

    try {
      for (const table of requiredTables) {
        try {
          const exists = await this.tableExists(table)
          if (!exists) {
            missingTables.push(table)
          }
        } catch (error) {
          errors.push(`Failed to check ${table}: ${error}`)
        }
      }

      return {
        isValid: missingTables.length === 0 && errors.length === 0,
        missingTables,
        errors,
      }
    } catch (error) {
      return {
        isValid: false,
        missingTables,
        errors: [...errors, String(error)],
      }
    }
  }

  private static async tableExists(tableName: string): Promise<boolean> {
    const dbType = getDatabaseType()

    try {
      if (dbType === "sqlite") {
        const result = await query<{ name: string }>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
          [tableName],
        )
        return result.length > 0
      } else {
        const result = await query<{ exists: boolean }>(
          `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
          [tableName],
        )
        return result[0]?.exists || false
      }
    } catch (error) {
      console.error(`[v0] Error checking if table ${tableName} exists:`, error)
      return false
    }
  }
}

export default DatabaseInitializer
