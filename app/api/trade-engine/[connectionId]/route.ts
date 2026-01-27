import { type NextRequest, NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { sql } from "@/lib/db"

interface TradeEngineRequest {
  action?: "start" | "stop" | "reset" | "status" | "health"
}

interface EngineHealthStatus {
  connectionId: string
  status: "running" | "stopped" | "error" | "initializing"
  health: "healthy" | "degraded" | "unhealthy"
  components: {
    manager: string
    indications: string
    strategies: string
    realtime: string
  }
  metrics: {
    uptime: number
    cyclesCompleted: number
    lastUpdate: string | null
    errorCount: number
    successRate: number
  }
  lastHealthCheck: string | null
}

/**
 * GET - Get trade engine status
 * GET /api/trade-engine/[connectionId]?action=status|health
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
  try {
    const { connectionId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "status"

    console.log("[v0] Trade engine GET:", { connectionId, action })

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found", connectionId },
        { status: 404 }
      )
    }

    // Get engine state from database with error handling
    let engineState: any = null
    try {
      const result = await sql<any>`
        SELECT * FROM trade_engine_state
        WHERE connection_id = ${connectionId}
      `
      engineState = result?.[0]
    } catch (dbError) {
      console.warn("[v0] Could not fetch engine state from database:", dbError)
      // Continue with null state - engine may not be initialized yet
    }

    if (!engineState) {
      return NextResponse.json({
        connectionId,
        status: "not_initialized",
        message: "Engine not initialized for this connection",
        action: "start the engine using POST /api/trade-engine/{connectionId}",
      })
    }

    if (action === "health") {
      const healthStatus: EngineHealthStatus = {
        connectionId,
        status: engineState.status || "stopped",
        health: engineState.manager_health_status || "unhealthy",
        components: {
          manager: engineState.manager_health_status || "unknown",
          indications: engineState.indications_health || "unknown",
          strategies: engineState.strategies_health || "unknown",
          realtime: engineState.realtime_health || "unknown",
        },
        metrics: {
          uptime: engineState.uptime_seconds || 0,
          cyclesCompleted:
            (engineState.indication_cycle_count || 0) +
            (engineState.strategy_cycle_count || 0) +
            (engineState.realtime_cycle_count || 0),
          lastUpdate: engineState.updated_at || null,
          errorCount:
            (engineState.indication_error_count || 0) +
            (engineState.strategy_error_count || 0) +
            (engineState.realtime_error_count || 0),
          successRate: calculateSuccessRate(engineState),
        },
        lastHealthCheck: engineState.last_manager_health_check || null,
      }
      return NextResponse.json(healthStatus)
    }

    // Default: return full status
    return NextResponse.json({
      connectionId,
      connection: {
        name: connection.name,
        exchange: connection.exchange,
        enabled: connection.is_enabled,
        liveTrading: connection.is_live_trade,
      },
      engine: {
        status: engineState.status || "stopped",
        health: engineState.manager_health_status || "unhealthy",
        isRunning: engineState.is_running || false,
        uptime: engineState.uptime_seconds || 0,
      },
      processing: {
        indications: {
          cycleCount: engineState.indication_cycle_count || 0,
          lastRun: engineState.last_indication_run || null,
          avgDuration: engineState.indication_avg_duration_ms || 0,
        },
        strategies: {
          cycleCount: engineState.strategy_cycle_count || 0,
          lastRun: engineState.last_strategy_run || null,
          avgDuration: engineState.strategy_avg_duration_ms || 0,
        },
        realtime: {
          cycleCount: engineState.realtime_cycle_count || 0,
          lastRun: engineState.last_realtime_run || null,
          avgDuration: engineState.realtime_avg_duration_ms || 0,
        },
      },
      data: {
        prehistoricDataLoaded: engineState.prehistoric_data_loaded || false,
        prehistoricDataStart: engineState.prehistoric_data_start || null,
        prehistoricDataEnd: engineState.prehistoric_data_end || null,
      },
      lastUpdate: engineState.updated_at,
    })
  } catch (error) {
    console.error("[v0] Trade engine GET error:", error)
    await SystemLogger.logError(error, "api", "GET /api/trade-engine/[connectionId]", { connectionId: (await params)?.connectionId })

    return NextResponse.json(
      {
        error: "Failed to get engine status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Control trade engine (start/stop/reset)
 * POST /api/trade-engine/[connectionId]
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
  try {
    const { connectionId } = await params
    const body: TradeEngineRequest = await request.json()
    const action = body.action || "start"

    console.log("[v0] Trade engine action:", { connectionId, action })

    await SystemLogger.logAPI("Trade engine control", "info", "POST /api/trade-engine/[connectionId]", {
      connectionId,
      action,
    })

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found", connectionId },
        { status: 404 }
      )
    }

    // Ensure engine state exists
    await ensureEngineStateExists(connectionId)

    if (action === "start") {
      try {
        // Update engine state to running
        await sql`
          UPDATE trade_engine_state
          SET 
            status = 'running',
            is_running = true,
            error_message = NULL,
            manager_health_status = 'healthy',
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE connection_id = ${connectionId}
        `

        console.log("[v0] Engine started:", connectionId)
        await SystemLogger.logConnection("Engine started", connectionId, "info")

        return NextResponse.json({
          success: true,
          message: "Trade engine started",
          connectionId,
          status: "running",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to start engine:", error)

        try {
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          await sql`
            UPDATE trade_engine_state
            SET 
              status = 'error',
              is_running = false,
              error_message = ${errorMsg},
              updated_at = CURRENT_TIMESTAMP
            WHERE connection_id = ${connectionId}
          `
        } catch (updateError) {
          console.warn("[v0] Could not update error state:", updateError)
        }

        await SystemLogger.logError(error, "api", "Start trade engine", { connectionId })

        return NextResponse.json(
          {
            success: false,
            error: "Failed to start engine",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    } else if (action === "stop") {
      try {
        await sql`
          UPDATE trade_engine_state
          SET 
            status = 'stopped',
            is_running = false,
            stopped_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE connection_id = ${connectionId}
        `

        console.log("[v0] Engine stopped:", connectionId)
        await SystemLogger.logConnection("Engine stopped", connectionId, "info")

        return NextResponse.json({
          success: true,
          message: "Trade engine stopped",
          connectionId,
          status: "stopped",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to stop engine:", error)
        await SystemLogger.logError(error, "api", "Stop trade engine", { connectionId })

        return NextResponse.json(
          {
            success: false,
            error: "Failed to stop engine",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    } else if (action === "reset") {
      try {
        await sql`
          UPDATE trade_engine_state
          SET 
            status = 'stopped',
            is_running = false,
            manager_health_status = 'unhealthy',
            indication_cycle_count = 0,
            strategy_cycle_count = 0,
            realtime_cycle_count = 0,
            indication_error_count = 0,
            strategy_error_count = 0,
            realtime_error_count = 0,
            prehistoric_data_loaded = false,
            error_message = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE connection_id = ${connectionId}
        `

        console.log("[v0] Engine reset:", connectionId)
        await SystemLogger.logConnection("Engine reset", connectionId, "info")

        return NextResponse.json({
          success: true,
          message: "Trade engine reset",
          connectionId,
          status: "stopped",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to reset engine:", error)
        await SystemLogger.logError(error, "api", "Reset trade engine", { connectionId })

        return NextResponse.json(
          {
            success: false,
            error: "Failed to reset engine",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    } else if (action === "health") {
      try {
        const engineState = await sql<any>`
          SELECT * FROM trade_engine_state
          WHERE connection_id = ${connectionId}
        `

        const state = engineState?.[0]

        if (!state) {
          return NextResponse.json(
            { error: "Engine state not found", connectionId },
            { status: 404 }
          )
        }

        const healthStatus: EngineHealthStatus = {
          connectionId,
          status: state.status || "stopped",
          health: state.manager_health_status || "unhealthy",
          components: {
            manager: state.manager_health_status || "unknown",
            indications: state.indications_health || "unknown",
            strategies: state.strategies_health || "unknown",
            realtime: state.realtime_health || "unknown",
          },
          metrics: {
            uptime: state.uptime_seconds || 0,
            cyclesCompleted:
              (state.indication_cycle_count || 0) +
              (state.strategy_cycle_count || 0) +
              (state.realtime_cycle_count || 0),
            lastUpdate: state.updated_at || null,
            errorCount:
              (state.indication_error_count || 0) +
              (state.strategy_error_count || 0) +
              (state.realtime_error_count || 0),
            successRate: calculateSuccessRate(state),
          },
          lastHealthCheck: state.last_manager_health_check || null,
        }

        return NextResponse.json(healthStatus)
      } catch (error) {
        console.error("[v0] Failed to get health:", error)
        return NextResponse.json(
          {
            error: "Failed to get engine health",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: "Unknown action", validActions: ["start", "stop", "reset", "health"] },
      { status: 400 }
    )
  } catch (error) {
    console.error("[v0] Trade engine control error:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/[connectionId]")

    return NextResponse.json(
      {
        error: "Failed to control engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Ensure engine state row exists in database
 */
async function ensureEngineStateExists(connectionId: string): Promise<void> {
  try {
    // Check if exists
    const existing = await sql<any>`
      SELECT id FROM trade_engine_state WHERE connection_id = ${connectionId} LIMIT 1
    `

    if (existing && existing.length > 0) {
      return
    }

    // Create new engine state
    try {
      await sql`
        INSERT INTO trade_engine_state (
          connection_id,
          status,
          is_running,
          manager_health_status,
          indications_health,
          strategies_health,
          realtime_health,
          created_at,
          updated_at
        ) VALUES (
          ${connectionId},
          'stopped',
          false,
          'healthy',
          'healthy',
          'healthy',
          'healthy',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `

      console.log("[v0] Created new engine state:", connectionId)
    } catch (insertError) {
      console.warn("[v0] Insert failed, attempting update:", insertError)
      // State may have been created by another request, ignore error
    }
  } catch (error) {
    console.warn("[v0] Could not ensure engine state exists:", error)
    // Non-critical - continue anyway
  }
}

/**
 * Calculate success rate from engine state
 */
function calculateSuccessRate(state: any): number {
  const totalCycles =
    (state.indication_cycle_count || 0) +
    (state.strategy_cycle_count || 0) +
    (state.realtime_cycle_count || 0)

  const totalErrors =
    (state.indication_error_count || 0) +
    (state.strategy_error_count || 0) +
    (state.realtime_error_count || 0)

  if (totalCycles === 0) return 100

  return Math.max(0, ((totalCycles - totalErrors) / totalCycles) * 100)
}
