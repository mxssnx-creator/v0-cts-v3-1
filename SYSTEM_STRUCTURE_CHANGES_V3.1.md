# System Structure Changes Documentation v3.1

**Document Purpose**: Track major architectural changes for relation coordination and future system modifications.

**Last Updated**: January 2026

---

## Major Refactoring: ContinuousTradeEngine → GlobalTradeEngineCoordinator

### Overview
The trade engine system was refactored from a monolithic `ContinuousTradeEngine` to a more flexible dual-architecture system consisting of:

1. **GlobalTradeEngineCoordinator** - Coordinates all trading operations globally
2. **TradeEngine** - Per-connection trade engine instances

### Architectural Changes

#### 1. Naming Changes

**Old Structure**:
- `ContinuousTradeEngine` (single class handling all operations)
- Located in: `lib/trade-engine.ts`

**New Structure**:
- `GlobalTradeEngineCoordinator` (global coordinator)
  - Located in: `lib/trade-engine.ts`
  - Purpose: Orchestrates all trading operations, manages lifecycle
- `TradeEngine` (per-connection engine)
  - Located in: `lib/trade-engine/trade-engine.tsx`
  - Purpose: Handles individual exchange connection trading logic

#### 2. New Functionality: Pause/Resume

**Added Methods**:
- `pause()` - Pauses the global coordinator without stopping it
  - Sets `paused` flag to true
  - Records `pauseTime` timestamp
  - Maintains all connections and state
  - Does NOT stop the engine loops

- `resume()` - Resumes a paused coordinator
  - Sets `paused` flag to false
  - Clears `pauseTime` timestamp
  - Continues from where it was paused

**Existing Methods** (for comparison):
- `start()` - Initializes and starts all engine loops
- `stop()` - Completely stops all operations and cleans up

#### 3. API Endpoints

**New Endpoints**:
- `POST /api/trade-engine/pause` - Pause the global coordinator
- `POST /api/trade-engine/resume` - Resume the paused coordinator

**Existing Endpoints**:
- `POST /api/trade-engine/start` - Start the global coordinator
- `POST /api/trade-engine/stop` - Stop the global coordinator
- `POST /api/trade-engine/restart` - Restart with optional cache clearing
- `GET /api/trade-engine/status` - Get current status
- `POST /api/trade-engine/[connectionId]/start` - Start per-connection engine
- `POST /api/trade-engine/[connectionId]/stop` - Stop per-connection engine

#### 4. UI Components

**New Component**:
- `GlobalTradeEngineControls` 
  - Located in: `components/dashboard/global-trade-engine-controls.tsx`
  - Displays: Real-time status, metrics, cycle performance
  - Controls: Start, Pause, Resume, Stop buttons
  - Integrated in: Main dashboard (`app/page.tsx`)

### File Structure Changes

\`\`\`
lib/
├── trade-engine.ts                          # GlobalTradeEngineCoordinator
│   ├── export class GlobalTradeEngineCoordinator
│   ├── export function getTradeEngine()
│   ├── export function getGlobalCoordinator()
│   ├── export function createTradeEngine()
│   ├── export function initializeGlobalCoordinator()
│   └── export { TradeEngine, TradeEngineConfig } from "./trade-engine/trade-engine"
│
└── trade-engine/
    ├── index.ts                             # Barrel exports
    │   └── Re-exports all from parent + TradeEngine
    │
    └── trade-engine.tsx                     # Per-connection TradeEngine
        ├── export interface TradeEngineConfig
        └── export class TradeEngine

app/api/trade-engine/
├── pause/route.ts                           # NEW: Pause endpoint
├── resume/route.ts                          # NEW: Resume endpoint
├── start/route.ts                           # Global coordinator start
├── stop/route.ts                            # Global coordinator stop
├── restart/route.ts                         # Global coordinator restart
├── status/route.ts                          # Status endpoint
└── [connectionId]/
    ├── start/route.tsx                      # Per-connection start
    └── stop/route.ts                        # Per-connection stop

components/dashboard/
└── global-trade-engine-controls.tsx         # NEW: UI controls component
\`\`\`

### State Management

**GlobalTradeEngineCoordinator State**:
\`\`\`typescript
{
  running: boolean           // Is the engine started?
  paused: boolean           // Is it paused? (only valid when running=true)
  pauseTime?: Date          // When was it paused?
  startTime?: Date          // When was it started?
  strategies: StrategyConfig[]
  indications: any
  mainEngineCycleCount: number
  presetEngineCycleCount: number
  activeOrderCycleCount: number
  // ... cycle timing stats
}
\`\`\`

**Status Flow**:
1. **Stopped**: `running=false, paused=false`
2. **Running**: `running=true, paused=false`
3. **Paused**: `running=true, paused=true`
4. **Resuming**: Returns to `running=true, paused=false`

### Import Patterns

**Recommended Imports**:
\`\`\`typescript
// For global coordinator
import { getTradeEngine, GlobalTradeEngineCoordinator } from "@/lib/trade-engine"

// For per-connection engines
import { TradeEngine, type TradeEngineConfig } from "@/lib/trade-engine"

// Alternative (explicit)
import { getGlobalCoordinator } from "@/lib/trade-engine"
\`\`\`

**Deprecated Imports** (but still work for backward compatibility):
\`\`\`typescript
// Old naming - getTradeEngine still returns GlobalTradeEngineCoordinator
import { ContinuousTradeEngine } from "@/lib/trade-engine" // ❌ No longer exists
\`\`\`

### Migration Guide for Future Changes

#### When Adding New Trade Engine Features:

1. **Determine Scope**:
   - Global operation → Add to `GlobalTradeEngineCoordinator` in `lib/trade-engine.ts`
   - Per-connection operation → Add to `TradeEngine` in `lib/trade-engine/trade-engine.tsx`

2. **Update API Routes**:
   - Global operations → `/api/trade-engine/[action]`
   - Per-connection → `/api/trade-engine/[connectionId]/[action]`

3. **Update UI**:
   - Global controls → `GlobalTradeEngineControls` component
   - Per-connection → Connection-specific components

4. **Update Exports**:
   - Add exports to `lib/trade-engine.ts` (for global features)
   - Add re-exports to `lib/trade-engine/index.ts` (barrel exports)

#### When Adding New Engine States:

1. Update `GlobalTradeEngineCoordinator` state properties
2. Update `getStatus()` method to include new state
3. Update `/api/trade-engine/status` endpoint response type
4. Update `GlobalTradeEngineControls` component to display new state
5. Add corresponding API endpoints if needed

#### When Modifying Engine Lifecycle:

1. Review existing methods: `start()`, `stop()`, `pause()`, `resume()`
2. Ensure new states work with existing state transitions
3. Update SystemLogger calls for audit trail
4. Test state transitions thoroughly
5. Document new state flow in this file

### Testing Checklist for Engine Changes

- [ ] Global coordinator starts correctly
- [ ] Global coordinator stops correctly
- [ ] Pause/Resume work without losing state
- [ ] Per-connection engines start independently
- [ ] Per-connection engines stop independently
- [ ] Status endpoint returns accurate data
- [ ] UI controls reflect actual engine state
- [ ] SystemLogger records all state changes
- [ ] No memory leaks on start/stop cycles
- [ ] Proper cleanup on stop/pause

### Related Files to Check on Engine Changes

**Core Engine**:
- `lib/trade-engine.ts` - Main coordinator
- `lib/trade-engine/trade-engine.tsx` - Per-connection engine
- `lib/trade-engine/index.ts` - Barrel exports

**API Routes**:
- `app/api/trade-engine/*.ts` - All global endpoints
- `app/api/trade-engine/[connectionId]/*.ts` - Per-connection endpoints

**UI Components**:
- `components/dashboard/global-trade-engine-controls.tsx` - Main controls
- `components/settings/connection-*.tsx` - Connection-specific components
- `app/page.tsx` - Dashboard integration

**Utilities**:
- `lib/system-logger.ts` - Logging system
- `lib/db.ts` - Database operations

**Documentation**:
- `TRADE_ENGINE_REFACTORING_V3.1.md` - Original refactoring docs
- `SYSTEM_STRUCTURE_CHANGES_V3.1.md` - This file
- `DATABASE_AUDIT_V3.1_REPORT.md` - Database structure

### Common Pitfalls to Avoid

1. **Don't confuse pause with stop**:
   - Pause: Temporary halt, maintains state, can resume
   - Stop: Complete shutdown, clears state, must restart

2. **Don't forget barrel exports**:
   - Always update `lib/trade-engine/index.ts` when adding exports
   - Add re-exports to `lib/trade-engine.ts` when needed

3. **Don't skip SystemLogger calls**:
   - All state changes should be logged
   - Helps with debugging and audit trails

4. **Don't mix global and per-connection operations**:
   - Keep them separate in API routes
   - Use correct import paths

5. **Don't forget to update TypeScript types**:
   - Update interfaces when adding new properties
   - Export types from barrel exports

### Version History

**v3.1 (January 2026)**:
- Refactored `ContinuousTradeEngine` → `GlobalTradeEngineCoordinator`
- Added pause/resume functionality
- Created dual-architecture system (global + per-connection)
- Added `GlobalTradeEngineControls` UI component
- Updated all API endpoints
- Migrated from deprecated toast to Sonner

**v3.0 (Previous)**:
- Original `ContinuousTradeEngine` implementation
- Basic start/stop functionality
- Single monolithic architecture

---

## Contact & Support

For questions about these changes or future modifications:
1. Review this document first
2. Check `TRADE_ENGINE_REFACTORING_V3.1.md` for technical details
3. Search codebase for usage examples
4. Update this document when making structural changes
