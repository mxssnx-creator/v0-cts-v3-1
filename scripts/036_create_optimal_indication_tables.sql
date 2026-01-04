-- Create base_pseudo_positions table for Optimal indication type
-- Implements 250-limit base configuration layer with performance tracking

CREATE TABLE IF NOT EXISTS base_pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL, -- Changed from INTEGER to TEXT to match exchange_connections.id
  symbol VARCHAR(20) NOT NULL,
  indication_type VARCHAR(50) NOT NULL CHECK (indication_type = 'optimal'),
  indication_range INTEGER NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Core configuration parameters
  drawdown_ratio DECIMAL(5, 2) NOT NULL,
  market_change_range INTEGER NOT NULL,
  last_part_ratio DECIMAL(5, 2) NOT NULL,
  
  -- Active-specific parameters (nullable for direction/move)
  activity_calculated INTEGER,
  activity_lastpart INTEGER,
  
  -- Performance metrics
  total_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  total_profit_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(10, 4) DEFAULT 0,
  win_rate DECIMAL(5, 4) DEFAULT 0,
  avg_profit DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'evaluating' CHECK (status IN ('evaluating', 'active', 'paused', 'failed')),
  evaluation_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure uniqueness per configuration
  UNIQUE(connection_id, symbol, indication_type, indication_range, direction, 
         drawdown_ratio, market_change_range, last_part_ratio)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_connection ON base_pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_symbol ON base_pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_status ON base_pseudo_positions(status);
CREATE INDEX IF NOT EXISTS idx_base_pseudo_positions_indication ON base_pseudo_positions(indication_type, indication_range);

-- Create pseudo_positions table first if it doesn't exist (self-contained migration)
CREATE TABLE IF NOT EXISTS pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  indication_type VARCHAR(50) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  position_cost DECIMAL(20, 8) NOT NULL,
  takeprofit_factor DECIMAL(10, 4) NOT NULL,
  stoploss_ratio DECIMAL(10, 4) NOT NULL,
  profit_factor DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start DECIMAL(10, 4),
  trail_stop DECIMAL(10, 4),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'stopped')),
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  close_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pseudo_positions_connection ON pseudo_positions(connection_id);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_symbol ON pseudo_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_status ON pseudo_positions(status);

-- Add base_position_id foreign key to pseudo_positions table
-- Changed from INTEGER to TEXT
ALTER TABLE pseudo_positions 
  ADD COLUMN IF NOT EXISTS base_position_id TEXT;

-- Add configuration columns to pseudo_positions for filtering
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS drawdown_ratio DECIMAL(5, 2);
  
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS market_change_range INTEGER;
  
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS last_part_ratio DECIMAL(5, 2);

-- Add direction column to pseudo_positions
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS direction VARCHAR(10);

-- Add indication_range column to pseudo_positions
ALTER TABLE pseudo_positions
  ADD COLUMN IF NOT EXISTS indication_range INTEGER;

-- Create index for base position lookup
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_base_position ON pseudo_positions(base_position_id);

-- Create index for configuration filtering
CREATE INDEX IF NOT EXISTS idx_pseudo_positions_config ON pseudo_positions(
  symbol, indication_type, direction, drawdown_ratio, market_change_range, last_part_ratio
);
