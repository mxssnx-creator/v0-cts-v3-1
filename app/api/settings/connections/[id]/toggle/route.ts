import { type NextRequest, NextResponse } from "next/server"
import { connectionDb, connectionLogsDb } from "@/lib/db-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type } = body

    if (!type || !["enabled", "active"].includes(type)) {
      return NextResponse.json({ error: "Invalid toggle type" }, { status: 400 })
    }

    let connection
    if (type === "enabled") {
      connection = await connectionDb.toggleEnabled(id)
    } else {
      connection = await connectionDb.toggleActive(id)
    }

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const action = type === "enabled" ? (connection.is_enabled ? "enabled" : "disabled") : connection.is_active ? "activated" : "deactivated"
    await connectionLogsDb.add(id, `toggle_${type}`, "success", `Connection ${connection.name} ${action}`)

    return NextResponse.json(connection)
  } catch (error) {
    console.error("[v0] Error toggling connection:", error)
    return NextResponse.json({ error: "Failed to toggle connection" }, { status: 500 })
  }
}
