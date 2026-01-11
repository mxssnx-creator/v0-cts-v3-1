import { execute, getDatabaseType, query } from "@/lib/db"
import fs from "fs"
import path from "path"

export interface Migration {
  id: number
  name: string
  sql: string
  executed: boolean
}

export class DatabaseMigrations {
  private static migrations: Migration[] = [
    {
      id: 36,
      name: "create_optimal_indication_tables",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 37,
      name: "create_exchange_positions_table",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 38,
      name: "fix_pseudo_positions_schema",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 51,
      name: "add_performance_indexes",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 53,
      name: "add_market_data_optimization",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 54,
      name: "rename_active_advanced_to_auto",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 55,
      name: "create_preset_trade_engine_tables",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 56,
      name: "add_parabolic_sar_and_common_indicators",
      sql: "", // Will be loaded from file
      executed: false,
    },
    {
      id: 57,
      name: "new_migration_example",
      sql: "", // Will be loaded from file
      executed: false,
    },
  ]

  private static async loadMigrationSQL(migration: Migration): Promise<string> {
    const paddedId = migration.id.toString().padStart(3, "0")
    const scriptsPath = path.join(process.cwd(), "scripts", `${paddedId}_${migration.name}.sql`)

    try {
      if (fs.existsSync(scriptsPath)) {
        console.log(`[v0] Loading migration ${migration.id} from file: ${scriptsPath}`)
        return fs.readFileSync(scriptsPath, "utf-8")
      }
    } catch (error) {
      console.log(`[v0] Migration ${migration.id} file not found at ${scriptsPath}, using inline SQL`)
    }
    // Fallback to inline SQL methods
    switch (migration.id) {
      case 36:
        return this.getOptimalIndicationSQL()
      case 37:
        return this.getExchangePositionsSQL()
      case 38:
        return this.getFixPseudoPositionsSQL()
      case 51:
        return this.getPerformanceIndexesSQL()
      case 53:
        return this.getMarketDataOptimizationSQL()
      case 54:
        return this.getRenameActiveAdvancedToAutoSQL()
      case 55:
        return this.getPresetTradeEngineTablesSQL()
      case 56:
        return this.getParabolicSarIndicatorSQL()
      case 57:
        return this.getNewMigrationExampleSQL()
      default:
        return migration.sql
    }
  }

  private static async createMigrationsTable(): Promise<void> {
    const dbType = getDatabaseType()

    const sql =
      dbType === "postgresql"
        ? `CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW()
        )`
        : `CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`

    await execute(sql)
  }

  private static async getAppliedMigrations(): Promise<Set<number>> {
    try {
      const results = await query("SELECT id FROM migrations")
      return new Set(results.map((r: any) => r.id))
    } catch (error) {
      console.log("[v0] Migrations table doesn't exist yet, will create it")
      return new Set()
    }
  }

  private static async markMigrationAsExecuted(id: number, name: string): Promise<void> {
    const dbType = getDatabaseType()

    const sql =
      dbType === "postgresql"
        ? `INSERT INTO migrations (id, name, executed_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO NOTHING`
        : `INSERT OR IGNORE INTO migrations (id, name, executed_at) VALUES (?, ?, datetime('now'))`

    await execute(sql, [id, name])
  }

  static async runMigrations(): Promise<{ success: boolean; applied: number; message: string }> {
    console.log("[v0] Starting database migrations...")

    try {
      const dbType = getDatabaseType()
      console.log(`[v0] Database type: ${dbType}`)

      await this.createMigrationsTable()

      const appliedMigrations = await this.getAppliedMigrations()
      console.log(`[v0] Found ${appliedMigrations.size} previously applied migrations`)

      let applied = 0

      for (const migration of this.migrations) {
        if (appliedMigrations.has(migration.id)) {
          console.log(`[v0] Migration ${migration.id} (${migration.name}) already applied, skipping`)
          continue
        }

        // Load SQL from file or fallback
        migration.sql = await this.loadMigrationSQL(migration)

        if (!migration.sql || migration.sql.trim() === "") {
          console.log(`[v0] Migration ${migration.id} (${migration.name}) is empty, marking as executed`)
          await this.markMigrationAsExecuted(migration.id, migration.name)
          applied++
          continue
        }

        try {
          console.log(`[v0] Applying migration ${migration.id}: ${migration.name}`)
          await execute(migration.sql)

          await this.markMigrationAsExecuted(migration.id, migration.name)

          migration.executed = true
          applied++
          console.log(`[v0] ✓ Migration ${migration.id} applied successfully`)
        } catch (error: any) {
          if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
            console.log(`[v0] Migration ${migration.id} objects already exist, marking as executed`)
            await this.markMigrationAsExecuted(migration.id, migration.name)
            migration.executed = true
            applied++
          } else {
            console.error(`[v0] Failed to apply migration ${migration.id}:`, error)
            return {
              success: false,
              applied,
              message: `Migration ${migration.id} failed: ${error.message}`,
            }
          }
        }
      }

      console.log(`[v0] Migrations completed successfully. Applied ${applied} migrations.`)
      return {
        success: true,
        applied,
        message: `Applied ${applied} migrations`,
      }
    } catch (error: any) {
      console.error("[v0] Migration process failed:", error)
      return {
        success: false,
        applied: 0,
        message: `Migration failed: ${error.message}`,
      }
    }
  }

  private static splitSQLStatements(sql: string): string[] {
    const withoutComments = sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")

    const statements: string[] = []
    let current = ""
    let inQuote = false
    let quoteChar = ""

    for (let i = 0; i < withoutComments.length; i++) {
      const char = withoutComments[i]

      if ((char === "'" || char === '"') && withoutComments[i - 1] !== "\\") {
        if (!inQuote) {
          inQuote = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuote = false
        }
      }

      if (char === ";" && !inQuote) {
        statements.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    if (current.trim()) {
      statements.push(current.trim())
    }

    return statements.filter((s) => s.length > 0)
  }

  private static getOptimalIndicationSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        CREATE TABLE IF NOT EXISTS base_pseudo_positions (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          indication_type TEXT NOT NULL,
          indication_range INTEGER NOT NULL,
          direction TEXT NOT NULL,
          drawdown_ratio REAL NOT NULL,
          market_change_range INTEGER NOT NULL,
          last_part_ratio REAL NOT NULL,
          total_positions INTEGER DEFAULT 0,
          winning_positions INTEGER DEFAULT 0,
          losing_positions INTEGER DEFAULT 0,
          total_profit_loss REAL DEFAULT 0,
          max_drawdown REAL DEFAULT 0,
          win_rate REAL DEFAULT 0,
          avg_profit REAL DEFAULT 0,
          avg_loss REAL DEFAULT 0,
          status TEXT DEFAULT 'evaluating',
          evaluation_count INTEGER DEFAULT 0,
          phase INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_position_at TIMESTAMP,
          UNIQUE(symbol, indication_type, indication_range, direction, drawdown_ratio, market_change_range, last_part_ratio)
        );
        CREATE INDEX IF NOT EXISTS idx_base_pseudo_symbol ON base_pseudo_positions(symbol);
        CREATE INDEX IF NOT EXISTS idx_base_pseudo_status ON base_pseudo_positions(status);
      `
    }

    return `
      CREATE TABLE IF NOT EXISTS base_pseudo_positions (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        indication_type TEXT NOT NULL,
        indication_range INTEGER NOT NULL,
        direction TEXT NOT NULL,
        drawdown_ratio REAL NOT NULL,
        market_change_range INTEGER NOT NULL,
        last_part_ratio REAL NOT NULL,
        total_positions INTEGER DEFAULT 0,
        winning_positions INTEGER DEFAULT 0,
        losing_positions INTEGER DEFAULT 0,
        total_profit_loss REAL DEFAULT 0,
        max_drawdown REAL DEFAULT 0,
        win_rate REAL DEFAULT 0,
        avg_profit REAL DEFAULT 0,
        avg_loss REAL DEFAULT 0,
        status TEXT DEFAULT 'evaluating',
        evaluation_count INTEGER DEFAULT 0,
        phase INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_position_at DATETIME,
        UNIQUE(symbol, indication_type, indication_range, direction, drawdown_ratio, market_change_range, last_part_ratio)
      );
      CREATE INDEX IF NOT EXISTS idx_base_pseudo_symbol ON base_pseudo_positions(symbol);
      CREATE INDEX IF NOT EXISTS idx_base_pseudo_status ON base_pseudo_positions(status);
    `
  }

  private static getExchangePositionsSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        CREATE TABLE IF NOT EXISTS active_exchange_positions (
          id TEXT PRIMARY KEY,
          connection_id TEXT NOT NULL,
          real_pseudo_position_id TEXT NOT NULL,
          main_pseudo_position_id TEXT,
          base_pseudo_position_id TEXT,
          exchange_id TEXT NOT NULL UNIQUE,
          exchange_order_id TEXT,
          exchange_position_id TEXT,
          symbol TEXT NOT NULL,
          side TEXT NOT NULL CHECK (side IN ('long', 'short')),
          position_type TEXT DEFAULT 'market',
          entry_price REAL NOT NULL,
          current_price REAL NOT NULL,
          quantity REAL NOT NULL,
          volume_usd REAL NOT NULL,
          leverage INTEGER DEFAULT 1,
          takeprofit REAL,
          stoploss REAL,
          trailing_enabled BOOLEAN DEFAULT FALSE,
          trail_start REAL,
          trail_stop REAL,
          trail_activated BOOLEAN DEFAULT FALSE,
          trail_high_price REAL,
          unrealized_pnl REAL DEFAULT 0,
          realized_pnl REAL DEFAULT 0,
          fees_paid REAL DEFAULT 0,
          funding_fees REAL DEFAULT 0,
          max_profit REAL DEFAULT 0,
          max_loss REAL DEFAULT 0,
          max_drawdown REAL DEFAULT 0,
          price_high REAL,
          price_low REAL,
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'cancelled', 'liquidated')),
          opened_at TIMESTAMP DEFAULT NOW(),
          last_updated_at TIMESTAMP DEFAULT NOW(),
          closed_at TIMESTAMP,
          hold_duration_seconds INTEGER,
          sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_update', 'error', 'out_of_sync')),
          last_sync_at TIMESTAMP DEFAULT NOW(),
          sync_error_message TEXT,
          sync_retry_count INTEGER DEFAULT 0,
          trade_mode TEXT NOT NULL CHECK (trade_mode IN ('preset', 'main')),
          indication_type TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_connection ON active_exchange_positions(connection_id);
        CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_exchange_id ON active_exchange_positions(exchange_id);
        CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_symbol ON active_exchange_positions(symbol);
        CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_status ON active_exchange_positions(status);
      `
    }

    return `
      CREATE TABLE IF NOT EXISTS active_exchange_positions (
        id TEXT PRIMARY KEY,
        connection_id TEXT NOT NULL,
        real_pseudo_position_id TEXT NOT NULL,
        main_pseudo_position_id TEXT,
        base_pseudo_position_id TEXT,
        exchange_id TEXT NOT NULL UNIQUE,
        exchange_order_id TEXT,
        exchange_position_id TEXT,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('long', 'short')),
        position_type TEXT DEFAULT 'market',
        entry_price REAL NOT NULL,
        current_price REAL NOT NULL,
        quantity REAL NOT NULL,
        volume_usd REAL NOT NULL,
        leverage INTEGER DEFAULT 1,
        takeprofit REAL,
        stoploss REAL,
        trailing_enabled BOOLEAN DEFAULT 0,
        trail_start REAL,
        trail_stop REAL,
        trail_activated BOOLEAN DEFAULT 0,
        trail_high_price REAL,
        unrealized_pnl REAL DEFAULT 0,
        realized_pnl REAL DEFAULT 0,
        fees_paid REAL DEFAULT 0,
        funding_fees REAL DEFAULT 0,
        max_profit REAL DEFAULT 0,
        max_loss REAL DEFAULT 0,
        max_drawdown REAL DEFAULT 0,
        price_high REAL,
        price_low REAL,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'cancelled', 'liquidated')),
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        hold_duration_seconds INTEGER,
        sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_update', 'error', 'out_of_sync')),
        last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_error_message TEXT,
        sync_retry_count INTEGER DEFAULT 0,
        trade_mode TEXT NOT NULL CHECK (trade_mode IN ('preset', 'main')),
        indication_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_connection ON active_exchange_positions(connection_id);
      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_exchange_id ON active_exchange_positions(exchange_id);
      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_symbol ON active_exchange_positions(symbol);
      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_status ON active_exchange_positions(status);
    `
  }

  private static getFixPseudoPositionsSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS drawdown_ratio DECIMAL(5, 2);
        ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS market_change_range INTEGER;
        ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS last_part_ratio DECIMAL(5, 2);
        ALTER TABLE pseudo_positions ADD COLUMN IF NOT EXISTS base_position_id TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position ON pseudo_positions(base_position_id);
        CREATE INDEX IF NOT EXISTS idx_pseudo_positions_optimal_config ON pseudo_positions(
          symbol, indication_type, drawdown_ratio, market_change_range, last_part_ratio
        ) WHERE indication_type = 'optimal';
      `
    }

    return `
      ALTER TABLE pseudo_positions ADD COLUMN drawdown_ratio REAL;
      ALTER TABLE pseudo_positions ADD COLUMN market_change_range INTEGER;
      ALTER TABLE pseudo_positions ADD COLUMN last_part_ratio REAL;
      ALTER TABLE pseudo_positions ADD COLUMN base_position_id TEXT;
      
      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position ON pseudo_positions(base_position_id);
      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_optimal_config ON pseudo_positions(
        symbol, indication_type, drawdown_ratio, market_change_range, last_part_ratio
      ) WHERE indication_type = 'optimal';
    `
  }

  private static getPerformanceIndexesSQL(): string {
    return `
      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_connection_status_level 
        ON pseudo_positions(connection_id, status, level) 
        WHERE status IN ('evaluating', 'active');

      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position 
        ON pseudo_positions(base_position_id, status);

      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_performance 
        ON pseudo_positions(connection_id, win_rate DESC, profit_factor DESC) 
        WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_indication 
        ON base_pseudo_positions(indication_id, status, total_positions);

      CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_performance 
        ON base_pseudo_positions(indication_id, win_rate DESC, drawdown_max ASC) 
        WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_main_position 
        ON real_pseudo_positions(main_position_id, status);

      CREATE INDEX IF NOT EXISTS idx_real_pseudo_positions_performance 
        ON real_pseudo_positions(connection_id, profit_factor DESC, drawdown_time_hours ASC) 
        WHERE status = 'validated';

      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_real_position 
        ON active_exchange_positions(real_pseudo_position_id, status);

      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_sync 
        ON active_exchange_positions(connection_id, sync_status, last_sync_at);

      CREATE INDEX IF NOT EXISTS idx_active_exchange_positions_performance 
        ON active_exchange_positions(connection_id, pnl_usdt DESC, win_count DESC);

      CREATE INDEX IF NOT EXISTS idx_indication_states_symbol_type 
        ON indication_states(connection_id, symbol, indication_type, validated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_indication_states_cooldown 
        ON indication_states(connection_id, symbol, indication_type, cooldown_until);

      CREATE INDEX IF NOT EXISTS idx_trade_engine_active_positions 
        ON pseudo_positions(connection_id, symbol, status, level, created_at DESC)
        WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_preset_coordination_symbol_valid 
        ON preset_coordination_results(preset_type_id, symbol, is_valid, profit_factor DESC);

      CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp 
        ON market_data(symbol, timestamp DESC);
    `
  }

  private static getMarketDataOptimizationSQL(): string {
    return `
      -- Market Data Optimization: Add time-based indexes, limits, and cleanup
      -- Performance improvements for indication calculations with prehistoric data management

      -- Add composite indexes for time-range queries
      CREATE INDEX IF NOT EXISTS idx_market_data_connection_symbol_time 
        ON market_data(connection_id, symbol, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time_price 
        ON market_data(symbol, timestamp DESC, price);

      CREATE INDEX IF NOT EXISTS idx_market_data_connection_time 
        ON market_data(connection_id, timestamp DESC);

      -- Add index on indication_states for cleanup
      CREATE INDEX IF NOT EXISTS idx_indication_states_validated 
        ON indication_states(validated_at);

      -- Add index on pseudo_positions for time-based queries
      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_created 
        ON pseudo_positions(connection_id, symbol, created_at DESC);

      -- Add index on pseudo_positions for status and time
      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_status_time 
        ON pseudo_positions(connection_id, status, created_at DESC);

      -- Add data retention settings
      INSERT INTO system_settings (key, value, description, category)
      VALUES 
        ('marketDataRetentionDays', '7', 'Number of days to keep market data (older data will be archived)', 'performance'),
        ('indicationStateRetentionHours', '48', 'Number of hours to keep indication states (older states will be cleaned)', 'performance'),
        ('marketDataQueryMaxMinutes', '60', 'Maximum minutes to fetch in a single market data query', 'performance'),
        ('enableAutoCleanup', 'true', 'Automatically cleanup old data based on retention settings', 'performance'),
        ('cleanupIntervalHours', '24', 'How often to run automatic cleanup (in hours)', 'performance')
      ON CONFLICT (key) DO NOTHING;

      -- Create archived_market_data table for historical data
      CREATE TABLE IF NOT EXISTS archived_market_data (
        id SERIAL PRIMARY KEY,
        connection_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        price NUMERIC(20, 8) NOT NULL,
        volume NUMERIC(20, 8),
        timestamp TIMESTAMP NOT NULL,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_archived_connection_symbol ON archived_market_data(connection_id, symbol);
      CREATE INDEX IF NOT EXISTS idx_archived_timestamp ON archived_market_data(timestamp DESC);

      -- Create cleanup log table
      CREATE TABLE IF NOT EXISTS data_cleanup_log (
        id SERIAL PRIMARY KEY,
        cleanup_type TEXT NOT NULL,
        records_cleaned INTEGER NOT NULL,
        records_archived INTEGER,
        cleanup_started_at TIMESTAMP NOT NULL,
        cleanup_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_cleanup_log_time ON data_cleanup_log(cleanup_completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_cleanup_log_type ON data_cleanup_log(cleanup_type);
    `
  }

  private static getRenameActiveAdvancedToAutoSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        -- Migration 054: Rename active_advanced to auto throughout the database
        
        -- Update indication_type in pseudo_positions
        UPDATE pseudo_positions 
        SET indication_type = 'auto' 
        WHERE indication_type = 'active_advanced';

        -- Update indication_type in base_pseudo_positions
        UPDATE base_pseudo_positions 
        SET indication_type = 'auto' 
        WHERE indication_type = 'active_advanced';

        -- Update indication_states
        UPDATE indication_states 
        SET state_key = REPLACE(state_key, 'active_advanced', 'auto')
        WHERE state_key LIKE '%active_advanced%';

        -- Update system_settings keys
        UPDATE system_settings 
        SET key = REPLACE(key, 'activeAdvanced', 'auto'),
            description = REPLACE(description, 'Active Advanced', 'Auto')
        WHERE key LIKE '%activeAdvanced%';

        -- Rename column if exists
        DO $$ 
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'exchange_connections' 
            AND column_name = 'indication_active_advanced'
          ) THEN
            ALTER TABLE exchange_connections 
            RENAME COLUMN indication_active_advanced TO indication_auto;
          END IF;
        END $$;

        -- Add new Auto-specific columns
        ALTER TABLE pseudo_positions
        ADD COLUMN IF NOT EXISTS eight_hour_trend VARCHAR(20),
        ADD COLUMN IF NOT EXISTS market_direction_short VARCHAR(20),
        ADD COLUMN IF NOT EXISTS market_direction_long VARCHAR(20),
        ADD COLUMN IF NOT EXISTS progressive_activity DECIMAL(10, 4),
        ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS block_neutral_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS level_volume_ratio DECIMAL(10, 4),
        ADD COLUMN IF NOT EXISTS dca_step INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS dca_total_steps INTEGER DEFAULT 4;

        -- Update indexes
        DROP INDEX IF EXISTS idx_pseudo_positions_active_advanced;
        DROP INDEX IF EXISTS idx_base_pseudo_active_advanced;

        CREATE INDEX IF NOT EXISTS idx_pseudo_positions_auto
        ON pseudo_positions(connection_id, symbol, indication_type, created_at)
        WHERE indication_type = 'auto';

        CREATE INDEX IF NOT EXISTS idx_base_pseudo_auto
        ON base_pseudo_positions(connection_id, symbol, indication_type, status)
        WHERE indication_type = 'auto';
      `
    }

    // SQLite version
    return `
      -- Migration 054: Rename active_advanced to auto throughout the database
      
      UPDATE pseudo_positions 
      SET indication_type = 'auto' 
      WHERE indication_type = 'active_advanced';

      UPDATE base_pseudo_positions 
      SET indication_type = 'auto' 
      WHERE indication_type = 'active_advanced';

      UPDATE indication_states 
      SET state_key = REPLACE(state_key, 'active_advanced', 'auto')
      WHERE state_key LIKE '%active_advanced%';

      UPDATE system_settings 
      SET key = REPLACE(key, 'activeAdvanced', 'auto'),
          description = REPLACE(description, 'Active Advanced', 'Auto')
      WHERE key LIKE '%activeAdvanced%';

      ALTER TABLE pseudo_positions
      ADD COLUMN eight_hour_trend TEXT;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN market_direction_short TEXT;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN market_direction_long TEXT;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN progressive_activity REAL;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN strategy_type TEXT;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN block_neutral_count INTEGER DEFAULT 0;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN level_volume_ratio REAL;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN dca_step INTEGER DEFAULT 1;
      
      ALTER TABLE pseudo_positions
      ADD COLUMN dca_total_steps INTEGER DEFAULT 4;

      CREATE INDEX IF NOT EXISTS idx_pseudo_positions_auto
      ON pseudo_positions(connection_id, symbol, indication_type, created_at)
      WHERE indication_type = 'auto';

      CREATE INDEX IF NOT EXISTS idx_base_pseudo_auto
      ON base_pseudo_positions(connection_id, symbol, indication_type, status)
      WHERE indication_type = 'auto';
    `
  }

  private static getPresetTradeEngineTablesSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        CREATE TABLE IF NOT EXISTS preset_trade_engine_states (
          id SERIAL PRIMARY KEY,
          connection_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          state TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(connection_id, symbol)
        );
      `
    }

    return `
      CREATE TABLE IF NOT EXISTS preset_trade_engine_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connection_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(connection_id, symbol)
      );
    `
  }

  private static getParabolicSarIndicatorSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        ALTER TABLE indicators ADD COLUMN IF NOT EXISTS parabolic_sar REAL;
        -- Additional common indicators can be added here
      `
    }

    return `
      ALTER TABLE indicators ADD COLUMN parabolic_sar REAL;
      -- Additional common indicators can be added here
    `
  }

  private static getNewMigrationExampleSQL(): string {
    const dbType = getDatabaseType()

    if (dbType === "postgresql") {
      return `
        CREATE TABLE IF NOT EXISTS new_migration_table (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    }

    return `
      CREATE TABLE IF NOT EXISTS new_migration_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
  }
}
