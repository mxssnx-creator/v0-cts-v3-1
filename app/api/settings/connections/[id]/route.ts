import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections, saveConnections, type Connection } from "@/lib/file-storage"
import { ErrorRecoveryManager } from "@/lib/error-recovery"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    return NextResponse.json(connection, { status: 200 })
  } catch (error) {
    console.error("[v0] Failed to fetch connection:", error)
    await SystemLogger.logError(error, "api", `GET /api/settings/connections/[id]`, { id: (await params).id })
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
    const updatedConnections = connections.filter((conn) => conn.id !== id)

    if (updatedConnections.length === connections.length) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    saveConnections(updatedConnections)
    await SystemLogger.logConnection(`Connection deleted`, id, "info")

    return NextResponse.json({ success: true, message: "Connection deleted" })
  } catch (error) {
    console.error("[v0] Failed to delete connection:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "delete-connection",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", `DELETE /api/settings/connections/[id]`, { id: (await params).id })
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

    console.log("[v0] Patching connection:", id, Object.keys(body))
    await SystemLogger.logConnection(`Updating connection`, id, "info", Object.keys(body))

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

    return NextResponse.json({ success: true, message: "Connection updated", connection: updatedConnection })
  } catch (error) {
    console.error("[v0] Failed to patch connection:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "patch-connection",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", `PATCH /api/settings/connections/[id]`, { id: (await params).id })
    return NextResponse.json(
      { error: "Failed to update connection", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log("[v0] Updating connection:", id, Object.keys(body))
    await SystemLogger.logConnection(`Full update of connection`, id, "info", Object.keys(body))

    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === id)

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const connection = connections[connectionIndex]

    // Handle is_enabled toggle (disable live trade if disabling)
    if (typeof body.is_enabled === "boolean" && body.is_enabled === false) {
      body.is_live_trade = false
      body.is_preset_trade = false
      console.log("[v0] Disabled connection, also disabling live trade:", id)
    }

    // Handle is_live_trade toggle (require connection to be enabled)
    if (typeof body.is_live_trade === "boolean" && body.is_live_trade === true) {
      if (!connection.is_enabled) {
        return NextResponse.json(
          { error: "Connection must be enabled before enabling live trade" },
          { status: 400 }
        )
      }
      console.log("[v0] Enabled live trade for connection:", id)
    }

    const updatedConnection: Connection = {
      ...connection,
      ...body,
      id, // Preserve original ID
      created_at: connection.created_at, // Preserve creation time
      updated_at: new Date().toISOString(),
    }

    connections[connectionIndex] = updatedConnection
    saveConnections(connections)

    await SystemLogger.logConnection(`Connection updated successfully`, id, "info", {
      fields: Object.keys(body),
    })

    return NextResponse.json({
      success: true,
      message: "Connection updated",
      connection: updatedConnection,
    })
  } catch (error) {
    console.error("[v0] Failed to update connection:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "update-connection",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", `PUT /api/settings/connections/[id]`, { id: (await params).id })
    return NextResponse.json(
      { error: "Failed to update connection", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
