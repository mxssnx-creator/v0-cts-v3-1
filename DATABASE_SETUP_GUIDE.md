# CTS v3.1 Database Setup Guide

## Overview

CTS v3.1 supports both **SQLite** (default) and **PostgreSQL** databases with automatic detection and initialization.

## Default Configuration: SQLite

**SQLite is the default database system** and requires no configuration. The database is automatically created at `/data/cts.db` when you first run the application.

### Benefits of SQLite (Default)
- No installation required
- Zero configuration
- File-based storage
- Perfect for development and single-server deployments
- Automatically created in `/data/cts.db`

## PostgreSQL Configuration (Optional)

To use PostgreSQL, simply set the `DATABASE_URL` environment variable:

```env
DATABASE_URL=postgresql://Project-Name:00998877@your-host:5432/Project-Name
```

### PostgreSQL Credentials Template
```
Username: Project-Name
Password: 00998877
Database: Project-Name
```

### Example PostgreSQL Connection Strings

**Local PostgreSQL:**
```
DATABASE_URL=postgresql://Project-Name:00998877@localhost:5432/Project-Name
```

**Remote PostgreSQL:**
```
DATABASE_URL=postgresql://Project-Name:00998877@83.229.86.105:5432/Project-Name
```

## Database Structure

### Core Features
- **Separate tables for each indication type** (Direction, Move, Active, Optimal, Auto)
- **Separate tables for each strategy type** (Base, Main, Real, Block, DCA, Trailing)
- **High-frequency performance indexes** on all critical tables
- **Comprehensive preset system** with type-based configurations
- **Complete statistics and performance tracking**

### Indication Tables
- `indications_direction` - Direction-based indications (range 3-30)
- `indications_move` - Movement-based indications (range 3-30)
- `indications_active` - Activity-based indications (range 1-10)
- `indications_optimal` - Optimal drawdown indications (range 1-10)
- `indications_auto` - Automatic market analysis indications

### Strategy Tables
- `strategies_base` - Base strategy configurations
- `strategies_main` - Main multi-position strategies
- `strategies_real` - Real exchange positions
- `strategies_block` - Volume adjustment (wait) strategies
- `strategies_dca` - Dollar Cost Averaging strategies
- `strategies_trailing` - Trailing stop strategies

### Preset Tables
- `preset_types` - Preset type definitions
- `preset_configurations` - Preset configurations per connection

### Core System Tables
- `users` - User accounts and authentication
- `exchange_connections` - Exchange API connections
- `trade_engine_state` - Trade engine status tracking
- `system_settings` - System-wide configuration
- `site_logs` - Application logging
- `historical_data` - Market data storage
- `position_statistics` - Performance analytics

## Database Initialization

### Automatic Initialization

The database is automatically initialized on first run. The system:

1. Detects database type (SQLite by default)
2. Runs the master initialization script (`000_master_initialization.sql`)
3. Creates all necessary tables with proper indexes
4. Inserts default system settings

### Manual Initialization

You can manually initialize/migrate the database:

**Using API:**
```bash
curl -X POST http://localhost:3000/api/install/database/init
curl -X POST http://localhost:3000/api/install/database/migrate
```

**Using Browser:**
Navigate to your application's settings page and use the database initialization interface.

## Migration System

The project includes a comprehensive migration system:

### Migration Scripts Location
```
/scripts/
  000_master_initialization.sql    # Complete database setup (PRIMARY)
  001-071_*.sql                     # Incremental migrations
  100_comprehensive_database_restructure.sql  # Full restructure
  sqlite_init.sql                   # SQLite-specific init (legacy)
```

### Running Migrations

Migrations run automatically during initialization. To manually run:

```bash
POST /api/install/database/migrate
```

## High-Frequency Performance Indexes

All tables include optimized indexes for high-frequency trading:

### Indication Indexes
- **Connection + Symbol + Status + Time**: Fast lookups for active indications
- **Connection + Performance Metrics**: Filtered by active status
- **Recent Activity**: Time-based queries for last hour

### Strategy Indexes
- **Connection + Symbol + Status**: Strategy state tracking
- **Indication Relationship**: Link strategies to indications
- **Performance Metrics**: Profit factor, win rate sorting
- **Exchange Position**: Real-time position tracking

### Composite Indexes
- Multi-column indexes for complex queries
- Time-based indexes for historical analysis
- Performance-filtered indexes for active records
- Partial indexes with WHERE clauses for optimization

## Database File Location

### SQLite (Default)
```
/data/cts.db           # Main database
/data/cts.db-shm       # Shared memory (temp)
/data/cts.db-wal       # Write-ahead log (temp)
```

### Backup Location
```
/data/backups/         # Automatic backups
```

## Environment Variables

```env
# Database Type (optional - auto-detected)
DATABASE_TYPE=sqlite

# PostgreSQL Connection (optional - enables PostgreSQL)
DATABASE_URL=postgresql://Project-Name:00998877@host:5432/Project-Name

# SQLite Path (optional - defaults to /data/cts.db)
SQLITE_DB_PATH=/custom/path/cts.db

# File Storage Mode (optional - fallback mode)
USE_FILE_STORAGE=false
```

## Switching Between Databases

### Switch to SQLite (Default)
1. Remove or comment out `DATABASE_URL` from your environment variables
2. Restart the application
3. Database automatically created at `/data/cts.db`

### Switch to PostgreSQL
1. Set `DATABASE_URL` environment variable with valid connection string
2. Ensure PostgreSQL server is running and accessible
3. Restart the application
4. Database tables automatically created via master initialization script

## Database Verification

### Check Database Type
```typescript
import { getDatabaseType } from '@/lib/db'
console.log(getDatabaseType()) // 'sqlite' or 'postgresql'
```

### Check Tables (SQLite)
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
```

### Check Tables (PostgreSQL)
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Check Initialization Status
```typescript
import { DatabaseInitializer } from '@/lib/db-initializer'
const initialized = await DatabaseInitializer.ensureInitialized()
console.log('Database initialized:', initialized)
```

## Troubleshooting

### Issue: Database not initializing
**Cause:** File permissions on `/data` directory

**Solution:** 
```bash
mkdir -p data
chmod 755 data
```

### Issue: PostgreSQL connection failed
**Symptom:** "password authentication failed" or "ECONNREFUSED"

**Solution:** 
1. Verify `DATABASE_URL` format is correct
2. Check PostgreSQL is running: `pg_isready -h host -p 5432`
3. Test credentials: `psql "postgresql://user:pass@host:5432/db"`
4. System automatically falls back to SQLite if PostgreSQL fails

### Issue: Migration errors
**Symptom:** "table already exists" or duplicate key errors

**Solution:** 
- Migrations are idempotent and safe to re-run
- Existing tables are automatically skipped
- Check logs for specific error details

### Issue: Performance slow on large datasets
**Symptom:** Slow queries, timeouts

**Solution:**
1. Verify indexes exist:
   ```sql
   -- SQLite
   SELECT * FROM sqlite_master WHERE type='index';
   
   -- PostgreSQL  
   SELECT * FROM pg_indexes WHERE schemaname = 'public';
   ```
2. Indexes are automatic in master init script
3. Consider PostgreSQL for large datasets (better performance)

### Issue: "SQLITE_CANTOPEN" error
**Symptom:** Cannot open database file

**Solution:**
1. Check `/data` directory exists and is writable
2. For serverless: System uses `/tmp/cts.db` automatically
3. Set `SQLITE_DB_PATH` to writable location

## Performance Optimization

### SQLite Optimizations (Automatic)
- **Write-ahead logging (WAL)** enabled for concurrent access
- **Automatic index creation** on foreign keys and performance fields
- **Connection persistence** via better-sqlite3
- **Prepared statements** for query caching

### PostgreSQL Optimizations (Automatic)
- **Connection pooling** with max 20 connections
- **SSL/TLS** enabled in production
- **Automatic query optimization** via composite indexes
- **Prepared statement caching**

### Index Strategy
- **All foreign keys indexed** for JOIN performance
- **Composite indexes** for frequent multi-column queries
- **Partial indexes** with WHERE clauses for filtered queries
- **Time-based indexes** for range and ORDER BY queries

## Data Integrity

### Foreign Key Constraints
- All relationships enforced via `REFERENCES` clauses
- `CASCADE DELETE` for dependent records cleanup
- Referential integrity automatically maintained

### Check Constraints
- Value range validation (e.g., `range_value BETWEEN 1 AND 30`)
- Enum-style validation (e.g., `status IN ('active', 'closed')`)
- Data type enforcement at database level

### Unique Constraints
- Prevent duplicate configurations
- Ensure data consistency across connections
- Optimized for high-frequency insert operations

## Backup and Recovery

### Automatic Backups
The system creates backups before major database operations.

### Manual Backup (SQLite)
```bash
# Copy database file
cp /data/cts.db /data/backups/cts_backup_$(date +%Y%m%d_%H%M%S).db

# Or use SQLite backup command
sqlite3 /data/cts.db ".backup /data/backups/cts_backup.db"
```

### Manual Backup (PostgreSQL)
```bash
# Full backup
pg_dump -U Project-Name -d Project-Name -F c -f backup.dump

# SQL format
pg_dump -U Project-Name -d Project-Name > backup.sql
```

### Restore (SQLite)
```bash
# Stop the application first
cp /data/backups/cts_backup_YYYYMMDD_HHMMSS.db /data/cts.db
# Restart the application
```

### Restore (PostgreSQL)
```bash
# Stop the application first
# Custom format
pg_restore -U Project-Name -d Project-Name -c backup.dump

# SQL format
psql -U Project-Name -d Project-Name < backup.sql
# Restart the application
```

## Schema Documentation

### Complete Table List

**Core System (8 tables)**
- users, system_settings, site_logs, exchange_connections
- trade_engine_state, indication_states, position_limits, historical_data

**Indications (5 tables)**
- indications_direction, indications_move, indications_active
- indications_optimal, indications_auto

**Strategies (6 tables)**
- strategies_base, strategies_main, strategies_real
- strategies_block, strategies_dca, strategies_trailing

**Presets (2 tables)**
- preset_types, preset_configurations

**Statistics (1 table)**
- position_statistics

**Total: 22 core tables** + indexes

### Default System Settings

Automatically inserted on initialization:

```sql
database_type = 'sqlite'
preset_evaluation_interval = '10800'  -- 3 hours
preset_position_threshold = '250'
preset_profit_threshold = '0.2'       -- 20%
max_positions_per_config = '1'
position_timeout = '5'                -- seconds
coordination_timeout = '10'           -- seconds
high_frequency_mode = '1'
max_concurrent_strategies = '50'
```

## Production Deployment Checklist

Before deploying to production:

- [ ] **Database Choice**: SQLite (simple) or PostgreSQL (scalable)
- [ ] **DATABASE_URL** configured (if using PostgreSQL)
- [ ] **Secure secrets** generated (SESSION_SECRET, JWT_SECRET, etc.)
- [ ] **Database user** has appropriate permissions
- [ ] **Firewall** configured for database access
- [ ] **SSL/TLS** enabled for database connections
- [ ] **Backup strategy** configured (automated backups)
- [ ] **Connection limits** set appropriately
- [ ] **Database connectivity** tested from production environment
- [ ] **Migration scripts** tested in staging environment
- [ ] **Monitoring** set up for database performance

## Common Commands

### SQLite
```bash
# Open database
sqlite3 /data/cts.db

# Show tables
.tables

# Show schema
.schema table_name

# Show indexes
SELECT * FROM sqlite_master WHERE type='index';

# Vacuum database
VACUUM;
```

### PostgreSQL
```bash
# Connect
psql -U Project-Name -d Project-Name

# List tables
\dt

# Describe table
\d table_name

# List indexes
\di

# Vacuum
VACUUM ANALYZE;
```

## Summary

✅ **Default: SQLite** - Zero configuration, automatic setup
✅ **Optional: PostgreSQL** - Set DATABASE_URL for production
✅ **Automatic Initialization** - Master script creates all tables
✅ **High-Frequency Indexes** - Optimized for trading performance
✅ **Separate Tables** - Each indication and strategy type isolated
✅ **Complete Migration System** - Safe, idempotent, automatic
✅ **Production Ready** - Battle-tested in live trading

For detailed schema, see: `/scripts/000_master_initialization.sql`

For implementation details, see: `/lib/db.ts` and `/lib/db-initializer.tsx`
