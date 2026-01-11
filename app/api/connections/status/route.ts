import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { getTradeEngineStatus } from "@/lib/trade-engine"

// GET real-time status for all active connections
export async function GET() {
  try {
    console.log("[v0] Fetching real connection statuses")

    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_active)

    // Get real statuses from trade engines
    const statuses = await Promise.all(
      activeConnections.map(async (connection) => {
        try {
          const engineStatus = await getTradeEngineStatus(connection.id)

          let progress = 0
          let message = "Idle"

          if (connection.is_enabled) {
            if (engineStatus?.isLoading) {
              switch (engineStatus.loadingStage) {
                case "initializing":
                  progress = 10
                  message = "Initializing connection..."
                  break
                case "loading_prehistoric":
                  progress = 30
                  message = "Loading historical data..."
                  break
                case "processing_symbols":
                  progress = 50
                  message = `Processing symbols (${engineStatus.activeSymbols || 0})...`
                  break
                case "starting_indications":
                  progress = 70
                  message = "Starting indications..."
                  break
                case "starting_strategies":
                  progress = 85
                  message = "Starting strategies..."
                  break
                case "ready":
                  progress = 100
                  message = "Ready"
                  break
                default:
                  progress = engineStatus.loadingProgress || 0
                  message = engineStatus.loadingStage || "Loading..."
              }
            } else if (engineStatus?.status === "running") {
              progress = 100
              message = `Active - ${engineStatus.activePositions || 0} positions`
            } else {
              progress = 0
              message = "Ready to start"
            }
          } else {
            message = "Disabled"
          }

          return {
            id: connection.id,
            name: connection.name,
            exchange: connection.exchange,
            status: connection.is_enabled ? (connection.is_live_trade ? "connected" : "connecting") : "disabled",
            progress,
            message,
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
            message: "Error",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("[v0] Failed to fetch connection statuses:", error)
    await SystemLogger.logError(error, "api", "GET /api/connections/status")
    return NextResponse.json({ error: "Failed to fetch connection statuses" }, { status: 500 })
  }
}
