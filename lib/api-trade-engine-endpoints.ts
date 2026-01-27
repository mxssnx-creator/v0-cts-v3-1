/**
 * Trade Engine API - Unified Reference
 * 
 * Consolidated API for managing trade engines at both connection and global levels
 */

// ============================================================================
// CONNECTION-LEVEL ENDPOINTS (Per Exchange Connection)
// ============================================================================

/**
 * GET /api/trade-engine/[connectionId]
 * Get trade engine status for a specific connection
 * 
 * Query params:
 *   ?action=status|health
 * 
 * Response (status):
 * {
 *   connectionId: string
 *   connection: {
 *     name: string
 *     exchange: string
 *     enabled: boolean
 *     liveTrading: boolean
 *   }
 *   engine: {
 *     status: "running" | "stopped" | "error" | "initializing"
 *     health: "healthy" | "degraded" | "unhealthy"
 *     isRunning: boolean
 *     uptime: number (seconds)
 *   }
 *   processing: {
 *     indications: {
 *       cycleCount: number
 *       lastRun: string | null
 *       avgDuration: number (ms)
 *     }
 *     strategies: { ... }
 *     realtime: { ... }
 *   }
 *   lastUpdate: string
 * }
 * 
 * Response (health):
 * {
 *   connectionId: string
 *   status: "running" | "stopped" | "error" | "initializing"
 *   health: "healthy" | "degraded" | "unhealthy"
 *   components: {
 *     manager: string
 *     indications: string
 *     strategies: string
 *     realtime: string
 *   }
 *   metrics: {
 *     uptime: number
 *     cyclesCompleted: number
 *     lastUpdate: string | null
 *     errorCount: number
 *     successRate: number
 *   }
 *   lastHealthCheck: string | null
 * }
 */

/**
 * POST /api/trade-engine/[connectionId]
 * Control trade engine for a specific connection
 * 
 * Request body:
 * {
 *   action: "start" | "stop" | "reset" | "status" | "health"
 * }
 * 
 * start - Start the engine and begin trading
 * stop - Stop the engine gracefully
 * reset - Reset engine state and metrics
 * status - Get current status (same as GET)
 * health - Get health information (same as GET?action=health)
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   connectionId: string
 *   status: "running" | "stopped" | ...
 *   timestamp: string
 * }
 */

// ============================================================================
// GLOBAL-LEVEL ENDPOINTS (All Connections)
// ============================================================================

/**
 * GET /api/trade-engine/global
 * Get global trade engine status across all connections
 * 
 * Query params:
 *   ?action=status (default)
 * 
 * Response:
 * {
 *   global: {
 *     overallStatus: "running" | "stopped" | "unknown"
 *     enginesRunning: number
 *     enginesTotal: number
 *     activeConnections: number
 *     liveConnections: number
 *   }
 *   engines: [
 *     {
 *       connectionId: string
 *       status: string
 *       health: string
 *       running: boolean
 *       cycles: {
 *         indications: number
 *         strategies: number
 *         realtime: number
 *       }
 *       lastUpdate: string
 *       error?: string
 *     }
 *   ]
 *   timestamp: string
 * }
 */

/**
 * POST /api/trade-engine/global
 * Control global trade engine operations
 * 
 * Request body:
 * {
 *   action: "start-all" | "stop-all" | "pause" | "resume" | "emergency-stop"
 * }
 * 
 * start-all - Start engines on all enabled connections
 * stop-all - Stop engines on all active connections
 * pause - Pause all running engines without stopping
 * resume - Resume all paused engines
 * emergency-stop - Force stop all engines (sets error state)
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   connectionsStarted?: number
 *   connectionsStopped?: number
 *   timestamp: string
 * }
 */

// ============================================================================
// REMOVED LEGACY ENDPOINTS (DO NOT USE)
// ============================================================================

// REMOVED: POST /api/trade-engine/start
// USE: POST /api/trade-engine/[connectionId] with { action: "start" }
// OR: POST /api/trade-engine/global with { action: "start-all" }

// REMOVED: POST /api/trade-engine/stop
// USE: POST /api/trade-engine/[connectionId] with { action: "stop" }
// OR: POST /api/trade-engine/global with { action: "stop-all" }

// REMOVED: GET /api/trade-engine/status
// USE: GET /api/trade-engine/[connectionId]
// OR: GET /api/trade-engine/global

// REMOVED: POST /api/trade-engine/pause
// USE: POST /api/trade-engine/global with { action: "pause" }

// REMOVED: POST /api/trade-engine/resume
// USE: POST /api/trade-engine/global with { action: "resume" }

// REMOVED: POST /api/trade-engine/restart
// USE: POST /api/trade-engine/[connectionId] with { action: "stop" } then { action: "start" }

// REMOVED: POST /api/trade-engine/emergency-stop
// USE: POST /api/trade-engine/global with { action: "emergency-stop" }

// REMOVED: GET /api/trade-engine/progression
// FUNCTIONALITY: Replaced with unified metrics in trade-engine-state table

export const TRADE_ENGINE_ENDPOINTS = {
  connection: {
    get: "GET /api/trade-engine/[connectionId]",
    control: "POST /api/trade-engine/[connectionId]",
    actions: ["start", "stop", "reset", "status", "health"],
  },
  global: {
    get: "GET /api/trade-engine/global",
    control: "POST /api/trade-engine/global",
    actions: ["start-all", "stop-all", "pause", "resume", "emergency-stop"],
  },
}
