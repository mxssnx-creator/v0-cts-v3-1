// Database table creation schemas for CTS v3.1
// Supports both SQLite and PostgreSQL

export const SQLiteTablesV3 = {
  users: `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  exchanges: `CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  exchange_connections: `CREATE TABLE IF NOT EXISTS exchange_connections (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL,
    exchange_id INTEGER,
    api_type TEXT NOT NULL DEFAULT 'perpetual_futures',
    connection_method TEXT NOT NULL DEFAULT 'rest',
    connection_library TEXT NOT NULL DEFAULT 'rest',
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    api_passphrase TEXT,
    margin_type TEXT NOT NULL DEFAULT 'cross',
    position_mode TEXT NOT NULL DEFAULT 'hedge',
    is_testnet BOOLEAN DEFAULT 0,
    is_enabled BOOLEAN DEFAULT 0,
    is_live_trade BOOLEAN DEFAULT 0,
    is_preset_trade BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_predefined BOOLEAN DEFAULT 0,
    volume_factor REAL DEFAULT 1.0,
    connection_settings TEXT,
    last_test_at TEXT,
    last_test_status TEXT,
    last_test_balance REAL,
    last_test_error TEXT,
    last_test_log TEXT,
    api_capabilities TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  system_settings: `CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  trading_pairs: `CREATE TABLE IF NOT EXISTS trading_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    min_order_size REAL,
    max_order_size REAL,
    price_precision INTEGER,
    quantity_precision INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exchange_id, symbol)
  )`,

  positions: `CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    entry_price REAL NOT NULL,
    quantity REAL NOT NULL,
    leverage INTEGER DEFAULT 1,
    unrealized_pnl REAL DEFAULT 0,
    realized_pnl REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  orders: `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    exchange_order_id TEXT,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    order_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL,
    status TEXT DEFAULT 'pending',
    filled_quantity REAL DEFAULT 0,
    average_fill_price REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  trades: `CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT NOT NULL,
    position_id INTEGER,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    commission REAL DEFAULT 0,
    realized_pnl REAL DEFAULT 0,
    executed_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  site_logs: `CREATE TABLE IF NOT EXISTS site_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    context TEXT,
    user_id INTEGER,
    connection_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  market_data: `CREATE TABLE IF NOT EXISTS market_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    open_price REAL NOT NULL,
    high_price REAL NOT NULL,
    low_price REAL NOT NULL,
    close_price REAL NOT NULL,
    volume REAL NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(exchange_id, symbol, timeframe, timestamp)
  )`,

  presets: `CREATE TABLE IF NOT EXISTS presets (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    indication_type TEXT NOT NULL,
    settings TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  preset_pseudo_positions: `CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    preset_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    entry_price REAL NOT NULL,
    quantity REAL NOT NULL,
    current_price REAL,
    unrealized_pnl REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
}

export const PostgreSQLTablesV3 = {
  users: `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  exchanges: `CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  exchange_connections: `CREATE TABLE IF NOT EXISTS exchange_connections (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(100) NOT NULL,
    exchange_id INTEGER,
    api_type VARCHAR(100) NOT NULL DEFAULT 'perpetual_futures',
    connection_method VARCHAR(100) NOT NULL DEFAULT 'rest',
    connection_library VARCHAR(100) NOT NULL DEFAULT 'rest',
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    api_passphrase TEXT,
    margin_type VARCHAR(50) NOT NULL DEFAULT 'cross',
    position_mode VARCHAR(50) NOT NULL DEFAULT 'hedge',
    is_testnet BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT FALSE,
    is_live_trade BOOLEAN DEFAULT FALSE,
    is_preset_trade BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_predefined BOOLEAN DEFAULT FALSE,
    volume_factor NUMERIC(10, 4) DEFAULT 1.0,
    connection_settings JSONB,
    last_test_at TIMESTAMP,
    last_test_status VARCHAR(50),
    last_test_balance NUMERIC(20, 8),
    last_test_error TEXT,
    last_test_log JSONB,
    api_capabilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  system_settings: `CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  trading_pairs: `CREATE TABLE IF NOT EXISTS trading_pairs (
    id SERIAL PRIMARY KEY,
    exchange_id INTEGER NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    base_currency VARCHAR(20) NOT NULL,
    quote_currency VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_order_size NUMERIC(20, 8),
    max_order_size NUMERIC(20, 8),
    price_precision INTEGER,
    quantity_precision INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange_id, symbol)
  )`,

  positions: `CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    entry_price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    unrealized_pnl NUMERIC(20, 8) DEFAULT 0,
    realized_pnl NUMERIC(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  orders: `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(255) NOT NULL,
    exchange_order_id VARCHAR(255),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 8),
    status VARCHAR(20) DEFAULT 'pending',
    filled_quantity NUMERIC(20, 8) DEFAULT 0,
    average_fill_price NUMERIC(20, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  trades: `CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(255) NOT NULL,
    position_id INTEGER,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 8) NOT NULL,
    commission NUMERIC(20, 8) DEFAULT 0,
    realized_pnl NUMERIC(20, 8) DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  site_logs: `CREATE TABLE IF NOT EXISTS site_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    user_id INTEGER,
    connection_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  market_data: `CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    exchange_id INTEGER NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    open_price NUMERIC(20, 8) NOT NULL,
    high_price NUMERIC(20, 8) NOT NULL,
    low_price NUMERIC(20, 8) NOT NULL,
    close_price NUMERIC(20, 8) NOT NULL,
    volume NUMERIC(20, 8) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange_id, symbol, timeframe, timestamp)
  )`,

  presets: `CREATE TABLE IF NOT EXISTS presets (
    id VARCHAR(255) PRIMARY KEY,
    connection_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    indication_type VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  preset_pseudo_positions: `CREATE TABLE IF NOT EXISTS preset_pseudo_positions (
    id SERIAL PRIMARY KEY,
    preset_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    entry_price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    current_price NUMERIC(20, 8),
    unrealized_pnl NUMERIC(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
}

// Default setting for ensuring SQLite is the default database type
export const DEFAULT_DATABASE_TYPE = "sqlite"

// Helper function to get table creation statements for current database type
export function getTableSchemas(databaseType: "sqlite" | "postgresql" = "sqlite") {
  return databaseType === "sqlite" ? SQLiteTablesV3 : PostgreSQLTablesV3
}
