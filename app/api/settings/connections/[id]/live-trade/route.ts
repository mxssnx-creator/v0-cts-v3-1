import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections } from "@/lib/file-storage"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"

// POST toggle live trading for a connection
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    const { is_live_trade } = await request.json()

    console.log("[v0] Toggling live trade:", connectionId, "enabled:", is_live_trade)

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === connectionId)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const connection = connections[connectionIndex]

    if (!connection.is_enabled && is_live_trade) {
      return NextResponse.json({ error: "Connection must be enabled before activating live trade" }, { status: 400 })
    }

    // Update connection
    const updatedConnection = {
      ...connection,
      is_live_trade,
      updated_at: new Date().toISOString(),
    }

    connections[connectionIndex] = updatedConnection
    saveConnections(connections)

    // Start/stop trade engine if needed
    if (is_live_trade) {
      const coordinator = getGlobalTradeEngineCoordinator()
      await coordinator.startEngine(connectionId)
    } else {
      const coordinator = getGlobalTradeEngineCoordinator()
      await coordinator.stopEngine(connectionId)
    }

    await SystemLogger.logConnection(
      `Live trading ${is_live_trade ? "enabled" : "disabled"}: ${connection.name}`,
      connectionId,
      "info",
      { is_live_trade, connection_id: connectionId },
    )

    return NextResponse.json({ success: true, is_live_trade })
  } catch (error) {
    console.error("[v0] Failed to toggle live trade:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/live-trade")
    return NextResponse.json(
      {
        error: "Failed to toggle live trade",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
