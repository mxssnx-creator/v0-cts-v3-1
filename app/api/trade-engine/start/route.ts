import { type NextRequest, NextResponse } from "next/server"
import { loadConnections, loadSettings } from "@/lib/file-storage"
import { TradeEngine, type TradeEngineConfig } from "@/lib/trade-engine/"
import { SystemLogger } from "@/lib/system-logger"

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

    // Load connection from file storage
    let connection
    try {
      const connections = loadConnections()
      
      // Ensure connections is an array
      if (!Array.isArray(connections)) {
        console.error("[v0] [Trade Engine] Connections is not an array:", typeof connections)
        return NextResponse.json({ error: "Invalid connections data" }, { status: 500 })
      }

      connection = connections.find((c) => c.id === connectionId && c.is_enabled)

      if (!connection) {
        console.error("[v0] [Trade Engine] Connection not found or not enabled:", connectionId)
        await SystemLogger.logTradeEngine(`Connection not found or not enabled: ${connectionId}`, "error", {
          connectionId,
        })
        return NextResponse.json({ error: "Connection not found or not enabled" }, { status: 404 })
      }

      console.log("[v0] [Trade Engine] Loaded connection from file storage:", connection.name)
    } catch (fileError) {
      console.error("[v0] [Trade Engine] Failed to load connection from file:", fileError)
      return NextResponse.json({ error: "Failed to load connection configuration" }, { status: 500 })
    }

    // Load settings from file storage
    let tradeInterval = 1.0
    let realInterval = 0.3

    try {
      const settings = loadSettings()
      tradeInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 1.0
      realInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 0.3
      console.log("[v0] [Trade Engine] Loaded settings - tradeInterval:", tradeInterval, "realInterval:", realInterval)
    } catch (settingsError) {
      console.warn("[v0] [Trade Engine] Could not load settings from file, using defaults:", settingsError)
    }

    const config: TradeEngineConfig = {
      connectionId: connectionId,
      tradeInterval: tradeInterval,
      realInterval: realInterval,
      maxConcurrency: 10,
    }

    console.log("[v0] [Trade Engine] Creating trade engine with config:", config)

    const tradeEngine = new TradeEngine(config)

    try {
      await tradeEngine.start(config)
      activeEngines.set(connectionId, tradeEngine)
      console.log("[v0] [Trade Engine] Trade engine started successfully")
      await SystemLogger.logTradeEngine(`Trade engine started successfully for connection: ${connection.name}`, "info", {
        connectionId,
        connectionName: connection.name,
      })
    } catch (startError) {
      console.error("[v0] [Trade Engine] Failed to start trade engine:", startError)
      await SystemLogger.logTradeEngine(`Failed to start trade engine: ${startError}`, "error", { connectionId })
      return NextResponse.json(
        {
          error: "Failed to start trade engine",
          details: startError instanceof Error ? startError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Trade engine started successfully",
      connectionId,
      connectionName: connection.name,
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
