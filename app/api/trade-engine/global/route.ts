import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { sql } from "@/lib/db"
import { loadConnections } from "@/lib/file-storage"

interface GlobalTradeEngineRequest {
  action?: "status" | "start-all" | "stop-all" | "pause" | "resume" | "emergency-stop"
}

/**
 * GET - Get global trade engine status (all connections)
 * GET /api/trade-engine/global
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Getting global trade engine status...")

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "status"

    if (action === "status") {
      // Get status for all connections
      try {
        const engines = await sql<any>`
          SELECT 
            connection_id,
            status,
            manager_health_status,
            is_running,
            indication_cycle_count,
            strategy_cycle_count,
            realtime_cycle_count,
            updated_at,
            error_message
          FROM trade_engine_state
          ORDER BY updated_at DESC
        `

        const connections = loadConnections()
        const activeCount = connections.filter((c) => c.is_enabled && c.is_active).length
        const liveCount = connections.filter((c) => c.is_live_trade).length
        const runningEngines = engines.filter((e: any) => e.is_running)

        return NextResponse.json({
          global: {
            overallStatus: runningEngines.length > 0 ? "running" : "stopped",
            enginesRunning: runningEngines.length,
            enginesTotal: engines.length,
            activeConnections: activeCount,
            liveConnections: liveCount,
          },
          engines: engines.map((e: any) => ({
            connectionId: e.connection_id,
            status: e.status,
            health: e.manager_health_status,
            running: e.is_running,
            cycles: {
              indications: e.indication_cycle_count,
              strategies: e.strategy_cycle_count,
              realtime: e.realtime_cycle_count,
            },
            lastUpdate: e.updated_at,
            error: e.error_message,
          })),
          timestamp: new Date().toISOString(),
        })
      } catch (dbError) {
        console.warn("[v0] Database error getting engine status, trying file storage:", dbError)

        const connections = loadConnections()
        const activeConns = connections.filter((c) => c.is_enabled && c.is_active)
        const liveConns = connections.filter((c) => c.is_live_trade)

        return NextResponse.json({
          global: {
            overallStatus: "unknown",
            enginesRunning: 0,
            enginesTotal: activeConns.length,
            activeConnections: activeConns.length,
            liveConnections: liveConns.length,
          },
          engines: [],
          timestamp: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Global trade engine status error:", error)
    await SystemLogger.logError(error, "api", "GET /api/trade-engine/global")

    return NextResponse.json(
      {
        error: "Failed to get global trade engine status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Control global trade engine
 * POST /api/trade-engine/global
 */
export async function POST(request: NextRequest) {
  try {
    const body: GlobalTradeEngineRequest = await request.json()
    const action = body.action || "start-all"

    console.log("[v0] Global trade engine action:", action)

    await SystemLogger.logAPI("Global trade engine control", "info", "POST /api/trade-engine/global", {
      action,
    })

    if (action === "start-all") {
      try {
        // Get all active, enabled connections
        const connections = loadConnections()
        const activeConns = connections.filter((c) => c.is_enabled && c.is_active)

        console.log(`[v0] Starting trade engines for ${activeConns.length} connections`)

        // Update all to running state
        const updates = activeConns.map(async (conn) => {
          try {
            await sql`
              UPDATE trade_engine_state
              SET status = 'running',
                  is_running = true,
                  updated_at = CURRENT_TIMESTAMP
              WHERE connection_id = ${conn.id}
            `
          } catch (error) {
            console.warn(`[v0] Failed to start engine for ${conn.id}:`, error)
          }
        })

        await Promise.allSettled(updates)

        await SystemLogger.logAPI("All trade engines started", "info", "POST /api/trade-engine/global", {
          connectionsStarted: activeConns.length,
        })

        return NextResponse.json({
          success: true,
          message: `Started trade engines for ${activeConns.length} connections`,
          connectionsStarted: activeConns.length,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to start all engines:", error)
        throw error
      }
    } else if (action === "stop-all") {
      try {
        // Get all running engines
        const engines = await sql<any>`
          SELECT DISTINCT connection_id 
          FROM trade_engine_state 
          WHERE is_running = true
        `

        console.log(`[v0] Stopping ${engines.length} trade engines`)

        // Update all to stopped state
        const updates = engines.map(async (engine: any) => {
          try {
            await sql`
              UPDATE trade_engine_state
              SET status = 'stopped',
                  is_running = false,
                  updated_at = CURRENT_TIMESTAMP
              WHERE connection_id = ${engine.connection_id}
            `
          } catch (error) {
            console.warn(`[v0] Failed to stop engine for ${engine.connection_id}:`, error)
          }
        })

        await Promise.allSettled(updates)

        await SystemLogger.logAPI("All trade engines stopped", "info", "POST /api/trade-engine/global", {
          connectionsStopped: engines.length,
        })

        return NextResponse.json({
          success: true,
          message: `Stopped ${engines.length} trade engines`,
          connectionsStopped: engines.length,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to stop all engines:", error)
        throw error
      }
    } else if (action === "pause") {
      try {
        // Set all engines to paused state
        await sql`
          UPDATE trade_engine_state
          SET status = 'paused',
              updated_at = CURRENT_TIMESTAMP
          WHERE is_running = true
        `

        console.log("[v0] All trade engines paused")

        await SystemLogger.logAPI("All trade engines paused", "info", "POST /api/trade-engine/global", {
          action: "pause",
        })

        return NextResponse.json({
          success: true,
          message: "All trade engines paused",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to pause engines:", error)
        throw error
      }
    } else if (action === "resume") {
      try {
        // Resume all paused engines
        await sql`
          UPDATE trade_engine_state
          SET status = 'running',
              updated_at = CURRENT_TIMESTAMP
          WHERE status = 'paused'
        `

        console.log("[v0] All trade engines resumed")

        await SystemLogger.logAPI("All trade engines resumed", "info", "POST /api/trade-engine/global", {
          action: "resume",
        })

        return NextResponse.json({
          success: true,
          message: "All trade engines resumed",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to resume engines:", error)
        throw error
      }
    } else if (action === "emergency-stop") {
      try {
        // Force all engines to emergency stop
        await sql`
          UPDATE trade_engine_state
          SET status = 'error',
              is_running = false,
              error_message = 'Emergency stop triggered via API',
              updated_at = CURRENT_TIMESTAMP
        `

        console.log("[v0] Emergency stop triggered on all trade engines")

        await SystemLogger.logAPI(
          "Emergency stop triggered on all trade engines",
          "critical",
          "POST /api/trade-engine/global",
          { action: "emergency-stop" }
        )

        return NextResponse.json({
          success: true,
          message: "Emergency stop triggered on all trade engines",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Failed to emergency stop engines:", error)
        throw error
      }
    }

    return NextResponse.json(
      {
        error: "Unknown action",
        validActions: ["status", "start-all", "stop-all", "pause", "resume", "emergency-stop"],
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("[v0] Global trade engine control error:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/global")

    return NextResponse.json(
      {
        error: "Failed to control global trade engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
