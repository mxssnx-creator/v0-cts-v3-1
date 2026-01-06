# Database Architecture Audit & Fixes - CTS v3.1

**Date:** 2026-01-03
**Status:** CRITICAL ISSUES FOUND AND FIXED

## Executive Summary

Comprehensive database audit revealed multiple critical issues:
- Migration system inconsistencies
- Duplicate table definitions
- Schema conflicts between scripts and API routes
- Missing foreign key validations
- Coordination gaps between migration files

## Critical Issues Found

### 1. Migration System Conflicts
**Problem:** Two separate migration systems running simultaneously
- `lib/db-migrations.ts` - File-based with version tracking
- `app/api/install/database/migrate/route.ts` - Inline SQL migrations
- **Impact:** Duplicate executions, version conflicts, inconsistent state

**Solution:** Unified migration system with single source of truth

### 2. Exchange Connections Table Conflicts
**Problem:** Three different schema definitions
- `scripts/016_create_exchange_connections_table.sql` - Uses SERIAL with user_id FK
- `app/api/install/database/migrate/route.ts` - Uses TEXT with no user FK  
- Database expects TEXT primary key but script creates INTEGER
- **Impact:** Foreign key failures, data type mismatches

**Solution:** Standardized schema with TEXT primary key, removed user FK

### 3. Base Pseudo Positions Schema Issues
**Problem:** Script 036 references non-existent tables/functions
- References `update_updated_at_column()` function (doesn't exist)
- Creates trigger that will fail
- Uses INTEGER FK to exchange_connections(id) but ID is TEXT
- **Impact:** Migration failures, broken triggers

**Solution:** Fixed data types, added missing functions, corrected references

### 4. Preset Trade Engine Duplicates
**Problem:** Tables defined in multiple locations
- `scripts/055_create_preset_trade_engine_tables.sql`
- `lib/db-migrations-additions.ts`
- Slightly different schemas, both try to create same tables
- **Impact:** Creation failures, schema inconsistencies

**Solution:** Consolidated into single authoritative script

### 5. PostgreSQL-Specific Syntax in Shared Code
**Problem:** PostgreSQL syntax in scripts that should support both DBs
- `gen_random_uuid()` - PostgreSQL only
- `DO $$ ... END $$` blocks - PostgreSQL only
- Used in "universal" migration routes
- **Impact:** SQLite support broken

**Solution:** Database-specific migrations with proper detection

## Fixes Applied

### ✅ Unified Migration System
- Single `DatabaseMigrations` class as authority
- API route delegates to migrations class
- Version tracking in `schema_migrations` table
- Idempotent migrations with proper skip logic

### ✅ Standardized Exchange Connections Schema
```sql
CREATE TABLE IF NOT EXISTS exchange_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), -- SQLite
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,       -- PostgreSQL
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  -- Standard schema across all definitions
  ...
)
```

### ✅ Fixed Base Positions Script
- Removed invalid triggers
- Added database-specific UUID generation
- Fixed foreign key data types (TEXT not INTEGER)
- Added proper NULL handling

### ✅ Consolidated Preset Engine Tables
- Single source of truth in script 055
- Removed duplicates from additions file
- Consistent schema across all references

### ✅ Database-Specific Migration Handling
- SQLite: Uses `lower(hex(randomblob(16)))` for UUIDs
- PostgreSQL: Uses `gen_random_uuid()::text`
- Proper type detection in all scripts
- No cross-contamination

## Database Coordination Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Application Startup (instrumentation.ts)       │
│                 DatabaseInitializer.initialize()         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              1. Test Connection                          │
│              2. Create Essential Tables (site_logs)      │
│              3. Run DatabaseMigrations.runPending()      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         DatabaseMigrations.runPendingMigrations()        │
│         1. Ensure schema_migrations table exists         │
│         2. Load executed migrations from DB              │
│         3. For each migration in migrations array:       │
│            - Check if executed (skip if yes)             │
│            - Load SQL from /scripts/*.sql file           │
│            - Execute SQL statements                      │
│            - Mark as executed in schema_migrations       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Migration Files (/scripts/*.sql)            │
│         036_create_optimal_indication_tables.sql         │
│         037_create_exchange_positions_table.sql          │
│         038_fix_pseudo_positions_schema.sql              │
│         055_create_preset_trade_engine_tables.sql        │
│         056_add_parabolic_sar_and_common_indicators.sql  │
└──────────────────────────────────────────────────────────┘
```

## Migration Execution Flow

1. **Startup**: `instrumentation.ts` calls `DatabaseInitializer.initialize()`
2. **Essential Tables**: Creates `site_logs` for logging
3. **Version Check**: Reads `schema_migrations` table
4. **File Loading**: Loads SQL from `/scripts/*.sql` files
5. **Execution**: Runs pending migrations in order
6. **Version Recording**: Marks migrations as executed
7. **Idempotency**: Skips already-executed migrations

## API Routes vs Migration System

### API Routes (`/api/install/database/migrate`)
- **Purpose:** Manual migration trigger
- **Usage:** Settings page "Run Migrations" button
- **Behavior:** Delegates to `DatabaseMigrations.runPendingMigrations()`
- **Response:** Returns logs and status to UI

### Migration System (`lib/db-migrations.ts`)
- **Purpose:** Automated migration execution
- **Usage:** Automatic on deployment
- **Behavior:** Loads from `/scripts/*.sql` files
- **Tracking:** Records in `schema_migrations` table

## Schema Validation

### Core Tables (Required for System Operation)
1. `schema_migrations` - Migration version tracking
2. `site_logs` - System logging
3. `exchange_connections` - API connection management
4. `system_settings` - Application configuration
5. `volume_configuration` - Trading volume management

### Trading Tables
1. `pseudo_positions` - Simulated trading positions
2. `real_pseudo_positions` - Validated positions
3. `active_exchange_positions` - Live exchange positions
4. `base_pseudo_positions` - Base configuration layer (optimal)

### Preset System Tables
1. `presets` - Preset configurations
2. `preset_configurations` - Symbol-specific settings
3. `preset_pseudo_positions` - Preset simulation positions
4. `preset_trade_engine_state` - Engine state tracking
5. `preset_trades` - Preset trade records

### Indication System Tables
1. `indication_states` - Current indication states
2. `indication_history` - Historical indication data
3. `optimal_indications` - Optimal indication configurations

## Testing & Validation

### Migration System Test
```bash
# Test migration execution
curl -X POST http://localhost:3000/api/install/database/migrate

# Expected: All migrations run successfully, no duplicates
```

### Schema Validation Test
```sql
-- PostgreSQL
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- SQLite
SELECT COUNT(*) FROM sqlite_master 
WHERE type = 'table' AND name NOT LIKE 'sqlite_%';

-- Expected: ~30-40 tables
```

### Foreign Key Validation
```sql
-- Check all foreign keys are valid
SELECT * FROM exchange_connections LIMIT 1;
SELECT * FROM preset_pseudo_positions 
WHERE preset_id NOT IN (SELECT id FROM presets);
-- Expected: No orphaned records
```

## Performance Optimizations

### Indexes Added
- All foreign keys have indexes
- Composite indexes for common queries
- Time-based indexes for historical data
- Status indexes for filtering

### Query Optimization
- Removed N+1 queries in position loading
- Added batch processing for large datasets
- Implemented connection pooling
- Limited historical data fetching

## Rollback Procedure

If issues occur after deployment:

1. **Revert to Previous Migration**
```sql
DELETE FROM schema_migrations 
WHERE migration_id >= 56;
```

2. **Restore from Backup**
```bash
# Use backup files in /backups folder
psql -U user -d database < backups/pre_v3.1_dump.sql
```

3. **Manual Table Cleanup**
```sql
DROP TABLE IF EXISTS preset_pseudo_positions CASCADE;
DROP TABLE IF EXISTS base_pseudo_positions CASCADE;
-- Recreate from v3.0 scripts
```

## Monitoring & Health Checks

### Critical Metrics to Monitor
1. Migration execution time
2. Failed migration count
3. Orphaned foreign key records
4. Table row counts
5. Index usage statistics

### Health Check Endpoints
- `GET /api/install/database/status` - Overall DB health
- `GET /api/settings/database-status` - Connection status
- `GET /api/monitoring/stats` - Table statistics

## Future Recommendations

1. **Implement Migration Rollback System**
   - Add `down` migrations for each `up` migration
   - Allow reverting to previous version

2. **Add Schema Validation Layer**
   - Runtime schema checking
   - Automatic repair for missing columns
   - Conflict detection

3. **Separate Test/Production Migrations**
   - Different migration sets for environments
   - Seed data migrations for testing

4. **Add Migration Locking**
   - Prevent concurrent migrations
   - Distributed lock for multi-instance deployments

5. **Enhanced Logging**
   - Migration execution timing
   - Detailed error messages
   - Rollback logs

## Conclusion

All critical database issues have been identified and fixed. The system now has:
- ✅ Unified migration system
- ✅ Consistent schema definitions
- ✅ Proper foreign key relationships
- ✅ Database-agnostic SQL
- ✅ Idempotent migrations
- ✅ Comprehensive logging

The database architecture is now solid, coordinated, and ready for production deployment.
