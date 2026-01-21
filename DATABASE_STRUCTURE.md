# Database Structure Documentation

## Database Configuration

**Database Name:** Project-Name  
**Username:** Project-Name  
**Password:** 00998877

## Overview

The CTS v3.1 database is structured with separate tables for each indication type and strategy type, optimized for high-frequency trading with comprehensive indexing for maximum performance.

## Architecture

### Separate Tables by Type

Instead of using a single table with a `type` column, each indication and strategy type has its own dedicated table. This provides:

- **Better Query Performance**: Indexes are more efficient on smaller, focused tables
- **Type-Specific Columns**: Each table only contains relevant columns for its type
- **Simplified Queries**: No need for type filtering in WHERE clauses
- **Optimal Index Usage**: Indexes are automatically used without type conditions

## Indication Tables

### 1. indications_direction
**Purpose:** Direction-based market indications (range 3-30)

**Key Columns:**
- `range_value`: INTEGER (3-30)
- `direction`: VARCHAR (long/short)
- `price_change_ratio`: DECIMAL
- `profit_factor`: DECIMAL

**Performance Indexes:**
- `idx_indications_direction_connection_symbol`: Fast lookups by connection/symbol
- `idx_indications_direction_performance`: Sorted by profit_factor and confidence
- `idx_indications_direction_recent`: Hot data within last hour

### 2. indications_move  
**Purpose:** Movement-based market indications (range 3-30)

**Key Columns:**
- `range_value`: INTEGER (3-30)
- `direction`: VARCHAR (long/short)
- `momentum`: DECIMAL
- `price_change_ratio`: DECIMAL

**Performance Indexes:**
- `idx_indications_move_connection_symbol`: Fast lookups by connection/symbol
- `idx_indications_move_performance`: Sorted by profit_factor and momentum
- `idx_indications_move_recent`: Hot data within last hour

### 3. indications_active
**Purpose:** Activity-based market indications (range 1-10)

**Key Columns:**
- `range_value`: INTEGER (1-10)
- `activity_ratio`: DECIMAL
- `time_window`: INTEGER
- `activity_for_calculated`: INTEGER
- `activity_last_part`: INTEGER
- `overall_change`: DECIMAL
- `last_part_change`: DECIMAL
- `volatility`: DECIMAL

**Performance Indexes:**
- `idx_indications_active_connection_symbol`: Fast lookups by connection/symbol
- `idx_indications_active_performance`: Sorted by profit_factor and activity_ratio
- `idx_indications_active_activity`: Activity-based queries

### 4. indications_optimal
**Purpose:** Optimal configuration testing (range 1-10)

**Key Columns:**
- `range_value`: INTEGER (1-10)
- `drawdown_ratio`: DECIMAL
- `market_change_range`: INTEGER
- `last_part_ratio`: DECIMAL
- `win_rate`: DECIMAL
- `total_positions`: INTEGER
- `evaluation_count`: INTEGER

**Performance Indexes:**
- `idx_indications_optimal_connection_symbol`: Fast lookups by connection/symbol
- `idx_indications_optimal_performance`: Sorted by profit_factor and win_rate
- `idx_indications_optimal_evaluation`: Evaluation tracking

### 5. indications_auto
**Purpose:** Automated indication with 8-hour trend analysis

**Key Columns:**
- `auto_activity_ratio`: DECIMAL
- `auto_time_window`: INTEGER
- `auto_use_8hour_analysis`: BOOLEAN
- `eight_hour_trend`: VARCHAR (bullish/bearish/neutral)
- `market_direction_short`: VARCHAR (up/down/sideways)
- `market_direction_long`: VARCHAR (up/down/sideways)
- `progressive_activity`: DECIMAL

**Performance Indexes:**
- `idx_indications_auto_connection_symbol`: Fast lookups by connection/symbol
- `idx_indications_auto_performance`: Sorted by profit_factor and signal_strength
- `idx_indications_auto_market_analysis`: Market trend queries

## Strategy Tables

### 1. strategies_base
**Purpose:** Base single-position strategies

**Key Columns:**
- `indication_id`: TEXT (foreign key to indication)
- `indication_type`: VARCHAR
- `takeprofit_factor`: DECIMAL
- `stoploss_ratio`: DECIMAL
- `profit_factor`: DECIMAL
- `win_rate`: DECIMAL
- `total_trades`: INTEGER

**Performance Indexes:**
- `idx_strategies_base_connection_symbol`: Fast lookups
- `idx_strategies_base_indication`: Link to indications
- `idx_strategies_base_performance`: Sorted by performance metrics

### 2. strategies_main
**Purpose:** Multi-position coordination strategies

**Key Columns:**
- `last_positions_count`: INTEGER (3,4,5,6,8,12,25)
- `position_coordination`: BOOLEAN
- `max_concurrent_positions`: INTEGER
- `avg_holding_time_minutes`: DECIMAL

**Performance Indexes:**
- `idx_strategies_main_connection_symbol`: Fast lookups
- `idx_strategies_main_indication`: Link to indications
- `idx_strategies_main_performance`: Sorted by performance metrics
- `idx_strategies_main_coordination`: Position coordination queries

### 3. strategies_real
**Purpose:** Actual exchange positions

**Key Columns:**
- `main_strategy_id`: TEXT (link to main strategy)
- `exchange_position_id`: TEXT
- `volume`: DECIMAL
- `entry_price`: DECIMAL
- `current_price`: DECIMAL
- `profit_loss`: DECIMAL
- `unrealized_pnl`: DECIMAL
- `realized_pnl`: DECIMAL

**Performance Indexes:**
- `idx_strategies_real_connection_symbol`: Fast lookups
- `idx_strategies_real_main_strategy`: Link to main strategies
- `idx_strategies_real_exchange_position`: Exchange position lookup
- `idx_strategies_real_performance`: Sorted by profit/loss

### 4. strategies_block
**Purpose:** Block strategy (wait positions)

**Key Columns:**
- `main_strategy_id`: TEXT
- `neutral_count`: INTEGER (1-3)
- `current_wait_count`: INTEGER
- `block_success_rate`: DECIMAL
- `auto_deactivate_threshold`: INTEGER (default 25)
- `reactivate_threshold`: INTEGER (default 40)

**Performance Indexes:**
- `idx_strategies_block_connection`: Fast connection lookups
- `idx_strategies_block_main_strategy`: Link to main strategies
- `idx_strategies_block_performance`: Success rate sorting

### 5. strategies_dca
**Purpose:** Dollar Cost Averaging strategy

**Key Columns:**
- `main_strategy_id`: TEXT
- `dca_step`: INTEGER (1-4)
- `total_steps`: INTEGER
- `step_ratio`: DECIMAL
- `dca_success_rate`: DECIMAL
- `auto_deactivate_threshold`: INTEGER (default 25)
- `reactivate_threshold`: INTEGER (default 40)

**Performance Indexes:**
- `idx_strategies_dca_connection`: Fast connection lookups
- `idx_strategies_dca_main_strategy`: Link to main strategies
- `idx_strategies_dca_performance`: Success rate sorting

### 6. strategies_trailing
**Purpose:** Trailing stop strategy

**Key Columns:**
- `strategy_id`: TEXT (can link to base/main/real)
- `strategy_type`: VARCHAR
- `trail_start`: DECIMAL
- `trail_stop`: DECIMAL
- `trailing_active`: BOOLEAN
- `highest_profit`: DECIMAL
- `trail_success_rate`: DECIMAL

**Performance Indexes:**
- `idx_strategies_trailing_connection`: Fast connection lookups
- `idx_strategies_trailing_strategy`: Link to parent strategy
- `idx_strategies_trailing_performance`: Success rate sorting

## Preset Tables

### preset_types
**Purpose:** Define preset types (main, test, custom)

**Key Columns:**
- `name`: VARCHAR (unique)
- `category`: VARCHAR (main/test/custom)
- `config`: JSONB
- `is_active`: BOOLEAN

### preset_configurations
**Purpose:** Preset configurations for automated trading

**Key Columns:**
- `preset_type_id`: TEXT (foreign key)
- `symbol_mode`: VARCHAR (main/test)
- `indication_type`: VARCHAR
- `indication_params`: JSONB
- `strategy_type`: VARCHAR
- `strategy_params`: JSONB
- `volume_factor_ratio`: DECIMAL
- `use_block`: BOOLEAN
- `use_dca`: BOOLEAN
- `use_trailing`: BOOLEAN

**Performance Indexes:**
- `idx_preset_configurations_preset_type`: Fast preset type lookups
- `idx_preset_configurations_connection`: Connection-based queries
- `idx_preset_configurations_indication`: Indication/strategy filtering

## Performance Views

### v_indication_performance
**Purpose:** Unified view across all indication types

**Columns:** indication_type, connection_id, symbol, profit_factor, confidence, status, calculated_at

### v_strategy_performance  
**Purpose:** Unified view across all strategy types

**Columns:** strategy_type, connection_id, symbol, profit_factor, win_rate, total_trades, status

### v_daily_performance
**Purpose:** Daily aggregated performance metrics

**Columns:** trade_date, connection_id, indication_type, total_trades, winning_trades, losing_trades, total_pnl, avg_pnl, max_profit, max_loss

## Using the Database

### Helper Functions

The `lib/db-helpers.ts` module provides convenient functions:

```typescript
import { 
  getActiveIndications,
  getBestPerformingIndications,
  getActiveStrategies,
  getBestPerformingStrategies,
  getStrategyStatistics,
  getAllIndicationPerformance,
  getDailyPerformanceSummary
} from '@/lib/db-helpers'

// Get all active indications for a symbol
const indications = await getActiveIndications(connectionId, 'BTCUSDT')

// Get best performing direction indications
const best = await getBestPerformingIndications(connectionId, 'direction', 10)

// Get all active strategies
const strategies = await getActiveStrategies(connectionId, 'BTCUSDT')

// Get comprehensive performance
const performance = await getAllIndicationPerformance(connectionId)

// Get daily summary
const daily = await getDailyPerformanceSummary(connectionId, 7)
```

### Direct Queries

For custom queries, use the table names directly:

```typescript
import { sql } from '@/lib/db'

// Query specific indication type
const directions = await sql`
  SELECT * FROM indications_direction
  WHERE connection_id = ${connectionId}
    AND symbol = ${symbol}
    AND status = 'active'
  ORDER BY profit_factor DESC
  LIMIT 10
`

// Query specific strategy type
const mainStrategies = await sql`
  SELECT * FROM strategies_main
  WHERE connection_id = ${connectionId}
    AND status = 'active'
  ORDER BY win_rate DESC
`
```

## Index Optimization

All tables include high-frequency performance indexes:

1. **Connection + Symbol Indexes**: Fast lookups for active trading
2. **Performance Indexes**: Sorted by profit metrics for ranking
3. **Time-based Indexes**: Recent data queries optimized
4. **Foreign Key Indexes**: Fast joins between related tables
5. **Partial Indexes**: WHERE clauses reduce index size and improve speed

## Migration

To apply the new structure:

1. Run the migration script:
```bash
psql -h [host] -U Project-Name -d Project-Name -f scripts/100_comprehensive_database_restructure.sql
```

2. The script will:
   - Create all indication tables
   - Create all strategy tables
   - Create preset tables
   - Add all performance indexes
   - Create performance views

3. Existing data migration (if needed) can be done with:
```sql
-- Example: Migrate from old indications table to new structure
INSERT INTO indications_direction (...)
SELECT ... FROM indications WHERE indication_type = 'direction';

INSERT INTO indications_move (...)
SELECT ... FROM indications WHERE indication_type = 'move';
-- ... etc
```

## Performance Monitoring

Use the built-in monitoring functions:

```typescript
import { getQueryPerformanceStats, getIndexUsageStats } from '@/lib/db-helpers'

// Monitor table statistics
const stats = await getQueryPerformanceStats()

// Monitor index usage
const indexes = await getIndexUsageStats()
```

## Best Practices

1. **Always use indexes**: Query patterns are optimized for the existing indexes
2. **Use helper functions**: They include proper table name mapping
3. **Monitor performance**: Check pg_stat_user_tables regularly
4. **Batch operations**: Use transactions for multiple inserts/updates
5. **Connection pooling**: Reuse database connections (configured in db.ts)

## Table Sizes & Maintenance

For high-frequency trading:
- Run VACUUM ANALYZE weekly
- Monitor index bloat
- Archive closed positions older than 30 days
- Maintain hot data within recent time windows
