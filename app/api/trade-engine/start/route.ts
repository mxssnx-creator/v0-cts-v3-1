import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { TradeEngine, type TradeEngineConfig } from "@/lib/trade-engine/"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections } from "@/lib/file-storage"

const activeEngines = new Map<string, TradeEngine>()

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

    let connection
    try {
      const connections = loadConnections()
      connection = connections.find((c) => c.id === connectionId && c.is_active)

      if (!connection) {
        console.error("[v0] [Trade Engine] Connection not found or not active:", connectionId)
        await SystemLogger.logTradeEngine(`Connection not found or not active: ${connectionId}`, "error", {
          connectionId,
        })
        return NextResponse.json({ error: "Connection not found or not active" }, { status: 404 })
      }
    } catch (fileError) {
      console.error("[v0] [Trade Engine] Failed to load connection from file:", fileError)
      return NextResponse.json({ error: "Failed to load connection configuration" }, { status: 500 })
    }
    // </CHANGE>

    // Get settings from system_settings or use defaults
    let tradeInterval = 1.0
    let realInterval = 0.3

    try {
      const [settings] = await sql<{ trade_interval?: number; real_interval?: number }>`
        SELECT 
          CAST(COALESCE((SELECT value FROM system_settings WHERE key = 'tradeInterval'), '1.0') AS FLOAT) as trade_interval,
          CAST(COALESCE((SELECT value FROM system_settings WHERE key = 'realInterval'), '0.3') AS FLOAT) as real_interval
      `
      tradeInterval = settings?.trade_interval || 1.0
      realInterval = settings?.real_interval || 0.3
    } catch (dbError) {
      console.warn("[v0] [Trade Engine] Could not load settings from database, using defaults")
    }

    const config: TradeEngineConfig = {
      connectionId: connectionId,
      tradeInterval: tradeInterval,
      realInterval: realInterval,
      maxConcurrency: 10,
    }

    const tradeEngine = new TradeEngine(config)
    await tradeEngine.start(config)

    activeEngines.set(connectionId, tradeEngine)

    try {
      await sql`
        INSERT INTO trade_engine_state (connection_id, state, updated_at)
        VALUES (${connectionId}, 'running', CURRENT_TIMESTAMP)
        ON CONFLICT (connection_id) 
        DO UPDATE SET state = 'running', updated_at = CURRENT_TIMESTAMP
      `
    } catch (dbError) {
      console.warn("[v0] [Trade Engine] Could not update database state:", dbError)
    }
    // </CHANGE>

    console.log("[v0] [Trade Engine] Started successfully for connection:", connectionId)
    await SystemLogger.logTradeEngine(`Trade engine started successfully for connection: ${connection.name}`, "info", {
      connectionId,
      connectionName: connection.name,
    })

    return NextResponse.json({
      success: true,
      message: "Trade engine started successfully",
      connectionId,
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
