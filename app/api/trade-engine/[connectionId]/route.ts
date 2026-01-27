import { type NextRequest, NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { sql } from "@/lib/db"

/**
 * Trade Engine Management API
 * GET /api/trade-engine/[connectionId]/status - Get engine status
 * POST /api/trade-engine/[connectionId]/start - Start engine
 * POST /api/trade-engine/[connectionId]/stop - Stop engine
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
  try {
    const { connectionId } = await params

    console.log("[v0] Getting trade engine status for connection:", connectionId)

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Get engine state from database
    try {
      const engineState = await sql<any>`
        SELECT * FROM trade_engine_state
        WHERE connection_id = ${connectionId}
      `

      const state = engineState?.[0]

      if (!state) {
        // Engine state doesn't exist yet
        return NextResponse.json({
          connectionId,
          status: "not_initialized",
          isRunning: false,
          message: "Engine not initialized for this connection",
        })
      }

      return NextResponse.json({
        connectionId,
        ...state,
        lastUpdated: state.updated_at,
      })
    } catch (dbError) {
      console.warn("[v0] Could not retrieve engine state from database:", dbError)

      // Return default status if database error
      return NextResponse.json({
        connectionId,
        status: "error",
        isRunning: false,
        errorMessage: "Could not retrieve engine state",
      })
    }
  } catch (error) {
    console.error("[v0] Error getting engine status:", error)
    await SystemLogger.logError(error, "api", "GET /api/trade-engine/[connectionId]/status")

    return NextResponse.json(
      {
        error: "Failed to get engine status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ connectionId: string }> }) {
  try {
    const { connectionId } = await params
    const body = await request.json()
    const action = body.action || "start"

    console.log("[v0] Trade engine action requested:", { connectionId, action })

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    if (action === "start") {
      try {
        // Ensure engine state exists in database
        await ensureEngineState(connectionId)

        // Update engine state to running
        await sql`
          UPDATE trade_engine_state
          SET 
            status = 'running',
            is_running = true,
            error_message = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE connection_id = ${connectionId}
        `

        await SystemLogger.logConnection(`Trade engine started`, connectionId, "info")

        return NextResponse.json({
          success: true,
          message: "Trade engine started successfully",
          connectionId,
          status: "running",
        })
      } catch (error) {
        console.error("[v0] Failed to start engine:", error)
        await SystemLogger.logError(error, "api", `POST /api/trade-engine/{connectionId}/start`, { connectionId })

        const errorMsg = error instanceof Error ? error.message : "Unknown error"

        // Try to update error state in database
        try {
          await sql`
            UPDATE trade_engine_state
            SET 
              status = 'error',
              error_message = ${errorMsg},
              is_running = false,
              updated_at = CURRENT_TIMESTAMP
            WHERE connection_id = ${connectionId}
          `
        } catch (updateError) {
          console.warn("[v0] Could not update error state:", updateError)
        }

        return NextResponse.json(
          {
            success: false,
            error: "Failed to start engine",
            details: errorMsg,
          },
          { status: 500 },
        )
      }
    } else if (action === "stop") {
      try {
        // Update engine state to stopped
        await sql`
          UPDATE trade_engine_state
          SET 
            status = 'stopped',
            is_running = false,
            updated_at = CURRENT_TIMESTAMP
          WHERE connection_id = ${connectionId}
        `

        await SystemLogger.logConnection(`Trade engine stopped`, connectionId, "info")

        return NextResponse.json({
          success: true,
          message: "Trade engine stopped successfully",
          connectionId,
          status: "stopped",
        })
      } catch (error) {
        console.error("[v0] Failed to stop engine:", error)
        await SystemLogger.logError(error, "api", `POST /api/trade-engine/{connectionId}/stop`, { connectionId })

        return NextResponse.json(
          {
            success: false,
            error: "Failed to stop engine",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "check_health") {
      try {
        // Get current engine state
        const engineState = await sql<any>`
          SELECT * FROM trade_engine_state
          WHERE connection_id = ${connectionId}
        `

        const state = engineState?.[0]

        if (!state) {
          return NextResponse.json({
            connectionId,
            health: "unknown",
            message: "Engine state not found",
          })
        }

        // Calculate overall health
        const health = calculateEngineHealth(state)

        return NextResponse.json({
          connectionId,
          health,
          state: {
            status: state.status,
            isRunning: state.is_running,
            managerHealth: state.manager_health_status,
            indicationsHealth: state.indications_health,
            strategiesHealth: state.strategies_health,
            realtimeHealth: state.realtime_health,
            lastCheck: state.last_manager_health_check,
          },
        })
      } catch (error) {
        console.error("[v0] Failed to check engine health:", error)

        return NextResponse.json(
          {
            connectionId,
            health: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error in trade engine API:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/[connectionId]")

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * Ensure engine state exists for a connection
 */
async function ensureEngineState(connectionId: string): Promise<void> {
  try {
    const existing = await sql<any>`
      SELECT id FROM trade_engine_state WHERE connection_id = ${connectionId}
    `

    if (existing && existing.length > 0) {
      return
    }

    // Create new engine state
    await sql`
      INSERT INTO trade_engine_state (
        connection_id,
        status,
        is_running,
        manager_health_status,
        indications_health,
        strategies_health,
        realtime_health
      ) VALUES (
        ${connectionId},
        'stopped',
        false,
        'healthy',
        'healthy',
        'healthy',
        'healthy'
      )
    `

    console.log("[v0] Created engine state for connection:", connectionId)
  } catch (error) {
    console.error("[v0] Failed to ensure engine state:", error)
    throw error
  }
}

/**
 * Calculate overall engine health
 */
function calculateEngineHealth(
  state: any,
): "healthy" | "degraded" | "unhealthy" | "error" {
  if (state.status === "error") return "error"
  if (state.status !== "running") return "degraded"

  const healthStatuses = [
    state.manager_health_status,
    state.indications_health,
    state.strategies_health,
    state.realtime_health,
  ]

  const unhealthyCount = healthStatuses.filter((s: string) => s === "unhealthy").length
  const degradedCount = healthStatuses.filter((s: string) => s === "degraded").length

  if (unhealthyCount > 0) return "unhealthy"
  if (degradedCount > 0) return "degraded"
  return "healthy"
}
