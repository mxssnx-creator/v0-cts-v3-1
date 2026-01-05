# Database Prefix System - CTS v3.1

Complete documentation for the database table and database prefixing system that allows multiple CTS instances to coexist.

## Overview

The database prefix system provides:
- **Project-based naming** - All tables prefixed with sanitized project name
- **Multi-instance support** - Run multiple CTS installations on same database server
- **Automatic configuration** - Setup wizard configures prefixes during installation
- **Migration compatibility** - All migrations automatically apply correct prefixes

## Architecture

### Components

1. **DatabasePrefixManager** (`lib/database-prefix-manager.ts`)
   - Manages prefix configuration file
   - Generates sanitized prefixes from project names
   - Provides async API for prefix operations

2. **DatabaseConfigManager** (`lib/config/database-config.ts`)
   - Integrates with DatabasePrefixManager
   - Manages database and table naming
   - Provides sync API for runtime operations

3. **Migration Runner** (`scripts/run-migrations-with-prefix.js`)
   - Applies prefixes to all SQL statements
   - Tracks migrations per prefix
   - Ensures idempotent migrations

### Configuration Files

**Location**: `data/db-config.json` or `data/db-prefix-config.json`

**Format**:
```json
{
  "projectName": "CTS v3.1",
  "dbPrefix": "cts_v3_1",
  "databases": {
    "main": "cts_v3_1_main",
    "indicationActive": "cts_v3_1_indication_active",
    "indicationDirection": "cts_v3_1_indication_direction",
    "indicationMove": "cts_v3_1_indication_move",
    "strategySimple": "cts_v3_1_strategy_simple",
    "strategyAdvanced": "cts_v3_1_strategy_advanced",
    "strategyStep": "cts_v3_1_strategy_step"
  },
  "users": {
    "admin": "cts_v3_1_admin",
    "app": "cts_v3_1_app"
  }
}
```

## Installation

### Interactive Setup

```bash
npm run db:setup:full
```

The setup wizard will:
1. Prompt for project name (e.g., "CTS Production")
2. Generate sanitized prefix (e.g., "cts_production")
3. Create configuration files
4. Create databases with prefix
5. Run all migrations with prefix

### Manual Configuration

```bash
# Set project name in environment
export PROJECT_NAME="My Trading Bot"
export DB_PREFIX="my_trading_bot"

# Create databases
npm run db:setup:prefix

# Run migrations
npm run db:migrate
```

## Naming Conventions

### Project Name → Prefix Conversion

| Project Name | Sanitized Prefix |
|--------------|------------------|
| CTS v3.1 | cts_v3_1 |
| Production Bot | production_bot |
| Test-Instance-2 | test_instance_2 |
| MyCompany_CTS | mycompany_cts |

**Sanitization Rules**:
1. Convert to lowercase
2. Replace non-alphanumeric characters with underscore
3. Collapse multiple underscores to single
4. Remove leading/trailing underscores

### Database Names

**Format**: `{prefix}_{type}_{subtype}`

**Examples**:
- Main: `cts_v3_1_main`
- Indication (Active): `cts_v3_1_indication_active`
- Strategy (Advanced): `cts_v3_1_strategy_advanced`

### Table Names

**Format**: `{prefix}_{table}`

**Examples**:
- `cts_v3_1_exchange_connections`
- `cts_v3_1_pseudo_positions`
- `cts_v3_1_real_positions`
- `cts_v3_1_market_data`

### User Names

**Format**: `{prefix}_{role}`

**Examples**:
- Admin: `cts_v3_1_admin` (for migrations, full privileges)
- App: `cts_v3_1_app` (for runtime, restricted privileges)

## Usage in Code

### Getting Table Names

```typescript
import { dbConfig } from "@/lib/config/database-config"

// Get prefixed table name
const tableName = dbConfig.getTableName("exchange_connections")
// Returns: "cts_v3_1_exchange_connections"

// Get database names
const mainDb = dbConfig.getMainDatabase()
// Returns: "cts_v3_1_main"

const indicationDb = dbConfig.getIndicationDatabase("active")
// Returns: "cts_v3_1_indication_active"
```

### In SQL Queries

```typescript
const connectionsTable = dbConfig.getTableName("exchange_connections")

// PostgreSQL
const { rows } = await pool.query(`
  SELECT * FROM ${connectionsTable}
  WHERE enabled = true
`)

// SQLite
const rows = db.prepare(`
  SELECT * FROM ${connectionsTable}
  WHERE enabled = 1
`).all()
```

### In Migrations

Migrations automatically have prefixes applied by the runner. Write migrations with base table names:

```sql
-- migrations/001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
```

The migration runner will transform this to:

```sql
CREATE TABLE IF NOT EXISTS cts_v3_1_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX cts_v3_1_idx_users_username ON cts_v3_1_users(username);
```

## Multi-Instance Setup

### Same Server, Different Prefixes

```bash
# Instance 1: Production
cd /opt/cts-production
export PROJECT_NAME="CTS Production"
npm run db:setup:full

# Instance 2: Staging
cd /opt/cts-staging
export PROJECT_NAME="CTS Staging"
npm run db:setup:full

# Instance 3: Development
cd /opt/cts-dev
export PROJECT_NAME="CTS Development"
npm run db:setup:full
```

**Result**:
- Production: `cts_production_*` tables/databases
- Staging: `cts_staging_*` tables/databases
- Development: `cts_development_*` tables/databases

### Different Servers

No prefix conflicts, but prefixes still recommended for clarity:

```bash
# Server 1: Primary
DATABASE_URL=postgresql://user:pass@server1/postgres
PROJECT_NAME="CTS Primary"

# Server 2: Backup
DATABASE_URL=postgresql://user:pass@server2/postgres
PROJECT_NAME="CTS Backup"
```

## Migration System

### Tracking Table

Each prefix has its own migration tracking:

```sql
CREATE TABLE {prefix}_schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(255) DEFAULT CURRENT_USER,
  prefix VARCHAR(255)
);
```

### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:status

# Reset database (caution!)
npm run db:reset
```

### Creating New Migrations

1. Create SQL file in `scripts/` directory
2. Name format: `###_description.sql` (e.g., `058_add_user_preferences.sql`)
3. Write with base table names (no prefix)
4. Run: `npm run db:migrate`

Example:

```sql
-- scripts/058_add_user_preferences.sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

## Environment Variables

```bash
# Project Configuration
PROJECT_NAME="CTS v3.1"          # Human-readable project name
DB_PREFIX="cts_v3_1"              # Override auto-generated prefix (optional)

# Database Connection
DATABASE_URL="postgresql://user:pass@host:5432/postgres"
REMOTE_POSTGRES_URL="postgresql://user:pass@host:5432/postgres"

# Database Users (auto-generated if not provided)
DB_ADMIN_USER="cts_v3_1_admin"
DB_ADMIN_PASSWORD="secure_password"
DB_APP_USER="cts_v3_1_app"
DB_APP_PASSWORD="secure_password"
```

## Troubleshooting

### Prefix Mismatch

**Symptom**: Tables not found errors

**Solution**:
```bash
# Check current configuration
cat data/db-config.json

# Verify environment variables
echo $PROJECT_NAME
echo $DB_PREFIX

# Regenerate configuration
rm data/db-config.json
npm run db:setup:prefix
```

### Migration Failures

**Symptom**: Migrations fail with "already exists" errors

**Solution**:
```bash
# Check what's been applied
npm run db:status

# Manual prefix verification
psql $DATABASE_URL -c "SELECT * FROM cts_v3_1_schema_migrations;"

# Reset and reapply (caution: data loss)
npm run db:reset
npm run db:migrate
```

### Multiple Prefixes in Same Database

**Symptom**: Mixed prefixed and non-prefixed tables

**Solution**:
```bash
# List all tables
psql $DATABASE_URL -c "\dt"

# Identify orphaned tables
# Drop old tables manually or migrate data

# Clean start
npm run db:reset
npm run db:setup:full
```

## Best Practices

1. **Always use setup wizard** - Ensures correct configuration
2. **Consistent naming** - Use descriptive, environment-specific project names
3. **Document prefixes** - Keep a record of all instances and their prefixes
4. **Test migrations** - Always test on staging before production
5. **Backup before changes** - Use `npm run db:backup` before migrations
6. **Monitor migrations** - Check logs for any transformation errors
7. **Use environment variables** - Don't hardcode prefixes in application code

## Performance Considerations

- Prefix length minimal impact on query performance
- Indexes automatically include prefix (handled by migration runner)
- Connection pooling unaffected by prefix system
- Separate databases for indication/strategy types provide parallel access

## Security

- Admin user for migrations only (elevated privileges)
- App user for runtime operations (restricted to necessary tables)
- Prefix doesn't provide security (use separate databases for true isolation)
- Environment-specific credentials recommended

## API Reference

### DatabaseConfigManager

```typescript
// Get singleton instance
const dbConfig = DatabaseConfigManager.getInstance()

// Get configuration
const config = dbConfig.getConfig()

// Get table name with prefix
const tableName = dbConfig.getTableName("users")

// Get database names
const mainDb = dbConfig.getMainDatabase()
const indicationDb = dbConfig.getIndicationDatabase("active")
const strategyDb = dbConfig.getStrategyDatabase("advanced")

// Get user names
const adminUser = dbConfig.getAdminUser()
const appUser = dbConfig.getAppUser()

// Update project name (regenerates prefix)
dbConfig.updateProjectName("New Project Name")

// Get prefix string
const prefix = dbConfig.getPrefix()
```

### DatabasePrefixManager

```typescript
import { dbPrefixManager } from "@/lib/database-prefix-manager"

// Initialize with project name
await dbPrefixManager.initialize("My Project")

// Load existing configuration
await dbPrefixManager.load()

// Get prefix
const prefix = await dbPrefixManager.getPrefix()

// Get table name
const tableName = await dbPrefixManager.getTableName("users")

// Update project name
await dbPrefixManager.updateProjectName("New Name")

// Get configuration info
const config = dbPrefixManager.getConfig()
```

## Migration to Prefix System

### From Non-Prefixed Installation

```bash
# 1. Backup existing database
npm run db:backup

# 2. Export data
pg_dump $DATABASE_URL > backup.sql

# 3. Setup new prefixed system
npm run db:setup:full

# 4. Migrate data (custom script required)
node scripts/migrate-to-prefixed.js

# 5. Verify and switch
```

### From Different Prefix

```bash
# 1. Backup
npm run db:backup

# 2. Update configuration
export PROJECT_NAME="New Name"
npm run db:setup:prefix

# 3. Rename tables (PostgreSQL)
psql $DATABASE_URL << EOF
ALTER TABLE old_prefix_users RENAME TO new_prefix_users;
ALTER TABLE old_prefix_positions RENAME TO new_prefix_positions;
-- ... repeat for all tables
EOF

# 4. Update migration tracking
UPDATE new_prefix_schema_migrations SET prefix = 'new_prefix';
```

## Support

For issues or questions:
1. Check configuration: `cat data/db-config.json`
2. Verify environment: `npm run system:check`
3. Review logs: Check console output during setup
4. Reset if needed: `npm run db:reset && npm run db:setup:full`
