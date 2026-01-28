# API Endpoints Reference - CTS v3.1

Complete API documentation for all endpoints.

## Connection Management

### GET /api/settings/connections
Fetch all exchange connections.

**Response:**
```json
{
  "success": true,
  "connections": [
    {
      "id": "bybit_main_123",
      "name": "Bybit Main Account",
      "exchange": "bybit",
      "api_type": "REST",
      "connection_method": "API",
      "authentication_type": "HMAC-SHA256",
      "api_key": "***",
      "api_secret": "***",
      "margin_type": "LINEAR",
      "position_mode": "ONE_WAY",
      "is_testnet": false,
      "is_enabled": true,
      "is_active": true,
      "is_predefined": false,
      "last_test_status": "success",
      "last_test_balance": 10000.50,
      "last_test_at": "2026-01-27T12:00:00Z"
    }
  ]
}
```

### POST /api/settings/connections
Create a new connection.

**Body:**
```json
{
  "name": "My New Connection",
  "exchange": "bybit",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "api_passphrase": "",
  "is_testnet": false,
  "margin_type": "LINEAR",
  "position_mode": "ONE_WAY"
}
```

**Response:**
```json
{
  "success": true,
  "connection": { /* connection object */ }
}
```

### GET /api/settings/connections/active
Get only active enabled connections.

**Response:**
```json
{
  "success": true,
  "connections": [ /* array */ ],
  "total": 5,
  "active": 3
}
```

### GET /api/settings/connections/[id]
Get a specific connection.

**Response:**
```json
{
  "id": "bybit_123",
  "name": "Bybit Main",
  /* connection object */
}
```

### PATCH /api/settings/connections/[id]
Update connection settings.

**Body:**
```json
{
  "name": "Updated Name",
  "api_key": "new_key",
  "api_secret": "new_secret"
}
```

**Response:**
```json
{
  "success": true,
  "connection": { /* updated connection */ }
}
```

### DELETE /api/settings/connections/[id]
Delete a connection.

**Response:**
```json
{
  "success": true
}
```

### POST /api/settings/connections/[id]/test
Test a connection.

**Response:**
```json
{
  "success": true,
  "balance": 10000.50,
  "balances": { /* balance breakdown */ },
  "capabilities": ["spot", "futures"],
  "log": [ /* test log entries */ ],
  "duration": 1234
}
```

### POST /api/settings/connections/[id]/toggle
Enable/disable a connection.

**Response:**
```json
{
  "success": true,
  "connection": { /* updated connection */ }
}
```

### POST /api/settings/connections/[id]/active
Activate a connection.

**Response:**
```json
{
  "success": true,
  "connection": { /* updated connection */ }
}
```

### DELETE /api/settings/connections/[id]/active
Deactivate a connection.

**Response:**
```json
{
  "success": true,
  "connection": { /* updated connection */ }
}
```

## Trade Engine Management

### POST /api/trade-engine/start
Start a trade engine.

**Body:**
```json
{
  "connectionId": "bybit_123",
  "indicationInterval": 5,
  "strategyInterval": 10,
  "realtimeInterval": 3
}
```

**Response:**
```json
{
  "success": true,
  "connectionId": "bybit_123",
  "message": "Engine started"
}
```

### GET /api/trade-engine/start-all
Start all enabled connections.

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "connectionId": "bybit_123",
      "connectionName": "Bybit Main",
      "success": true,
      "message": "Engine started successfully"
    }
  ]
}
```

### POST /api/trade-engine/stop
Stop a trade engine.

**Body:**
```json
{
  "connectionId": "bybit_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trade engine stop signal sent"
}
```

### GET /api/trade-engine/status-all
Get status of all engines.

**Response:**
```json
{
  "success": true,
  "engines": [
    {
      "connectionId": "bybit_123",
      "connectionName": "Bybit Main",
      "isEngineRunning": true,
      "engineStatus": { /* detailed status */ }
    }
  ],
  "summary": {
    "total": 3,
    "running": 2,
    "stopped": 1
  }
}
```

### GET /api/trade-engine/health
Get health status of trade engines.

**Response:**
```json
{
  "success": true,
  "overall": "healthy",
  "runningEngines": 2,
  "totalEngines": 3,
  "engines": [
    {
      "connectionId": "bybit_123",
      "status": "running",
      "isRunning": true,
      "lastUpdate": "2026-01-27T12:00:00Z"
    }
  ]
}
```

### GET /api/trade-engine/startup-debug
Manual startup debug endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Manual trade engine startup completed",
  "results": [ /* startup results */ ]
}
```

## System Status

### GET /api/system/verify-startup
Verify system startup.

**Response:**
```json
{
  "success": true,
  "status": "pass",
  "checks": [
    {
      "name": "Check Name",
      "status": "pass",
      "details": {}
    }
  ]
}
```

### GET /api/system/verify-apis
Verify all APIs are working.

**Response:**
```json
{
  "success": true,
  "apis": [
    {
      "name": "GET /api/settings/connections",
      "status": "pass",
      "responseTime": 45
    }
  ],
  "allPassing": true
}
```

### GET /api/monitoring/comprehensive
Get comprehensive system monitoring data.

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-27T12:00:00Z",
  "connections": {
    "total": 5,
    "enabled": 4,
    "active": 3,
    "liveTrading": 2
  },
  "engines": {
    "running": 2,
    "stopped": 2,
    "failed": 1
  },
  "health": "good"
}
```

### GET /api/connections/status
Get real-time status for all connections.

**Response:**
```json
[
  {
    "id": "bybit_123",
    "name": "Bybit Main",
    "status": "connected",
    "progress": 100,
    "balance": 10000.50,
    "activePositions": 5,
    "lastUpdate": "2026-01-27T12:00:00Z"
  }
]
```

## Error Responses

All endpoints follow consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": "API key is required"
}
```

### 404 Not Found
```json
{
  "error": "Connection not found",
  "details": "ID: bybit_invalid"
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "details": "Failed to connect to exchange",
  "log": [ /* error logs */ ]
}
```

### 503 Service Unavailable
```json
{
  "error": "Trade engine coordinator not initialized",
  "details": "System still initializing"
}
```

## Status Values

### Connection Status
- `"success"` - Connected and verified
- `"failed"` - Connection failed
- `"warning"` - Credentials not configured
- `"pending"` - Never tested

### Engine Status
- `"running"` - Engine actively trading
- `"stopped"` - Engine stopped
- `"error"` - Engine encountered error
- `"initializing"` - Engine starting up

## Rate Limiting

- Default: 100 requests per minute per IP
- Connection test: 1 per 30 seconds per connection
- Status checks: Unlimited

## Authentication

All endpoints are unauthenticated in development. In production, implement:
- JWT tokens for API access
- API keys for programmatic access
- Session cookies for web UI

## Webhook Events

Future implementation will support webhooks for:
- Trade engine start/stop
- Connection status changes
- Position opens/closes
- Error alerts
