# Adjust Strategy Optimization & Statistics

## Overview

Adjust Strategies (Block, DCA) are designed for **independent, optional statistical calculation** at the Main position level. Volume calculations occur ONLY when Adjust Strategies are actively enabled.

## Strategy Architecture

### Trailing (Additional Category)
- **Applied at**: Base position level
- **Calculation**: Minimal overhead (trail high tracking only)
- **Volume**: Inherited from Base
- **Applies to**: All configurations with trailing enabled

### Adjust Strategies (Block, DCA)
- **Applied at**: Main pseudo position level
- **Calculation**: Independent per Set configuration
- **Volume**: Calculated at Main level ONLY when enabled
- **Applies to**: Each Set independently, regardless of trailing status

### Real Level
- **Applies at**: Real pseudo position level
- **Calculation**: Just counts/validates from Main
- **Volume**: NO active calculations
- **Statistics**: Inherited from Main

## Performance Optimization Approach

### Option 1: Minimal Mode (Default)
\`\`\`
- No Adjust Strategy statistics calculated
- Minimal database queries
- Pure performance - no overhead
\`\`\`

### Option 2: Full Statistics Mode
\`\`\`
- Block Strategy Statistics:
  - Win rate by block size
  - Increased vs standard volume effectiveness
  - Neutral position counting
  - Independent Set performance

- DCA Strategy Statistics:
  - Step-by-step win rates
  - Averaging effectiveness
  - Entry spacing analysis
  - Independent Set performance
\`\`\`

## Independent Set Calculations

Each configuration Set calculates statistics **independently**:

\`\`\`typescript
interface IndependentSetStatistics {
  set_id: string
  symbol: string
  configuration_hash: string
  tp_min: number
  tp_max: number
  sl_ratio: number
  trailing_enabled: boolean
  block_stats?: BlockSetStatistics    // Only if Block enabled
  dca_stats?: DCASetStatistics        // Only if DCA enabled
  combined_performance?: number        // Score combining active strategies
}
\`\`\`

### Block Set Statistics
- Total blocks deployed
- Block sizes used
- Average block effectiveness
- Increased volume win rate vs standard
- Neutral position counts

### DCA Set Statistics
- Total steps in DCA sequence
- Average step position
- Averaging effectiveness (per step win rates)
- Entry spacing actual vs configured
- Independent step win rates

## Volume Calculation Flow

\`\`\`
Base Positions (No Volume Calc)
↓
├─ Trailing Applied (Additional, Inherited Volume)
↓
Main Positions (Volume Calc IF Adjust Enabled)
├─ Block Strategy: Calculates position sizing
├─ DCA Strategy: Calculates step-based positioning
└─ Statistics Generated (Independent per Set)
↓
Real Positions (No Active Volume Calc)
└─ Validates/Counts from Main (For specific factors)
↓
Exchange Positions (No Volume Calc)
└─ Logs actual live trades (For statistics only)
\`\`\`

## Database Schema Additions

### `adjust_strategy_statistics`
\`\`\`sql
CREATE TABLE adjust_strategy_statistics (
  id INTEGER PRIMARY KEY,
  connection_id TEXT,
  strategy_type VARCHAR(20),           -- 'block' or 'dca'
  period_hours INTEGER,
  total_positions INTEGER,
  successful_positions INTEGER,
  failed_positions INTEGER,
  win_rate DECIMAL(5,4),
  avg_profit_factor DECIMAL(8,4),
  independent_sets_count INTEGER,
  calculated_at TIMESTAMP
);

CREATE INDEX idx_adjust_stats_connection 
ON adjust_strategy_statistics(connection_id, strategy_type);
\`\`\`

### `pseudo_positions` Enhancements
\`\`\`sql
-- Already exists:
adjusted_strategy VARCHAR(20),         -- 'block' or 'dca' if applicable
adjusted_volume DECIMAL(15,6),         -- ONLY populated at Main level
configuration_set_id TEXT,             -- For independent set tracking
block_neutral_count INTEGER,           -- Block strategy specific
dca_step INTEGER,                      -- DCA strategy specific
dca_total_steps INTEGER,               -- DCA configuration
\`\`\`

## Implementation Pattern

### Minimal Mode (No Statistics)
\`\`\`typescript
const calculator = new AdjustStrategyStatisticsCalculator(connectionId)

// No database overhead - returns null
const blockStats = await calculator.calculateBlockStatistics(24, false)
const dcaStats = await calculator.calculateDCAStatistics(24, false)
\`\`\`

### Full Statistics Mode
\`\`\`typescript
const calculator = new AdjustStrategyStatisticsCalculator(connectionId)

// Full calculations for reporting/dashboard
const blockStats = await calculator.calculateBlockStatistics(24, true)
const dcaStats = await calculator.calculateDCAStatistics(24, true)

// Independent Set statistics
const setStats = await calculator.getIndependentSetStatistics(setId, true)
\`\`\`

## Performance Metrics

### Calculation Complexity
- **Block Strategy**: O(n) where n = positions in period
- **DCA Strategy**: O(n log n) due to step grouping
- **Independent Set**: O(m) where m = positions in set

### Database Impact
- Minimal Mode: 0 queries
- Full Mode: 3-5 queries per strategy type
- Statistics Storage: 1 insert query per snapshot

### Memory Usage
- Minimal Mode: ~0 MB
- Full Mode: ~2-5 MB (in-memory calculation)

## Configuration

Enable/Disable Adjust Strategies:
\`\`\`
Settings → Strategy → Main
├─ Block Strategy (Adjust)
│  └─ blockEnabled: boolean
│  └─ blockAutoDisableEnabled: boolean
├─ DCA Strategy (Adjust)
│  └─ dcaEnabled: boolean
└─ Trailing (Additional)
   └─ mainTrailingStrategy: boolean (ALWAYS enabled by default now)
\`\`\`

## Best Practices

1. **Keep Minimal Mode by default** for production
2. **Enable Full Statistics only for**:
   - Debugging specific configurations
   - Generating performance reports
   - A/B testing strategy effectiveness
3. **Use Independent Set Statistics** for per-configuration optimization
4. **Calculate statistics asynchronously** (don't block position creation)
5. **Store snapshots periodically** for trending analysis

## Future Optimizations

- Batch statistics calculations per connection
- Async statistics generation in background workers
- Statistics caching with TTL
- Machine learning model for optimal Adjust strategy selection
