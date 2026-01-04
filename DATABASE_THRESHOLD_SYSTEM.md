# Database Position Threshold System

## Overview

The Position Threshold Manager provides automatic database size control with high-performance cleanup for high-frequency trading applications.

## Core Concept

Each configuration type (Base, Main, Real, Preset) has independent position limits per connection:
- **Position Limit**: Target number of positions (e.g., 250)
- **Threshold Percentage**: Buffer before cleanup (default: 20%)
- **Storage Limit**: Position Limit × (1 + Threshold%) = Actual max storage
- **Example**: 250 limit + 20% threshold = 300 positions stored, cleanup to 250 when reached

## Configuration

### Settings Location
`Settings → System → Database Length & Thresholds`

### Available Settings
- **Base Position Limit**: 50-1000 positions (default: 250)
- **Main Position Limit**: 50-1000 positions (default: 250)
- **Real Position Limit**: 50-1000 positions (default: 250)
- **Preset Position Limit**: 50-1000 positions (default: 250)
- **Threshold Percentage**: 10-50% (default: 20%)
- **Max Database Size**: 5-50 GB (default: 20 GB)
- **Enable Monitoring**: Automatic cleanup (default: enabled)

## How It Works

### 1. Continuous Monitoring
- Runs every 60 seconds
- Checks all connections in parallel
- Identifies connections exceeding storage limit

### 2. Threshold Detection
```
Storage Limit = Position Limit × (1 + Threshold% / 100)
Example: 250 × 1.2 = 300 positions

When connection reaches 300 positions:
→ Trigger cleanup
```

### 3. Cleanup Process
1. **Archive**: Copy old positions to `archived_positions` table
2. **Select**: Keep most recent positions up to base limit (250)
3. **Priority**: Active positions kept before closed positions
4. **Delete**: Remove old positions beyond limit
5. **Log**: Record cleanup operation in `data_cleanup_log`

### 4. Position Selection Logic
```sql
ORDER BY 
  CASE WHEN status = 'active' THEN 0 ELSE 1 END,  -- Active first
  created_at DESC                                   -- Then by newest
LIMIT 250
```

## Database Schema

### archived_positions
```sql
CREATE TABLE archived_positions (
  id SERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL,
  connection_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  status TEXT NOT NULL,
  entry_price NUMERIC(20, 8),
  current_price NUMERIC(20, 8),
  profit_factor NUMERIC(20, 8),
  position_cost NUMERIC(20, 8),
  created_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position_data JSONB
);

-- High-performance indexes
CREATE INDEX idx_archived_positions_connection ON archived_positions(connection_id);
CREATE INDEX idx_archived_positions_table ON archived_positions(table_name);
CREATE INDEX idx_archived_positions_archived_at ON archived_positions(archived_at);
```

### data_cleanup_log
```sql
CREATE TABLE data_cleanup_log (
  id SERIAL PRIMARY KEY,
  cleanup_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  connection_id TEXT,
  records_cleaned INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  cleanup_started_at TIMESTAMPTZ NOT NULL,
  cleanup_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  error_message TEXT
);
```

## Performance Optimizations

### 1. Parallel Processing
- Each connection processed independently
- Multiple configurations cleaned simultaneously
- Uses `Promise.allSettled` for fault tolerance

### 2. Indexed Queries
All position tables have optimized indexes:
```sql
CREATE INDEX idx_positions_connection ON positions(connection_id);
CREATE INDEX idx_positions_created_at ON positions(created_at DESC);
CREATE INDEX idx_positions_status ON positions(status);
```

### 3. Batch Operations
- Single query to archive multiple positions
- Single query to delete multiple positions
- Minimal transaction overhead

### 4. Aggressive Cleanup
When database reaches 90% of max size:
- Delete archived positions > 90 days old
- Delete old market data > 30 days old
- Delete old logs > 30 days old
- Run `VACUUM ANALYZE` to reclaim space

## API Endpoints

### Manual Cleanup
```bash
POST /api/database/threshold-cleanup
{
  "type": "manual",
  "connectionId": "conn123"
}
```

### Cleanup All Connections
```bash
POST /api/database/threshold-cleanup
{
  "type": "all"
}
```

### Get Statistics
```bash
GET /api/database/threshold-cleanup
```

Returns position counts per connection and configuration type.

## Monitoring

### Logs
All cleanup operations logged to `data_cleanup_log` table:
- Cleanup type
- Records cleaned/archived
- Start/completion timestamps
- Success/failure status
- Error messages

### System Logger
Real-time monitoring via SystemLogger:
- Threshold exceeded notifications
- Cleanup progress
- Database size warnings
- Error alerts

## Best Practices

### 1. Sizing Guidelines
- **Low-frequency trading**: 100-250 positions
- **Medium-frequency trading**: 250-500 positions
- **High-frequency trading**: 500-1000 positions

### 2. Threshold Percentage
- **20%**: Recommended for most use cases
- **10-15%**: More aggressive cleanup, less storage
- **30-50%**: Less frequent cleanup, more storage

### 3. Database Size
- **5-10 GB**: Small deployments, few connections
- **10-20 GB**: Medium deployments (default)
- **20-50 GB**: Large deployments, many connections

### 4. Monitoring Interval
- Default: 60 seconds (recommended)
- High-frequency: 30 seconds
- Low-frequency: 120+ seconds

## Troubleshooting

### Cleanup Not Running
1. Check `enableThresholdMonitoring` setting
2. Verify threshold manager started in logs
3. Check for errors in SystemLogger

### Performance Issues
1. Verify indexes exist on position tables
2. Increase monitoring interval
3. Reduce position limits if too high
4. Check database CPU/memory usage

### Storage Still Growing
1. Verify aggressive cleanup triggered
2. Check archived_positions size
3. Consider reducing archived retention
4. Run manual `VACUUM ANALYZE`

## Future Enhancements

- [ ] Configurable archived position retention
- [ ] Export archived positions to cold storage
- [ ] Compression for archived data
- [ ] Dashboard widget for cleanup stats
- [ ] Email alerts for storage limits
- [ ] Per-connection limit overrides
