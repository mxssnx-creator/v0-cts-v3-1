import { NextResponse } from "next/server"
import { getGlobalCoordinator } from "@/lib/trade-engine"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] [Trade Engine] Fetching trade engine status...")

    const coordinator = getGlobalCoordinator()

    if (!coordinator) {
      console.log("[v0] [Trade Engine] Coordinator not initialized")
      return NextResponse.json({
        running: false,
        paused: false,
        connectedExchanges: 0,
        activePositions: 0,
        totalProfit: 0,
        uptime: 0,
        lastUpdate: new Date().toISOString(),
        message: "Trade engine not initialized",
      })
    }

    const engineStatus = coordinator.getStatus()
    const isRunning = coordinator.getIsRunning()
    const isPaused = coordinator.getIsPaused()
    const uptime = coordinator.getUptime()

    // Get real-time statistics from database
    const activeConnections = await query(`
      SELECT COUNT(*) as count
      FROM exchange_connections
      WHERE is_active = 1 AND is_enabled = 1
    `)

    const activePositionsResult = await query(`
      SELECT COUNT(*) as count
      FROM positions
      WHERE status = 'open'
    `)

    const profitData = await query(`
      SELECT COALESCE(SUM(profit_loss), 0) as total_profit
      FROM positions
      WHERE status = 'closed' AND datetime(closed_at) > datetime('now', '-24 hours')
    `)

    console.log("[v0] [Trade Engine] Status retrieved successfully")

    return NextResponse.json({
      running: isRunning,
      paused: isPaused,
      connectedExchanges: activeConnections[0]?.count || 0,
      activePositions: activePositionsResult[0]?.count || 0,
      totalProfit: Number.parseFloat(profitData[0]?.total_profit || "0"),
      uptime: uptime,
      lastUpdate: new Date().toISOString(),
      status: engineStatus.status,
      startedAt: engineStatus.startedAt,
      stoppedAt: engineStatus.stoppedAt,
      errorMessage: engineStatus.errorMessage,
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to get status:", error)
    return NextResponse.json({
      running: false,
      paused: false,
      connectedExchanges: 0,
      activePositions: 0,
      totalProfit: 0,
      uptime: 0,
      lastUpdate: new Date().toISOString(),
      message: "Failed to get status",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
