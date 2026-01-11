import { type NextRequest, NextResponse } from "next/server"
import { loadActiveConnections, saveActiveConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const connectionId = params.id
    console.log("[v0] Deleting active connection:", connectionId)

    const connections = loadActiveConnections()
    const filtered = connections.filter((c) => c.id !== connectionId)

    if (filtered.length === connections.length) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    saveActiveConnections(filtered)

    await SystemLogger.logConnection(`Active connection deleted`, connectionId, "info", { action: "delete" })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error deleting active connection:", error)
    await SystemLogger.logError(error, "api", "DELETE /api/active-connections/:id")
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 })
  }
}
