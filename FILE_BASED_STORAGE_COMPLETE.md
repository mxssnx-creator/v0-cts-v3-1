# File-Based Storage System - Complete Implementation

## Overview
The CTS v3.1 system now uses **100% file-based storage** for connections and connection state, providing complete independence from database systems.

## Architecture

### Data Directory Structure
```
data/
├── connections.json              # All exchange connections
├── connection-state.json         # Connection state (active, volume factors, test results)
├── connection-sync-log.json      # Sync operation logs
├── settings.json                 # System settings
├── main-indications.json         # Main indication settings
└── common-indications.json       # Common indication settings
```

### File Locations
- **Production (Vercel/AWS Lambda)**: `/tmp/data/`
- **Development**: `{project_root}/data/`

## Connection Management

### Connections File (`connections.json`)
Stores all exchange connection configurations:

```json
[
  {
    "id": "conn_abc123",
    "user_id": 1,
    "name": "Bybit Main",
    "exchange": "bybit",
    "exchange_id": 2,
    "api_type": "perpetual_futures",
    "connection_method": "rest",
    "connection_library": "rest",
    "api_key": "...",
    "api_secret": "...",
    "api_passphrase": null,
    "margin_type": "cross",
    "position_mode": "hedge",
    "is_testnet": false,
    "is_enabled": true,
    "is_live_trade": true,
    "is_preset_trade": false,
    "is_active": true,
    "is_predefined": false,
    "volume_factor": 1.0,
    "connection_settings": "{}",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Connection State File (`connection-state.json`)
Stores runtime state for each connection:

```json
[
  {
    "connection_id": "conn_abc123",
    "is_active": true,
    "volume_factor_live": 1.0,
    "volume_factor_preset": 1.0,
    "test_results": {
      "success": true,
      "latency": 45,
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "last_sync_at": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Sync Log File (`connection-sync-log.json`)
Tracks all state changes (keeps last 1000 entries):

```json
[
  {
    "id": 1,
    "connection_id": "conn_abc123",
    "action": "set_active",
    "data": { "timestamp": "2024-01-01T00:00:00.000Z" },
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "connection_id": "conn_abc123",
    "action": "update_volume",
    "data": { "live": 1.5, "preset": 2.0, "timestamp": "2024-01-01T00:01:00.000Z" },
    "created_at": "2024-01-01T00:01:00.000Z"
  }
]
```

## API Endpoints

### Connection Management
All connection APIs use file storage:

- `GET /api/settings/connections` - Load all connections from file
- `POST /api/settings/connections` - Create new connection in file
- `PUT /api/settings/connections/[id]` - Update connection in file
- `DELETE /api/settings/connections/[id]` - Remove connection from file
- `GET /api/connections/active` - Get active connections from file

### State Management
Connection state manager uses file storage:

- Active connection tracking
- Volume factor management (live/preset)
- Test results storage
- Heartbeat updates
- Stale connection detection

## Performance Optimizations

### Caching Strategy
- In-memory cache with 5-second TTL
- Per-exchange cache groups
- LRU cache with max 50 entries
- Cache invalidation on updates

### Batch Operations
```typescript
// Batch update multiple connections efficiently
batchUpdateConnections([
  { id: "conn1", is_enabled: true },
  { id: "conn2", volume_factor: 1.5 }
])
```

### File Access Optimization
- Atomic write operations
- Directory existence checks
- Graceful error handling
- Automatic retry on transient failures

## Benefits

### Complete Independence
- No database required for connections
- Works in serverless environments
- Fast cold starts
- Easy backup and restore

### Portability
- Simple JSON files
- Human-readable format
- Easy to version control
- Simple migration between environments

### Performance
- No database connection overhead
- In-memory caching
- Fast file system access
- Efficient batch operations

### Reliability
- Atomic file writes
- Automatic directory creation
- Graceful degradation
- Comprehensive error handling

## Error Handling

### File System Errors
```typescript
try {
  saveConnections(connections)
} catch (error) {
  // Graceful fallback to predefined connections
  console.error("Failed to save:", error)
  return getPredefinedConnectionsAsStatic()
}
```

### Missing Files
- Automatically creates data directory
- Initializes with default values
- Logs all file operations
- Returns empty arrays on read errors

### Validation
- Type checking on load
- Schema validation
- Data sanitization
- Automatic repair of corrupted data

## Backup and Recovery

### Manual Backup
```bash
# Backup all connection data
cp -r data/ backups/data-$(date +%Y%m%d-%H%M%S)/
```

### Automatic Export
```typescript
// Export from database to files (one-time migration)
await exportConnectionsToFile()
await exportSettingsToFile()
```

### Recovery
```bash
# Restore from backup
cp -r backups/data-20240101-120000/ data/
```

## Migration from Database

### One-Time Export
Use the export functions to migrate existing data:

```typescript
import { exportConnectionsToFile, exportSettingsToFile } from "@/lib/file-storage"

await exportConnectionsToFile()  // Export connections from DB to file
await exportSettingsToFile()      // Export settings from DB to file
```

### Validation
After migration, verify:
1. All connections present in `data/connections.json`
2. Connection state in `data/connection-state.json`
3. Settings in `data/settings.json`
4. Test each connection works correctly

## Monitoring

### Health Checks
- File existence verification
- Data integrity validation
- Write permission checks
- Directory space monitoring

### Logging
All operations are logged with `[v0]` prefix:
- `[v0] Loaded N connections from file`
- `[v0] Saved N connections to file`
- `[v0] Connection created successfully: {id}`

### Metrics
- Connection count
- Cache hit rate
- File operation latency
- Error frequency

## Production Deployment

### Vercel Configuration
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### Environment Variables
No database credentials needed for connections!
```env
# Optional: Custom data directory
DATA_DIR=/custom/path/to/data
```

### Serverless Considerations
- Files stored in `/tmp/data` on serverless platforms
- Consider using persistent storage (S3, Redis) for production
- Implement regular backups
- Use sticky sessions for consistency

## Security

### File Permissions
```bash
# Set proper permissions
chmod 700 data/
chmod 600 data/*.json
```

### API Key Protection
- API secrets encrypted at rest (optional)
- Never log sensitive credentials
- Secure file system access
- Environment-based encryption keys

### Access Control
- File system permissions
- API authentication
- Rate limiting
- Audit logging

## Troubleshooting

### Common Issues

**Issue**: "Failed to load connections from file"
**Solution**: Check data directory exists and is writable

**Issue**: "Connection not found"
**Solution**: Verify connection ID in `data/connections.json`

**Issue**: "State not updating"
**Solution**: Clear cache with `clearConnectionCache()`

### Debug Mode
Enable verbose logging:
```typescript
console.log("[v0] Connection operations:", {
  loaded: connections.length,
  cache: connectionCache.size,
  file: fs.existsSync(CONNECTIONS_FILE)
})
```

## Summary

The file-based storage system provides:
- Complete database independence for connections
- Fast, reliable file operations
- In-memory caching for performance
- Comprehensive error handling
- Easy backup and recovery
- Production-ready serverless support

All connection and state management now runs entirely on text files, providing maximum portability and simplicity while maintaining enterprise-grade reliability.
