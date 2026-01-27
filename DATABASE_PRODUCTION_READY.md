# CTS v3.1 - Production-Ready Database System

## Overview

The CTS v3.1 database system is now production-ready with comprehensive migration management, automatic initialization, and health monitoring.

## Key Features

### 1. **Automatic Initialization**
- Database migrations run automatically on application startup
- No manual intervention required
- Idempotent migrations (safe to run multiple times)
- Automatic rollback and error handling

### 2. **Dual Database Support**
- **SQLite** (Default): Zero-configuration, file-based database
- **PostgreSQL**: Enterprise-grade relational database

### 3. **Production Migration System**
- Consolidated migration scripts
- Checksum-based tracking
- Execution time monitoring
- Comprehensive logging
- Automatic recovery

## Database Configuration

### SQLite (Default)

No configuration needed! The database is automatically created at:
\`\`\`
/data/cts.db
\`\`\`

### PostgreSQL

Set the `DATABASE_URL` environment variable:

\`\`\`bash
DATABASE_URL=postgresql://username:password@host:port/database
\`\`\`

Example:
\`\`\`bash
DATABASE_URL=postgresql://Project-Name:00998877@localhost:5432/Project-Name
\`\`\`

## Database Structure

### Core Tables (22 Total)

#### System Tables
- `users` - User accounts and authentication
- `system_settings` - Application configuration
- `site_logs` - Application logging
- `migrations` - Migration tracking

#### Connection Tables
- `exchange_connections` - Exchange API connections
- `connection_coordination` - Connection state management

#### Indication Tables (Separate by Type)
- `indications_direction` - Direction-based indicators
- `indications_move` - Movement indicators
- `indications_active` - Activity indicators
- `indications_optimal` - Optimal entry/exit points
- `indications_auto` - Automated indicators
- `indication_states` - State tracking

#### Strategy Tables (Separate by Type)
- `strategies_base` - Base strategy configurations
- `strategies_main` - Main trading strategies
- `strategies_real` - Real trading strategies
- `strategies_block` - Block trading strategies
- `strategies_dca` - Dollar-cost averaging strategies
- `strategies_trailing` - Trailing stop strategies

#### Position Tables
- `pseudo_positions` - Simulated positions
- `real_pseudo_positions` - Real-time tracked positions
- `exchange_positions` - Actual exchange positions

#### Statistics Tables
- `statistics_indication` - Indication performance stats
- `statistics_strategy` - Strategy performance stats
- `statistics_daily` - Daily aggregated statistics

### High-Performance Indexes

All tables include optimized indexes for:
- **High-frequency queries** (composite indexes on connection_id + symbol + timestamp)
- **Status filtering** (partial indexes on active records)
- **Time-series data** (DESC indexes for latest-first queries)
- **Join operations** (foreign key indexes)

## Migration System

### How It Works

1. **On Startup**: Application automatically runs migrations
2. **Unified Setup**: Complete database schema created
3. **Incremental Updates**: Additional migrations applied if needed
4. **Verification**: Critical tables verified
5. **Health Check**: Database connectivity confirmed

### Migration Files

- `unified_complete_setup.sql` - Complete database schema (primary)
- `000_master_initialization.sql` - Alternative initialization (fallback)
- `051_add_performance_indexes.sql` - Performance optimization
- `070_high_frequency_performance_indexes.sql` - Trading-specific indexes
- `071_add_coordination_tables.sql` - Connection coordination

### Migration Tracking

All migrations are tracked in the `migrations` table:

\`\`\`sql
SELECT * FROM migrations ORDER BY id;
\`\`\`

## Health Monitoring

### Database Health Check

\`\`\`bash
curl http://localhost:3000/api/health/database
\`\`\`

Response:
\`\`\`json
{
  "status": "healthy",
  "database": {
    "type": "sqlite",
    "connected": true,
    "responseTime": "5ms",
    "tableCount": 22,
    "criticalTables": {
      "total": 5,
      "existing": 5,
      "missing": []
    }
  }
}
\`\`\`

### Migration Status

\`\`\`bash
curl http://localhost:3000/api/admin/migrations/status
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "database": {
    "type": "sqlite",
    "connected": true
  },
  "migrations": {
    "total": 4,
    "applied": [...]
  },
  "tables": {
    "total": 22,
    "expected": 22,
    "existing": 22,
    "categories": {...}
  },
  "status": "complete"
}
\`\`\`

## Production Deployment

### Pre-Deployment Checklist

- [ ] Database credentials configured (if using PostgreSQL)
- [ ] Environment variables set
- [ ] Data directory permissions verified
- [ ] Backup strategy implemented
- [ ] Health check endpoints tested

### Deployment Steps

1. **Deploy Application**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

2. **Automatic Migration**
   - Migrations run on first request
   - Progress logged to console
   - Application becomes available after completion

3. **Verify Installation**
   \`\`\`bash
   curl http://localhost:3000/api/health/database
   curl http://localhost:3000/api/admin/migrations/status
   \`\`\`

### Environment Variables

\`\`\`bash
# Optional: Specify database type
DATABASE_TYPE=sqlite  # or "postgresql"

# PostgreSQL Configuration (if used)
DATABASE_URL=postgresql://user:pass@host:port/db

# SQLite Configuration (optional)
SQLITE_DB_PATH=/custom/path/to/cts.db

# Application
NODE_ENV=production
\`\`\`

## Backup and Recovery

### SQLite Backup

\`\`\`bash
# Simple file copy (when application is stopped)
cp data/cts.db data/cts.db.backup

# Online backup (while running)
sqlite3 data/cts.db ".backup 'data/cts.db.backup'"
\`\`\`

### PostgreSQL Backup

\`\`\`bash
# Full database backup
pg_dump -U Project-Name -h localhost Project-Name > backup.sql

# Restore
psql -U Project-Name -h localhost Project-Name < backup.sql
\`\`\`

### Restore After Failure

1. Stop application
2. Restore database file/data
3. Start application
4. Migrations will verify and fix schema if needed

## Performance Optimization

### Index Usage

All high-frequency queries use optimized indexes:

\`\`\`sql
-- Connection + Symbol + Time (most common query pattern)
CREATE INDEX idx_indications_direction_conn_symbol 
  ON indications_direction(connection_id, symbol, calculated_at DESC);

-- Status filtering
CREATE INDEX idx_indications_direction_status 
  ON indications_direction(connection_id, status, calculated_at DESC);
\`\`\`

### Query Optimization

- Use parameterized queries (prevents SQL injection + improves performance)
- Limit result sets with appropriate WHERE clauses
- Use composite indexes for multi-column filters
- Avoid SELECT * - specify needed columns

### Connection Pooling

PostgreSQL uses connection pooling:
\`\`\`javascript
max: 20,  // Maximum connections
idleTimeoutMillis: 30000,  // Close idle connections
connectionTimeoutMillis: 10000  // Connection timeout
\`\`\`

## Troubleshooting

### Issue: Migrations Fail

**Solution:**
1. Check logs in console
2. Verify database connectivity
3. Check disk space (SQLite)
4. Verify credentials (PostgreSQL)
5. Review migration status API

### Issue: Missing Tables

**Solution:**
\`\`\`bash
# Check which tables are missing
curl http://localhost:3000/api/admin/migrations/status

# The system will automatically create them on next restart
\`\`\`

### Issue: Performance Degradation

**Solution:**
1. Check index usage
2. Review slow query logs
3. Optimize database queries
4. Consider connection pool tuning

### Issue: Database Locked (SQLite)

**Solution:**
- SQLite uses file locking
- Ensure only one process writes at a time
- Consider PostgreSQL for high-concurrency scenarios

## Security

### Best Practices

1. **Never commit database files** - `.gitignore` includes `data/`
2. **Secure credentials** - Use environment variables
3. **Use parameterized queries** - Prevents SQL injection
4. **Regular backups** - Automated backup strategy
5. **Access control** - Restrict database file permissions

### File Permissions (SQLite)

\`\`\`bash
chmod 600 data/cts.db  # Owner read/write only
\`\`\`

### Network Security (PostgreSQL)

- Use SSL/TLS for remote connections
- Restrict IP access with firewall rules
- Use strong passwords
- Rotate credentials regularly

## Monitoring

### Application Logs

All database operations are logged:
\`\`\`
[v0] Database Type: SQLITE
[v0] ✓ Unified setup complete: 150 applied, 12 skipped
[v0] ✓ All 22 critical tables verified
[v0] ✓ Application Ready for Production
\`\`\`

### Health Check Integration

Integrate health checks with monitoring tools:
\`\`\`yaml
# Example: Docker Compose health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/database"]
  interval: 30s
  timeout: 10s
  retries: 3
\`\`\`

## Support

For database-related issues:

1. Check `/api/health/database` endpoint
2. Review `/api/admin/migrations/status` 
3. Examine application logs
4. Verify environment configuration
5. Test database connectivity independently

## Summary

The CTS v3.1 database system is now fully production-ready with:

✓ Automatic initialization on startup
✓ Comprehensive migration system
✓ Health monitoring endpoints  
✓ High-performance indexes for trading
✓ Separate tables for each indication/strategy type
✓ Production-grade error handling
✓ Complete logging and tracking
✓ Dual database support (SQLite/PostgreSQL)

**No manual setup required - just start the application and it's ready to go!**
