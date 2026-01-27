import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

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
          // Safely access engine status with proper error handling
          let engineStatus = null
          try {
            // Try to fetch engine status from database if available
            const { sql } = await import("@/lib/db")
            const engineState = await sql<any>`
              SELECT * FROM trade_engine_state WHERE connection_id = ${connection.id} LIMIT 1
            `
            if (engineState && engineState.length > 0) {
              engineStatus = engineState[0]
            }
          } catch (dbError) {
            console.warn(`[v0] Could not fetch engine status from DB for ${connection.id}`)
          }

          return {
            id: connection.id,
            name: connection.name,
            exchange: connection.exchange,
            status: connection.is_enabled ? (connection.is_live_trade ? "connected" : "connecting") : "disabled",
            progress: engineStatus?.loading_progress || 0,
            balance: engineStatus?.balance || 0,
            activePositions: engineStatus?.active_positions || 0,
            activeSymbols: engineStatus?.active_symbols || 0,
            indicationsActive: engineStatus?.indications_active || 0,
            lastUpdate: engineStatus?.last_update || new Date().toISOString(),
            isLoading: engineStatus?.is_loading || false,
            loadingStage: engineStatus?.loading_stage || "idle",
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
    return NextResponse.json({ error: "Failed to fetch connection statuses" }, { status: 500 })
  }
}
