import { type NextRequest, NextResponse } from "next/server"
import { connectionDb, connectionLogsDb } from "@/lib/db-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connection = await connectionDb.getById(id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    return NextResponse.json(connection)
  } catch (error) {
    console.error("[v0] Error fetching connection:", error)
    return NextResponse.json({ error: "Failed to fetch connection" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const connection = await connectionDb.update(id, body)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    await connectionLogsDb.add(id, "update", "success", `Connection ${connection.name} updated`)

    return NextResponse.json(connection)
  } catch (error) {
    console.error("[v0] Error updating connection:", error)
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connection = await connectionDb.getById(id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    await connectionDb.delete(id)
    await connectionLogsDb.deleteByConnectionId(id)

    return NextResponse.json({ success: true, message: "Connection deleted" })
  } catch (error) {
    console.error("[v0] Error deleting connection:", error)
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const connection = await connectionDb.update(id, body)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    await connectionLogsDb.add(id, "update", "success", `Connection ${connection.name} updated`)

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error("[v0] Error updating connection:", error)
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 })
  }
}
