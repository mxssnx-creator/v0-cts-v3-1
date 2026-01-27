# Trade Engine Relation Map

**Quick Reference**: How different parts of the system interact with the trade engine.

---

## Component Relationships

### Frontend → Backend Flow

\`\`\`
Dashboard (app/page.tsx)
    └─> GlobalTradeEngineControls component
        └─> Fetch API calls
            ├─> POST /api/trade-engine/start
            ├─> POST /api/trade-engine/pause
            ├─> POST /api/trade-engine/resume
            ├─> POST /api/trade-engine/stop
            └─> GET /api/trade-engine/status
                └─> lib/trade-engine.ts (GlobalTradeEngineCoordinator)
\`\`\`

### API Endpoint → Engine Coordinator

\`\`\`
/api/trade-engine/pause
    └─> getTradeEngine()
        └─> GlobalTradeEngineCoordinator.pause()
            └─> SystemLogger.logTradeEngine()

/api/trade-engine/resume
    └─> getTradeEngine()
        └─> GlobalTradeEngineCoordinator.resume()
            └─> SystemLogger.logTradeEngine()

/api/trade-engine/start
    └─> createTradeEngine() or getTradeEngine()
        └─> GlobalTradeEngineCoordinator.start()
            └─> SystemLogger.logTradeEngine()

/api/trade-engine/stop
    └─> getTradeEngine()
        └─> GlobalTradeEngineCoordinator.stop()
            └─> SystemLogger.logTradeEngine()
\`\`\`

### Per-Connection Engine Flow

\`\`\`
Connection Settings (app/settings/page.tsx)
    └─> Connection controls
        └─> POST /api/trade-engine/[connectionId]/start
            └─> TradeEngine instance
                └─> config from database
                └─> TradeEngine.start(config)

/api/trade-engine/[connectionId]/stop
    └─> Update database state
    └─> Engine stops on next cycle check
\`\`\`

## Data Flow

### Status Updates

\`\`\`
GlobalTradeEngineCoordinator
    ├─> mainEngineCycleCount (increments on main loop)
    ├─> presetEngineCycleCount (increments on preset loop)
    ├─> activeOrderCycleCount (increments on order loop)
    ├─> Timing statistics (avg duration per cycle)
    └─> getStatus() method
        └─> GET /api/trade-engine/status
            └─> GlobalTradeEngineControls component
                └─> UI display (updates every 3 seconds)
\`\`\`

### State Transitions

\`\`\`
[Stopped] ─start()─> [Running] ─pause()─> [Paused]
    ^                    |                      |
    |                    |                      |
    └─────stop()────────┘          resume()────┘
                                         |
                                         v
                                    [Running]
\`\`\`

## Database Relations

### Trade Engine State Storage

\`\`\`
connections table
    ├─> state: 'active' | 'stopped' | 'paused'
    ├─> updated_at: timestamp
    └─> Used by per-connection engines

No global state stored in database
    └─> GlobalTradeEngineCoordinator state is in-memory only
    └─> Status queried via API on-demand
\`\`\`

### System Logging

\`\`\`
system_logs table
    ├─> trade_engine events
    ├─> Logged by SystemLogger.logTradeEngine()
    └─> Captures:
        ├─> Start/Stop events
        ├─> Pause/Resume events
        ├─> Error conditions
        └─> State transitions
\`\`\`

## Import Dependencies

### Who imports what

\`\`\`
app/page.tsx
    └─> GlobalTradeEngineControls

GlobalTradeEngineControls
    └─> Sonner (toast)
    └─> shadcn/ui components

API routes (pause, resume, start, stop)
    └─> getTradeEngine from "@/lib/trade-engine"
    └─> SystemLogger from "@/lib/system-logger"

API routes (per-connection)
    └─> TradeEngine from "@/lib/trade-engine"
    └─> db from "@/lib/db"

lib/trade-engine/index.ts (barrel)
    └─> Re-exports from "../trade-engine"
    └─> Re-exports from "./trade-engine/trade-engine"
\`\`\`

## Key Integration Points

### 1. Dashboard Integration
- **File**: `app/page.tsx`
- **Component**: `<GlobalTradeEngineControls />`
- **Purpose**: Primary user interface for global engine control

### 2. Settings Integration
- **File**: `app/settings/page.tsx`
- **Components**: Connection-specific dialogs
- **Purpose**: Per-connection engine management

### 3. Monitoring Integration
- **File**: `lib/system-logger.ts`
- **Method**: `SystemLogger.logTradeEngine()`
- **Purpose**: Audit trail and debugging

### 4. Status Polling
- **Endpoint**: `GET /api/trade-engine/status`
- **Interval**: 3 seconds
- **Consumer**: `GlobalTradeEngineControls`

## When to Update This Map

Update this document when you:
- Add new API endpoints related to trade engine
- Create new UI components that control the engine
- Modify state flow or lifecycle methods
- Add new database tables/columns for engine state
- Change import patterns or file structure
- Add new integration points with other systems

---

**Last Updated**: January 2026
