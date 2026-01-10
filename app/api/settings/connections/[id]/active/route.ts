import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections } from "@/lib/file-storage"

// POST - Add connection to active connections
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id

    console.log("[v0] Adding connection to active:", connectionId)

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === connectionId)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Update connection to be active
    connections[connectionIndex] = {
      ...connections[connectionIndex],
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    saveConnections(connections)

    await SystemLogger.logConnection(
      `Connection added to active: ${connections[connectionIndex].name}`,
      connectionId,
      "info",
    )

    return NextResponse.json({ success: true, message: "Connection added to active" })
  } catch (error) {
    console.error("[v0] Failed to add connection to active:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/active")
    return NextResponse.json({ error: "Failed to add connection to active" }, { status: 500 })
  }
}

// DELETE - Remove connection from active connections
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id

    console.log("[v0] Removing connection from active:", connectionId)

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === connectionId)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Update connection to not be active
    connections[connectionIndex] = {
      ...connections[connectionIndex],
      is_active: false,
      is_enabled: false,
      is_live_trade: false,
      updated_at: new Date().toISOString(),
    }

    saveConnections(connections)

    await SystemLogger.logConnection(
      `Connection removed from active: ${connections[connectionIndex].name}`,
      connectionId,
      "info",
    )

    return NextResponse.json({ success: true, message: "Connection removed from active" })
  } catch (error) {
    console.error("[v0] Failed to remove connection from active:", error)
    await SystemLogger.logError(error, "api", "DELETE /api/settings/connections/[id]/active")
    return NextResponse.json({ error: "Failed to remove connection from active" }, { status: 500 })
  }
}
