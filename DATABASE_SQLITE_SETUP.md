# SQLite Database Setup - CTS v3.1

## Overview

CTS v3.1 uses **SQLite as the default database**. SQLite is a lightweight, serverless, zero-configuration database that requires no separate server process. This makes CTS v3.1 extremely easy to deploy and run.

## Key Features

- **Zero Configuration**: Database automatically initializes on first run
- **No Server Required**: Embedded database, no separate process needed
- **Portable**: Single file database (data/cts.db)
- **Reliable**: ACID compliant with transaction support
- **Fast**: Optimized with WAL mode and proper indexes
- **Automatic**: All initialization happens automatically

## Default Configuration

By default, CTS v3.1 will:

1. **Automatically create** the SQLite database at `data/cts.db`
2. **Initialize the schema** when the application first starts
3. **Enable optimizations** (WAL mode, foreign keys, caching)
4. **Handle migrations** automatically

## Manual Database Management

While initialization is automatic, you can manually manage the database:

### Check Database Status

```bash
npm run db:check
```

This will verify:
- Database file exists
- Directory has proper permissions
- Critical tables are present
- Row counts for key tables

### Initialize Database Manually

```bash
npm run db:init
```

This will:
- Create the database file if it doesn't exist
- Run the complete schema initialization
- Set up all tables, indexes, and constraints
- Insert default system settings

### Check Database Health

```bash
npm run db:status
```

### Backup Database

```bash
npm run db:backup
```

Creates a timestamped backup in `backups/` directory.

## Database Location

**Default**: `data/cts.db` (relative to project root)

**Custom Location**: Set environment variable

```bash
# In .env.local
SQLITE_DB_PATH=/path/to/your/database.db
```

## Database File Structure

```
project-root/
├── data/
│   ├── cts.db              # Main database file
│   ├── cts.db-shm          # Shared memory file (WAL mode)
│   └── cts.db-wal          # Write-ahead log file (WAL mode)
├── backups/
│   └── cts-backup-*.db     # Automatic backups
└── scripts/
    ├── unified_complete_setup.sql
    └── init-database-sqlite.js
```

## Automatic Initialization Process

When you start CTS v3.1, the system automatically:

### 1. **Startup Check** (`instrumentation.ts`)
- Verifies runtime environment
- Checks if database type is SQLite (default)
- Logs initialization progress

### 2. **Database Creation** (`lib/db.ts`)
- Creates `data/` directory if missing
- Initializes SQLite database file
- Enables performance optimizations:
  - WAL (Write-Ahead Logging) mode
  - Foreign key constraints
  - 64MB cache
  - Memory temp storage

### 3. **Schema Setup** (`instrumentation.ts`)
- Checks for critical tables
- Runs `unified_complete_setup.sql` if tables missing
- Creates all tables, indexes, and constraints
- Inserts default system settings

### 4. **Verification**
- Confirms all critical tables exist
- Records migrations
- Logs completion status

## Database Optimizations

The system automatically enables these SQLite optimizations:

```sql
PRAGMA journal_mode = WAL;        -- Better concurrency
PRAGMA foreign_keys = ON;         -- Referential integrity
PRAGMA synchronous = NORMAL;      -- Balance safety/speed
PRAGMA temp_store = MEMORY;       -- Fast temp operations
PRAGMA cache_size = -64000;       -- 64MB cache
```

## Migration to PostgreSQL

If you need to switch to PostgreSQL later:

### 1. Set Environment Variable

```bash
# In .env.local
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Restart Application

The system will automatically detect PostgreSQL and use it instead of SQLite.

## Troubleshooting

### Database File Permissions

```bash
# Ensure proper permissions
chmod 755 data/
chmod 644 data/cts.db
```

### Database Locked Error

If you get "database is locked" errors:

1. **Check for multiple instances**: Only one CTS instance should access the database
2. **Close connections**: Ensure previous instances are fully stopped
3. **WAL mode**: Should be automatic, but verify with:

```bash
sqlite3 data/cts.db "PRAGMA journal_mode;"
# Should return: wal
```

### Corrupted Database

If database becomes corrupted:

```bash
# 1. Stop the application
# 2. Backup existing database
cp data/cts.db data/cts.db.backup

# 3. Reinitialize
npm run db:init
```

### Missing Tables

If tables are missing:

```bash
# Reinitialize schema
npm run db:init
```

## Database Size Management

SQLite databases can grow over time. To manage size:

### Check Size

```bash
ls -lh data/cts.db
```

### Vacuum Database (Reclaim Space)

```bash
sqlite3 data/cts.db "VACUUM;"
```

### Auto-vacuum (Optional)

Add to initialization SQL:

```sql
PRAGMA auto_vacuum = INCREMENTAL;
```

## Performance Tips

1. **WAL Mode** ✓ (enabled by default)
   - Allows concurrent reads during writes
   - Better performance for multi-user scenarios

2. **Proper Indexes** ✓ (created automatically)
   - All foreign keys indexed
   - Common query patterns optimized

3. **Connection Pooling** ✓ (automatic)
   - Single connection reused
   - No overhead from connection creation

4. **Prepared Statements** ✓ (used throughout)
   - Better performance
   - Protection against SQL injection

## Best Practices

### DO:
- ✓ Use the default SQLite database for standalone deployments
- ✓ Let automatic initialization handle schema setup
- ✓ Regular backups (automatic every 6 hours)
- ✓ Monitor database size periodically

### DON'T:
- ✗ Manually edit the database file
- ✗ Run multiple instances accessing same database
- ✗ Delete WAL files while application is running
- ✗ Modify schema without migrations

## Quick Reference

```bash
# Start application (auto-init on first run)
npm run dev

# Manual database check
npm run db:check

# Manual initialization
npm run db:init

# Check status
npm run db:status

# Create backup
npm run db:backup

# System health check
npm run health
```

## Summary

SQLite is now the **default and recommended** database for CTS v3.1:

- ✓ **Zero configuration required**
- ✓ **Automatic initialization**
- ✓ **Production-ready performance**
- ✓ **Reliable and ACID compliant**
- ✓ **Easy backup and recovery**

The system is designed to "just work" out of the box. Simply run `npm run dev` and everything will be set up automatically!
