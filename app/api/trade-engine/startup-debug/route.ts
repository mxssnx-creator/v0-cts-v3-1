import { NextResponse } from "next/server"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function GET() {
  try {
    console.log("[v0] [DEBUG] Trade Engine Manual Startup Endpoint")

    // Get coordinator
    const coordinator = getGlobalTradeEngineCoordinator()
    console.log("[v0] [DEBUG] Coordinator obtained")

    // Load connections
    const connections = loadConnections()
    console.log(`[v0] [DEBUG] Loaded ${connections.length} connections`)

    // Filter enabled connections
    const enabledConnections = connections.filter(
      (c) => c.is_enabled === true && c.is_active === true
    )
    console.log(`[v0] [DEBUG] Found ${enabledConnections.length} enabled connections`)

    // Start engines
    const results = []

    for (const connection of enabledConnections) {
      try {
        console.log(`[v0] [DEBUG] Starting engine for: ${connection.name}`)

        const engineConfig = {
          connectionId: connection.id,
          exchange: connection.exchange,
          apiKey: connection.api_key,
          apiSecret: connection.api_secret,
          testnet: connection.is_testnet === true,
        }

        await coordinator.startEngine(connection.id, engineConfig)

        console.log(`[v0] [DEBUG] Started engine for: ${connection.name}`)

        results.push({
          connectionId: connection.id,
          connectionName: connection.name,
          success: true,
          message: "Engine started successfully",
        })
      } catch (error) {
        console.error(
          `[v0] [DEBUG] Failed to start engine for ${connection.name}:`,
          error
        )

        results.push({
          connectionId: connection.id,
          connectionName: connection.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    console.log("[v0] [DEBUG] Manual startup complete")

    return NextResponse.json({
      success: true,
      message: "Manual trade engine startup completed",
      totalConnections: connections.length,
      enabledConnections: enabledConnections.length,
      results,
    })
  } catch (error) {
    console.error("[v0] [DEBUG] Manual startup failed:", error)
    await SystemLogger.logError(error, "trade-engine", "Manual startup failed")

    return NextResponse.json(
      {
        success: false,
        error: "Manual startup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
