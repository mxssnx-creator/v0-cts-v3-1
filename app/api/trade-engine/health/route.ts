import { NextResponse } from "next/server"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { loadConnections } from "@/lib/file-storage"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching trade engine health status")
    
    const coordinator = getGlobalTradeEngineCoordinator()
    const connections = loadConnections()
    const enabledConnections = connections.filter((c) => c.is_enabled)

    // Get health for each engine
    const engineHealthStatus = await Promise.all(
      enabledConnections.map(async (conn) => {
        try {
          const engineStatus = await coordinator.getEngineStatus(conn.id)
          const state = await query<{ state: string; updated_at: string }>(
            `SELECT state, updated_at FROM trade_engine_state WHERE connection_id = ?`,
            [conn.id]
          )

          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            status: engineStatus?.status || state[0]?.state || "idle",
            isRunning: engineStatus?.status === "running",
            lastUpdate: state[0]?.updated_at || null,
            errorMessage: engineStatus?.errorMessage || null,
          }
        } catch (err) {
          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            status: "error",
            isRunning: false,
            error: err instanceof Error ? err.message : String(err),
          }
        }
      })
    )

    const runningCount = engineHealthStatus.filter((s) => s.isRunning).length
    const totalCount = engineHealthStatus.length

    return NextResponse.json({
      success: true,
      overall: runningCount > 0 ? "healthy" : "idle",
      runningEngines: runningCount,
      totalEngines: totalCount,
      engines: engineHealthStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to get health status:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get health status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
