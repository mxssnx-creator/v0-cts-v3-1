-- Connections table for storing exchange API connections
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_type TEXT NOT NULL,
  connection_method TEXT DEFAULT 'rest',
  connection_library TEXT DEFAULT 'native',
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  api_passphrase TEXT,
  margin_type TEXT DEFAULT 'cross',
  position_mode TEXT DEFAULT 'hedge',
  is_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_testnet BOOLEAN DEFAULT false,
  is_predefined BOOLEAN DEFAULT false,
  last_test_status TEXT,
  last_test_timestamp TEXT,
  last_test_log TEXT, -- JSON array as string
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  UNIQUE(exchange, name)
);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  key TEXT NOT NULL,
  value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

-- Connection logs table for tracking test results and operations
CREATE TABLE IF NOT EXISTS connection_logs (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  log_type TEXT NOT NULL,
  status TEXT,
  message TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Trading history table
CREATE TABLE IF NOT EXISTS trading_history (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_price DECIMAL(20, 8),
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8),
  status TEXT,
  pnl DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Active connections table for real-time tracking
CREATE TABLE IF NOT EXISTS active_connections (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  last_heartbeat TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_connections_exchange ON connections(exchange);
CREATE INDEX IF NOT EXISTS idx_connections_enabled ON connections(is_enabled);
CREATE INDEX IF NOT EXISTS idx_connections_active ON connections(is_active);
CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_connection_id ON connection_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_created_at ON connection_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_history_connection_id ON trading_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_symbol ON trading_history(symbol);
CREATE INDEX IF NOT EXISTS idx_active_connections_connection_id ON active_connections(connection_id);

-- Insert sample predefined connections (optional)
INSERT OR IGNORE INTO connections (
  id, name, exchange, api_type, connection_method, 
  connection_library, margin_type, position_mode, 
  is_predefined, is_testnet, is_enabled
) VALUES 
('predefined_bybit_demo', 'Bybit Demo', 'bybit', 'perpetual_futures', 'rest', 'native', 'cross', 'hedge', true, true, true),
('predefined_binance_demo', 'Binance Demo', 'binance', 'perpetual_futures', 'rest', 'native', 'cross', 'hedge', true, true, true);
