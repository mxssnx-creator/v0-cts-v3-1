# CTS v3.1 - Complete Project Documentation

**Version:** 3.1.0  
**Last Updated:** 2025-01-04  
**Status:** Production Ready

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [Configuration](#configuration)
8. [Deployment](#deployment)
9. [Maintenance](#maintenance)

---

## 1. Project Overview

### Purpose
CTS v3.1 is a professional cryptocurrency trading system with advanced indication-based automation, multi-exchange support, and comprehensive position management.

### Key Features
- **6 Exchange Connectors**: Bybit, BingX, Binance, Pionex, OrangeX, OKX
- **4 Indication Types**: Direction, Move, Active, Optimal (step-based)
- **8 Common Indicators**: RSI, MACD, Bollinger, Parabolic SAR, EMA, SMA, Stochastic, ADX
- **3 Strategy Categories**: Additional (Trailing), Adjust (Block, DCA), Custom
- **Real-time Monitoring**: WebSocket connections, live position tracking
- **Database Threshold System**: Position limits with auto-cleanup (250 base + 20% threshold)
- **High-Performance Indexing**: 50+ database indexes for optimal query speed

### Technology Stack
```
Frontend:  Next.js 16, React 19, TypeScript, Tailwind CSS v4
Backend:   Next.js API Routes, Node.js 20+
Database:  PostgreSQL / SQLite with advanced indexing
UI:        shadcn/ui, Radix UI primitives
Charts:    Recharts for analytics visualization
State:     SWR for data fetching and caching
```

---

## 2. System Architecture

### Core Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Next.js)                      │
│  Dashboard │ Settings │ Live Trading │ Analytics │ Monitoring│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    API Layer (REST)                          │
│  Auth │ Connections │ Positions │ Orders │ Health │ Settings│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                  Business Logic Layer                        │
│  Trade Engine │ Position Manager │ Order Executor │ Analytics│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│               Data Layer (PostgreSQL/SQLite)                 │
│  Users │ Connections │ Positions │ Orders │ Logs │ Analytics│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│            Exchange Layer (REST + WebSocket)                 │
│  Bybit │ BingX │ Binance │ Pionex │ OrangeX │ OKX           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Market Data (WebSocket) → Indication Processing → Strategy Evaluation
           ↓                       ↓                      ↓
    Price Updates          Base Pseudo Positions   Main Pseudo Positions
           ↓                       ↓                      ↓
    Database Storage        Performance Tracking    Real Position Candidates
           ↓                       ↓                      ↓
    Technical Analysis      Profit Factor Calc     Order Execution (Exchange)
```

---

## 3. Core Components

### 3.1 Trade Engine (`lib/trade-engine.ts`)

**Purpose:** Orchestrates all trading operations with non-overlapping intervals

**Key Functions:**
- `startTradeEngine(connectionId)` - Initialize trading for a connection
- `stopTradeEngine(connectionId)` - Gracefully stop trading
- `pauseTradeEngine(connectionId)` - Temporarily pause operations
- `resumeTradeEngine(connectionId)` - Resume paused trading

**Intervals:**
- Trade Engine: 1.0s (indications + strategies + positions + logging)
- Real Positions: 0.3s (exchange position sync only)
- Position Threshold Check: 60s (database cleanup)

**State Management:**
- Database-backed state (connection_state table)
- File-based logging (logs/trade-engine/)
- Real-time health monitoring

### 3.2 Position Manager (`lib/position-manager.ts`)

**Purpose:** Manages position lifecycle from pseudo to real execution

**Position Hierarchy:**
```
Base Pseudo Position (Indication Valid)
    ↓ (Performance filter: profit_factor ≥ 0.6)
Main Pseudo Position (Strategy Selected)
    ↓ (Top 10 by profit_factor per connection)
Real Position Candidate (Awaiting Execution)
    ↓ (Validation + Risk checks)
Real Position (Exchange Order Placed)
```

**Database Threshold System:**
- **Base Limit:** 250 positions per configuration set
- **Threshold:** 20% (default, configurable 10-50%)
- **Cleanup Trigger:** 250 × 1.2 = 300 positions
- **Cleanup Action:** Keep newest 250, archive deleted
- **Independent Limits:** Each config (TP/SL/Trailing) = separate set

### 3.3 Order Executor (`lib/order-executor.ts`)

**Purpose:** Execute orders on exchanges with retry logic

**Features:**
- Timeout protection (15s default)
- 3 retry attempts with exponential backoff
- Comprehensive error handling per exchange
- Database transaction support (ACID compliant)
- Detailed execution logging

**Supported Order Types:**
- Market orders (all exchanges)
- Limit orders (all exchanges)
- Stop-loss integration
- Take-profit integration

### 3.4 Exchange Connectors (`lib/exchange-connectors/`)

**Implementations:**
1. `bybit-connector.ts` - Bybit API v5
2. `bingx-connector.ts` - BingX perpetual futures
3. `binance-connector.ts` - Binance futures
4. `pionex-connector.ts` - Pionex API
5. `orangex-connector.ts` - OrangeX perpetuals
6. `okx-connector.ts` - OKX with passphrase support

**Common Methods:**
- `placeOrder(params)` - Execute trade
- `getBalance()` - Fetch account balance
- `getPositions()` - Get open positions
- `cancelOrder(orderId)` - Cancel pending order
- `testConnection()` - Verify API credentials

**Error Handling:**
- Rate limit detection and retry
- Network timeout protection
- Invalid signature error recovery
- Exchange-specific error mapping

### 3.5 System Health Monitor (`lib/system-health-monitor.ts`)

**Purpose:** Real-time system health and diagnostics

**Health Checks:**
1. **Exchange Connections** - Active status, API test results
2. **Trade Engine** - Running status, stale detection, error count
3. **Database** - Connection health, table count, position sync
4. **API Health** - Recent error rate, response times
5. **Position Sync** - Stale sync detection, last update times

**Logging:**
- File-based: `logs/health/*.txt`
- Timestamped entries
- Action audit trail
- Independent from database

---

## 4. Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### connections
```sql
CREATE TABLE connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  exchange VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  api_passphrase TEXT,
  testnet BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_exchange ON connections(exchange);
CREATE INDEX idx_connections_enabled ON connections(enabled);
CREATE INDEX idx_connections_active ON connections(active);
```

#### base_pseudo_positions
```sql
CREATE TABLE base_pseudo_positions (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  indication_type VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  take_profit DECIMAL(10, 4) NOT NULL,
  stop_loss DECIMAL(10, 4) NOT NULL,
  trailing_enabled BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'evaluating',
  profit_factor DECIMAL(10, 4) DEFAULT 0,
  win_rate DECIMAL(10, 4) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_base_pseudo_connection ON base_pseudo_positions(connection_id);
CREATE INDEX idx_base_pseudo_symbol ON base_pseudo_positions(symbol);
CREATE INDEX idx_base_pseudo_status ON base_pseudo_positions(status);
CREATE INDEX idx_base_pseudo_profit_factor ON base_pseudo_positions(profit_factor DESC);
CREATE INDEX idx_base_pseudo_created ON base_pseudo_positions(created_at DESC);
```

#### pseudo_positions
```sql
CREATE TABLE pseudo_positions (
  id SERIAL PRIMARY KEY,
  base_position_id INTEGER REFERENCES base_pseudo_positions(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  realized_pnl DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);
CREATE INDEX idx_pseudo_base_position ON pseudo_positions(base_position_id);
CREATE INDEX idx_pseudo_connection ON pseudo_positions(connection_id);
CREATE INDEX idx_pseudo_symbol ON pseudo_positions(symbol);
CREATE INDEX idx_pseudo_status ON pseudo_positions(status);
CREATE INDEX idx_pseudo_created ON pseudo_positions(created_at DESC);
```

#### orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
  exchange_order_id VARCHAR(255),
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  status VARCHAR(50) DEFAULT 'pending',
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP
);
CREATE INDEX idx_orders_connection ON orders(connection_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_exchange_order_id ON orders(exchange_order_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### connection_state
```sql
CREATE TABLE connection_state (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER UNIQUE REFERENCES connections(id) ON DELETE CASCADE,
  trade_engine_running BOOLEAN DEFAULT FALSE,
  preset_engine_running BOOLEAN DEFAULT FALSE,
  last_execution_time TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_connection_state_connection ON connection_state(connection_id);
CREATE INDEX idx_connection_state_running ON connection_state(trade_engine_running);
```

### Performance Indexes (50+ total)

**Query Optimization:**
- Composite indexes for common queries
- Covering indexes for hot paths
- Partial indexes for filtered queries
- Descending indexes for ORDER BY DESC

**Maintenance:**
- Auto-vacuum enabled
- Statistics auto-update
- Analyze after bulk operations

---

## 5. API Endpoints

### Authentication
```
POST /api/auth/register      - Create new user
POST /api/auth/login          - User login
POST /api/auth/logout         - User logout
GET  /api/auth/me             - Get current user
```

### Connections
```
GET    /api/connections/active                    - Get active connections
GET    /api/settings/connections                  - List all connections
POST   /api/settings/connections                  - Create connection
GET    /api/settings/connections/[id]             - Get connection details
PUT    /api/settings/connections/[id]             - Update connection
DELETE /api/settings/connections/[id]             - Delete connection
POST   /api/settings/connections/[id]/test        - Test connection
POST   /api/settings/connections/[id]/toggle      - Enable/disable connection
```

### Trade Engine
```
POST   /api/trade-engine/start                    - Start all engines
POST   /api/trade-engine/stop                     - Stop all engines
POST   /api/trade-engine/pause                    - Pause all engines
POST   /api/trade-engine/resume                   - Resume all engines
GET    /api/trade-engine/status                   - Get global status
POST   /api/trade-engine/[connectionId]/start     - Start specific engine
POST   /api/trade-engine/[connectionId]/stop      - Stop specific engine
GET    /api/trade-engine/[connectionId]/status    - Get engine status
```

### Positions
```
GET    /api/positions                             - Get all positions
GET    /api/positions/[connectionId]              - Get connection positions
GET    /api/positions/[connectionId]/stats        - Get position statistics
GET    /api/positions/stats                       - Get global statistics
POST   /api/exchange-positions                    - Sync exchange positions
GET    /api/exchange-positions/statistics         - Get sync statistics
```

### Orders
```
GET    /api/orders                                - List orders
POST   /api/orders                                - Create order
GET    /api/orders/[id]                           - Get order details
DELETE /api/orders/[id]                           - Cancel order
```

### Health & Monitoring
```
GET    /api/health                                - System health check
GET    /api/health/logs                           - Get health logs
POST   /api/health/action                         - Execute health action
GET    /api/monitoring/stats                      - System statistics
GET    /api/monitoring/logs                       - Application logs
GET    /api/monitoring/errors                     - Error logs
```

### Settings
```
GET    /api/settings                              - Get all settings
PUT    /api/settings                              - Update settings
GET    /api/settings/system                       - Get system settings
PUT    /api/settings/system                       - Update system settings
```

---

## 6. UI Components

### Pages

1. **Dashboard (`app/page.tsx`)**
   - Connection cards with real-time status
   - Global trade engine controls
   - Portfolio overview
   - System health panel

2. **Live Trading (`app/live-trading/page.tsx`)**
   - Real-time position table
   - Exchange selection
   - Manual trade execution
   - Performance metrics

3. **Settings (`app/settings/page.tsx`)**
   - Connection management
   - Indication configuration
   - Strategy settings
   - System parameters
   - Database management

4. **Monitoring (`app/monitoring/page.tsx`)**
   - System states
   - Error logs
   - Performance metrics
   - Health monitor

5. **Logistics (`app/logistics/page.tsx`)**
   - Complete system workflow
   - Phase-by-phase breakdown
   - Technical architecture
   - Implementation details

### Reusable Components

**Dashboard Components:**
- `connection-card.tsx` - Connection status and controls
- `global-trade-engine-controls.tsx` - Engine start/stop/pause
- `system-health-panel.tsx` - Real-time health monitoring
- `system-diagnostics.tsx` - Issue tracking and logging

**Settings Components:**
- `exchange-connection-dialog.tsx` - Add/edit connections
- `connection-info-dialog.tsx` - View connection details
- `exchange-connection-manager.tsx` - Connection list management

**Monitoring Components:**
- `expandable-log-viewer.tsx` - Collapsible log display
- Various metric displays

---

## 7. Configuration

### Environment Variables

```bash
# Application
PROJECT_NAME=CTS-v3
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/cts
REMOTE_POSTGRES_URL=postgresql://user:password@host:5432/cts

# Security (Auto-generated by setup)
SESSION_SECRET=random-32-byte-hex
JWT_SECRET=random-32-byte-hex
ENCRYPTION_KEY=random-32-byte-hex
API_SIGNING_SECRET=random-32-byte-hex
```

### System Settings (Database)

```typescript
interface SystemSettings {
  // Trade Engine
  tradeEngineInterval: number;        // Default: 1.0s
  realPositionsInterval: number;      // Default: 0.3s
  positionThresholdInterval: number;  // Default: 60s
  
  // Database
  databaseMaxSize: number;            // Default: 20 GB
  positionDatabaseLength: number;     // Default: 250 positions
  thresholdPercentage: number;        // Default: 20% (10-50%)
  
  // Trading
  maxPositionsPerConnection: number;  // Default: 10
  validationTimeout: number;          // Default: 15s
  positionCooldown: number;           // Default: 20s
}
```

---

## 8. Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed (if HTTPS)
- [ ] Exchange API keys tested (testnet first)
- [ ] System health check passing
- [ ] Backup strategy configured
- [ ] Monitoring alerts configured
- [ ] Log rotation enabled

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

---

## 9. Maintenance

### Daily Tasks
- Monitor system health dashboard
- Review error logs
- Check database size
- Verify exchange connections

### Weekly Tasks
- Database backup
- Performance metrics review
- Log analysis
- System updates check

### Monthly Tasks
- Full system audit
- Database optimization (VACUUM, ANALYZE)
- Security review
- Documentation update

### Backup Strategy

```bash
# Database backup
npm run db:backup

# Full system export
curl http://localhost:3000/api/install/export > backup.json

# Restore from export
curl -X POST http://localhost:3000/api/install/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

---

## Support & Resources

- **Documentation:** /docs folder
- **GitHub:** Repository issues
- **Logs:** logs/ directory
- **Health Check:** /api/health
- **System Info:** Settings → Install → System Information

---

**End of Documentation**
