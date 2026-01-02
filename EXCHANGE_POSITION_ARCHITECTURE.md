# Exchange Position Architecture - Optimized Design

## Overview

The Exchange Position system represents the actual executed trades from exchange providers. It's designed to minimize API calls while providing comprehensive statistics and comparison capabilities.

## Position Flow

\`\`\`
Base Pseudo → Main Pseudo → Real Pseudo → Exchange Position (Mirrored Live Trade)
                                              ↓
                                    Volume from Symbol Data
                                    (captured at execution)
                                              ↓
                                    Statistics & Comparisons
                                    (no repeated API calls)
\`\`\`

## Key Principles

### 1. Mirroring (Not Fetching)
- Exchange Positions **log actual executed trades** from the exchange
- They don't actively fetch from exchange history repeatedly
- Data is captured **once at execution time** for performance

### 2. Volume Calculation Strategy
- **Real Volume** comes from symbol data at execution
- Volume is calculated **only once** via `VolumeCalculator`
- Stored with the exchange position for later statistics
- **No additional volume calculations** on subsequent updates

### 3. Statistics Without API Calls
Exchange positions serve dual purposes:
- **Live Position Tracking**: Real-time price, PnL, drawdown
- **Statistics Generation**: Win rate, profit factor, drawdown time (from cached data)

All statistics use stored data, no exchange API calls needed.

## Database Schema Optimization

### Main Tables

#### `active_exchange_positions`
Stores mirrored executed trades with:
- Volume (USDT)
- Leverage (if applicable)
- Real PnL (unrealized & realized)
- Drawdown tracking (max_drawdown, drawdown_time)
- Trailing stop state (if enabled)

**No volume recalculation** - stored once at creation.

#### `exchange_position_statistics`
Pre-calculated statistics for periods (24h, 7d, 30d):
- Win rate, profit factor
- Average winning/losing trade
- Max drawdown
- Average hold duration
- Total volume traded

**Updated on close**, not on every update.

#### `exchange_position_coordination_log`
Tracks all state changes:
- Position open/close events
- Price updates (sampled, not every tick)
- Sync status
- Error tracking

## Processing Layers

### Layer 1: Base Pseudo Positions
- Calculation: Averages + drawdown time only
- Volume: ❌ Not calculated
- Exchange positions: ❌ Not created

### Layer 2: Main Pseudo Positions  
- Calculation: Independent set tracking
- Volume: ✅ Calculated (for adjust strategies only)
- Exchange positions: ❌ Not created yet

### Layer 3: Adjust Strategies (DCA/Block)
- Applied independently per set
- **Also applied to configs WITH trailing enabled**
- Statistics: Independent per strategy type
- Volume: ✅ Used from Main

### Layer 4: Real Pseudo Positions
- Validation: Drawdown time + profit factor
- Volume: ✅ Inherited from Main
- Exchange positions: ✅ Mirrored here

### Layer 5: Exchange Positions
- Mirror of actual executed trade
- Volume: ✅ From symbol data (one-time)
- Statistics: ✅ Cached calculations
- API Calls: ❌ None needed (data is mirrored)

## Performance Optimizations

### 1. Zero Repeated Volume Calculations
\`\`\`
✅ ONE calculation at position creation
❌ NO recalculation on price updates
❌ NO volume lookups on statistics generation
\`\`\`

### 2. Batched Statistics Updates
\`\`\`
- Statistics calculated ONLY when position closes
- Cached for 24-hour intervals
- No real-time statistics calculations
\`\`\`

### 3. Sampling Price Updates
\`\`\`
- Not every tick causes DB write
- Batch updates (e.g., every 5-10 price changes)
- Reduces write volume significantly
\`\`\`

### 4. Independent Async Processing
\`\`\`
- Exchange position updates: Async, independent
- Statistics generation: Batch, async
- Coordination logs: Batch write, time-based
\`\`\`

## Adjusted Strategies with Statistics

### Block Strategy
- **Activation**: Main position at loss
- **Action**: Add position at lower price
- **Statistics**: 
  - Set-independent (each add is separate set)
  - Tracks win rate per block count
  - Calculates average recovery time

### DCA Strategy  
- **Activation**: Time-based or price-based
- **Action**: Accumulate position at intervals
- **Statistics**:
  - Set-independent (each DCA is separate)
  - Tracks cost basis evolution
  - Calculates average entry price improvement

### Trailing Strategy (Additional)
- **Base logistics** applied at creation
- **Not an "Adjust"** strategy
- **Statistics**: Profit factor at trail activation

## Real-Time Monitoring

### Active Monitoring View
\`\`\`sql
SELECT * FROM v_active_exchange_positions_monitoring
WHERE connection_id = $1
ORDER BY unrealized_pnl DESC
\`\`\`

Returns:
- Current price & PnL
- Drawdown percentage
- Hold duration
- Trailing status (if enabled)

### Statistics Query Pattern
\`\`\`sql
SELECT * FROM exchange_position_statistics
WHERE connection_id = $1
  AND period_hours = 24
ORDER BY period_start DESC
LIMIT 1
\`\`\`

Returns cached statistics, zero calculation overhead.

## Comparison: Real Pseudo vs Exchange Position

| Aspect | Real Pseudo | Exchange Position |
|--------|------------|-------------------|
| Source | Calculated from Main | Actual executed trade |
| Volume | Inherited | From symbol at execution |
| Purpose | Validation | Historical tracking |
| Updates | Periodic (1-2s) | Real-time market prices |
| Statistics | Per config | Per symbol/indication |
| API Calls | None | Zero (mirrored data) |

## Database Size Estimates

Per connection, per day:
- Opened positions: ~20-50
- Price updates: ~1000-5000 (sampled)
- Closed positions: ~10-30
- Statistics records: ~3-10
- Coordination logs: ~100-500

**Total daily growth**: ~2KB per connection (compressed)

## Async Processing Pattern

\`\`\`typescript
// Non-blocking position creation
await exchangePositionManager.mirrorToExchange(params)
  .then(() => console.log("Mirrored"))
  .catch(err => logger.error(err))

// Batch updates every 5s
setInterval(() => {
  batchUpdateExchangePositions()
    .catch(err => logger.error(err))
}, 5000)

// Statistics refresh on close
if (position.closed) {
  updateStatistics()
    .catch(err => logger.error(err))
}
\`\`\`

## Validation & Constraints

### Data Integrity
- Real volume ≤ Account balance
- PnL never exceeds max drawdown theoretically
- Drawdown time tracks from max profit peak

### State Consistency
- Position can't close before opening
- Closed price must relate to entry (for PnL calc)
- Coordination log tracks all state transitions

## Summary

The Exchange Position system is **minimal, fast, and stateless**:
- ✅ Mirrors actual trades once
- ✅ Captures volume once
- ✅ Calculates statistics once (on close)
- ✅ Provides cached comparisons
- ✅ Zero repeated API calls
- ✅ Optimized database writes (batched, sampled)
