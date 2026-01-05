# Trade Engine System - Complete Implementation

## Architecture Overview

The CTS v3.1 Trade Engine System is a comprehensive, production-ready trading automation platform with the following architecture:

### Core Components

1. **GlobalTradeEngineCoordinator** (`lib/global-trade-engine-coordinator.ts`)
   - Singleton pattern for system-wide coordination
   - Manages multiple TradeEngineManager instances
   - Handles global start/stop/pause/resume operations
   - Provides health monitoring and performance tracking
   - **Status**: ✅ Fully Implemented

2. **TradeEngineManager** (`lib/trade-engine/engine-manager.ts`)
   - Per-connection trade engine management
   - Non-overlapping interval-based processing
   - Prehistoric data loading (5 days history)
   - Real-time market data streaming
   - **Status**: ✅ Fully Implemented

3. **Processor Components**
   - **IndicationProcessor**: Calculates Direction, Move, Active, Optimal indications
   - **StrategyProcessor**: Evaluates Trailing, Block, DCA strategies
   - **PseudoPositionManager**: Manages paper trading positions with volume calculations
   - **RealtimeProcessor**: Handles real-time position updates and market data
   - **Status**: ✅ All Fully Implemented

### Data Flow

```
Market Data Stream (WebSocket/Polling)
    ↓
IndicationProcessor (Calculate Signals)
    ↓
StrategyProcessor (Evaluate Strategies)
    ↓
PseudoPositionManager (Create Positions)
    ↓
RealtimeProcessor (Update & Monitor)
    ↓
Database Storage & Logging
```

### Performance Optimizations

1. **Non-Overlapping Execution**
   - Trade intervals wait for previous cycle completion
   - Prevents race conditions and data consistency issues
   - Implemented in TradeEngineManager with `lastIntervalComplete` flag

2. **Parallel Processing**
   - Symbols processed concurrently (batch size: 10, max concurrent: 5)
   - Rate limiting between batches (100ms delay)
   - Implemented in all processor components

3. **Performance Monitoring**
   - TradeEnginePerformanceMonitor tracks all processing times
   - Automatic warnings for slow operations
   - Health status calculation (healthy/degraded/unhealthy)
   - API endpoint: `/api/trade-engine/performance`

4. **Memory Management**
   - Metrics stored with max 100 samples
   - Automatic cleanup of old data
   - Memory usage tracking and warnings

### Configuration

All settings configured in **Settings / System** tab:

- **Trade Engine Interval**: 1.0s (default) - Indications + Strategies + Positions + Logging
- **Real Positions Interval**: 0.3s (default) - Exchange position updates only
- **Market Data Timeframe**: 1 second candles
- **Time Range History**: 5 days (configurable 1-12 days)
- **Prehistoric Data**: Automatic loading on engine start
- **Position Limits**: 1 per unique (symbol, indication_type, side, TP, SL, trailing) config
- **Validation Cooldown**: 15 seconds
- **Position Cooldown**: 20 seconds

### Database Schema

**Trade Engine State Table**:
```sql
CREATE TABLE trade_engine_state (
  connection_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'stopped',
  prehistoric_data_loaded BOOLEAN DEFAULT false,
  last_indication_run TIMESTAMP,
  last_strategy_run TIMESTAMP,
  last_realtime_run TIMESTAMP,
  manager_health_status TEXT DEFAULT 'healthy',
  active_positions_count INTEGER DEFAULT 0,
  error_message TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Performance Indexes**:
- 50+ optimized indexes for fast queries
- Automatic index creation on startup
- Covering indexes for common query patterns

### API Endpoints

1. **Start Engine**: `POST /api/trade-engine/start`
   - Starts GlobalTradeEngineCoordinator
   - Initializes all connections
   - Loads prehistoric data

2. **Stop Engine**: `POST /api/trade-engine/stop`
   - Gracefully stops all engines
   - Closes active positions (optional)
   - Updates engine state

3. **Performance Metrics**: `GET /api/trade-engine/performance`
   - Real-time performance data
   - Health status
   - Processing time averages

4. **Engine Status**: `GET /api/trade-engine/status`
   - Current engine state
   - Active connections
   - Component health

### Logistics Workflow

#### Phase 1: Initialization (30-120 seconds)
1. Load system settings from database
2. Load symbols (main/exchange/default + forced symbols)
3. **Load prehistoric data** (parallel per symbol):
   - Fetch 5 days of OHLCV data
   - Calculate technical indicators
   - Generate indication signals
   - Calculate step-based indications
   - Evaluate strategies
   - Create pseudo positions
4. Initialize market data stream (WebSocket/polling)

#### Phase 2: Trade Interval Loop (1.0s, non-overlapping)
1. **Process Indications** (parallel by symbol):
   - Calculate Direction/Move/Active/Optimal
   - Store indication results
2. **Process Strategies** (parallel by symbol):
   - Evaluate Trailing/Block/DCA
   - Generate strategy signals
3. **Manage Pseudo Positions**:
   - Create new positions from strategies
   - Validate position limits
   - Calculate volumes
4. **Logging & Metrics**:
   - Update engine state
   - Record performance metrics
   - Log errors and warnings

#### Phase 3: Real Interval Loop (0.3s, non-overlapping)
1. Get active positions
2. Update current prices from stream
3. Check TP/SL conditions
4. Update trailing stops
5. Close positions as needed

### Missing Components - NOW IMPLEMENTED

✅ **MarketDataStream** (`lib/realtime/market-data-stream.ts`)
   - WebSocket connection handling
   - Polling fallback for exchanges without WebSocket
   - Latest price caching
   - Automatic reconnection

✅ **TradeEnginePerformanceMonitor** (`lib/trade-engine-performance-monitor.ts`)
   - Processing time tracking
   - Memory usage monitoring
   - Performance warnings
   - Health status calculation

✅ **Performance API** (`app/api/trade-engine/performance/route.ts`)
   - Real-time metrics endpoint
   - Health status reporting
   - Detailed performance breakdown

### Production Readiness Checklist

- ✅ **Error Handling**: Comprehensive try-catch blocks in all components
- ✅ **Logging**: SystemLogger integration throughout
- ✅ **Performance Monitoring**: TradeEnginePerformanceMonitor tracks all operations
- ✅ **Non-Overlapping Execution**: Prevents race conditions
- ✅ **Rate Limiting**: 100ms delay between symbol batches
- ✅ **Parallel Processing**: Batch size 10, max concurrent 5
- ✅ **Health Monitoring**: Component-level health tracking
- ✅ **Automatic Recovery**: Reconnection logic for market data streams
- ✅ **Position Limits**: Per-config position limits enforced
- ✅ **Memory Management**: Automatic cleanup of old metrics
- ✅ **Database Optimization**: 50+ indexes for fast queries
- ✅ **File-Based Config**: No database dependency for core settings

### Performance Benchmarks

**Expected Performance** (per 100 symbols):
- Indication Processing: <3 seconds average
- Strategy Processing: <3 seconds average
- Realtime Processing: <1 second average
- Memory Usage: <70% under normal load
- CPU Usage: <60% under normal load

**Warning Thresholds**:
- Indication Processing: 5 seconds
- Strategy Processing: 5 seconds
- Realtime Processing: 3 seconds
- Memory Usage: 80%
- CPU Usage: 80%
- Database Query: 1 second

### Troubleshooting

**Engine Not Starting**:
1. Check database connection
2. Verify system settings exist
3. Check trade_engine_state table
4. Review system logs for errors

**Slow Performance**:
1. Check `/api/trade-engine/performance`
2. Review component health status
3. Check database query times
4. Reduce symbol count or increase intervals

**Position Not Creating**:
1. Check position limits (maxPositionsPerConfigSet)
2. Verify cooldown periods (15s validation, 20s position)
3. Check indication profit factors
4. Review strategy evaluation logs

**Market Data Issues**:
1. Check MarketDataStream status
2. Verify WebSocket connection
3. Check polling fallback
4. Review latest price cache

### Next Steps

The trade engine system is now **100% production-ready** with:
- Complete implementation of all components
- Comprehensive error handling
- Performance monitoring and optimization
- Health tracking and automatic warnings
- Full documentation and troubleshooting guides

For operational details, see:
- `app/logistics/page.tsx` - Complete workflow visualization
- `DATABASE_THRESHOLD_SYSTEM.md` - Position management details
- `AUTO_RECOVERY_SYSTEM.md` - Automatic recovery features
