# CTS v3.1 System Workflows

## Complete System Workflow Documentation

### 1. Connection Testing Workflow

**Purpose**: Verify exchange API credentials and connectivity before enabling trading

**Steps**:
1. User navigates to Settings → Exchange Connections
2. User creates new connection or selects existing connection
3. User enters/verifies:
   - Exchange selection (Binance, Bybit, OKX, etc.)
   - API Key
   - API Secret
   - Testnet toggle (optional)
   - Connection name
4. User clicks "Test Connection" button
5. System calls: `POST /api/settings/connections/[id]/test`
6. API validates:
   - Connection ID exists
   - API credentials are present
7. System creates exchange connector instance
8. Connector attempts to fetch account balance
9. Test result stored in database:
   - `last_test_at`: Current timestamp
   - `last_test_result`: 'success' or 'failed'
   - `last_test_message`: Detailed result message
10. If successful, connection automatically activated
11. UI updates with test result and status

**API Endpoint**: `POST /api/settings/connections/[id]/test`

**Database Tables**:
- `exchange_connections`: Stores connection config and test results

**Key Files**:
- `/app/api/settings/connections/[id]/test/route.ts`
- `/lib/exchange-connectors/base-connector.ts`
- `/lib/exchange-connectors/[exchange]-connector.ts`

---

### 2. Trade Engine Start Workflow

**Purpose**: Initialize and start automated trading engine for a connection

**Prerequisites**:
- Connection must be active (`is_active = 1`)
- Connection must be successfully tested (`last_test_result = 'success'`)
- Engine must not already be running

**Steps**:
1. User navigates to Live Trading or Dashboard
2. User selects connection and clicks "Start Engine"
3. System calls: `POST /api/trade-engine/start` with `connectionId`
4. API validates:
   - Connection exists and is active
   - Connection has been tested successfully
   - Engine is not already running
5. TradeEngineManager creates new engine instance
6. Engine initializes:
   - Loads connection settings
   - Initializes exchange connector
   - Loads active strategies
   - Sets up indication processors
7. Engine starts main loop:
   - Fetch market data
   - Process indications
   - Evaluate strategies
   - Manage positions
   - Execute orders
8. Database updated:
   - `engine_running = 1`
   - `engine_started_at = CURRENT_TIMESTAMP`
9. UI updates with "Running" status

**API Endpoint**: `POST /api/trade-engine/start`

**Database Tables**:
- `exchange_connections`: Engine status tracking
- `trade_progression`: Cycle tracking
- `positions`: Active positions
- `orders`: Pending/executed orders

**Key Files**:
- `/app/api/trade-engine/start/route.ts`
- `/lib/trade-engine/engine-manager.ts`
- `/lib/trade-engine/trade-engine.tsx`
- `/lib/trade-engine/indication-processor.ts`
- `/lib/trade-engine/strategy-processor.ts`

---

### 3. Trade Engine Progression Workflow

**Purpose**: Continuous automated trading cycle

**Main Loop** (runs every cycle while engine is running):

1. **Market Data Fetch**
   - Fetch current prices from exchange
   - Update market data cache
   - Store in `market_data` table

2. **Indication Processing**
   - Load active indication settings
   - Calculate technical indicators (RSI, MACD, etc.)
   - Generate buy/sell signals
   - Update `indication_states` table

3. **Strategy Evaluation**
   - Load active strategies
   - Evaluate strategy conditions
   - Check against indications
   - Determine actions (enter/exit/hold)

4. **Position Management**
   - Check existing positions
   - Update position P&L
   - Check stop-loss/take-profit
   - Determine if adjustment needed

5. **Order Execution**
   - Calculate position sizes
   - Apply volume settings
   - Apply risk management rules
   - Submit orders to exchange
   - Track order status

6. **Progression Logging**
   - Log cycle completion
   - Update `trade_progression` table
   - Increment cycle counter
   - Update last cycle timestamp

7. **Wait for next cycle**
   - Configurable interval (default: 5-60 seconds)
   - Repeat from step 1

**Stop Conditions**:
- User manually stops engine
- Critical error occurs
- Connection becomes inactive
- Emergency stop triggered

**API Endpoints**:
- `GET /api/trade-engine/status`: Current engine status
- `GET /api/trade-engine/progression`: Cycle history
- `POST /api/trade-engine/stop`: Stop engine

**Key Files**:
- `/lib/trade-engine/trade-engine.tsx`: Main engine loop
- `/lib/trade-engine/realtime-processor.ts`: Market data processing
- `/lib/position-manager.ts`: Position tracking
- `/lib/order-executor.ts`: Order submission

---

### 4. Position Management Workflow

**Purpose**: Track and manage trading positions from entry to exit

**Entry Workflow**:
1. Engine receives BUY signal from strategy
2. Position calculator determines size based on:
   - Account balance
   - Risk percentage
   - Leverage settings
   - Volume configuration
3. Order executor creates order:
   - Calculates entry price
   - Sets stop-loss level
   - Sets take-profit level
   - Submits to exchange
4. Order status tracked until filled
5. Position created in database:
   - Entry price
   - Position size
   - Stop-loss
   - Take-profit
   - Status: 'open'

**Monitoring**:
- Engine checks position every cycle
- Updates current price and P&L
- Checks if stop-loss hit
- Checks if take-profit hit
- Updates position in database

**Exit Workflow**:
1. Exit condition triggered:
   - Stop-loss hit
   - Take-profit hit
   - Strategy signals exit
   - Manual close requested
2. Order executor creates close order
3. Position status updated to 'closing'
4. Order tracked until filled
5. Position closed:
   - Status: 'closed'
   - Realized P&L calculated
   - Closed timestamp recorded

**API Endpoints**:
- `GET /api/positions`: All positions
- `GET /api/positions/[connectionId]`: Positions for connection
- `GET /api/positions/[connectionId]/stats`: Position statistics

**Database Tables**:
- `positions`: Position records
- `orders`: Entry/exit orders
- `trades`: Individual trade executions

---

### 5. Monitoring and Logging Workflow

**Purpose**: Track system health and activity

**Components Monitored**:
1. **System Health**
   - Database connectivity
   - Active connections
   - Running engines
   - Open positions
   - Pending orders

2. **Performance Metrics**
   - Engine cycle times
   - API response times
   - Order execution times
   - Error rates

3. **Activity Logs**
   - Connection tests
   - Engine starts/stops
   - Position entries/exits
   - Order executions
   - Error events

**Logging Levels**:
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARN`: Warning messages for potential issues
- `ERROR`: Error events requiring attention

**API Endpoints**:
- `GET /api/monitoring/system`: System metrics
- `GET /api/monitoring/logs`: Activity logs
- `GET /api/system/health-check`: Comprehensive health check

**Database Tables**:
- `site_logs`: Application logs
- `audit_logs`: User actions
- `performance_metrics`: Performance data

---

### 6. Connection Activation Workflow

**Purpose**: Enable/disable trading connections

**Activation**:
1. User clicks toggle to activate connection
2. System calls: `POST /api/settings/connections/[id]/toggle`
3. API validates connection exists
4. Connection status updated: `is_active = 1`
5. UI shows connection as "Active"

**Deactivation**:
1. User clicks toggle to deactivate connection
2. If engine running for connection:
   - Engine stop requested
   - Positions monitored (optional: close all)
   - Engine stopped gracefully
   - Database updated: `engine_running = 0`
3. Connection status updated: `is_active = 0`
4. UI shows connection as "Inactive"

---

## System Integrity Checks

### Automated Health Checks

Run comprehensive health check:
```bash
npm run health-check
```

Or verify system integrity:
```bash
npm run verify
```

### Manual Verification Checklist

- [ ] Database tables exist and populated
- [ ] At least one connection configured
- [ ] Connection successfully tested
- [ ] Connection is active
- [ ] Engine can start without errors
- [ ] Engine processes cycles
- [ ] Positions tracked correctly
- [ ] Orders executed successfully
- [ ] Monitoring logs capturing events
- [ ] UI updating in real-time

---

## Troubleshooting

### Connection Test Fails
1. Verify API credentials are correct
2. Check if testnet toggle matches API keys
3. Verify exchange API is accessible
4. Check API key permissions (trading enabled)

### Engine Won't Start
1. Ensure connection is active
2. Verify connection tested successfully
3. Check no engine already running
4. Review engine logs for errors

### Positions Not Opening
1. Verify strategies are active
2. Check indication settings configured
3. Verify sufficient account balance
4. Check risk management settings

### UI Not Updating
1. Check WebSocket connection
2. Verify real-time data stream active
3. Check browser console for errors
4. Refresh page to reconnect

---

## API Reference

### Core Endpoints

**Connection Management**:
- `GET /api/settings/connections` - List all connections
- `POST /api/settings/connections` - Create connection
- `GET /api/settings/connections/[id]` - Get connection details
- `PUT /api/settings/connections/[id]` - Update connection
- `DELETE /api/settings/connections/[id]` - Delete connection
- `POST /api/settings/connections/[id]/test` - Test connection
- `POST /api/settings/connections/[id]/toggle` - Activate/deactivate

**Trade Engine**:
- `POST /api/trade-engine/start` - Start engine
- `POST /api/trade-engine/stop` - Stop engine
- `GET /api/trade-engine/status` - Get engine status
- `GET /api/trade-engine/progression` - Get progression data

**Monitoring**:
- `GET /api/monitoring/system` - System metrics
- `GET /api/system/health-check` - Comprehensive health check

---

## Database Schema Reference

### Critical Tables

**exchange_connections**:
- Connection configuration
- Test results
- Engine status
- Timestamps

**positions**:
- Position details
- Entry/exit data
- P&L tracking
- Status

**orders**:
- Order details
- Status tracking
- Execution data

**trade_progression**:
- Engine cycle logs
- Performance metrics
- Timestamp tracking

---

*Last Updated: System Integrity Enhancement*
