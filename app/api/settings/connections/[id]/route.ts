import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections, type Connection } from "@/lib/file-storage"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id && c.is_active)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    return NextResponse.json(connection, { status: 200 })
  } catch (error) {
    console.error("[v0] Failed to fetch connection:", error)
    await SystemLogger.logError(error, "api", `GET /api/settings/connections/${(await params).id}`)
    return NextResponse.json(
      { error: "Failed to fetch connection", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("[v0] Deleting connection:", id)
    await SystemLogger.logConnection(`Deleting connection`, id, "info")

    const connections = loadConnections()
    const updatedConnections = connections.map((conn) =>
      conn.id === id ? { ...conn, is_active: false, updated_at: new Date().toISOString() } : conn,
    )

    saveConnections(updatedConnections)
    await SystemLogger.logConnection(`Connection deleted`, id, "info")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete connection:", error)
    await SystemLogger.logError(error, "api", `DELETE /api/settings/connections/${(await params).id}`)
    return NextResponse.json(
      { error: "Failed to delete connection", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log("[v0] Updating connection:", id, body)
    await SystemLogger.logConnection(`Updating connection`, id, "info", body)

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === id)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const updatedConnection: Connection = {
      ...connections[connectionIndex],
      ...body,
      id: connections[connectionIndex].id, // Preserve original ID
      created_at: connections[connectionIndex].created_at, // Preserve creation time
      updated_at: new Date().toISOString(),
    }

    connections[connectionIndex] = updatedConnection
    saveConnections(connections)

    await SystemLogger.logConnection(`Connection updated successfully`, id, "info")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update connection:", error)
    await SystemLogger.logError(error, "api", `PATCH /api/settings/connections/${(await params).id}`)
    return NextResponse.json(
      { error: "Failed to update connection", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
