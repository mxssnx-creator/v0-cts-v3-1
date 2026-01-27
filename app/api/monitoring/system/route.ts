import { NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { ErrorRecoveryManager } from "@/lib/error-recovery"
import DatabaseManager from "@/lib/database"

export async function GET() {
  try {
    const db = DatabaseManager.getInstance()

    console.log("[v0] Fetching system monitoring states...")

    // Fetch connection data with error handling
    let connections: any[] = []
    try {
      connections = (await db.getConnections()) || []
    } catch (error) {
      console.warn("[v0] Failed to fetch connections:", error)
      connections = []
    }

    // Fetch position data with error handling
    let pseudoPositions: any[] = []
    let realPositions: any[] = []
    try {
      pseudoPositions = (await db.getPseudoPositions(undefined, 100)) || []
      realPositions = (await db.getRealPositions()) || []
    } catch (error) {
      console.warn("[v0] Failed to fetch positions:", error)
    }

    // Fetch recent errors with error handling
    let recentErrors: any[] = []
    try {
      recentErrors = (await db.getErrors(20, false)) || []
    } catch (error) {
      console.warn("[v0] Failed to fetch recent errors:", error)
    }

    // Calculate system states safely
    const activeConnections = connections.filter((c: any) => c?.is_enabled).length
    const liveTradeConnections = connections.filter((c: any) => c?.is_live_trade).length
    const activePseudoPositions = pseudoPositions.length
    const openRealPositions = realPositions.length

    // Calculate total PnL safely
    let totalPnL = 0
    let totalUnrealizedPnL = 0
    try {
      totalUnrealizedPnL = pseudoPositions.reduce((sum: number, pos: any) => {
        return sum + (Number(pos?.unrealized_pnl) || 0)
      }, 0)

      totalPnL = realPositions.reduce((sum: number, pos: any) => {
        return sum + (Number(pos?.realized_pnl) || 0)
      }, 0)
    } catch (error) {
      console.warn("[v0] Failed to calculate PnL:", error)
    }

    // Memory usage
    const memoryUsage = process.memoryUsage()

    const systemStates = {
      status: activeConnections > 0 ? "running" : "idle",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: {
        total: connections.length,
        active: activeConnections,
        liveTrade: liveTradeConnections,
        status: activeConnections > 0 ? "connected" : "disconnected",
      },
      trading: {
        pseudoPositions: activePseudoPositions,
        realPositions: openRealPositions,
        totalRealizedPnL: totalPnL,
        totalUnrealizedPnL: totalUnrealizedPnL,
        status: openRealPositions > 0 ? "active" : "idle",
      },
      indicators: {
        processingRate: "real-time",
        status: "running",
      },
      database: {
        status: "connected",
        recordCounts: {
          connections: connections.length,
          pseudoPositions: pseudoPositions.length,
          realPositions: realPositions.length,
        },
      },
      system: {
        errors: {
          recent: recentErrors.length,
          status: recentErrors.length > 10 ? "warning" : recentErrors.length > 0 ? "caution" : "healthy",
        },
        memory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
      },
    }

    await SystemLogger.logAPI("System monitoring data retrieved", "info", "GET /api/monitoring/system", {
      connections: systemStates.connections.total,
      activePositions: systemStates.trading.pseudoPositions,
    })

    return NextResponse.json({
      success: true,
      states: systemStates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error fetching system states:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "get-system-monitoring",
    })
    await SystemLogger.logError(error, "api", "GET /api/monitoring/system")

    // Return degraded state with available information
    return NextResponse.json(
      {
        success: false,
        states: {
          status: "degraded",
          timestamp: new Date().toISOString(),
          connections: { total: 0, active: 0, liveTrade: 0, status: "unknown" },
          trading: { pseudoPositions: 0, realPositions: 0, status: "unknown" },
          indicators: { status: "unknown" },
          database: { status: "error" },
          system: { errors: { recent: 1, status: "error" } },
        },
        error: error instanceof Error ? error.message : "Failed to retrieve system states",
      },
      { status: 503 }
    )
  }
}

}
