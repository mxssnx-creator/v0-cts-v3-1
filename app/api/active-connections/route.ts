import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections } from "@/lib/file-storage"

// GET active connections - connections that are enabled and ready for trading
export async function GET() {
  try {
    console.log("[v0] Fetching active connections...")
    await SystemLogger.logAPI("Fetching active connections", "info", "GET /api/active-connections")

    const allConnections = loadConnections()

    const activeConnections = allConnections.filter((conn) => conn.is_enabled && conn.is_active)

    console.log("[v0] Found", activeConnections.length, "active connections out of", allConnections.length, "total")
    await SystemLogger.logAPI(
      `Found ${activeConnections.length} active connections`,
      "info",
      "GET /api/active-connections",
    )

    const formattedConnections = activeConnections.map((conn) => ({
      ...conn,
      is_enabled: Boolean(conn.is_enabled),
      is_live_trade: Boolean(conn.is_live_trade),
      is_preset_trade: Boolean(conn.is_preset_trade),
      is_testnet: Boolean(conn.is_testnet),
      is_active: Boolean(conn.is_active),
      volume_factor: typeof conn.volume_factor === "number" ? conn.volume_factor : 1.0,
      // Include trade settings from connection_settings if available
      tradeSettings: conn.connection_settings
        ? typeof conn.connection_settings === "string"
          ? JSON.parse(conn.connection_settings)
          : conn.connection_settings
        : {},
    }))

    return NextResponse.json(formattedConnections, { status: 200 })
  } catch (error) {
    console.error("[v0] Error fetching active connections:", error)
    await SystemLogger.logError(error, "api", "GET /api/active-connections")

    return NextResponse.json(
      {
        error: "Failed to fetch active connections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PATCH update active connection trade settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, settings } = body

    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating active connection settings:", connectionId)
    await SystemLogger.logAPI(`Updating active connection ${connectionId}`, "info", "PATCH /api/active-connections", {
      connectionId,
      settings,
    })

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === connectionId)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const currentSettings = connections[connectionIndex].connection_settings || {}
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updated_at: new Date().toISOString(),
    }

    connections[connectionIndex] = {
      ...connections[connectionIndex],
      connection_settings: updatedSettings,
      updated_at: new Date().toISOString(),
    }

    const { saveConnections } = await import("@/lib/file-storage")
    saveConnections(connections)

    console.log("[v0] Active connection settings updated successfully")
    await SystemLogger.logConnection(`Active connection settings updated`, connectionId, "info", settings)

    return NextResponse.json({
      success: true,
      message: "Active connection settings updated",
      connection: connections[connectionIndex],
    })
  } catch (error) {
    console.error("[v0] Error updating active connection:", error)
    await SystemLogger.logError(error, "api", "PATCH /api/active-connections")

    return NextResponse.json(
      {
        error: "Failed to update active connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
