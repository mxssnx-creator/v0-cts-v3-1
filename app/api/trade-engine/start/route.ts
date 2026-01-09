import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { initializeGlobalCoordinator } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

const activeEngines = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId } = body

    console.log("[v0] [Trade Engine] Starting trade engine for connection:", connectionId)
    await SystemLogger.logTradeEngine(`Starting trade engine for connection: ${connectionId}`, "info", { connectionId })

    if (activeEngines.has(connectionId)) {
      console.log("[v0] [Trade Engine] Already running for connection:", connectionId)
      return NextResponse.json({
        success: true,
        message: "Trade engine already running for this connection",
      })
    }

    const [connection] = await sql`
      SELECT * FROM exchange_connections
      WHERE id = ${connectionId} AND is_active = true
    `

    if (!connection) {
      console.error("[v0] [Trade Engine] Connection not found or not active:", connectionId)
      await SystemLogger.logTradeEngine(`Connection not found or not active: ${connectionId}`, "error", {
        connectionId,
      })
      return NextResponse.json({ error: "Connection not found or not active" }, { status: 404 })
    }

    const [settings] = await sql<{ trade_interval?: number; real_interval?: number }>`
      SELECT 
        CAST(COALESCE((SELECT value FROM system_settings WHERE key = 'tradeInterval'), '1.0') AS FLOAT) as trade_interval,
        CAST(COALESCE((SELECT value FROM system_settings WHERE key = 'realInterval'), '0.3') AS FLOAT) as real_interval
    `

    const config: any = {
      connectionId: connectionId,
      tradeInterval: settings?.trade_interval || 1.0,
      realInterval: settings?.real_interval || 0.3,
      maxConcurrency: 10,
    }

    const coordinator = initializeGlobalCoordinator()

    if (coordinator.getIsRunning()) {
      console.log("[v0] [Trade Engine] Already running")
      return NextResponse.json({
        success: true,
        message: "Trade engine is already running",
        alreadyRunning: true,
      })
    }

    await coordinator.start()

    console.log("[v0] [Trade Engine] Started successfully")
    await SystemLogger.logTradeEngine("Global trade engine started successfully", "info", {})

    return NextResponse.json({
      success: true,
      message: "Global trade engine started successfully",
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to start:", error)
    await SystemLogger.logError(error, "trade-engine", "POST /api/trade-engine/start")

    return NextResponse.json(
      {
        error: "Failed to start trade engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
