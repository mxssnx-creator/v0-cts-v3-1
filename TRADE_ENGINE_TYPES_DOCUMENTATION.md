# Trade Engine Types Documentation

## Overview

The CTS v3.1 system supports two distinct trade engine types that can be independently enabled or disabled:

1. **Main Trade Engine** - Primary trading operations
2. **Preset Trade Engine** - Preset-based trading coordination

## Configuration

### Location
Settings > System > Trade Engine Types (Top section)

### Controls
- **Main Trade Engine**: Toggle to enable/disable main trading operations
- **Preset Trade Engine**: Toggle to enable/disable preset-based trading

### Default State
Both engines are **enabled by default** to ensure full system functionality on first run.

## Engine Types

### Main Trade Engine
**Purpose**: Executes trades based on primary trading strategies and real-time market conditions.

**Characteristics**:
- Real-time market analysis
- Direct strategy execution
- Active position management
- Immediate trade execution

**Use Cases**:
- Live trading with primary strategies
- Real-time market opportunity capture
- Direct exchange integration

### Preset Trade Engine
**Purpose**: Executes trades based on predefined preset configurations and coordination rules.

**Characteristics**:
- Configuration-based trading
- Preset coordination system
- Batch processing capability
- Multi-strategy coordination

**Use Cases**:
- Preset-based trading strategies
- Configuration testing
- Coordinated multi-symbol trading
- Systematic trading approaches

## System Integration

### Database Settings
Both settings are stored in the `system_settings` table:
- Key: `mainTradeEngineEnabled` (boolean)
- Key: `presetTradeEngineEnabled` (boolean)

### API Endpoints
- GET `/api/settings/system` - Retrieve current engine states
- POST `/api/settings/system` - Update engine states

### Trade Engine Integration
The `lib/trade-engine.ts` module provides:
```typescript
async function isTradeEngineTypeEnabled(engineType: "main" | "preset"): Promise<boolean>
```

This function checks if a specific engine type is enabled before executing operations.

## Operational Impact

### Disabling Main Trade Engine
- Stops all main strategy executions
- Prevents new main trades from opening
- Existing positions remain active (manual close required)
- Market data collection continues

### Disabling Preset Trade Engine
- Stops all preset-based executions
- Prevents new preset coordination cycles
- Existing preset positions remain active
- Preset configurations remain accessible

### Both Engines Disabled
- Complete trading halt
- No new positions opened
- Monitoring continues
- Manual trading still possible via UI

## Best Practices

1. **Testing**: Disable engines during system maintenance or testing
2. **Selective Trading**: Enable only the engine type needed for current strategy
3. **Emergency Stop**: Disable both engines for immediate trading halt
4. **Resource Management**: Disable unused engine types to reduce system load

## Safety Features

- Changes take effect immediately for **new** operations only
- Existing positions are not automatically closed
- Position monitoring continues regardless of engine state
- Manual override always available through UI

## Monitoring

Check engine status via:
- Dashboard > System Status
- Settings > System > Trade Engine Types
- API: `/api/settings/system`
- Logs: Search for "trade engine" in system logs

## Troubleshooting

### Engine Not Starting
1. Check if engine type is enabled in settings
2. Verify database connection
3. Review system logs for errors
4. Ensure required connections are active

### Unexpected Trading Activity
1. Verify both engine types' enabled status
2. Check active connections configuration
3. Review strategy settings
4. Examine recent system changes

## Related Documentation
- [Trade Engine Architecture](./TRADE_ENGINE_ARCHITECTURE.md)
- [Connection Management](./SETTINGS_CONNECTION_COORDINATION.md)
- [System Configuration](./SYSTEM_PRODUCTION_STATUS.md)
