-- High-Performance Database Tables with Indication & Strategy Type Separation
-- Project: CTS v3.1
-- Tables use project-name prefix and are separated by indication/strategy types
-- Comprehensive indexes for maximum query performance

-- ============================================================================
-- INDICATION TYPE: ACTIVE
-- Separate tables for "active" indication type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_active_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT DEFAULT 'active',
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL,
  position_cost REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance tracking
  position_age_seconds INTEGER,
  last_update_interval INTEGER,
  avg_update_interval INTEGER,
  total_updates INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_factor REAL,
  max_profit_factor REAL,
  min_profit_factor REAL,
  avg_profit_factor REAL,
  profit_factor_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for active indication
CREATE INDEX IF NOT EXISTS idx_active_pseudo_connection_status ON {prefix}_active_pseudo_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_active_pseudo_symbol_status ON {prefix}_active_pseudo_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_active_pseudo_profit_factor ON {prefix}_active_pseudo_positions(profit_factor DESC);
CREATE INDEX IF NOT EXISTS idx_active_pseudo_created_at ON {prefix}_active_pseudo_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_pseudo_compound ON {prefix}_active_pseudo_positions(connection_id, symbol, status, profit_factor);

-- ============================================================================
-- INDICATION TYPE: DIRECTION
-- Separate tables for "direction" indication type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_direction_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT DEFAULT 'direction',
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL,
  position_cost REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance tracking
  position_age_seconds INTEGER,
  last_update_interval INTEGER,
  avg_update_interval INTEGER,
  total_updates INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_factor REAL,
  max_profit_factor REAL,
  min_profit_factor REAL,
  avg_profit_factor REAL,
  profit_factor_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for direction indication
CREATE INDEX IF NOT EXISTS idx_direction_pseudo_connection_status ON {prefix}_direction_pseudo_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_direction_pseudo_symbol_status ON {prefix}_direction_pseudo_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_direction_pseudo_profit_factor ON {prefix}_direction_pseudo_positions(profit_factor DESC);
CREATE INDEX IF NOT EXISTS idx_direction_pseudo_created_at ON {prefix}_direction_pseudo_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direction_pseudo_compound ON {prefix}_direction_pseudo_positions(connection_id, symbol, status, profit_factor);

-- ============================================================================
-- INDICATION TYPE: MOVE
-- Separate tables for "move" indication type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_move_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT DEFAULT 'move',
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL,
  position_cost REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance tracking
  position_age_seconds INTEGER,
  last_update_interval INTEGER,
  avg_update_interval INTEGER,
  total_updates INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_factor REAL,
  max_profit_factor REAL,
  min_profit_factor REAL,
  avg_profit_factor REAL,
  profit_factor_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for move indication
CREATE INDEX IF NOT EXISTS idx_move_pseudo_connection_status ON {prefix}_move_pseudo_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_move_pseudo_symbol_status ON {prefix}_move_pseudo_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_move_pseudo_profit_factor ON {prefix}_move_pseudo_positions(profit_factor DESC);
CREATE INDEX IF NOT EXISTS idx_move_pseudo_created_at ON {prefix}_move_pseudo_positions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_move_pseudo_compound ON {prefix}_move_pseudo_positions(connection_id, symbol, status, profit_factor);

-- ============================================================================
-- STRATEGY TYPE: SIMPLE
-- Separate tables for "simple" strategy type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_simple_real_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  symbol TEXT NOT NULL,
  strategy_type TEXT DEFAULT 'simple',
  volume REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit REAL,
  stoploss REAL,
  profit_loss REAL NOT NULL,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Performance tracking
  position_duration_seconds INTEGER,
  avg_check_interval_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_loss REAL,
  max_profit REAL,
  max_loss REAL,
  profit_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for simple strategy
CREATE INDEX IF NOT EXISTS idx_simple_real_connection_status ON {prefix}_simple_real_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_simple_real_symbol_status ON {prefix}_simple_real_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_simple_real_profit_loss ON {prefix}_simple_real_positions(profit_loss DESC);
CREATE INDEX IF NOT EXISTS idx_simple_real_opened_at ON {prefix}_simple_real_positions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_simple_real_compound ON {prefix}_simple_real_positions(connection_id, symbol, status, profit_loss);

-- ============================================================================
-- STRATEGY TYPE: ADVANCED
-- Separate tables for "advanced" strategy type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_advanced_real_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  symbol TEXT NOT NULL,
  strategy_type TEXT DEFAULT 'advanced',
  volume REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit REAL,
  stoploss REAL,
  profit_loss REAL NOT NULL,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Performance tracking
  position_duration_seconds INTEGER,
  avg_check_interval_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_loss REAL,
  max_profit REAL,
  max_loss REAL,
  profit_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for advanced strategy
CREATE INDEX IF NOT EXISTS idx_advanced_real_connection_status ON {prefix}_advanced_real_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_advanced_real_symbol_status ON {prefix}_advanced_real_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_advanced_real_profit_loss ON {prefix}_advanced_real_positions(profit_loss DESC);
CREATE INDEX IF NOT EXISTS idx_advanced_real_opened_at ON {prefix}_advanced_real_positions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_advanced_real_compound ON {prefix}_advanced_real_positions(connection_id, symbol, status, profit_loss);

-- ============================================================================
-- STRATEGY TYPE: STEP
-- Separate tables for "step" strategy type
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_step_real_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  symbol TEXT NOT NULL,
  strategy_type TEXT DEFAULT 'step',
  volume REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit REAL,
  stoploss REAL,
  profit_loss REAL NOT NULL,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Performance tracking
  position_duration_seconds INTEGER,
  avg_check_interval_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  
  -- Profit tracking
  initial_profit_loss REAL,
  max_profit REAL,
  max_loss REAL,
  profit_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES {prefix}_exchange_connections(id) ON DELETE CASCADE
);

-- High-performance indexes for step strategy
CREATE INDEX IF NOT EXISTS idx_step_real_connection_status ON {prefix}_step_real_positions(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_step_real_symbol_status ON {prefix}_step_real_positions(symbol, status);
CREATE INDEX IF NOT EXISTS idx_step_real_profit_loss ON {prefix}_step_real_positions(profit_loss DESC);
CREATE INDEX IF NOT EXISTS idx_step_real_opened_at ON {prefix}_step_real_positions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_step_real_compound ON {prefix}_step_real_positions(connection_id, symbol, status, profit_loss);

-- ============================================================================
-- PERFORMANCE SUMMARY TABLE
-- Tracks query performance and optimization statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS {prefix}_performance_stats (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  query_type TEXT NOT NULL,
  execution_time_ms REAL NOT NULL,
  rows_affected INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perf_stats_table ON {prefix}_performance_stats(table_name, query_type);
CREATE INDEX IF NOT EXISTS idx_perf_stats_time ON {prefix}_performance_stats(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_perf_stats_timestamp ON {prefix}_performance_stats(timestamp DESC);
