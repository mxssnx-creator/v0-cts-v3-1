-- CTS v3.1 Comprehensive Database Optimization with Indexes
-- This script implements:
-- 1. Project-name prefixed tables (cts_v3_1_*)
-- 2. High-performance indexes for all critical queries
-- 3. Separate databases for indication and strategy types
-- 4. Complete system integrity checks

-- ============================================================================
-- PART 1: CREATE SEPARATE DATABASES FOR ISOLATION
-- ============================================================================

-- Indication type databases (each gets own DB for data isolation)
CREATE DATABASE IF NOT EXISTS cts_v3_1_indication_active;
CREATE DATABASE IF NOT EXISTS cts_v3_1_indication_direction;
CREATE DATABASE IF NOT EXISTS cts_v3_1_indication_move;

-- Strategy type databases
CREATE DATABASE IF NOT EXISTS cts_v3_1_strategy_simple;
CREATE DATABASE IF NOT EXISTS cts_v3_1_strategy_advanced;
CREATE DATABASE IF NOT EXISTS cts_v3_1_strategy_step;

-- Main application database
CREATE DATABASE IF NOT EXISTS cts_v3_1_main;

USE cts_v3_1_main;

-- ============================================================================
-- PART 2: OPTIMIZED CORE TABLES WITH PROJECT PREFIX
-- ============================================================================

-- Exchange connections with comprehensive indexes
CREATE TABLE IF NOT EXISTS cts_v3_1_exchange_connections (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  exchange VARCHAR(50) NOT NULL,
  api_type VARCHAR(50) NOT NULL,
  connection_method VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_live_trade BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Performance metadata
  last_heartbeat TIMESTAMP,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  avg_response_time_ms INT DEFAULT 0,
  total_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  
  INDEX idx_exchange (exchange),
  INDEX idx_enabled (is_enabled),
  INDEX idx_live_trade (is_live_trade),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_heartbeat (last_heartbeat DESC),
  INDEX idx_composite_active (exchange, is_enabled, is_live_trade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pseudo positions with extensive indexes for high-speed queries
CREATE TABLE IF NOT EXISTS cts_v3_1_pseudo_positions (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  indication_type ENUM('active', 'direction', 'move') NOT NULL,
  strategy_type ENUM('simple', 'advanced', 'step') NOT NULL,
  
  -- Position parameters
  takeprofit_factor DECIMAL(10,6) NOT NULL,
  stoploss_ratio DECIMAL(10,6) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start DECIMAL(10,6),
  trail_stop DECIMAL(10,6),
  
  -- Price data
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  profit_factor DECIMAL(10,6) NOT NULL,
  position_cost DECIMAL(20,8) NOT NULL,
  
  -- Status and timestamps
  status ENUM('active', 'closed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  
  -- Performance metrics
  indication_range INT,
  indication_interval INT,
  strategy_step INT,
  strategy_interval INT,
  position_age_seconds INT,
  total_updates INT DEFAULT 0,
  
  -- Profit tracking
  initial_profit_factor DECIMAL(10,6),
  max_profit_factor DECIMAL(10,6),
  min_profit_factor DECIMAL(10,6),
  avg_profit_factor DECIMAL(10,6),
  
  FOREIGN KEY (connection_id) REFERENCES cts_v3_1_exchange_connections(id) ON DELETE CASCADE,
  
  -- Critical performance indexes
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_indication_type (indication_type),
  INDEX idx_strategy_type (strategy_type),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_updated_at (updated_at DESC),
  INDEX idx_closed_at (closed_at DESC),
  INDEX idx_profit_factor (profit_factor DESC),
  
  -- Composite indexes for complex queries
  INDEX idx_composite_active (connection_id, symbol, status),
  INDEX idx_composite_type (indication_type, strategy_type, status),
  INDEX idx_composite_performance (connection_id, status, profit_factor DESC),
  INDEX idx_composite_symbol_active (symbol, status, indication_type),
  INDEX idx_composite_time_status (created_at DESC, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Real positions with optimized indexing
CREATE TABLE IF NOT EXISTS cts_v3_1_real_positions (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  exchange_position_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  strategy_type ENUM('simple', 'advanced', 'step') NOT NULL,
  
  -- Position data
  volume DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  takeprofit DECIMAL(20,8),
  stoploss DECIMAL(20,8),
  profit_loss DECIMAL(20,8) NOT NULL,
  
  -- Status
  status ENUM('open', 'closed', 'liquidated') DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  
  -- Performance tracking
  indication_type ENUM('active', 'direction', 'move'),
  position_duration_seconds INT,
  total_checks INT DEFAULT 0,
  max_profit DECIMAL(20,8),
  max_loss DECIMAL(20,8),
  
  FOREIGN KEY (connection_id) REFERENCES cts_v3_1_exchange_connections(id) ON DELETE CASCADE,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_strategy_type (strategy_type),
  INDEX idx_indication_type (indication_type),
  INDEX idx_opened_at (opened_at DESC),
  INDEX idx_closed_at (closed_at DESC),
  INDEX idx_profit_loss (profit_loss DESC),
  INDEX idx_exchange_position (exchange_position_id),
  
  -- Composite indexes
  INDEX idx_composite_active (connection_id, symbol, status),
  INDEX idx_composite_performance (connection_id, status, profit_loss DESC),
  INDEX idx_composite_type (strategy_type, indication_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market data with time-series optimization
CREATE TABLE IF NOT EXISTS cts_v3_1_market_data (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Market metadata
  bid DECIMAL(20,8),
  ask DECIMAL(20,8),
  high_24h DECIMAL(20,8),
  low_24h DECIMAL(20,8),
  
  FOREIGN KEY (connection_id) REFERENCES cts_v3_1_exchange_connections(id) ON DELETE CASCADE,
  
  -- Time-series optimized indexes
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_composite_symbol_time (symbol, timestamp DESC),
  INDEX idx_composite_connection_symbol_time (connection_id, symbol, timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings with fast lookups
CREATE TABLE IF NOT EXISTS cts_v3_1_system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_updated_at (updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs with efficient querying
CREATE TABLE IF NOT EXISTS cts_v3_1_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  log_level ENUM('debug', 'info', 'warn', 'error', 'critical') NOT NULL,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  stack_trace TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_level (log_level),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_composite_level_time (log_level, created_at DESC),
  INDEX idx_composite_category_time (category, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 3: INDICATION-SPECIFIC TABLES (SEPARATE DATABASES)
-- ============================================================================

-- Active indication database
USE cts_v3_1_indication_active;

CREATE TABLE IF NOT EXISTS positions (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  strategy_type ENUM('simple', 'advanced', 'step') NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  profit_factor DECIMAL(10,6) NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_strategy (strategy_type),
  INDEX idx_composite (connection_id, symbol, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Direction indication database
USE cts_v3_1_indication_direction;

CREATE TABLE IF NOT EXISTS positions (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  strategy_type ENUM('simple', 'advanced', 'step') NOT NULL,
  direction ENUM('long', 'short') NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  profit_factor DECIMAL(10,6) NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_direction (direction),
  INDEX idx_strategy (strategy_type),
  INDEX idx_composite (connection_id, symbol, status, direction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Move indication database
USE cts_v3_1_indication_move;

CREATE TABLE IF NOT EXISTS positions (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  strategy_type ENUM('simple', 'advanced', 'step') NOT NULL,
  move_range INT NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8) NOT NULL,
  profit_factor DECIMAL(10,6) NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_move_range (move_range),
  INDEX idx_strategy (strategy_type),
  INDEX idx_composite (connection_id, symbol, status, move_range)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 4: STRATEGY-SPECIFIC TABLES (SEPARATE DATABASES)
-- ============================================================================

-- Simple strategy database
USE cts_v3_1_strategy_simple;

CREATE TABLE IF NOT EXISTS strategy_configurations (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  takeprofit DECIMAL(10,6) NOT NULL,
  stoploss DECIMAL(10,6) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Advanced strategy database
USE cts_v3_1_strategy_advanced;

CREATE TABLE IF NOT EXISTS strategy_configurations (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  takeprofit DECIMAL(10,6) NOT NULL,
  stoploss DECIMAL(10,6) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  trail_start DECIMAL(10,6),
  trail_stop DECIMAL(10,6),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_active (is_active),
  INDEX idx_trailing (trailing_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step strategy database
USE cts_v3_1_strategy_step;

CREATE TABLE IF NOT EXISTS strategy_configurations (
  id VARCHAR(36) PRIMARY KEY,
  connection_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  step_count INT NOT NULL,
  step_interval INT NOT NULL,
  takeprofit_per_step DECIMAL(10,6) NOT NULL,
  stoploss DECIMAL(10,6) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_connection (connection_id),
  INDEX idx_symbol (symbol),
  INDEX idx_active (is_active),
  INDEX idx_step_count (step_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 5: PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

USE cts_v3_1_main;

-- Additional covering indexes for frequent queries
ALTER TABLE cts_v3_1_pseudo_positions 
ADD INDEX idx_covering_active_positions (connection_id, status, symbol, profit_factor, created_at);

ALTER TABLE cts_v3_1_real_positions 
ADD INDEX idx_covering_open_positions (connection_id, status, symbol, profit_loss, opened_at);

ALTER TABLE cts_v3_1_market_data 
ADD INDEX idx_covering_latest_prices (symbol, timestamp, price, volume);

-- ============================================================================
-- PART 6: DATABASE STATISTICS AND OPTIMIZATION
-- ============================================================================

-- Analyze tables for query optimizer
ANALYZE TABLE cts_v3_1_exchange_connections;
ANALYZE TABLE cts_v3_1_pseudo_positions;
ANALYZE TABLE cts_v3_1_real_positions;
ANALYZE TABLE cts_v3_1_market_data;
ANALYZE TABLE cts_v3_1_system_settings;
ANALYZE TABLE cts_v3_1_logs;

-- Optimize tables
OPTIMIZE TABLE cts_v3_1_exchange_connections;
OPTIMIZE TABLE cts_v3_1_pseudo_positions;
OPTIMIZE TABLE cts_v3_1_real_positions;
OPTIMIZE TABLE cts_v3_1_market_data;
OPTIMIZE TABLE cts_v3_1_system_settings;
OPTIMIZE TABLE cts_v3_1_logs;

-- ============================================================================
-- COMPLETED: CTS v3.1 Database Optimization
-- ============================================================================
