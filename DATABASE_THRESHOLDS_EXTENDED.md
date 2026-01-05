# Extended Database Thresholds - CTS v3.1

## Overview
Enhanced database threshold management system with support for optimal types, auto types, preset types, and ADX data cleanup.

## New Threshold Types

### 1. Optimal Positions (`optimal_pseudo_positions`)
**Purpose:** Store positions from optimal calculation engine
**Default Limit:** 300 positions per connection
**Use Case:** Auto-optimal strategy results and analysis

### 2. Auto Positions (`auto_pseudo_positions`)
**Purpose:** Store positions from automated trading systems
**Default Limit:** 300 positions per connection
**Use Case:** Fully automated trade execution tracking

### 3. Preset Positions (`preset_pseudo_positions`)
**Purpose:** Store positions from preset strategies
**Default Limit:** 500 positions per connection (higher due to multiple preset configurations)
**Use Case:** Preset strategy execution and backtesting

### 4. ADX Data (`adx_data`)
**Purpose:** Store ADX indicator calculations
**Default Limit:** 10,000 records total
**Use Case:** Technical analysis and indicator-based strategies

## Configuration

### Settings Keys
All settings are stored in `system_settings` table and file-based storage:

```typescript
{
  databaseSizeBase: 250,        // Base position limit
  databaseSizeMain: 250,        // Main position limit
  databaseSizeReal: 250,        // Real position limit
  databaseSizePreset: 500,      // Preset position limit (HIGHER)
  databaseSizeOptimal: 300,     // Optimal position limit
  databaseSizeAuto: 300,        // Auto position limit
  adxDatabaseLength: 10000,     // ADX data record limit
  databaseThresholdPercent: 20, // Cleanup threshold (20%)
  maxDatabaseSizeGB: 20         // Max database size
}
```

### Threshold Calculation
Actual storage limit = `configuredLimit * (1 + thresholdPercent / 100)`

**Examples:**
- Preset: 500 * 1.20 = 600 positions (cleanup at 600, keep 500)
- Optimal: 300 * 1.20 = 360 positions (cleanup at 360, keep 300)
- ADX: 10,000 * 1.20 = 12,000 records (cleanup at 12k, keep 10k)

## Cleanup Process

### Position Cleanup (All Types)
1. Monitor position counts per connection
2. When threshold exceeded:
   - Archive old positions to `archived_positions` table
   - Delete oldest positions (keeping most recent + active)
   - Log cleanup in `data_cleanup_log`
3. Preserve active positions (priority)
4. Keep most recent closed positions

### ADX Data Cleanup
1. Monitor total ADX records across all symbols/timeframes
2. When threshold exceeded:
   - Archive old ADX data to `archived_adx_data` table
   - Delete oldest ADX records (keeping most recent)
   - Log cleanup in `data_cleanup_log`
3. Preserve most recent data per symbol/timeframe

## API Endpoints

### Get Threshold Statistics
```
GET /api/database/threshold-cleanup
```

Returns position counts and ADX statistics for all types.

### Manual Cleanup Trigger
```
POST /api/database/threshold-cleanup
Body: { connectionId: "conn_123" }
```

Triggers immediate cleanup for a specific connection.

### Update Thresholds
```
PATCH /api/settings/system
Body: {
  databaseSizePreset: 500,
  databaseSizeOptimal: 300,
  databaseSizeAuto: 300,
  adxDatabaseLength: 10000
}
```

## Monitoring

### Automatic Monitoring
- Runs every 60 seconds (configurable)
- Checks all position types
- Checks ADX data length
- Checks overall database size

### Manual Monitoring
```typescript
import { positionThresholdManager } from '@/lib/position-threshold-manager'

// Get current statistics
const stats = await positionThresholdManager.getPositionStatistics()

// Trigger manual cleanup
await positionThresholdManager.manualCleanup('connection_id')
```

## Performance Optimizations

### High-Performance Features
1. **Parallel Processing:** All connection cleanups run concurrently
2. **Batch Operations:** Archive and delete in single queries
3. **Indexed Queries:** Fast lookups using database indexes
4. **Minimal Locking:** Optimistic concurrency control

### Database Indexes Required
```sql
-- Position tables
CREATE INDEX idx_positions_connection_created ON optimal_pseudo_positions(connection_id, created_at DESC);
CREATE INDEX idx_positions_connection_status ON optimal_pseudo_positions(connection_id, status);

-- ADX data
CREATE INDEX idx_adx_timestamp ON adx_data(timestamp DESC);
CREATE INDEX idx_adx_symbol_timeframe ON adx_data(symbol, timeframe);
```

## Archive Tables

### archived_positions
Stores archived position data before deletion:
- All position fields preserved
- Original table name stored
- Archive timestamp
- JSON snapshot of original row

### archived_adx_data
Stores archived ADX data before deletion:
- All ADX calculation fields
- Symbol and timeframe
- Archive timestamp
- JSON snapshot of original row

## Best Practices

### Preset Strategies
- Higher limit (500) accommodates multiple preset configurations
- Each preset type can maintain significant history
- Ideal for backtesting and strategy comparison

### Optimal/Auto Types
- Medium limit (300) balances history and performance
- Sufficient for analysis and optimization
- Prevents unbounded growth

### ADX Data
- Centralized limit across all symbols
- Keep most recent for each symbol/timeframe
- Archive old data for historical analysis

### Production Recommendations
1. Monitor cleanup logs regularly
2. Adjust limits based on trading frequency
3. Review archived data retention policies
4. Set up alerts for database size warnings

## Troubleshooting

### High Cleanup Frequency
- Increase position limits
- Increase threshold percentage
- Review trading volume

### Slow Cleanup Operations
- Check database indexes
- Monitor connection pool
- Review query performance

### Archive Table Growth
- Implement archive rotation (>90 days)
- Regular vacuum operations
- Monitor disk space

## Integration

The threshold system integrates with:
- System Health Monitor
- Auto Recovery Manager
- Database Manager
- File-based Settings Storage
- Monitoring Dashboard

All configuration is stored in both database and file storage for resilience.
