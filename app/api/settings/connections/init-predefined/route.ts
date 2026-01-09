import { type NextRequest, NextResponse } from "next/server"
import { DatabaseInitializer } from "@/lib/db-initializer"
import { CONNECTION_PREDEFINITIONS, getDefaultEnabledConnections } from "@/lib/connection-predefinitions"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections } from "@/lib/file-storage"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Initializing predefined connections with ByBit and BingX enabled by default")

    const dbReady = await DatabaseInitializer.initialize(5, 60000)
    if (!dbReady) {
      console.error("[v0] Database initialization failed after retries")
      return NextResponse.json(
        { error: "Database not ready", details: "Failed to initialize database" },
        { status: 503 },
      )
    }

    const connections = loadConnections()
    const existingIds = new Set(connections.map((c) => c.id))
    const defaultEnabled = getDefaultEnabledConnections()

    let createdCount = 0
    let enabledCount = 0

    for (const pred of CONNECTION_PREDEFINITIONS) {
      if (existingIds.has(pred.id)) {
        console.log(`[v0] Connection ${pred.id} already exists, skipping...`)
        continue
      }

      const isEnabledByDefault = pred.id === "bybit-x03" || pred.id === "bingx-x01"

      const newConnection: any = {
        id: pred.id,
        name: pred.name,
        exchange: pred.id.split("-")[0],
        api_type: pred.apiType,
        connection_method: pred.connectionMethod,
        connection_library: pred.id.startsWith("bybit")
          ? "bybit-api"
          : pred.id.startsWith("bingx")
            ? "bingx-api"
            : "ccxt",
        api_key: pred.apiKey || "",
        api_secret: pred.apiSecret || "",
        api_passphrase: "",
        margin_type: pred.marginType,
        position_mode: pred.positionMode,
        is_testnet: false,
        is_enabled: isEnabledByDefault,
        is_predefined: true,
        is_live_trade: false,
        is_active: true,
        api_capabilities: "[]",
        rate_limits: JSON.stringify(pred.rateLimits),
        last_test_status: null,
        last_test_balance: null,
        last_test_log: [],
        last_test_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      connections.push(newConnection)
      createdCount++

      if (isEnabledByDefault) {
        enabledCount++
        console.log(`[v0] Connection ${pred.name} created and ENABLED in Settings`)
      } else {
        console.log(`[v0] Connection ${pred.name} created (disabled)`)
      }
    }

    saveConnections(connections)

    await SystemLogger.logConnection(
      `Initialized ${createdCount} predefined connections (${enabledCount} enabled by default)`,
      "system",
      "info",
    )

    return NextResponse.json({
      success: true,
      message: `Initialized ${createdCount} connections. ByBit and BingX enabled in Settings by default.`,
      totalCreated: createdCount,
      enabledByDefault: enabledCount,
      note: "Connections are enabled in Settings but NOT active for live trading. Enable live trading on Dashboard.",
    })
  } catch (error) {
    console.error("[v0] Failed to initialize predefined connections:", error)
    await SystemLogger.logError(error, "connection", "POST /api/settings/connections/init-predefined")

    return NextResponse.json(
      {
        error: "Failed to initialize predefined connections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
