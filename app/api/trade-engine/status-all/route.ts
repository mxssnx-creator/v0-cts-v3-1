import { NextResponse } from "next/server"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function GET() {
  try {
    console.log("[v0] Fetching all trade engine statuses")

    const coordinator = getGlobalTradeEngineCoordinator()
    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_active && c.is_enabled)

    const engineStatuses = await Promise.all(
      activeConnections.map(async (conn) => {
        const status = await coordinator.getEngineStatus(conn.id)
        const isRunning = status !== null

        return {
          connectionId: conn.id,
          connectionName: conn.name,
          exchange: conn.exchange,
          isEnabled: conn.is_enabled,
          isActive: conn.is_active,
          isLiveTrading: conn.is_live_trade,
          isEngineRunning: isRunning,
          engineStatus: status,
        }
      })
    )

    const runningCount = engineStatuses.filter((s) => s.isEngineRunning).length
    const totalCount = engineStatuses.length

    console.log(`[v0] Engine status: ${runningCount}/${totalCount} running`)

    return NextResponse.json({
      success: true,
      engines: engineStatuses,
      summary: {
        total: totalCount,
        running: runningCount,
        stopped: totalCount - runningCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to fetch engine statuses:", error)
    await SystemLogger.logError(error, "trade-engine", "GET /api/trade-engine/status-all")

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch engine statuses",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
