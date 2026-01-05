import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections, type Connection } from "@/lib/file-storage"
import { getPredefinedConnectionsAsStatic } from "@/lib/connection-predefinitions"

const EXCHANGE_NAME_TO_ID: Record<string, number> = {
  binance: 1,
  bybit: 2,
  okx: 3,
  gateio: 4,
  mexc: 5,
  bitget: 6,
  kucoin: 7,
  huobi: 8,
  bingx: 9,
  pionex: 10,
  orangex: 11,
}

export async function GET() {
  try {
    console.log("[v0] Fetching all connections from file...")
    await SystemLogger.logAPI("Fetching all connections", "info", "GET /api/settings/connections")

    let connections: any[] = []
    try {
      connections = loadConnections()
      if (!Array.isArray(connections)) {
        console.log("[v0] Invalid connections data, returning predefined")
        connections = getPredefinedConnectionsAsStatic()
      }
    } catch (error) {
      console.log("[v0] Database not ready yet, returning predefined connections")
      connections = getPredefinedConnectionsAsStatic()
    }

    console.log("[v0] Found connections:", connections.length)
    await SystemLogger.logAPI(`Found ${connections.length} connections`, "info", "GET /api/settings/connections")

    const formattedConnections = connections.map((conn) => ({
      ...conn,
      is_enabled: Boolean(conn.is_enabled),
      is_live_trade: Boolean(conn.is_live_trade),
      is_preset_trade: Boolean(conn.is_preset_trade),
      is_testnet: Boolean(conn.is_testnet),
      is_active: Boolean(conn.is_active),
      is_predefined: Boolean(conn.is_predefined),
      volume_factor: typeof conn.volume_factor === "number" ? conn.volume_factor : 1.0,
      exchange_id: conn.exchange_id || EXCHANGE_NAME_TO_ID[conn.exchange?.toLowerCase()] || null,
    }))

    return NextResponse.json(formattedConnections, { status: 200 })
  } catch (error) {
    console.error("[v0] Error fetching connections:", error)
    await SystemLogger.logError(error, "api", "GET /api/settings/connections")

    const predefinedConnections = getPredefinedConnectionsAsStatic()
    return NextResponse.json(predefinedConnections, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating new connection:", {
      name: body.name,
      exchange: body.exchange,
      api_type: body.api_type,
    })

    await SystemLogger.logAPI(
      `Creating connection: ${body.name} (${body.exchange})`,
      "info",
      "POST /api/settings/connections",
      { exchange: body.exchange, api_type: body.api_type },
    )

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      await SystemLogger.logAPI("Missing connection name", "warn", "POST /api/settings/connections")
      return NextResponse.json(
        { error: "Missing connection name", details: "Connection name is required and must not be empty" },
        { status: 400 },
      )
    }

    if (!body.exchange || typeof body.exchange !== "string") {
      await SystemLogger.logAPI("Missing exchange", "warn", "POST /api/settings/connections")
      return NextResponse.json({ error: "Missing exchange", details: "Exchange name is required" }, { status: 400 })
    }

    if (!body.api_key || typeof body.api_key !== "string" || !body.api_key.trim()) {
      await SystemLogger.logAPI("Missing API key", "warn", "POST /api/settings/connections")
      return NextResponse.json(
        { error: "Missing API key", details: "API key is required and must not be empty" },
        { status: 400 },
      )
    }

    if (!body.api_secret || typeof body.api_secret !== "string" || !body.api_secret.trim()) {
      await SystemLogger.logAPI("Missing API secret", "warn", "POST /api/settings/connections")
      return NextResponse.json(
        { error: "Missing API secret", details: "API secret is required and must not be empty" },
        { status: 400 },
      )
    }

    const exchangeName = body.exchange.toLowerCase()
    if (exchangeName === "okx" && (!body.api_passphrase || !body.api_passphrase.trim())) {
      await SystemLogger.logAPI("Missing API passphrase for OKX", "warn", "POST /api/settings/connections")
      return NextResponse.json(
        { error: "Missing API passphrase", details: "OKX requires an API passphrase for authentication" },
        { status: 400 },
      )
    }

    const supportedExchanges = [
      "bybit",
      "bingx",
      "pionex",
      "orangex",
      "binance",
      "okx",
      "gateio",
      "mexc",
      "bitget",
      "kucoin",
      "huobi",
    ]
    if (!supportedExchanges.includes(exchangeName)) {
      await SystemLogger.logAPI(`Unsupported exchange: ${exchangeName}`, "warn", "POST /api/settings/connections")
      return NextResponse.json(
        {
          error: "Unsupported exchange",
          details: `Exchange "${body.exchange}" is not supported. Supported exchanges: ${supportedExchanges.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const connectionId = nanoid()
    const exchangeId = EXCHANGE_NAME_TO_ID[exchangeName] || null

    let connectionSettings = body.connection_settings
    if (connectionSettings && typeof connectionSettings === "object") {
      try {
        connectionSettings = JSON.stringify(connectionSettings)
      } catch (err) {
        console.error("[v0] Failed to stringify connection settings:", err)
        connectionSettings = "{}"
      }
    }

    const newConnection: Connection = {
      id: connectionId,
      user_id: 1,
      name: body.name.trim(),
      exchange: exchangeName,
      exchange_id: exchangeId,
      api_type: body.api_type || "perpetual_futures",
      connection_method: body.connection_method || "rest",
      connection_library: body.connection_library || "rest",
      api_key: body.api_key.trim(),
      api_secret: body.api_secret.trim(),
      api_passphrase: body.api_passphrase?.trim(),
      margin_type: body.margin_type || "cross",
      position_mode: body.position_mode || "hedge",
      is_testnet: body.is_testnet || false,
      is_enabled: false,
      is_live_trade: false,
      is_preset_trade: false,
      is_active: true,
      is_predefined: false,
      volume_factor: 1.0,
      connection_settings: connectionSettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const connections = loadConnections()
      connections.push(newConnection)
      saveConnections(connections)
    } catch (storageError) {
      console.error("[v0] Failed to save connection to storage:", storageError)
      await SystemLogger.logError(storageError, "api", "POST /api/settings/connections - storage")

      return NextResponse.json(
        {
          error: "Storage error",
          details: "Failed to save connection to storage. Please ensure the data directory is writable.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Connection created successfully:", connectionId)
    await SystemLogger.logConnection(`Connection created: ${body.name}`, connectionId, "info", {
      exchange: body.exchange,
      testnet: body.is_testnet,
    })

    return NextResponse.json(
      {
        success: true,
        id: connectionId,
        message: "Connection created successfully",
        connection: newConnection,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating connection - Full error:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections")

    const isDev = process.env.NODE_ENV === "development"

    return NextResponse.json(
      {
        error: "Failed to create connection",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        ...(isDev && error instanceof Error && { stack: error.stack }),
      },
      { status: 500 },
    )
  }
}
