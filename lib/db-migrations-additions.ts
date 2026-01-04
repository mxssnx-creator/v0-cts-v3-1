/**
 * Additional Database Migration Methods
 * These are appended to the DatabaseMigrations class
 */

import { getDatabaseType } from "@/lib/db"

export function getPresetTradeEngineTablesSQL(): string {
  const dbType = getDatabaseType()

  if (dbType === "postgresql") {
    return `
      -- Preset Trade Engine State Table
      CREATE TABLE IF NOT EXISTS preset_trade_engine_state (
        connection_id TEXT NOT NULL,
        preset_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'stopped',
        testing_progress INTEGER DEFAULT 0,
        testing_message TEXT,
        error_message TEXT,
        started_at TIMESTAMP,
        stopped_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (connection_id, preset_id)
      );

      -- Preset Trades Table
      CREATE TABLE IF NOT EXISTS preset_trades (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        preset_id TEXT NOT NULL,
        connection_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price DECIMAL(20, 8) NOT NULL,
        exit_price DECIMAL(20, 8),
        quantity DECIMAL(20, 8) NOT NULL,
        takeprofit DECIMAL(20, 8),
        stoploss DECIMAL(20, 8),
        trailing_enabled BOOLEAN DEFAULT false,
        indicator_type TEXT NOT NULL,
        indicator_params JSONB NOT NULL DEFAULT '{}',
        profit_loss DECIMAL(20, 8),
        fees_paid DECIMAL(20, 8) DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'open',
        close_reason TEXT,
        opened_at TIMESTAMP NOT NULL,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Preset Pseudo Positions Table
      CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
        id TEXT PRIMARY KEY,
        connection_id TEXT NOT NULL,
        preset_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'base',
        direction TEXT,
        indication_type TEXT,
        indication_range INTEGER,
        indication_category TEXT DEFAULT 'main',
        takeprofit_factor DECIMAL(10, 4),
        stoploss_ratio DECIMAL(10, 4),
        trailing_enabled BOOLEAN DEFAULT false,
        trail_start DECIMAL(10, 4),
        trail_stop DECIMAL(10, 4),
        entry_price DECIMAL(20, 8),
        current_price DECIMAL(20, 8),
        profit_factor DECIMAL(10, 4),
        profit_loss DECIMAL(20, 8) DEFAULT 0,
        position_cost DECIMAL(20, 8),
        main_position_id TEXT,
        base_position_id TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_preset_trades_preset ON preset_trades(preset_id);
      CREATE INDEX IF NOT EXISTS idx_preset_trades_connection ON preset_trades(connection_id);
      CREATE INDEX IF NOT EXISTS idx_preset_trades_symbol ON preset_trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_preset_trades_status ON preset_trades(status);
      CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_connection ON preset_pseudo_positions(connection_id);
      CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_preset ON preset_pseudo_positions(preset_id);
      CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_type ON preset_pseudo_positions(type);
      CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_status ON preset_pseudo_positions(status);

      -- Add preset_type_id column to exchange_connections if not exists
      ALTER TABLE exchange_connections ADD COLUMN IF NOT EXISTS preset_type_id TEXT;

      -- Archived Positions Table (for threshold cleanup)
      CREATE TABLE IF NOT EXISTS archived_positions (
        id SERIAL PRIMARY KEY,
        original_id INTEGER NOT NULL,
        connection_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        status TEXT NOT NULL,
        entry_price NUMERIC(20, 8),
        current_price NUMERIC(20, 8),
        profit_factor NUMERIC(20, 8),
        position_cost NUMERIC(20, 8),
        created_at TIMESTAMPTZ NOT NULL,
        closed_at TIMESTAMPTZ,
        archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        position_data JSONB
      );

      -- Data Cleanup Log Table
      CREATE TABLE IF NOT EXISTS data_cleanup_log (
        id SERIAL PRIMARY KEY,
        cleanup_type TEXT NOT NULL,
        table_name TEXT NOT NULL,
        connection_id TEXT,
        records_cleaned INTEGER DEFAULT 0,
        records_archived INTEGER DEFAULT 0,
        cleanup_started_at TIMESTAMPTZ NOT NULL,
        cleanup_completed_at TIMESTAMPTZ,
        status TEXT NOT NULL,
        error_message TEXT
      );

      -- High-performance indexes for archived positions
      CREATE INDEX IF NOT EXISTS idx_archived_positions_connection ON archived_positions(connection_id);
      CREATE INDEX IF NOT EXISTS idx_archived_positions_table ON archived_positions(table_name);
      CREATE INDEX IF NOT EXISTS idx_archived_positions_archived_at ON archived_positions(archived_at);
      CREATE INDEX IF NOT EXISTS idx_archived_positions_symbol ON archived_positions(symbol);

      -- Indexes for cleanup log
      CREATE INDEX IF NOT EXISTS idx_cleanup_log_connection ON data_cleanup_log(connection_id);
      CREATE INDEX IF NOT EXISTS idx_cleanup_log_table ON data_cleanup_log(table_name);
      CREATE INDEX IF NOT EXISTS idx_cleanup_log_completed ON data_cleanup_log(cleanup_completed_at);

      -- Add threshold settings to system_settings
      INSERT INTO system_settings (key, value, description, category)
      VALUES 
        ('databaseSizeBase', '250', 'Base position limit per connection', 'database'),
        ('databaseSizeMain', '250', 'Main position limit per connection', 'database'),
        ('databaseSizeReal', '250', 'Real position limit per connection', 'database'),
        ('databaseSizePreset', '250', 'Preset position limit per connection', 'database'),
        ('databaseThresholdPercent', '20', 'Cleanup threshold percentage', 'database'),
        ('maxDatabaseSizeGB', '20', 'Maximum database size in GB', 'database'),
        ('enableThresholdMonitoring', 'true', 'Enable automatic threshold monitoring', 'database')
      ON CONFLICT (key) DO NOTHING;
    `
  }

  // SQLite version
  return `
    CREATE TABLE IF NOT EXISTS preset_trade_engine_state (
      connection_id TEXT NOT NULL,
      preset_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'stopped',
      testing_progress INTEGER DEFAULT 0,
      testing_message TEXT,
      error_message TEXT,
      started_at DATETIME,
      stopped_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (connection_id, preset_id)
    );

    CREATE TABLE IF NOT EXISTS preset_trades (
      id TEXT PRIMARY KEY,
      preset_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      quantity REAL NOT NULL,
      takeprofit REAL,
      stoploss REAL,
      trailing_enabled INTEGER DEFAULT 0,
      indicator_type TEXT NOT NULL,
      indicator_params TEXT NOT NULL DEFAULT '{}',
      profit_loss REAL,
      fees_paid REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      close_reason TEXT,
      opened_at DATETIME NOT NULL,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL,
      preset_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'base',
      direction TEXT,
      indication_type TEXT,
      indication_range INTEGER,
      indication_category TEXT DEFAULT 'main',
      takeprofit_factor REAL,
      stoploss_ratio REAL,
      trailing_enabled INTEGER DEFAULT 0,
      trail_start REAL,
      trail_stop REAL,
      entry_price REAL,
      current_price REAL,
      profit_factor REAL,
      profit_loss REAL DEFAULT 0,
      position_cost REAL,
      main_position_id TEXT,
      base_position_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_preset_trades_preset ON preset_trades(preset_id);
    CREATE INDEX IF NOT EXISTS idx_preset_trades_connection ON preset_trades(connection_id);
    CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_connection ON preset_pseudo_positions(connection_id);
    CREATE INDEX IF NOT EXISTS idx_preset_pseudo_positions_preset ON preset_pseudo_positions(preset_id);

    -- Archived Positions Table (for threshold cleanup)
    CREATE TABLE IF NOT EXISTS archived_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_id INTEGER NOT NULL,
      connection_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      status TEXT NOT NULL,
      entry_price REAL,
      current_price REAL,
      profit_factor REAL,
      position_cost REAL,
      created_at DATETIME NOT NULL,
      closed_at DATETIME,
      archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      position_data TEXT
    );

    -- Data Cleanup Log Table
    CREATE TABLE IF NOT EXISTS data_cleanup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cleanup_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      connection_id TEXT,
      records_cleaned INTEGER DEFAULT 0,
      records_archived INTEGER DEFAULT 0,
      cleanup_started_at DATETIME NOT NULL,
      cleanup_completed_at DATETIME,
      status TEXT NOT NULL,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_archived_positions_connection ON archived_positions(connection_id);
    CREATE INDEX IF NOT EXISTS idx_archived_positions_table ON archived_positions(table_name);
    CREATE INDEX IF NOT EXISTS idx_cleanup_log_connection ON data_cleanup_log(connection_id);

    INSERT OR IGNORE INTO system_settings (key, value, description, category)
    VALUES 
      ('databaseSizeBase', '250', 'Base position limit per connection', 'database'),
      ('databaseSizeMain', '250', 'Main position limit per connection', 'database'),
      ('databaseSizeReal', '250', 'Real position limit per connection', 'database'),
      ('databaseSizePreset', '250', 'Preset position limit per connection', 'database'),
      ('databaseThresholdPercent', '20', 'Cleanup threshold percentage', 'database'),
      ('maxDatabaseSizeGB', '20', 'Maximum database size in GB', 'database'),
      ('enableThresholdMonitoring', 'true', 'Enable automatic threshold monitoring', 'database');
  `
}

export function getParabolicSarIndicatorSQL(): string {
  const dbType = getDatabaseType()

  if (dbType === "postgresql") {
    return `
      -- Add ParabolicSAR indicator settings
      INSERT INTO system_settings (key, value, description, category)
      VALUES 
        ('parabolicSarEnabled', 'true', 'Enable Parabolic SAR indicator', 'indications_common'),
        ('parabolicSarAccelerationFactor', '0.02', 'Parabolic SAR acceleration factor (default: 0.02)', 'indications_common'),
        ('parabolicSarMaxFactor', '0.2', 'Parabolic SAR maximum factor (default: 0.2)', 'indications_common')
      ON CONFLICT (key) DO NOTHING;

      -- Add ParabolicSAR columns to indication tables
      ALTER TABLE indication_states ADD COLUMN IF NOT EXISTS parabolic_sar_value DECIMAL(20, 8);
      ALTER TABLE indication_states ADD COLUMN IF NOT EXISTS parabolic_sar_trend TEXT;

      -- Add Common indicators category tracking
      ALTER TABLE preset_pseudo_positions ADD COLUMN IF NOT EXISTS common_indicators_used JSONB DEFAULT '[]';
    `
  }

  // SQLite version
  return `
    INSERT OR IGNORE INTO system_settings (key, value, description, category)
    VALUES 
      ('parabolicSarEnabled', 'true', 'Enable Parabolic SAR indicator', 'indications_common'),
      ('parabolicSarAccelerationFactor', '0.02', 'Parabolic SAR acceleration factor (default: 0.02)', 'indications_common'),
      ('parabolicSarMaxFactor', '0.2', 'Parabolic SAR maximum factor (default: 0.2)', 'indications_common');

    ALTER TABLE indication_states ADD COLUMN parabolic_sar_value REAL;
    ALTER TABLE indication_states ADD COLUMN parabolic_sar_trend TEXT;

    ALTER TABLE preset_pseudo_positions ADD COLUMN common_indicators_used TEXT DEFAULT '[]';
  `
}
