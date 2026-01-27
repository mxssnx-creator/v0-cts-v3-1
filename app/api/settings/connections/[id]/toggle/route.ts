import { type NextRequest, NextResponse } from "next/server"
import { loadConnections, saveConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { is_enabled } = body

    if (typeof is_enabled !== "boolean") {
      return NextResponse.json({ error: "is_enabled must be a boolean" }, { status: 400 })
    }

    const connections = loadConnections()
    const connIndex = connections.findIndex((c) => c.id === id)

    if (connIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const connection = connections[connIndex]
    
    // If disabling, also disable live trading
    if (!is_enabled) {
      connection.is_live_trade = false
      connection.is_preset_trade = false
    }
    
    connection.is_enabled = is_enabled
    connection.updated_at = new Date().toISOString()

    saveConnections(connections)

    console.log(`[v0] Connection ${id} toggled to enabled=${is_enabled}`)
    await SystemLogger.logConnection(`Connection toggled: ${is_enabled ? "enabled" : "disabled"}`, id, "info", {
      was_enabled: !is_enabled,
    })

    return NextResponse.json({ success: true, message: "Connection toggled" })
  } catch (error) {
    console.error("[v0] Error toggling connection:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/toggle")
    return NextResponse.json({ error: "Failed to toggle connection" }, { status: 500 })
  }
}
