# SQLite System - Quick Reference Guide

## System Architecture

```
Application Startup
    ↓
instrumentation.ts (register function)
    ↓
db-initialization-coordinator.ts (executeCompleteInitialization)
    ↓
├─ Apply PRAGMAs for performance
├─ Load unified schema (unified_complete_setup.sql)
├─ Verify schema integrity
├─ Run ANALYZE optimization
└─ Checkpoint WAL
    ↓
migration-runner.ts (runMigrations)
    ↓
├─ Execute numbered migrations (000_* through 102_*)
├─ Track executed migrations
└─ Apply optimization migrations
    ↓
Trade Engine Initialization
    ↓
├─ Initialize ConnectionManager
├─ Initialize TradeEngineCoordinator
└─ Auto-start enabled engines
```

## Key Files & Their Responsibilities

### Core Database Files
- **lib/db.ts** - SQLite client initialization with all PRAGMAs
- **lib/db-initializer.ts** - Database setup and table initialization
- **lib/migration-runner.ts** - Migration execution and tracking
- **lib/db-initialization-coordinator.ts** - Orchestrates complete initialization

### Performance & Optimization
- **lib/sqlite-bulk-operations.ts** - Bulk insert/update operations
- **lib/db-audit.ts** - Database integrity and performance audit
- **scripts/101_sqlite_comprehensive_optimization.sql** - PRAGMA settings
- **scripts/102_sqlite_optimized_indexes.sql** - Performance indexes

### Integration Points
- **instrumentation.ts** - Server startup entry point
- **app/api/install/initialize/route.ts** - HTTP initialization endpoint
- **app/api/system/status/route.ts** - System health check endpoint

## Common Operations

### Check Database Health
```typescript
import { runDatabaseAudit } from "@/lib/db-initialization-coordinator"

const audit = await runDatabaseAudit()
console.log(`Database size: ${audit.size}`)
console.log(`Tables: ${audit.totalTables}`)
console.log(`Issues: ${audit.issues.length}`)
```

### Bulk Insert Data
```typescript
import { bulkInsert } from "@/lib/sqlite-bulk-operations"

const result = await bulkInsert(
  "trades",
  [
    { id: 1, symbol: "BTC/USD", price: 50000 },
    { id: 2, symbol: "ETH/USD", price: 3000 },
  ]
)
console.log(`Inserted: ${result.inserted} rows`)
```

### Get Database Statistics
```typescript
import { getDatabaseStats } from "@/lib/sqlite-bulk-operations"

const stats = await getDatabaseStats()
console.log(stats)
// {
//   tables: 32,
//   indexes: 120,
//   totalSize: "X.XX MB",
//   pageSize: 4096,
//   ...
// }
```

### Run Database Optimization
```typescript
import { optimizeDatabase } from "@/lib/sqlite-bulk-operations"

const result = await optimizeDatabase()
console.log(`Optimization completed in ${result.duration}ms`)
```

### Checkpoint WAL
```typescript
import { checkpoint } from "@/lib/sqlite-bulk-operations"

const result = await checkpoint()
console.log(`Checkpoint completed in ${result.duration}ms`)
```

## Performance Tuning

### Cache Size Configuration
Current: 64MB (-64000)
Increase for larger datasets: `-cache_size = -128000` (128MB)

### Memory-Mapped I/O
Current: 30MB (30000000 bytes)
For very large operations: `mmap_size = 100000000` (100MB)

### Checkpoint Frequency
Current: 1000 pages
For frequent writes: Reduce to 500 pages
For minimal overhead: Increase to 5000 pages

### Journal Mode
Current: WAL (Write-Ahead Logging)
For simple single-connection usage: `journal_mode = DELETE`

## Troubleshooting

### Database Locked
- Check for long-running transactions
- Verify busy_timeout is set (currently 30s)
- Monitor WAL file size
- May need to increase cache_size

### Slow Queries
1. Run ANALYZE: `db.exec("ANALYZE")`
2. Check indexes with: `PRAGMA index_info(index_name)`
3. Use EXPLAIN: `db.prepare("EXPLAIN QUERY PLAN ...").all()`
4. Consider composite indexes for frequently joined tables

### High Memory Usage
- Reduce cache_size: `-cache_size = -32000` (32MB)
- Reduce mmap_size: `mmap_size = 10000000` (10MB)
- Enable manual pragma: `synchronous = FULL` (slower but less memory)

### Database File Size Growing
- Run ANALYZE: Updates statistics
- Consider VACUUM: Reclaims space (requires exclusive lock)
- Check auto_vacuum is enabled: `PRAGMA auto_vacuum = INCREMENTAL`

## Monitoring

### Check System Status
```bash
curl http://localhost:3000/api/system/status
```

Returns comprehensive system info including:
- Database size and table count
- Index count and performance
- Integrity check results
- PRAGMA settings verification

### Monitor Database Growth
```typescript
import fs from "fs"
const size = fs.statSync("data/database.db").size / 1024 / 1024
console.log(`Database size: ${size.toFixed(2)} MB`)
```

### Check Migration Status
```typescript
import Database from "better-sqlite3"
const db = new Database("data/database.db")
const migrations = db.prepare("SELECT * FROM migrations ORDER BY executedAt").all()
console.log(`${migrations.length} migrations executed`)
```

## Production Checklist

- [ ] Database file exists and is writable
- [ ] WAL mode enabled (journal_mode = WAL)
- [ ] Foreign keys enforced (foreign_keys = ON)
- [ ] All 32 tables present
- [ ] 100+ indexes created
- [ ] PRAGMA integrity_check passes
- [ ] All 72+ migrations executed
- [ ] System status API returns healthy
- [ ] Database audit shows no issues
- [ ] Backup strategy in place

## Emergency Recovery

If database becomes corrupted:

1. Stop the application
2. Backup current database: `cp data/database.db data/database.db.backup`
3. Run integrity check: `PRAGMA integrity_check`
4. If corrupted, rebuild from backup scripts
5. Re-run migrations

## Performance Expectations

### Operations Per Second
- Simple selects: 10,000+
- Indexed lookups: 5,000+
- Bulk inserts: 1,000+ rows
- Complex joins: 1,000+

### Memory Usage
- Base: 50-100MB (cached schema)
- Per 1GB data: +200MB
- Peak with optimization: 500-800MB

### Query Latencies (95th percentile)
- Point lookup: <1ms
- Range query (10K rows): 10-50ms
- Join query: 20-100ms
- Aggregation: 50-200ms
