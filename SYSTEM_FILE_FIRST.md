# System Architecture: File-First Design

## Core Principle
The Automated Trading System is designed to operate optimally with **file-based storage as the primary data layer**. Database support is optional and acts as an enhancement, not a requirement.

## Storage Hierarchy

### 1. Primary: File-Based Storage (Always Available)
- **Location**: `/data` directory (or `/tmp/data` on serverless platforms)
- **Format**: JSON files for persistence
- **Files**:
  - `connections.json` - Exchange connections and API credentials
  - `settings.json` - System and user settings
  - `main-indications.json` - Trading indicators configuration
  - `common-indications.json` - Shared indicator settings

### 2. Secondary: Database (Optional)
- Supported types: SQLite, PostgreSQL, Neon
- Used for: Advanced analytics, historical data, complex queries
- Fallback: If unavailable, system continues with file storage

## Startup Flow

### Phase 1: File Storage Load (CRITICAL)
1. Load connections from `connections.json`
2. Load settings from `settings.json`
3. Load predefined connections if files are missing
4. System is **ready to trade** after this phase

### Phase 2: Database Check (OPTIONAL)
1. Test database connectivity (2s timeout)
2. Skip if unavailable
3. Log status but don't block startup

### Phase 3: System Health (OPTIONAL)
1. Compute health metrics
2. Report file storage status (primary)
3. Report database status (secondary)
4. Mark system as operational if file storage is available

## API Endpoints - File-First Priority

### GET /api/settings/connections
- Primary: Load from file storage
- Fallback: Return predefined connections
- Database: Never required

### POST /api/system/health
- Primary: Check file storage availability
- Secondary: Check database connectivity (2s timeout, non-blocking)
- Status Determination:
  - **Healthy**: File storage OK, database OK
  - **Degraded**: File storage OK, database unavailable
  - **Unhealthy**: File storage unavailable (system cannot function)

### POST /api/db/init
- Primary: Load connections from file storage
- Secondary: Verify database (if available)
- Response: Always successful - file storage is sufficient

## Recovery Mechanisms

### If Database Unavailable
1. System continues normally with file storage
2. All trading functions remain operational
3. Data persisted to JSON files
4. Next database connection attempt on health check

### If File Storage Unavailable
1. System cannot operate (no way to load connections)
2. Status: Unhealthy
3. User must restore file storage

### If Both Unavailable
1. System loads predefined connections only
2. Limited to demo mode
3. No custom trading configurations

## Development Notes

### Testing Without Database
```bash
# Start the system without any database
# File storage will handle everything
npm run dev
```

### Verifying File-First Operation
1. Check health endpoint: `GET /api/system/health`
2. Verify `storage.file_based: true` in response
3. `database.optional: true` confirms DB is not required
4. Load connections: `GET /api/settings/connections`
5. Connections load from file, not database

### Adding Database Later
1. Set `DATABASE_URL` environment variable
2. Database checks automatically activate
3. File storage remains as primary
4. Zero code changes required

## Performance Characteristics

### File Storage
- **Speed**: Instant (~1-5ms)
- **Concurrency**: Best-effort caching with 5s TTL
- **Reliability**: High (local filesystem)
- **Scalability**: Adequate for 50-100 connections

### Database (Optional)
- **Speed**: Depends on database (10-50ms)
- **Concurrency**: Native database support
- **Reliability**: Depends on database
- **Scalability**: Excellent for large datasets

## Migration Path

1. **Phase 1 (Current)**: File-based only
   - All data in JSON files
   - System fully functional
   - Zero database dependency

2. **Phase 2 (Future)**: File + Database
   - Enable DATABASE_URL
   - Database syncs with file storage
   - Historical data stored in database
   - Real-time data in file storage

3. **Phase 3 (Optional)**: Database-first
   - Database becomes primary (if desired)
   - File storage as cache
   - Requires explicit configuration

## Summary

The system is **production-ready with file-based storage alone**. Database is optional. The startup process is resilient, non-blocking, and guarantees the system operates either with full functionality (file storage) or with limited functionality (if file storage fails). No database configuration is required to get started.
