# System Architecture & Coordination Guide v3.1

**Purpose**: Central coordination document for understanding system architecture, managing changes, and maintaining consistency across the CTS v3.1 trading system.

**Last Updated**: January 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Trade Engine Architecture](#trade-engine-architecture)
3. [Component Relationships](#component-relationships)
4. [API Route Structure](#api-route-structure)
5. [Database Schema](#database-schema)
6. [State Management](#state-management)
7. [Change Management Guidelines](#change-management-guidelines)
8. [Common Operations Guide](#common-operations-guide)

---

## System Overview

### Core Architecture

CTS v3.1 uses a dual-architecture trading system:

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    CTS v3.1 Trading System                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │      GlobalTradeEngineCoordinator                  │    │
│  │  (Orchestrates all trading operations)             │    │
│  │                                                      │    │
│  │  States: Stopped → Running → Paused → Running      │    │
│  │  Methods: start(), stop(), pause(), resume()       │    │
│  └──────────────┬──────────────┬──────────────────────┘    │
│                 │              │                             │
│                 │              │                             │
│     ┌───────────▼──────┐  ┌───▼──────────────┐            │
│     │  TradeEngine     │  │  TradeEngine     │            │
│     │  (Exchange 1)    │  │  (Exchange 2)    │  ...       │
│     │  Per-connection  │  │  Per-connection  │            │
│     └──────────────────┘  └──────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Key Architectural Changes (v3.0 → v3.1)

#### 1. **ContinuousTradeEngine → GlobalTradeEngineCoordinator**

**Old (v3.0)**:
- Single monolithic class: `ContinuousTradeEngine`
- All operations in one class
- Located in: `lib/trade-engine.ts`

**New (v3.1)**:
- **GlobalTradeEngineCoordinator**: Coordinates all global operations
  - File: `lib/trade-engine.ts`
  - Manages: Lifecycle, strategies, global state
- **TradeEngine**: Per-connection engine instances
  - File: `lib/trade-engine/trade-engine.tsx`
  - Manages: Individual exchange trading logic

#### 2. **New Pause/Resume Functionality**

**Addition**: Intermediate state between Running and Stopped

**States**:
1. **Stopped**: Engine not initialized
2. **Running**: Active trading operations
3. **Paused**: Temporarily halted (NEW)
4. **Resuming**: Returning to running state (NEW)

**Implementation**:
\`\`\`typescript
// Global Coordinator State
{
  running: boolean      // Is engine started?
  paused: boolean      // Is it paused?
  pauseTime?: Date     // When was it paused?
  startTime?: Date     // When was it started?
}
\`\`\`

**Methods**:
- `pause()`: Pauses without stopping loops
- `resume()`: Continues from paused state
- `stop()`: Complete shutdown
- `start()`: Initialize and start

---

## Trade Engine Architecture

### File Structure

\`\`\`
lib/
├── trade-engine.ts                          # Main coordinator file
│   │
│   ├── Interface: TradeEngineInterface
│   │   ├── start(): Promise<void>
│   │   ├── stop(): Promise<void>
│   │   ├── pause(): Promise<void>          ← NEW
│   │   ├── resume(): Promise<void>         ← NEW
│   │   ├── isRunning(): boolean
│   │   ├── isPaused(): boolean             ← NEW
│   │   └── getStatus(): EngineStatus
│   │
│   ├── Class: GlobalTradeEngineCoordinator
│   │   └── Implements TradeEngineInterface
│   │
│   ├── export function getTradeEngine()
│   ├── export function getGlobalCoordinator()
│   ├── export function initializeTradeEngine()
│   ├── export function initializeGlobalCoordinator()
│   └── export { TradeEngine, TradeEngineConfig } from "./trade-engine/trade-engine"
│
└── trade-engine/
    │
    ├── index.ts                             # Barrel exports
    │   └── Re-exports everything from parent + TradeEngine
    │
    └── trade-engine.tsx                     # Per-connection engine
        ├── export interface TradeEngineConfig
        └── export class TradeEngine
\`\`\`

### Import Patterns

**Recommended Imports**:

\`\`\`typescript
// Global Coordinator
import { getTradeEngine, GlobalTradeEngineCoordinator } from "@/lib/trade-engine"

// Per-Connection Engine
import { TradeEngine, type TradeEngineConfig } from "@/lib/trade-engine"

// Alternative (explicit)
import { getGlobalCoordinator } from "@/lib/trade-engine"

// Barrel export (works for everything)
import { 
  getTradeEngine,
  GlobalTradeEngineCoordinator,
  TradeEngine,
  TradeEngineConfig 
} from "@/lib/trade-engine"
\`\`\`

**DO NOT USE** (deprecated):
\`\`\`typescript
// ❌ Old naming - no longer exists
import { ContinuousTradeEngine } from "@/lib/trade-engine"

// ❌ Direct subdirectory imports - use barrel exports
import { TradeEngine } from "@/lib/trade-engine/trade-engine"
\`\`\`

### Lifecycle Methods

#### start()
- Initializes all engine loops
- Sets `running = true`
- Records `startTime`
- Starts: mainEngine, presetEngine, activeOrderManager loops

#### pause()
- Temporary halt without stopping loops
- Sets `paused = true`
- Records `pauseTime`
- Maintains all state and connections
- Loops continue but skip processing when paused

#### resume()
- Continues from paused state
- Sets `paused = false`
- Clears `pauseTime`
- Returns to normal operation

#### stop()
- Complete shutdown
- Sets `running = false`, `paused = false`
- Clears all intervals
- Cleans up resources

---

## Component Relationships

### UI → API → Engine Flow

\`\`\`
User Interface
    ↓
GlobalTradeEngineControls Component
    ↓ (Calls API endpoints)
API Routes (/api/trade-engine/*)
    ↓ (Gets engine instance)
getTradeEngine()
    ↓ (Returns coordinator)
GlobalTradeEngineCoordinator
    ↓ (Manages)
TradeEngine instances (per-connection)
    ↓ (Executes on)
Exchange Connections
\`\`\`

### Component Dependency Map

\`\`\`
app/page.tsx (Dashboard)
├─> GlobalTradeEngineControls
│   ├─> /api/trade-engine/start
│   ├─> /api/trade-engine/stop
│   ├─> /api/trade-engine/pause       ← NEW
│   ├─> /api/trade-engine/resume      ← NEW
│   └─> /api/trade-engine/status
│
app/settings/page.tsx
├─> ConnectionInfoDialog
│   └─> /api/trade-engine/[connectionId]/start
├─> ConnectionLogDialog
├─> ConnectionSettingsDialog
│   └─> /api/trade-engine/[connectionId]/stop
│
All API Routes
├─> lib/trade-engine.ts
│   ├─> getTradeEngine()
│   └─> GlobalTradeEngineCoordinator methods
│
└─> lib/system-logger.ts
    └─> Database logging
\`\`\`

---

## API Route Structure

### Global Operations

| Endpoint | Method | Purpose | Engine Method |
|----------|--------|---------|---------------|
| `/api/trade-engine/start` | POST | Start global coordinator | `start()` |
| `/api/trade-engine/stop` | POST | Stop global coordinator | `stop()` |
| `/api/trade-engine/pause` | POST | Pause coordinator | `pause()` ← NEW |
| `/api/trade-engine/resume` | POST | Resume coordinator | `resume()` ← NEW |
| `/api/trade-engine/restart` | POST | Restart coordinator | `stop()` + `start()` |
| `/api/trade-engine/status` | GET | Get current status | `getStatus()` |

### Per-Connection Operations

| Endpoint | Method | Purpose | Engine Method |
|----------|--------|---------|---------------|
| `/api/trade-engine/[connectionId]/start` | POST | Start connection engine | TradeEngine.start() |
| `/api/trade-engine/[connectionId]/stop` | POST | Stop connection engine | TradeEngine.stop() |

### API Response Patterns

**Success Response**:
\`\`\`typescript
{
  success: true,
  message: "Operation completed",
  data?: any
}
\`\`\`

**Error Response**:
\`\`\`typescript
{
  success: false,
  error: "Error message",
  details?: string
}
\`\`\`

---

## Database Schema

### Key Tables

#### `connections` Table
- Stores exchange connection configurations
- Fields: id, name, exchange, apiKey, apiSecret, enabled, createdAt, updatedAt

#### `trade_engine_logs` Table
- Logs all engine state changes and operations
- Fields: id, message, level, context, timestamp

#### `positions` Table
- Tracks active and historical positions
- Fields: id, connectionId, symbol, side, size, entryPrice, exitPrice, status, createdAt, closedAt

#### `orders` Table
- Records all orders placed
- Fields: id, connectionId, symbol, side, type, size, price, status, createdAt, filledAt

### Database Access Patterns

\`\`\`typescript
// In API routes
import { db } from "@/lib/db"

// Query connections
const connections = await db.query("SELECT * FROM connections WHERE enabled = ?", [true])

// Log to database
import { SystemLogger } from "@/lib/system-logger"
await SystemLogger.logTradeEngine("Message", "info")
\`\`\`

---

## State Management

### Global State

**Location**: `lib/trade-engine.ts`

**Singleton Pattern**:
\`\`\`typescript
let globalCoordinator: GlobalTradeEngineCoordinator | null = null

export function getTradeEngine(): GlobalTradeEngineCoordinator | null {
  return globalCoordinator
}
\`\`\`

### Per-Connection State

**Location**: `lib/trade-engine/trade-engine.tsx`

**Instance Pattern**:
\`\`\`typescript
// Each connection gets its own TradeEngine instance
const engine = new TradeEngine(config)
\`\`\`

### State Transitions

\`\`\`
┌──────────┐
│ Stopped  │
└────┬─────┘
     │ start()
     ▼
┌──────────┐
│ Running  │◄──────┐
└────┬─────┘       │
     │ pause()     │ resume()
     ▼             │
┌──────────┐       │
│  Paused  │───────┘
└────┬─────┘
     │ stop()
     ▼
┌──────────┐
│ Stopped  │
└──────────┘
\`\`\`

---

## Change Management Guidelines

### Adding New Engine Features

#### Step 1: Determine Scope

**Question**: Is this a global or per-connection feature?

- **Global**: Affects all connections, add to `GlobalTradeEngineCoordinator`
- **Per-Connection**: Affects individual exchanges, add to `TradeEngine`

#### Step 2: Update Core Engine

**For Global Features**:
1. Add method to `TradeEngineInterface` in `lib/trade-engine.ts`
2. Implement in `GlobalTradeEngineCoordinator` class
3. Export from `lib/trade-engine.ts` if needed
4. Re-export from `lib/trade-engine/index.ts` (barrel export)

**For Per-Connection Features**:
1. Add method to `TradeEngine` class in `lib/trade-engine/trade-engine.tsx`
2. Update `TradeEngineConfig` interface if needed
3. Ensure re-export from `lib/trade-engine.ts`

#### Step 3: Add API Routes

**Global Operations**:
- Create route: `app/api/trade-engine/[action]/route.ts`
- Call: `getTradeEngine().[method]()`

**Per-Connection Operations**:
- Create route: `app/api/trade-engine/[connectionId]/[action]/route.tsx`
- Get connection engine and call method

#### Step 4: Update UI

**Global Controls**:
- Update: `components/dashboard/global-trade-engine-controls.tsx`
- Add buttons/status displays

**Per-Connection Controls**:
- Update connection-specific components in `components/settings/`

#### Step 5: Add Logging

\`\`\`typescript
await SystemLogger.logTradeEngine("Action performed", "info")
\`\`\`

#### Step 6: Update Documentation

- Add to `SYSTEM_ARCHITECTURE_COORDINATION_V3.1.md` (this file)
- Update `SYSTEM_STRUCTURE_CHANGES_V3.1.md`
- Document in `TRADE_ENGINE_REFACTORING_V3.1.md`

### Adding New Engine States

1. Add state property to `GlobalTradeEngineCoordinator` class
2. Update `getStatus()` method to include new state
3. Update `/api/trade-engine/status` response type
4. Update UI to display new state
5. Add state transition logic
6. Document state flow

### Modifying Lifecycle Methods

1. Review existing methods: `start()`, `stop()`, `pause()`, `resume()`
2. Ensure compatibility with existing state transitions
3. Add SystemLogger calls for audit trail
4. Test all state transitions thoroughly
5. Update state diagram in documentation

### Testing Checklist

- [ ] Global coordinator starts correctly
- [ ] Global coordinator stops correctly
- [ ] Pause maintains state without losing data
- [ ] Resume continues from exact pause point
- [ ] Per-connection engines start independently
- [ ] Per-connection engines stop independently
- [ ] Status endpoint returns accurate real-time data
- [ ] UI controls reflect actual engine state immediately
- [ ] SystemLogger records all state changes
- [ ] No memory leaks on multiple start/stop cycles
- [ ] Proper cleanup on stop/pause
- [ ] All TypeScript types are correct
- [ ] Barrel exports work correctly

---

## Common Operations Guide

### Starting the Global Coordinator

\`\`\`typescript
// From API route
const engine = getTradeEngine()
if (engine) {
  await engine.start()
}

// From UI (via API call)
await fetch('/api/trade-engine/start', { method: 'POST' })
\`\`\`

### Pausing the Global Coordinator

\`\`\`typescript
// From API route
const engine = getTradeEngine()
if (engine) {
  await engine.pause()
}

// From UI (via API call)
await fetch('/api/trade-engine/pause', { method: 'POST' })
\`\`\`

### Resuming the Global Coordinator

\`\`\`typescript
// From API route
const engine = getTradeEngine()
if (engine) {
  await engine.resume()
}

// From UI (via API call)
await fetch('/api/trade-engine/resume', { method: 'POST' })
\`\`\`

### Checking Engine Status

\`\`\`typescript
// From API route
const engine = getTradeEngine()
if (engine) {
  const status = engine.getStatus()
  const isRunning = engine.isRunning()
  const isPaused = engine.isPaused()
}

// From UI (via API call)
const response = await fetch('/api/trade-engine/status')
const { status, isRunning, isPaused } = await response.json()
\`\`\`

### Starting a Per-Connection Engine

\`\`\`typescript
// From API route
const engine = new TradeEngine(config)
await engine.start()

// From UI (via API call)
await fetch(`/api/trade-engine/${connectionId}/start`, { method: 'POST' })
\`\`\`

### Logging Operations

\`\`\`typescript
import { SystemLogger } from "@/lib/system-logger"

// Trade engine logs
await SystemLogger.logTradeEngine("Engine started", "info")

// Error logs
await SystemLogger.logError(error, "trade-engine", "start")

// Custom context logs
await SystemLogger.log("Custom message", "info", { context: "custom" })
\`\`\`

---

## File Reference Guide

### Core Engine Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/trade-engine.ts` | Global coordinator | `GlobalTradeEngineCoordinator`, `getTradeEngine()` |
| `lib/trade-engine/trade-engine.tsx` | Per-connection engine | `TradeEngine`, `TradeEngineConfig` |
| `lib/trade-engine/index.ts` | Barrel exports | All engine-related exports |

### API Route Files

| File | Purpose | Methods |
|------|---------|---------|
| `app/api/trade-engine/start/route.ts` | Start coordinator | POST |
| `app/api/trade-engine/stop/route.ts` | Stop coordinator | POST |
| `app/api/trade-engine/pause/route.ts` | Pause coordinator | POST |
| `app/api/trade-engine/resume/route.ts` | Resume coordinator | POST |
| `app/api/trade-engine/status/route.ts` | Get status | GET |
| `app/api/trade-engine/[connectionId]/start/route.tsx` | Start connection | POST |
| `app/api/trade-engine/[connectionId]/stop/route.ts` | Stop connection | POST |

### UI Component Files

| File | Purpose | Used In |
|------|---------|---------|
| `components/dashboard/global-trade-engine-controls.tsx` | Global controls | Dashboard |
| `components/settings/connection-info-dialog.tsx` | Connection details | Settings |
| `components/settings/connection-log-dialog.tsx` | Connection logs | Settings |
| `components/settings/connection-settings-dialog.tsx` | Connection config | Settings |

### Utility Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/system-logger.ts` | Logging system | `SystemLogger` |
| `lib/db.ts` | Database access | `db` |
| `lib/types.ts` | TypeScript types | Various types |

### Documentation Files

| File | Purpose |
|------|---------|
| `SYSTEM_ARCHITECTURE_COORDINATION_V3.1.md` | This file - Central coordination guide |
| `SYSTEM_STRUCTURE_CHANGES_V3.1.md` | Detailed structural changes |
| `TRADE_ENGINE_REFACTORING_V3.1.md` | Refactoring technical details |
| `TRADE_ENGINE_RELATION_MAP.md` | Component relationship map |
| `DATABASE_AUDIT_V3.1_REPORT.md` | Database structure |

---

## Common Pitfalls & Solutions

### Pitfall 1: Confusing Pause vs Stop

**Problem**: Using stop when you mean pause, losing state

**Solution**:
- **Pause**: Temporary halt, maintains all state, can resume
- **Stop**: Complete shutdown, clears everything, must restart

### Pitfall 2: Wrong Import Paths

**Problem**: Importing from subdirectories directly

**Solution**: Always use barrel exports
\`\`\`typescript
// ❌ Wrong
import { TradeEngine } from "@/lib/trade-engine/trade-engine"

// ✅ Correct
import { TradeEngine } from "@/lib/trade-engine"
\`\`\`

### Pitfall 3: Missing SystemLogger Calls

**Problem**: State changes not logged, hard to debug

**Solution**: Log all significant operations
\`\`\`typescript
await SystemLogger.logTradeEngine("Engine paused", "info")
\`\`\`

### Pitfall 4: Forgetting Barrel Exports

**Problem**: New exports not accessible from package root

**Solution**: Always update `lib/trade-engine/index.ts`

### Pitfall 5: Mixing Global and Per-Connection

**Problem**: Calling global methods on per-connection engines

**Solution**: Use correct import and instance
\`\`\`typescript
// Global
const engine = getTradeEngine()
await engine.pause()

// Per-connection
const connectionEngine = new TradeEngine(config)
await connectionEngine.start()
\`\`\`

---

## Version History

### v3.1 (January 2026)
- Renamed `ContinuousTradeEngine` → `GlobalTradeEngineCoordinator`
- Added pause/resume functionality
- Created dual-architecture (global + per-connection)
- Added `GlobalTradeEngineControls` UI component
- Migrated from deprecated toast to Sonner
- Added comprehensive documentation

### v3.0 (Previous)
- Original `ContinuousTradeEngine` implementation
- Basic start/stop functionality
- Single monolithic architecture

---

## Quick Reference

### Most Common Operations

1. **Start trading**: `POST /api/trade-engine/start`
2. **Pause trading**: `POST /api/trade-engine/pause`
3. **Resume trading**: `POST /api/trade-engine/resume`
4. **Stop trading**: `POST /api/trade-engine/stop`
5. **Check status**: `GET /api/trade-engine/status`

### Most Common Files to Edit

1. `lib/trade-engine.ts` - Global coordinator logic
2. `components/dashboard/global-trade-engine-controls.tsx` - UI controls
3. `app/api/trade-engine/[action]/route.ts` - API endpoints

### Must-Update Files on Engine Changes

1. Core engine implementation
2. API routes (if adding endpoints)
3. UI components (if adding controls)
4. Barrel exports (`lib/trade-engine/index.ts`)
5. This documentation file

---

## Contact & Maintenance

This document should be updated whenever:
- New engine features are added
- State transitions change
- API endpoints are added/modified
- UI components are updated
- Architecture changes are made

**Maintainer Guidelines**:
1. Keep this file current with all changes
2. Document all architectural decisions
3. Provide clear examples
4. Update version history
5. Cross-reference related documentation

---

*Last Updated: January 2026*
*Document Version: 3.1*
*System Version: CTS v3.1*
