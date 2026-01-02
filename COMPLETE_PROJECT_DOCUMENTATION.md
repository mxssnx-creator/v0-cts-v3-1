# CTS v3 - Complete System Documentation
## Crypto Trading System - Full Technical Specification

**Version:** 3.1
**Last Updated:** 2025-01-26
**Purpose:** Complete reference for recreating the entire system from scratch

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Core Engines](#core-engines)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [Settings & Configuration](#settings--configuration)
8. [Business Logic](#business-logic)
9. [Integration Guide](#integration-guide)
10. [Deployment](#deployment)

---

## 1. SYSTEM OVERVIEW

### Purpose
CTS v3 is an advanced cryptocurrency trading system with real-time analytics, automated strategies, and multi-exchange support.

### Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (remote) / SQLite (local)
- **UI:** React 19.2 + shadcn/ui
- **Styling:** Tailwind CSS v4
- **Real-time:** WebSocket integration
- **State:** React Context + SWR

### Key Features
- Multi-exchange connectivity (Binance, ByBit, BingX, OKX, OrangeX, Pionex)
- Real-time position management (pseudo & real positions)
- Automated indication engines (Direction, Move, Active)
- Strategy processing (Adjust, Block, DCA, Main, Real)
- Preset configuration & backtesting system
- Comprehensive analytics & monitoring
- Multi-theme support (Dark, White, Grey, BlackWhite)
- Authentication & security

---

## 2. ARCHITECTURE

### High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Settings  │  │Analytics │  │Monitoring│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Settings │  │ Trading  │  │Monitoring│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     ENGINE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Trade Engine  │  │Indication    │  │Preset Engine │     │
│  │              │  │Calculator    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXCHANGE LAYER                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │Binance │  │ ByBit  │  │ BingX  │  │  OKX   │  ...      │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│            PostgreSQL (Remote) / SQLite (Local)              │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Directory Structure

\`\`\`
/app                          # Next.js App Router pages
  /(dashboard)/realtime      # Real-time monitoring
  /alerts                     # Alert management
  /analysis                   # Position analysis
  /api                        # API route handlers
  /indications                # Indication monitoring
  /live-trading               # Live trading dashboard
  /login                      # Authentication
  /monitoring                 # System monitoring
  /presets                    # Preset management
  /sets                       # Configuration sets
  /settings                   # System settings
  /statistics                 # Performance stats
  /strategies                 # Strategy management

/lib                          # Core business logic
  /core                       # Core types & operations
  /constants                  # Constants & enums
  /exchange-connectors        # Exchange API wrappers
  /realtime                   # Real-time data streams
  /trade-engine              # Trade execution engine

/components                   # React components
  /ui                         # shadcn/ui components
  /dashboard                  # Dashboard components
  /presets                    # Preset components
  /settings                   # Settings components
  /statistics                 # Statistics components

/hooks                        # Custom React hooks
/backups                      # Configuration backups
\`\`\`

---

## 3. DATABASE SCHEMA

### Core Tables

#### **exchange_connections**
\`\`\`sql
CREATE TABLE exchange_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,                -- Binance, ByBit, etc.
  api_type TEXT NOT NULL,                -- spot, futures, margin
  connection_method TEXT NOT NULL,       -- testnet, mainnet
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_live_trade BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### **pseudo_positions**
\`\`\`sql
CREATE TABLE pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,         -- direction, move, active
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL,
  position_cost REAL NOT NULL,           -- 0.1 = 0.1% (NOT 10%)
  status TEXT DEFAULT 'active',          -- active, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance metrics
  indication_range INTEGER,
  indication_interval INTEGER,
  indication_timeout INTEGER,
  strategy_type TEXT,
  strategy_step INTEGER,
  strategy_interval INTEGER,
  position_age_seconds INTEGER,
  last_update_interval INTEGER,
  avg_update_interval INTEGER,
  total_updates INTEGER DEFAULT 0,
  initial_profit_factor REAL,
  max_profit_factor REAL,
  min_profit_factor REAL,
  avg_profit_factor REAL,
  profit_factor_volatility REAL,
  last_check_timestamp TIMESTAMP,
  checks_per_minute REAL,
  price_updates_count INTEGER DEFAULT 0,
  
  FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
);
\`\`\`

#### **real_positions**
\`\`\`sql
CREATE TABLE real_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  volume REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit REAL,
  stoploss REAL,
  profit_loss REAL NOT NULL,
  status TEXT DEFAULT 'open',            -- open, closed
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Performance metrics
  indication_type TEXT,
  indication_range INTEGER,
  indication_interval INTEGER,
  strategy_interval INTEGER,
  position_duration_seconds INTEGER,
  avg_check_interval_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  initial_profit_loss REAL,
  max_profit REAL,
  max_loss REAL,
  profit_volatility REAL,
  
  FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
);
\`\`\`

#### **system_settings**
\`\`\`sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,                   -- JSON stringified
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### Preset System Tables

#### **preset_types**
\`\`\`sql
CREATE TABLE preset_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### **preset_configuration_sets**
\`\`\`sql
CREATE TABLE preset_configuration_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preset_type_id TEXT NOT NULL,
  indicators JSON NOT NULL,              -- Selected indicators with params
  position_config JSON NOT NULL,         -- TP/SL/Trailing config
  evaluation_settings JSON NOT NULL,     -- Min profit, max drawdown
  status TEXT DEFAULT 'active',          -- active, disabled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_evaluation_at TIMESTAMP,
  evaluation_result JSON,
  auto_disable_reason TEXT,
  min_profit_factor REAL DEFAULT 1.2,
  position_count_threshold INTEGER DEFAULT 10,
  total_completed_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  
  FOREIGN KEY (preset_type_id) REFERENCES preset_types (id)
);
\`\`\`

#### **preset_configurations**
\`\`\`sql
CREATE TABLE preset_configurations (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL,
  symbol TEXT,
  indication_type TEXT NOT NULL,
  indication_params JSON NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_config JSON,
  performance_stats JSON,                 -- Backtest results
  is_active BOOLEAN DEFAULT true,
  
  FOREIGN KEY (set_id) REFERENCES preset_configuration_sets (id)
);
\`\`\`

### Monitoring Tables

#### **logs**
\`\`\`sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,                    -- info, warning, error
  category TEXT NOT NULL,                 -- engine, api, exchange
  message TEXT NOT NULL,
  details TEXT,                           -- JSON stringified
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### **errors**
\`\`\`sql
CREATE TABLE errors (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context TEXT,                           -- JSON stringified
  resolved BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### **site_logs**
\`\`\`sql
CREATE TABLE site_logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,                    -- debug, info, warn, error
  category TEXT NOT NULL,                 -- client, server, api
  message TEXT NOT NULL,
  details TEXT,
  stack TEXT,
  metadata TEXT,                          -- JSON stringified
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

---

## 4. CORE ENGINES

### 4.1 Trade Engine

**Location:** `/lib/trade-engine/trade-engine.tsx`

**Purpose:** Main trading engine that coordinates indication processing, strategy execution, and position management.

**Key Components:**
- **Engine Manager** (`/lib/trade-engine/engine-manager.ts`)
- **Indication Processor** (`/lib/trade-engine/indication-processor.ts`)
- **Strategy Processor** (`/lib/trade-engine/strategy-processor.ts`)
- **Position Manager** (`/lib/trade-engine/pseudo-position-manager.ts`)

**Workflow:**
\`\`\`
1. Load connection settings from database
2. Initialize exchange connector
3. Start indication processor (every 100ms)
4. Process indications → Generate signals
5. Execute strategies → Create positions
6. Monitor positions → Update prices
7. Check TP/SL conditions → Close positions
8. Log all activities → Save to database
\`\`\`

**Intervals (CRITICAL - Must be synchronized):**
- **Active Order Handling:** 100ms (independent)
- **Active Indication:** 100ms (coordinated with order handling)
- **Indication Processing:** 100ms default
- **Position Updates:** Real-time via WebSocket

**Configuration:**
\`\`\`typescript
interface TradeEngineConfig {
  connectionId: string
  settings: Settings
  isLiveTrade: boolean
  maxPositionsPerSymbol: number
  maxPositionsPerConfigDirection: number  // Default: 2
}
\`\`\`

### 4.2 Indication Calculator

**Location:** `/lib/indication-calculator.ts`

**Purpose:** Calculates indication signals (Direction, Move, Active) based on market data.

**Indication Types:**

#### **Direction Indication**
\`\`\`typescript
interface DirectionIndication {
  type: 'direction'
  range: number                   // 3-30 (step 1)
  interval: number                // ms
  timeout: number                 // ms
  drawdownValues: number[]        // [10, 20, 30, 40, 50]
  marketChangeRange: {
    from: number
    to: number
    step: number
  }
  minCalculationTime: number      // seconds
  lastPartRatio: number           // 0.1-0.5 (10%-50%)
  ratioFactor: {
    from: number                  // 1.0
    to: number                    // 2.5
    step: number                  // 0.5
  }
}
\`\`\`

**Logic:**
1. Collect market data for specified range
2. Calculate price changes and drawdowns
3. Identify trend direction (up/down)
4. Apply ratio factor for acceleration detection
5. Validate against minimum calculation time
6. Return indication signal with confidence

#### **Move Indication**
\`\`\`typescript
interface MoveIndication {
  type: 'move'
  range: number                   // 3-30 (step 1)
  interval: number                // ms
  timeout: number                 // ms
  drawdownValues: number[]        // [10, 20, 30, 40, 50]
  marketChangeRange: {
    from: number
    to: number
    step: number
  }
  minCalculationTime: number      // seconds
  lastPartRatio: number           // 0.1-0.5
  ratioFactor: {
    from: number
    to: number
    step: number
  }
}
\`\`\`

**Logic:**
1. Analyze price movements over time
2. Detect significant price changes
3. Compare against market change thresholds
4. Calculate movement strength
5. Return move signal with magnitude

#### **Active Indication**
\`\`\`typescript
interface ActiveIndication {
  type: 'active'
  range: number                   // 3-30 (step 1)
  interval: number                // ms
  timeout: number                 // ms
  drawdownValues: number[]        // [10, 20, 30, 40, 50]
  marketChangeRange: {
    from: number
    to: number
    step: number
  }
  minCalculationTime: number      // seconds
  lastPartRatio: number           // 0.1-0.5
  ratioFactor: {
    from: number
    to: number
    step: number
  }
  activityCalculatedRange: {      // ADDITIONAL
    from: number
    to: number
    step: number
  }
  activityLastPartRange: {        // ADDITIONAL
    from: number
    to: number
    step: number
  }
}
\`\`\`

**Logic:**
1. Monitor market activity levels
2. Calculate activity percentage
3. Analyze last part activity concentration
4. Detect active trading periods
5. Return activity signal with intensity

### 4.3 Strategy Processor

**Location:** `/lib/trade-engine/strategy-processor.ts`

**Purpose:** Processes indication signals and executes trading strategies.

**Strategy Types:**

#### **Main Strategy**
- Primary strategy for opening positions
- Uses base indication settings
- No additional modifications
- Direct TP/SL from settings

#### **Adjust Strategy**
- Modifies TP/SL based on market conditions
- Adjusts position cost dynamically
- Uses indication range as modifier
- Formula: `adjusted = base * (1 + range/100)`

#### **Block Strategy**
- Blocks positions at certain levels
- Prevents overexposure
- Uses position count limits
- Activates when limits reached

#### **DCA Strategy (Dollar Cost Averaging)**
- Adds to existing positions
- Lowers average entry price
- Triggered by drawdown levels
- Max DCA levels configurable

#### **Real Strategy**
- Converts pseudo positions to real orders
- Places actual exchange orders
- Requires live trading enabled
- Monitors real position status

### 4.4 Preset Trade Engine

**Location:** `/lib/preset-trade-engine.ts`

**Purpose:** Manages preset-based trading with multiple configurations.

**Features:**
- Runs multiple configurations simultaneously
- Each configuration = unique indication + position parameters
- Max 2 positions per configuration per direction
- Tracks performance per configuration
- Auto-disables underperforming configurations

**Configuration Structure:**
\`\`\`typescript
interface PresetConfiguration {
  id: string
  setId: string
  indicationType: 'direction' | 'move' | 'active'
  indicationParams: {
    range: number
    interval: number
    // ... other params
  }
  takeprofitFactor: number
  stoplossRatio: number
  trailingConfig?: {
    enabled: boolean
    start: number
    stop: number
  }
  maxPositions: 2                 // Per direction
}
\`\`\`

### 4.5 Preset Set Evaluator

**Location:** `/lib/preset-set-evaluator.ts`

**Purpose:** Hourly evaluation and auto-disable of underperforming Sets.

**Evaluation Logic:**
\`\`\`typescript
interface SetEvaluation {
  // For each symbol in Set
  symbolPerformance: {
    symbol: string
    recentPositions: number       // Last N positions
    profitFactor: number          // Average profit factor
    winRate: number               // Winning percentage
  }[]
  
  // Disable conditions
  shouldDisable: boolean
  reason?: string
  
  // If any symbol has:
  // - profitFactor < minProfitFactor (from Set config)
  // - recentPositions >= positionCountThreshold
  // Then: Auto-disable Set
}
\`\`\`

**Schedule:**
- Runs every 1 hour
- Evaluates all active Sets
- Checks symbol-level performance
- Auto-disables if thresholds breached
- Logs evaluation results

---

## 5. API ENDPOINTS

### Authentication

#### POST `/api/auth/register`
\`\`\`typescript
// Register new user
Request: { username: string, email: string, password: string }
Response: { success: boolean, user: User }
\`\`\`

#### POST `/api/auth/login`
\`\`\`typescript
// User login
Request: { email: string, password: string }
Response: { success: boolean, token: string, user: User }
\`\`\`

#### POST `/api/auth/logout`
\`\`\`typescript
// User logout
Request: {}
Response: { success: boolean }
\`\`\`

#### GET `/api/auth/me`
\`\`\`typescript
// Get current user
Response: { user: User }
\`\`\`

### Settings

#### GET `/api/settings`
\`\`\`typescript
// Get system settings
Response: { settings: Settings }
\`\`\`

#### POST `/api/settings`
\`\`\`typescript
// Save system settings
Request: { settings: Settings }
Response: { success: boolean }
\`\`\`

#### GET `/api/settings/export`
\`\`\`typescript
// Export settings as JSON
Response: { settings: Settings, connections: Connection[] }
\`\`\`

### Connections

#### GET `/api/settings/connections`
\`\`\`typescript
// Get all exchange connections
Response: { connections: ExchangeConnection[] }
\`\`\`

#### POST `/api/settings/connections`
\`\`\`typescript
// Create new connection
Request: { name: string, exchange: string, apiKey: string, apiSecret: string }
Response: { success: boolean, connection: ExchangeConnection }
\`\`\`

#### GET `/api/settings/connections/[id]`
\`\`\`typescript
// Get connection details
Response: { connection: ExchangeConnection }
\`\`\`

#### PUT `/api/settings/connections/[id]`
\`\`\`typescript
// Update connection
Request: { name?: string, isEnabled?: boolean, settings?: object }
Response: { success: boolean }
\`\`\`

#### DELETE `/api/settings/connections/[id]`
\`\`\`typescript
// Delete connection
Response: { success: boolean }
\`\`\`

#### POST `/api/settings/connections/[id]/toggle`
\`\`\`typescript
// Toggle connection enabled status
Response: { success: boolean, isEnabled: boolean }
\`\`\`

#### POST `/api/settings/connections/[id]/test`
\`\`\`typescript
// Test connection
Response: { success: boolean, message: string }
\`\`\`

### Trade Engine

#### POST `/api/trade-engine/[connectionId]/start`
\`\`\`typescript
// Start trade engine for connection
Request: { settings: Settings }
Response: { success: boolean, message: string }
\`\`\`

#### POST `/api/trade-engine/[connectionId]/stop`
\`\`\`typescript
// Stop trade engine
Response: { success: boolean }
\`\`\`

#### GET `/api/trade-engine/[connectionId]/status`
\`\`\`typescript
// Get engine status
Response: { isRunning: boolean, stats: EngineStats }
\`\`\`

### Positions

#### GET `/api/positions`
\`\`\`typescript
// Get all positions
Query: { connectionId?: string, status?: 'active' | 'closed' }
Response: { positions: Position[] }
\`\`\`

#### GET `/api/positions/[connectionId]`
\`\`\`typescript
// Get positions for connection
Response: { positions: Position[] }
\`\`\`

#### GET `/api/positions/[connectionId]/stats`
\`\`\`typescript
// Get position statistics
Response: { stats: PositionStats }
\`\`\`

### Presets

#### GET `/api/presets`
\`\`\`typescript
// Get all presets
Response: { presets: Preset[] }
\`\`\`

#### POST `/api/presets`
\`\`\`typescript
// Create preset
Request: { name: string, config: PresetConfig }
Response: { success: boolean, preset: Preset }
\`\`\`

#### GET `/api/presets/[id]`
\`\`\`typescript
// Get preset details
Response: { preset: Preset }
\`\`\`

#### POST `/api/presets/[id]/backtest`
\`\`\`typescript
// Run backtest
Request: { days: number, symbols: string[] }
Response: { results: BacktestResults }
\`\`\`

#### POST `/api/presets/[id]/add-to-connections`
\`\`\`typescript
// Add preset to connections
Request: { connectionIds: string[] }
Response: { success: boolean }
\`\`\`

### Preset Sets

#### GET `/api/preset-sets`
\`\`\`typescript
// Get all configuration sets
Response: { sets: PresetSet[] }
\`\`\`

#### POST `/api/preset-sets`
\`\`\`typescript
// Create configuration set
Request: { name: string, config: SetConfig }
Response: { success: boolean, set: PresetSet }
\`\`\`

#### GET `/api/preset-sets/[id]`
\`\`\`typescript
// Get set details
Response: { set: PresetSet }
\`\`\`

#### POST `/api/preset-sets/[id]/evaluate`
\`\`\`typescript
// Evaluate set performance
Response: { evaluation: SetEvaluation }
\`\`\`

#### POST `/api/preset-sets/evaluator/start`
\`\`\`typescript
// Start hourly evaluator
Response: { success: boolean }
\`\`\`

#### POST `/api/preset-sets/evaluator/stop`
\`\`\`typescript
// Stop hourly evaluator
Response: { success: boolean }
\`\`\`

### Monitoring

#### GET `/api/monitoring/logs`
\`\`\`typescript
// Get system logs
Query: { level?: string, category?: string, limit?: number }
Response: { logs: Log[] }
\`\`\`

#### GET `/api/monitoring/errors`
\`\`\`typescript
// Get error logs
Query: { resolved?: boolean, limit?: number }
Response: { errors: Error[] }
\`\`\`

#### GET `/api/monitoring/stats`
\`\`\`typescript
// Get system statistics
Response: { stats: SystemStats }
\`\`\`

#### GET `/api/monitoring/system`
\`\`\`typescript
// Get system health
Response: { health: SystemHealth }
\`\`\`

---

## 6. UI COMPONENTS

### Component Structure

\`\`\`
components/
├── ui/                          # Base shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   ├── table.tsx
│   └── ... (50+ components)
│
├── dashboard/                   # Dashboard components
│   ├── connection-card.tsx     # Exchange connection card
│   ├── positions-table.tsx     # Position list
│   ├── portfolio-metrics.tsx   # Portfolio overview
│   ├── orders-history.tsx      # Order history
│   └── system-overview.tsx     # System status
│
├── presets/                     # Preset management
│   ├── preset-card.tsx         # Preset card display
│   ├── preset-dialog.tsx       # Create/edit preset
│   ├── configuration-set-manager.tsx
│   ├── create-configuration-set-dialog.tsx
│   ├── expandable-statistics-display.tsx
│   ├── preset-trade-statistics.tsx
│   └── coordination-results.tsx
│
├── settings/                    # Settings components
│   ├── exchange-connection-manager.tsx
│   ├── exchange-connection-dialog.tsx
│   ├── exchange-connection-settings-dialog.tsx
│   ├── connection-settings-dialog.tsx
│   └── install-manager.tsx
│
└── statistics/                  # Statistics & analytics
    ├── strategy-performance-table.tsx
    ├── preset-trade-stats.tsx
    └── analytics-filters.tsx
\`\`\`

### Key Component Examples

#### Connection Card
**File:** `components/dashboard/connection-card.tsx`
\`\`\`typescript
interface ConnectionCardProps {
  connection: ExchangeConnection
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

// Displays:
// - Connection name and status
// - Exchange type and API type
// - Enable/disable toggle
// - Active positions count
// - Real-time profit/loss
// - Settings button
\`\`\`

#### Expandable Statistics Display
**File:** `components/presets/expandable-statistics-display.tsx`
\`\`\`typescript
interface ExpandableStatisticsProps {
  configurations: Configuration[]
  minProfitFactor: number
  maxDrawdownHours: number
}

// Displays hierarchical statistics:
// Level 1: Major ranges (indication type + parameters)
// Level 2: Minor ranges (parameter variations)
// Level 3: Takeprofit steps
// Level 4: Stoploss ratios
// Level 5: Trailing configurations

// Each level shows:
// - Total configurations
// - Valid configurations (above thresholds)
// - Average profit factor
// - Win rate
// - Average drawdown time
\`\`\`

#### Create Configuration Set Dialog
**File:** `components/presets/create-configuration-set-dialog.tsx`
\`\`\`typescript
interface CreateSetDialogProps {
  onSave: (set: PresetSet) => void
}

// 4-tab interface:
// Tab 1: Basic Info
//   - Set name
//   - Indicator selection (RSI, MACD, EMA, etc.)
//   - Indicator enable toggles

// Tab 2: Indicator Parameters
//   - Dynamic inputs based on selected indicators
//   - From/To/Step for each parameter
//   - Shows variation count in real-time

// Tab 3: Position Configuration
//   - Takeprofit range (from/to/step)
//   - Stoploss range (from/to/step)
//   - Trailing configuration

// Tab 4: Evaluation Settings
//   - Min profit factor threshold
//   - Position count threshold
//   - Max drawdown hours
//   - Backtest days
\`\`\`

### Theme System

**Themes:** Dark, White, Grey, BlackWhite, WhiteActive
**Styles:** Default, New York, Minimal, Rounded, Compact

**Usage:**
\`\`\`typescript
// In layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="white"
  themes={["dark", "white", "grey", "blackwhite"]}
>
  {children}
</ThemeProvider>

// Switching themes
const { setTheme } = useTheme()
setTheme('dark')

// Switching styles
document.documentElement.className = 'style-compact'
\`\`\`

---

## 7. SETTINGS & CONFIGURATION

### Complete Settings Structure

\`\`\`typescript
interface Settings {
  // OVERALL / MAIN
  base_volume_factor: number              // Default: 1.0
  positions_average: number               // Default: 50
  exchange_max_positions: number          // Default: 50
  order_valid_time: number                // Seconds, Default: 300
  use_average_profit: boolean             // Default: true
  max_volume: number                      // Default: 1000
  min_volume: number                      // Default: 10
  volume_factor_mode: string              // 'base' | 'dynamic'
  base_profit_factor: number              // Default: 1.2
  main_profit_factor: number              // Default: 1.5
  adjustment_threshold: number            // Default: 0.1
  enable_adjustment: boolean              // Default: true
  min_volume_enforcement: boolean         // Default: true
  
  // Leverage Configuration
  leverage_percentage: number             // 0.01-1.0, Default: 0.1 (10%)
  
  // Position Cost Configuration
  position_cost: number                   // 0.01-0.2, Default: 0.1 (0.1%)
  // CRITICAL: 0.1 = 0.1%, NOT 10%!
  
  // Symbol Configuration
  symbol_order_type: string               // volume24h, marketCap, priceChange24h, volatility, trades24h, alphabetical
  number_of_symbols_to_select: number     // 1-20, Default: 8
  quote_asset: string                     // usdt, usdc, busd, btc, eth
  use_main_symbols: boolean               // Default: true
  main_symbols: string[]                  // Default: ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL']
  forced_symbols: string[]                // Default: ['XRP', 'BCH']
  
  // EXCHANGE
  exchange_symbol_order: string           // Same as symbol_order_type
  exchange_position_cost: number          // Default: 0.1 (0.1%)
  
  // INDICATION
  // Direction Indication
  direction_enabled: boolean              // Default: true
  direction_interval: number              // ms, Default: 100
  direction_range_from: number            // Default: 3
  direction_range_to: number              // Default: 30
  direction_range_step: number            // Default: 1
  direction_drawdown_values: string       // "10,20,30,40,50"
  direction_market_change_from: number    // Default: 0.5
  direction_market_change_to: number      // Default: 5.0
  direction_market_change_step: number    // Default: 0.5
  direction_min_calc_time: number         // seconds, Default: 5
  direction_last_part_ratio: number       // 0.1-0.5, Default: 0.2 (20%)
  direction_ratio_factor_from: number     // Default: 1.0
  direction_ratio_factor_to: number       // Default: 2.5
  direction_ratio_factor_step: number     // Default: 0.5
  
  // Move Indication
  move_enabled: boolean                   // Default: true
  move_interval: number                   // ms, Default: 100
  move_range_from: number                 // Default: 3
  move_range_to: number                   // Default: 30
  // ... (same structure as direction)
  
  // Active Indication
  active_enabled: boolean                 // Default: true
  active_interval: number                 // ms, Default: 100
  active_range_from: number               // Default: 3
  active_range_to: number                 // Default: 30
  // ... (same structure as direction)
  active_activity_calculated_from: number // Default: 10
  active_activity_calculated_to: number   // Default: 50
  active_activity_calculated_step: number // Default: 5
  active_activity_last_part_from: number  // Default: 10
  active_activity_last_part_to: number    // Default: 50
  active_activity_last_part_step: number  // Default: 5
  
  // Common Indicators
  common_indicators: string[]             // ['rsi', 'macd', 'ema']
  
  // RSI Configuration
  rsi_enabled: boolean                    // Default: true
  rsi_period: number                      // Default: 14
  rsi_period_from: number                 // Default: 7 (50% of 14)
  rsi_period_to: number                   // Default: 21 (150% of 14)
  rsi_period_step: number                 // Default: 1
  rsi_oversold: number                    // Default: 30
  rsi_oversold_from: number               // Default: 15
  rsi_oversold_to: number                 // Default: 45
  rsi_oversold_step: number               // Default: 5
  rsi_overbought: number                  // Default: 70
  rsi_overbought_from: number             // Default: 35
  rsi_overbought_to: number               // Default: 105
  rsi_overbought_step: number             // Default: 5
  
  // MACD Configuration
  macd_enabled: boolean                   // Default: true
  macd_fast: number                       // Default: 12
  macd_fast_from: number                  // Default: 6
  macd_fast_to: number                    // Default: 18
  macd_fast_step: number                  // Default: 1
  macd_slow: number                       // Default: 26
  macd_slow_from: number                  // Default: 13
  macd_slow_to: number                    // Default: 39
  macd_slow_step: number                  // Default: 1
  macd_signal: number                     // Default: 9
  macd_signal_from: number                // Default: 5
  macd_signal_to: number                  // Default: 14
  macd_signal_step: number                // Default: 1
  
  // EMA Configuration
  ema_enabled: boolean                    // Default: true
  ema_period: number                      // Default: 20
  ema_period_from: number                 // Default: 10
  ema_period_to: number                   // Default: 30
  ema_period_step: number                 // Default: 1
  
  // STRATEGY
  // Main Strategy
  main_strategy_enabled: boolean          // Default: true
  main_takeprofit_factor: number          // Default: 1.02 (2%)
  main_stoploss_ratio: number             // Default: 0.5
  main_trailing_enabled: boolean          // Default: false
  main_trail_start: number                // Default: 1.01 (1%)
  main_trail_stop: number                 // Default: 0.005 (0.5%)
  
  // Adjust Strategy
  adjust_enabled: boolean                 // Default: true
  adjust_takeprofit_factor: number        // Default: 1.03 (3%)
  adjust_stoploss_ratio: number           // Default: 0.6
  // ... similar to main
  
  // Block Strategy
  block_enabled: boolean                  // Default: true
  block_threshold: number                 // Default: 80
  // ...
  
  // DCA Strategy
  dca_enabled: boolean                    // Default: false
  dca_levels: number                      // Default: 3
  dca_size_multiplier: number             // Default: 1.5
  // ...
  
  // Real Strategy
  real_enabled: boolean                   // Default: false
  real_min_profit_factor: number          // Default: 1.1
  // ...
  
  // Preset Strategy
  max_positions_per_config_direction: number // Default: 2
  
  // SYSTEM
  active_order_handling_interval: number  // ms, Default: 100 (INDEPENDENT)
  active_indication_interval: number      // ms, Default: 100 (COORDINATED)
  max_positions_per_symbol: number        // Default: 3
  max_positions_per_direction: number     // Default: 5
  enable_websocket: boolean               // Default: true
  log_level: string                       // 'debug' | 'info' | 'warn' | 'error'
  data_retention_days: number             // Default: 30
}
\`\`\`

### Critical Settings Notes

1. **Position Cost** - 0.1 means 0.1%, NOT 10%!
2. **Active Order Handling Interval** - 100ms, INDEPENDENT from Active Indication
3. **Active Indication Interval** - 100ms, COORDINATED with position checks
4. **Leverage Percentage** - 0.1 means 10% of available margin
5. **Max Positions Per Config Direction** - 2 positions max per configuration per direction

### Default Values Reference

\`\`\`typescript
const SETTINGS_DEFAULTS = {
  // Overall / Main
  base_volume_factor: 1.0,
  positions_average: 50,
  exchange_max_positions: 50,
  leverage_percentage: 0.1,           // 10%
  position_cost: 0.1,                 // 0.1% (NOT 10%)
  
  // Symbol Configuration
  symbol_order_type: 'volume24h',
  number_of_symbols_to_select: 8,
  quote_asset: 'usdt',
  use_main_symbols: true,
  main_symbols: ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL'],
  forced_symbols: ['XRP', 'BCH'],
  
  // Indication
  direction_enabled: true,
  direction_interval: 100,
  direction_range_from: 3,
  direction_range_to: 30,
  direction_range_step: 1,
  direction_drawdown_values: '10,20,30,40,50',
  direction_last_part_ratio: 0.2,     // 20%
  
  // Common Indicators
  rsi_enabled: true,
  rsi_period: 14,
  rsi_period_from: 7,                 // 50% of default
  rsi_period_to: 21,                  // 150% of default
  rsi_oversold: 30,
  rsi_overbought: 70,
  
  macd_enabled: true,
  macd_fast: 12,
  macd_slow: 26,
  macd_signal: 9,
  
  ema_enabled: true,
  ema_period: 20,
  
  // Strategy
  main_strategy_enabled: true,
  main_takeprofit_factor: 1.02,       // 2%
  main_stoploss_ratio: 0.5,
  
  // System
  active_order_handling_interval: 100,
  active_indication_interval: 100,
  max_positions_per_config_direction: 2,
  max_positions_per_symbol: 3,
}
\`\`\`

---

## 8. BUSINESS LOGIC

### Position Lifecycle

\`\`\`
1. INDICATION PHASE
   ├─ Market data collected
   ├─ Indication calculated (Direction/Move/Active)
   ├─ Signal generated with confidence
   └─ Signal passed to strategy processor

2. STRATEGY EVALUATION PHASE
   ├─ Check enabled strategies
   ├─ Evaluate position limits
   ├─ Calculate position cost
   ├─ Determine TP/SL levels
   └─ Create position if conditions met

3. POSITION CREATION PHASE
   ├─ Generate position ID
   ├─ Set entry price
   ├─ Set takeprofit price
   ├─ Set stoploss price
   ├─ Initialize trailing (if enabled)
   └─ Save to database

4. POSITION MONITORING PHASE
   ├─ Update price in real-time
   ├─ Calculate profit factor
   ├─ Check TP condition
   ├─ Check SL condition
   ├─ Update trailing stop (if enabled)
   └─ Log all updates

5. POSITION CLOSING PHASE
   ├─ TP/SL condition met
   ├─ Calculate final profit/loss
   ├─ Update position status to 'closed'
   ├─ Log closing reason
   ├─ Update statistics
   └─ Free position slot
\`\`\`

### Profit Factor Calculation

\`\`\`typescript
function calculateProfitFactor(
  entryPrice: number,
  currentPrice: number,
  direction: 'long' | 'short'
): number {
  if (direction === 'long') {
    return currentPrice / entryPrice
  } else {
    return entryPrice / currentPrice
  }
}

// Example:
// Long: Entry 100, Current 102 → PF = 102/100 = 1.02 (2% profit)
// Short: Entry 100, Current 98 → PF = 100/98 = 1.0204 (2.04% profit)
\`\`\`

### Takeprofit & Stoploss Logic

\`\`\`typescript
// Takeprofit condition
if (profitFactor >= takeprofitFactor) {
  closePosition('takeprofit')
}

// Stoploss condition
if (profitFactor <= (2 - stoplossRatio)) {
  closePosition('stoploss')
}

// Example:
// TP Factor: 1.02 (close at 2% profit)
// SL Ratio: 0.5 → SL Factor = 2 - 0.5 = 1.5
//   But this is wrong! Should be:
// SL Ratio: 0.5 → SL Factor = 1.0 - (1.0 - 1.0) * 0.5 = 0.99 (1% loss)

// CORRECT FORMULA:
const stoplossaFactor = 1.0 - ((takeprofitFactor - 1.0) * stoplossRatio)

// Example:
// TP Factor: 1.02 (2% profit target)
// SL Ratio: 0.5 (50% of profit target)
// SL Factor: 1.0 - (0.02 * 0.5) = 0.99 (1% loss limit)
\`\`\`

### Trailing Stop Logic

\`\`\`typescript
interface TrailingConfig {
  enabled: boolean
  start: number        // 1.01 (start trailing at 1% profit)
  stop: number         // 0.005 (stop 0.5% below peak)
}

let trailingPeak = entryPrice

function updateTrailing(currentPrice: number) {
  if (!trailingEnabled) return
  
  // Update peak if price improved
  if (currentPrice > trailingPeak) {
    trailingPeak = currentPrice
  }
  
  // Check if trailing activated
  const profitFactor = currentPrice / entryPrice
  if (profitFactor >= trailStart) {
    // Calculate stop price
    const stopPrice = trailingPeak * (1 - trailStop)
    
    // Close if price dropped below stop
    if (currentPrice <= stopPrice) {
      closePosition('trailing-stop')
    }
  }
}

// Example:
// Entry: 100
// Trail Start: 1.01 (activate at 101)
// Trail Stop: 0.005 (close 0.5% below peak)
//
// Price goes 100 → 101 (trailing activated)
// Peak: 101, Stop: 100.495
// Price goes 101 → 105 (new peak)
// Peak: 105, Stop: 104.475
// Price drops to 104 (below stop) → CLOSE
\`\`\`

### Configuration Variation Generator

\`\`\`typescript
function generateConfigurations(set: PresetSet): Configuration[] {
  const configs: Configuration[] = []
  
  // For each selected indicator
  for (const indicator of set.indicators) {
    // Generate parameter combinations
    const paramCombos = generateParamCombinations(indicator)
    
    // For each param combo
    for (const params of paramCombos) {
      // For each TP value
      for (let tp = set.tpFrom; tp <= set.tpTo; tp += set.tpStep) {
        // For each SL value
        for (let sl = set.slFrom; sl <= set.slTo; sl += set.slStep) {
          // For each trailing config
          for (const trailing of set.trailingConfigs) {
            configs.push({
              id: generateId(),
              setId: set.id,
              indicationType: indicator.type,
              indicationParams: params,
              takeprofitFactor: tp,
              stoplossRatio: sl,
              trailingConfig: trailing,
              maxPositions: 2  // Per direction
            })
          }
        }
      }
    }
  }
  
  return configs
}

// Example counts:
// RSI: period (7-21, step 1) = 15 variations
//      oversold (15-45, step 5) = 7 variations
//      overbought (35-105, step 5) = 15 variations
//      Total: 15 * 7 * 15 = 1,575 RSI configs
//
// TP: 1.01-1.05, step 0.01 = 5 variations
// SL: 0.3-0.7, step 0.1 = 5 variations
// Trailing: 2 variations (enabled/disabled)
//
// Total: 1,575 * 5 * 5 * 2 = 78,750 configurations!
\`\`\`

---

## 9. INTEGRATION GUIDE

### Setting Up a New Instance

#### Step 1: Database Setup

\`\`\`bash
# Option A: PostgreSQL (Recommended for production)
# Set environment variable
export REMOTE_POSTGRES_URL="postgresql://user:pass@host:5432/dbname"

# Option B: SQLite (Development)
# Automatic - creates database.db in root
\`\`\`

#### Step 2: Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

#### Step 3: Initialize Database

\`\`\`bash
# Run database initialization
npm run init-db
# or use API endpoint
curl -X POST http://localhost:3000/api/install/database/init
\`\`\`

#### Step 4: Configure Environment

\`\`\`env
# .env.local
NODE_ENV=development
REMOTE_POSTGRES_URL=postgresql://...
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
API_SIGNING_SECRET=your-api-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

#### Step 5: Start Application

\`\`\`bash
npm run dev
# Access at http://localhost:3000
\`\`\`

#### Step 6: Create Exchange Connection

1. Navigate to Settings → Exchange Connections
2. Click "Add Connection"
3. Fill in:
   - Name: "My Binance Account"
   - Exchange: Binance
   - API Type: Spot / Futures
   - Connection Method: Testnet / Mainnet
   - API Key: your-api-key
   - API Secret: your-api-secret
4. Click "Test Connection"
5. If successful, click "Save"
6. Enable connection

#### Step 7: Configure Settings

1. Navigate to Settings → Overall/Main
2. Configure:
   - Volume Factor: 1.0
   - Position Cost: 0.1 (0.1%)
   - Leverage: 0.1 (10%)
   - Symbol Configuration
3. Navigate to Settings → Indication
4. Enable desired indications:
   - Direction, Move, Active
5. Configure ranges and parameters
6. Navigate to Settings → Strategy
7. Enable desired strategies:
   - Main, Adjust, Block, DCA
8. Click "Save All Settings"

#### Step 8: Start Trading

1. Navigate to Dashboard
2. Find your connection card
3. Click "Start Engine"
4. Monitor positions in real-time
5. View analytics in Statistics page

### Exchange Connector Implementation

To add a new exchange:

#### 1. Create Connector Class

\`\`\`typescript
// lib/exchange-connectors/your-exchange-connector.ts

import { BaseExchangeConnector } from './base-connector'

export class YourExchangeConnector extends BaseExchangeConnector {
  async connect(): Promise<boolean> {
    // Initialize exchange API client
    // Verify credentials
    // Return connection status
  }
  
  async getMarketPrice(symbol: string): Promise<number> {
    // Fetch current market price
    // Handle symbol format conversion
    // Return price
  }
  
  async getSymbols(): Promise<string[]> {
    // Fetch all trading symbols
    // Filter by quote asset
    // Return symbol list
  }
  
  async placeOrder(params: OrderParams): Promise<Order> {
    // Place order on exchange
    // Handle order response
    // Return order details
  }
  
  async getPositions(): Promise<Position[]> {
    // Fetch open positions
    // Map to internal format
    // Return positions
  }
  
  async closePosition(positionId: string): Promise<boolean> {
    // Close position on exchange
    // Verify closure
    // Return success status
  }
}
\`\`\`

#### 2. Register Connector

\`\`\`typescript
// lib/exchange-connectors/index.ts

import { YourExchangeConnector } from './your-exchange-connector'

export function getExchangeConnector(exchange: string) {
  switch (exchange.toLowerCase()) {
    case 'binance':
      return new BinanceConnector()
    case 'bybit':
      return new ByBitConnector()
    case 'yourexchange':
      return new YourExchangeConnector()
    default:
      throw new Error(`Unsupported exchange: ${exchange}`)
  }
}
\`\`\`

#### 3. Add to Configuration

\`\`\`typescript
// lib/constants/types.ts

export const SUPPORTED_EXCHANGES = [
  'Binance',
  'ByBit',
  'BingX',
  'OKX',
  'OrangeX',
  'Pionex',
  'YourExchange'  // Add here
] as const
\`\`\`

---

## 10. DEPLOYMENT

### Production Deployment

#### Option 1: Vercel (Recommended)

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - REMOTE_POSTGRES_URL
# - SESSION_SECRET
# - JWT_SECRET
# - ENCRYPTION_KEY
# - API_SIGNING_SECRET
\`\`\`

#### Option 2: Docker

\`\`\`dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

\`\`\`bash
# Build
docker build -t cts-v3 .

# Run
docker run -p 3000:3000 \
  -e REMOTE_POSTGRES_URL=postgresql://... \
  -e SESSION_SECRET=... \
  cts-v3
\`\`\`

#### Option 3: VPS / Dedicated Server

\`\`\`bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-repo/cts-v3.git
cd cts-v3

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "cts-v3" -- start
pm2 save
pm2 startup
\`\`\`

### Database Backup & Restore

#### Backup

\`\`\`bash
# PostgreSQL
pg_dump -U username -h host dbname > backup.sql

# SQLite
cp database.db database_backup.db

# Via API
curl -X POST http://localhost:3000/api/install/backup/create \
  -H "Content-Type: application/json" \
  -d '{"name":"my-backup"}'
\`\`\`

#### Restore

\`\`\`bash
# PostgreSQL
psql -U username -h host dbname < backup.sql

# SQLite
cp database_backup.db database.db

# Via API
curl -X POST http://localhost:3000/api/install/backup/restore \
  -H "Content-Type: application/json" \
  -d '{"backupId":"backup-id"}'
\`\`\`

### Monitoring & Maintenance

#### Health Checks

\`\`\`bash
# System health
curl http://localhost:3000/api/monitoring/system

# Database status
curl http://localhost:3000/api/settings/database-status

# Engine status
curl http://localhost:3000/api/trade-engine/status
\`\`\`

#### Log Management

\`\`\`bash
# Export logs
curl http://localhost:3000/api/monitoring/logs/export > logs.json

# Clear old logs
curl -X POST http://localhost:3000/api/database/cleanup-historical
\`\`\`

#### Performance Optimization

1. **Database Indexing**
\`\`\`sql
CREATE INDEX idx_positions_status ON pseudo_positions(status);
CREATE INDEX idx_positions_connection ON pseudo_positions(connection_id);
CREATE INDEX idx_positions_symbol ON pseudo_positions(symbol);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
\`\`\`

2. **Data Retention**
\`\`\`typescript
// In Settings → System
data_retention_days: 30  // Keep only 30 days of historical data
\`\`\`

3. **WebSocket Optimization**
\`\`\`typescript
// In Settings → System
enable_websocket: true  // Real-time updates
\`\`\`

---

## APPENDIX A: Troubleshooting

### Common Issues

#### Issue: Positions not opening
**Causes:**
- Indication not generating signals
- Position limits reached
- Insufficient volume
- Exchange API errors

**Solutions:**
1. Check indication settings (enabled, interval, range)
2. Verify position limits (max per symbol, per direction)
3. Check volume settings (min/max volume)
4. Review exchange connection logs

#### Issue: Positions closing immediately
**Causes:**
- TP/SL too tight
- Price volatility
- Trailing stop too aggressive

**Solutions:**
1. Increase TP factor (e.g., 1.02 → 1.03)
2. Adjust SL ratio (e.g., 0.5 → 0.6)
3. Widen trailing stop gap

#### Issue: Database connection errors
**Causes:**
- Invalid connection string
- Network issues
- Database not initialized

**Solutions:**
1. Verify REMOTE_POSTGRES_URL format
2. Test database connectivity
3. Run database initialization
4. Check firewall settings

#### Issue: High CPU usage
**Causes:**
- Too many active connections
- Indication interval too short
- Too many active positions

**Solutions:**
1. Reduce active connections
2. Increase indication interval (100ms → 200ms)
3. Lower max positions per symbol
4. Enable WebSocket for efficiency

---

## APPENDIX B: API Response Examples

### GET /api/settings

\`\`\`json
{
  "settings": {
    "base_volume_factor": 1.0,
    "positions_average": 50,
    "exchange_max_positions": 50,
    "leverage_percentage": 0.1,
    "position_cost": 0.1,
    "symbol_order_type": "volume24h",
    "number_of_symbols_to_select": 8,
    "quote_asset": "usdt",
    "use_main_symbols": true,
    "main_symbols": ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL"],
    "forced_symbols": ["XRP", "BCH"],
    "direction_enabled": true,
    "direction_interval": 100,
    "direction_range_from": 3,
    "direction_range_to": 30,
    "rsi_enabled": true,
    "rsi_period": 14,
    "macd_enabled": true,
    "main_strategy_enabled": true,
    "main_takeprofit_factor": 1.02,
    "main_stoploss_ratio": 0.5,
    "max_positions_per_config_direction": 2
  }
}
\`\`\`

### GET /api/positions

\`\`\`json
{
  "positions": [
    {
      "id": "pos_abc123",
      "connection_id": "conn_xyz789",
      "symbol": "BTCUSDT",
      "indication_type": "direction",
      "takeprofit_factor": 1.02,
      "stoploss_ratio": 0.5,
      "trailing_enabled": false,
      "entry_price": 50000,
      "current_price": 50500,
      "profit_factor": 1.01,
      "position_cost": 0.1,
      "status": "active",
      "created_at": "2025-01-26T10:00:00Z",
      "indication_range": 10,
      "indication_interval": 100,
      "position_age_seconds": 3600,
      "total_updates": 36000
    }
  ]
}
\`\`\`

### POST /api/preset-sets/[id]/evaluate

\`\`\`json
{
  "evaluation": {
    "setId": "set_abc123",
    "evaluatedAt": "2025-01-26T12:00:00Z",
    "symbolPerformance": [
      {
        "symbol": "BTCUSDT",
        "recentPositions": 15,
        "profitFactor": 1.15,
        "winRate": 0.67,
        "avgDrawdownHours": 2.5,
        "status": "healthy"
      },
      {
        "symbol": "ETHUSDT",
        "recentPositions": 12,
        "profitFactor": 0.95,
        "winRate": 0.42,
        "avgDrawdownHours": 8.3,
        "status": "underperforming"
      }
    ],
    "shouldDisable": true,
    "reason": "ETHUSDT profit factor (0.95) below threshold (1.20) for 12 positions",
    "overallStats": {
      "totalPositions": 27,
      "avgProfitFactor": 1.06,
      "winRate": 0.56
    }
  }
}
\`\`\`

---

## APPENDIX C: Database Initialization SQL

### Complete Schema Creation

\`\`\`sql
-- Exchange Connections
CREATE TABLE exchange_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  api_type TEXT NOT NULL,
  connection_method TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_live_trade BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pseudo Positions
CREATE TABLE pseudo_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  indication_type TEXT NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_enabled BOOLEAN DEFAULT false,
  trail_start REAL,
  trail_stop REAL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  profit_factor REAL NOT NULL,
  position_cost REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  indication_range INTEGER,
  indication_interval INTEGER,
  indication_timeout INTEGER,
  strategy_type TEXT,
  strategy_step INTEGER,
  strategy_interval INTEGER,
  position_age_seconds INTEGER,
  last_update_interval INTEGER,
  avg_update_interval INTEGER,
  total_updates INTEGER DEFAULT 0,
  initial_profit_factor REAL,
  max_profit_factor REAL,
  min_profit_factor REAL,
  avg_profit_factor REAL,
  profit_factor_volatility REAL,
  last_check_timestamp TIMESTAMP,
  checks_per_minute REAL,
  price_updates_count INTEGER DEFAULT 0,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
);

-- Real Positions
CREATE TABLE real_positions (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  exchange_position_id TEXT,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  volume REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  takeprofit REAL,
  stoploss REAL,
  profit_loss REAL NOT NULL,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  indication_type TEXT,
  indication_range INTEGER,
  indication_interval INTEGER,
  strategy_interval INTEGER,
  position_duration_seconds INTEGER,
  avg_check_interval_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  initial_profit_loss REAL,
  max_profit REAL,
  max_loss REAL,
  profit_volatility REAL,
  FOREIGN KEY (connection_id) REFERENCES exchange_connections (id)
);

-- System Settings
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset Types
CREATE TABLE preset_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preset Configuration Sets
CREATE TABLE preset_configuration_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preset_type_id TEXT NOT NULL,
  indicators TEXT NOT NULL,
  position_config TEXT NOT NULL,
  evaluation_settings TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_evaluation_at TIMESTAMP,
  evaluation_result TEXT,
  auto_disable_reason TEXT,
  min_profit_factor REAL DEFAULT 1.2,
  position_count_threshold INTEGER DEFAULT 10,
  total_completed_positions INTEGER DEFAULT 0,
  winning_positions INTEGER DEFAULT 0,
  losing_positions INTEGER DEFAULT 0,
  FOREIGN KEY (preset_type_id) REFERENCES preset_types (id)
);

-- Preset Configurations
CREATE TABLE preset_configurations (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL,
  symbol TEXT,
  indication_type TEXT NOT NULL,
  indication_params TEXT NOT NULL,
  takeprofit_factor REAL NOT NULL,
  stoploss_ratio REAL NOT NULL,
  trailing_config TEXT,
  performance_stats TEXT,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (set_id) REFERENCES preset_configuration_sets (id)
);

-- Logs
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Errors
CREATE TABLE errors (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context TEXT,
  resolved BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site Logs
CREATE TABLE site_logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  stack TEXT,
  metadata TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_positions_status ON pseudo_positions(status);
CREATE INDEX idx_positions_connection ON pseudo_positions(connection_id);
CREATE INDEX idx_positions_symbol ON pseudo_positions(symbol);
CREATE INDEX idx_real_positions_status ON real_positions(status);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_errors_resolved ON errors(resolved);
\`\`\`

---

## CONCLUSION

This documentation provides a complete reference for the CTS v3 Crypto Trading System. With this information, you can:

1. Understand the entire system architecture
2. Recreate the database schema
3. Implement core trading engines
4. Build API endpoints
5. Develop UI components
6. Configure settings properly
7. Deploy to production
8. Maintain and troubleshoot

**Key Takeaways:**

- Position Cost: 0.1 = 0.1% (NOT 10%)
- Max Positions Per Config: 2 per direction
- Active Intervals: 100ms (coordinated)
- Indication Ranges: 50% variation from defaults
- Preset System: Automatic hourly evaluation
- Multi-exchange support with connector pattern

For updates and additional resources, refer to the backup files in `/backups` directory.

**Version:** 3.1
**Last Updated:** 2025-01-26
**Status:** Production Ready
