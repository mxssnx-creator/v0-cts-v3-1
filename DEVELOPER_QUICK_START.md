# SQLite Developer Quick Start Guide

## 5-Minute Setup

### 1. System Starts Automatically
When the app starts, instrumentation.ts automatically runs:
```
✓ Database initialization (WAL mode, PRAGMAs)
✓ Migration execution (77 core + 2 optimization migrations)
✓ Connection manager setup
✓ Trade engine initialization
```

No manual setup required - it's automatic!

### 2. Check System Status
```bash
# Get database health and performance info
curl http://localhost:3000/api/system/status

# Response includes:
{
  "database": {
    "status": "available",
    "size": "15728640 bytes",
    "tables": 32,
    "indexes": 135,
    "integrity": {...},
    "hasIssues": false
  },
  "connections": {...},
  "uptime": "2 minutes"
}
```

### 3. Verify Initialization
```bash
# Full database setup with optimizations
curl -X POST http://localhost:3000/api/install/initialize

# Returns:
{
  "status": "success",
  "message": "Database fully initialized and optimized",
  "details": {
    "tablesCreated": 32,
    "indexesCreated": 135,
    "pragmasApplied": 10,
    "optimizationTime": "1250ms"
  }
}
```

## Common Tasks

### Check Database Size
```typescript
import { getDatabaseStats } from '@/lib/sqlite-bulk-operations'

const stats = await getDatabaseStats()
console.log(`Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
```

### Bulk Insert Trading Data
```typescript
import { insertBatch } from '@/lib/sqlite-bulk-operations'

const orders = [
  { exchange: 'binance', symbol: 'BTCUSDT', price: 45000, quantity: 1 },
  // ... more orders
]

const result = await insertBatch(orders, {
  table: 'orders',
  chunkSize: 1000,
  onProgress: (current, total) => {
    console.log(`Inserted ${current}/${total}`)
  }
})

console.log(`${result.rowsInserted} rows inserted in ${result.duration}ms`)
```

### Audit Database
```typescript
import { auditDatabase } from '@/lib/db-audit'

const audit = await auditDatabase()

console.log(`Database Size: ${(audit.size / 1024 / 1024).toFixed(2)} MB`)
console.log(`Tables: ${audit.totalTables}`)
console.log(`Indexes: ${audit.totalIndexes}`)

if (audit.issues.length > 0) {
  console.warn('Issues found:')
  audit.issues.forEach(issue => console.warn(`- ${issue}`))
}

if (audit.recommendations.length > 0) {
  console.log('Recommendations:')
  audit.recommendations.forEach(rec => console.log(`- ${rec}`))
}
```

### Run Optimization
```typescript
import { optimizeDatabase, checkpoint } from '@/lib/sqlite-bulk-operations'

// Optimize (vacuum, analyze, etc)
const optResult = await optimizeDatabase()
console.log(`Optimized in ${optResult.duration}ms`)

// Flush WAL to main database
const checkpointResult = await checkpoint()
console.log(`Checkpoint in ${checkpointResult.duration}ms`)
```

## Database Schema

### Key Tables

**Users & Authentication**
- `users` - User accounts
- `user_preferences` - User settings
- `user_roles` - Role assignments

**Exchange Integration**
- `exchanges` - Exchange definitions
- `exchange_connections` - User connections to exchanges
- `exchange_positions` - Current positions per exchange

**Trading**
- `orders` - All orders
- `trades` - Executed trades
- `positions` - Current positions
- `portfolios` - User portfolios

**Market Data**
- `market_data` - OHLCV candles
- `trading_pairs` - Pair definitions

**Strategies & Automation**
- `strategies` - Trading strategies
- `presets` - Strategy presets
- `preset_trade_engine` - Preset automation

**System**
- `system_settings` - Configuration
- `audit_logs` - Change tracking
- `site_logs` - Application logs

## Performance Optimizations

### Already Applied
✓ **WAL Mode** - Enables unlimited concurrent readers
✓ **64MB Cache** - Fast repeated access
✓ **30MB Memory-Mapped I/O** - Fast file operations
✓ **33 Strategic Indexes** - Sub-millisecond lookups
✓ **Foreign Key Constraints** - Data integrity
✓ **30-Second Lock Timeout** - Deadlock prevention

### Expected Performance
| Operation | Time |
|-----------|------|
| Single record lookup | < 1ms |
| Index range query | < 5ms |
| Bulk insert (1000 rows) | 50-200ms |
| Full database scan | 100-500ms |
| Concurrent reads | Unlimited |

## Troubleshooting

### Database Initialization Failed
```typescript
// Check what went wrong
const { runDatabaseAudit } = await import('@/lib/db-initialization-coordinator')
const audit = await runDatabaseAudit()
console.log(audit.issues)
console.log(audit.recommendations)
```

### Slow Queries
```typescript
// Add query timing
console.time('query')
const result = db.prepare(sql).all()
console.timeEnd('query') // Shows execution time

// Check index usage
const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all()
console.log(plan) // Shows if indexes are used
```

### High Memory Usage
```typescript
// Reduce cache
// In db.ts, change cache_size from -64000 to -32000

// Run checkpoint to flush WAL
const { checkpoint } = await import('@/lib/sqlite-bulk-operations')
await checkpoint()
```

### Database Locked
```
This is normal under high concurrency.
SQLite will automatically wait up to 30 seconds for the lock to clear.
If persists, restart the application.
```

## File Locations

```
/lib/db.ts                           - Database client initialization
/lib/migration-runner.ts             - Migration execution
/lib/db-initializer.ts               - Database setup
/lib/sqlite-bulk-operations.ts       - Bulk operations (NEW)
/lib/db-initialization-coordinator.ts - Initialization orchestration (NEW)
/lib/db-audit.ts                     - Database auditing (NEW)

/scripts/000_*.sql through 072_*.sql - Core migrations (77 files)
/scripts/101_*.sql                   - Optimization PRAGMAs (NEW)
/scripts/102_*.sql                   - Performance indexes (NEW)

/data/database.db                    - SQLite database file
/data/database.db-wal                - WAL file (auto-created)
/data/database.db-shm                - Shared memory file (auto-created)

/SQLITE_SYSTEM_COMPLETE.md           - Full documentation
/DEVELOPER_QUICK_START.md            - This file
/SQLITE_QUICK_REFERENCE.md           - API reference
```

## API Reference

### Bulk Operations

#### insertBatch(records, options)
```typescript
const result = await insertBatch(records, {
  table: 'table_name',
  chunkSize: 1000,        // Records per transaction
  onProgress: (current, total) => {},
  timeout: 300000         // Timeout in ms
})

// Returns:
{
  success: boolean,
  rowsInserted: number,
  duration: number,
  errors: string[]
}
```

#### updateBatch(records, options)
```typescript
const result = await updateBatch(records, {
  table: 'table_name',
  idField: 'id',
  chunkSize: 1000,
  onProgress: (current, total) => {},
  timeout: 300000
})

// Returns: { success, rowsUpdated, duration, errors }
```

#### deleteBatch(ids, options)
```typescript
const result = await deleteBatch(ids, {
  table: 'table_name',
  idField: 'id',
  chunkSize: 1000,
  timeout: 300000
})

// Returns: { success, rowsDeleted, duration, errors }
```

#### getDatabaseStats()
```typescript
const stats = await getDatabaseStats()

// Returns:
{
  size: number,           // Bytes
  pageSize: number,
  pageCount: number,
  freePages: number,
  tables: number,
  indexes: number
}
```

#### optimizeDatabase()
```typescript
const result = await optimizeDatabase()

// Returns:
{
  success: boolean,
  duration: number,
  error?: string
}
```

#### checkpoint()
```typescript
const result = await checkpoint()

// Returns:
{
  success: boolean,
  duration: number
}
```

### Database Audit

#### auditDatabase()
```typescript
const audit = await auditDatabase()

// Returns:
{
  size: number,
  totalTables: number,
  totalIndexes: number,
  pragmaSettings: {...},
  issues: string[],
  recommendations: string[],
  tableDetails: [{name, rows, size}, ...],
  indexDetails: [{name, table, unique}, ...],
  integrity: {
    foreignKeys: boolean,
    hasOrphanedIndexes: boolean,
    hasUnusedIndexes: boolean
  }
}
```

## Monitoring

### System Status Endpoint
```typescript
// GET /api/system/status
{
  "timestamp": "2026-01-28T12:00:00Z",
  "status": "healthy",
  "database": {
    "status": "available",
    "size": 15728640,
    "tables": 32,
    "indexes": 135,
    "integrity": {...},
    "hasIssues": false,
    "issues": []
  },
  "connections": {
    "total": 5,
    "active": 3,
    "byExchange": {...},
    "byApiType": {...}
  },
  "uptime": "1 hour 23 minutes"
}
```

## Environment Variables

```bash
# SQLite specific
DATABASE_TYPE=sqlite              # Optional, defaults to SQLite
DB_PATH=data/database.db          # Optional, defaults shown

# System
NEXT_RUNTIME=nodejs               # Auto-set by Next.js
NODE_ENV=production               # production | development
```

## Deployment

### Production Checklist
- [ ] Database file is in persistent storage
- [ ] WAL mode enabled (automatic)
- [ ] Backups include all three files (.db, -wal, -shm)
- [ ] Read-only replicas use .db file only
- [ ] Monitoring for locked database errors
- [ ] Regular optimization scheduled
- [ ] Audit checks run monthly

### Backup Strategy
```bash
# Backup (includes all necessary files)
cp data/database.db* /backup/location/

# Restore
cp /backup/location/database.db* data/

# Verify
curl http://localhost:3000/api/system/status
```

## Support

For issues or questions:
1. Check `/SQLITE_SYSTEM_COMPLETE.md` for detailed docs
2. Review `/SQLITE_QUICK_REFERENCE.md` for API reference
3. Run `auditDatabase()` to identify issues
4. Check application logs for errors
5. Review migration execution logs
