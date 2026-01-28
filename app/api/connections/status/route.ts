import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { getTradeEngineStatus } from "@/lib/trade-engine"

// GET real-time status for all active connections
export async function GET() {
  try {
    console.log("[v0] Fetching real connection statuses")

    const connections = loadConnections()
    
    // Ensure connections is an array
    if (!Array.isArray(connections)) {
      console.error("[v0] Connections is not an array:", typeof connections)
      return NextResponse.json({ error: "Invalid connections data", statuses: [] }, { status: 500 })
    }

    const activeConnections = connections.filter((c) => c.is_active)

    // Get real statuses from trade engines
    const statuses = await Promise.all(
      activeConnections.map(async (connection) => {
        try {
          const engineStatus = await getTradeEngineStatus(connection.id)

          return {
            id: connection.id,
            name: connection.name,
            exchange: connection.exchange,
            status: connection.is_enabled ? (connection.is_live_trade ? "connected" : "connecting") : "disabled",
            progress: engineStatus?.loadingProgress || 0,
            balance: engineStatus?.balance || 0,
            activePositions: engineStatus?.activePositions || 0,
            activeSymbols: engineStatus?.activeSymbols || 0,
            indicationsActive: engineStatus?.indicationsActive || 0,
            lastUpdate: engineStatus?.lastUpdate || new Date().toISOString(),
            isLoading: engineStatus?.isLoading || false,
            loadingStage: engineStatus?.loadingStage || "idle",
            error: engineStatus?.error || null,
          }
        } catch (error) {
          console.error(`[v0] Failed to get status for ${connection.id}:`, error)
          return {
            id: connection.id,
            name: connection.name,
            exchange: connection.exchange,
            status: "error",
            progress: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("[v0] Failed to fetch connection statuses:", error)
    await SystemLogger.logError(error, "api", "GET /api/connections/status")
    return NextResponse.json({ error: "Failed to fetch connection statuses", statuses: [] }, { status: 500 })
  }
}
