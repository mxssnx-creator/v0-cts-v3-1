# Automatic Recovery System Documentation

## Overview

The CTS v3.1 Trading System includes a comprehensive automatic recovery and restart system that monitors all critical services and automatically recovers from failures without manual intervention.

## Features

### 1. Automatic Health Monitoring

- **Real-time Health Checks**: Every 30 seconds, all critical services are checked
- **Error Detection**: Automatic detection of connection failures, service crashes, and performance degradation
- **Threshold-based Recovery**: Recovery triggered when error count exceeds 10 consecutive failures

### 2. Monitored Services

#### Database Connection
- Monitors database connectivity
- Auto-reconnects on connection loss
- Reinitializes tables if needed
- Logs all recovery attempts

#### Position Threshold Manager
- Monitors position cleanup service
- Restarts monitoring on failure
- Maintains position threshold enforcement

#### Trade Engine Coordinator
- Monitors trade engine health
- Clears error states automatically
- Resets configuration when needed

### 3. Recovery Mechanisms

#### Automatic Restart
- Maximum 3 restart attempts per service
- 1-minute cooldown between restarts
- Exponential backoff on failures
- Automatic reset after successful recovery

#### Smart Recovery
- Database: Full reconnection and reinitialization
- Services: Stop, clear state, and restart
- Connections: Test and re-establish
- Caching: Clear and rebuild

### 4. Recovery Logging

All recovery actions are logged to:
```
logs/recovery/recovery-YYYY-MM-DD.log
```

Log format:
```
TIMESTAMP | ACTION_TYPE | STATUS | ERROR | RETRY_COUNT
```

## API Endpoints

### Check Recovery Status
```
GET /api/recovery/status
```

Returns:
- Current status of all monitored services
- Recent recovery history
- Error counts and restart counts

### Manual Service Restart
```
POST /api/recovery/restart
Body: { "service": "database" | "position-threshold" | "trade-engine" }
```

Triggers manual restart of specified service.

### Get Recovery Logs
```
GET /api/recovery/logs?days=7
```

Returns recovery logs for the specified number of days.

## Configuration

### Environment Variables

```bash
# Auto-recovery settings
AUTO_RECOVERY_ENABLED=true
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=60000       # 1 minute
MAX_ERROR_THRESHOLD=10
```

### Settings File (data/settings.json)

```json
{
  "trade_engine_auto_restart": true,
  "database_auto_reconnect": true,
  "auto_recovery_enabled": true
}
```

## How It Works

### 1. Initialization

On system startup:
1. Auto-recovery manager initializes
2. All services registered for monitoring
3. Health check timer starts
4. Initial health check performed

### 2. Health Monitoring

Every 30 seconds:
1. Each service is checked for responsiveness
2. Error counters incremented on failure
3. Success resets error counter
4. Recovery triggered if threshold exceeded

### 3. Recovery Process

When recovery is triggered:
1. Check restart attempt count
2. Set service to "recovering" status
3. Execute service-specific recovery
4. Log recovery attempt
5. Reset counters on success
6. Set cooldown period

### 4. Failure Handling

If recovery fails:
1. Increment retry count
2. Log failure details
3. Wait for cooldown period
4. Attempt again (max 3 times)
5. Mark as "error" if all attempts fail

## Monitoring

### Dashboard Integration

The auto-recovery system integrates with the system health panel:
- Real-time service status
- Recovery action history
- Manual restart buttons
- Detailed error logs

### Log Files

Check recovery logs:
```bash
tail -f logs/recovery/recovery-$(date +%Y-%m-%d).log
```

### System Notifications

Critical failures are logged to:
- System logs (logs/system/)
- Recovery logs (logs/recovery/)
- Error tracking (logs/errors/)

## Best Practices

### 1. Monitor Recovery Logs

Regularly check recovery logs to identify patterns:
```bash
grep "failed" logs/recovery/*.log
```

### 2. Alert on Multiple Failures

Set up alerts if a service fails more than 3 times:
```bash
grep "Maximum restart attempts" logs/recovery/*.log
```

### 3. Review Service Health

Check service status regularly:
```bash
curl http://localhost:3000/api/recovery/status
```

### 4. Manual Intervention

If auto-recovery fails repeatedly:
1. Check underlying infrastructure
2. Review error logs
3. Verify database connectivity
4. Check resource availability

## Troubleshooting

### Service Stuck in "Recovering"

If a service shows "recovering" status for >5 minutes:
1. Check system resources (CPU, memory)
2. Verify database connectivity
3. Review recovery logs
4. Consider manual restart

### Repeated Restart Failures

If auto-recovery fails repeatedly:
1. Check database connection string
2. Verify file permissions (logs/, data/)
3. Ensure sufficient disk space
4. Review system logs for underlying errors

### Manual Recovery

To manually trigger recovery:
```bash
curl -X POST http://localhost:3000/api/recovery/restart \
  -H "Content-Type: application/json" \
  -d '{"service": "database"}'
```

## Production Deployment

### 1. Enable Auto-Recovery

```bash
export AUTO_RECOVERY_ENABLED=true
```

### 2. Configure Health Checks

Adjust intervals based on your needs:
```bash
export HEALTH_CHECK_INTERVAL=30000  # Check every 30s
export MAX_ERROR_THRESHOLD=10       # Trigger after 10 errors
```

### 3. Set Up Monitoring

Monitor recovery logs in your observability platform:
- Datadog
- New Relic
- CloudWatch
- Custom monitoring

### 4. Configure Alerts

Set up alerts for:
- Service status changes
- Multiple recovery attempts
- Failed recoveries
- High error rates

## Summary

The automatic recovery system provides:
- ✅ Self-healing infrastructure
- ✅ Zero-downtime recovery
- ✅ Comprehensive logging
- ✅ Manual override capabilities
- ✅ Production-ready resilience

The system automatically handles most common failure scenarios, reducing operational overhead and improving system reliability.
