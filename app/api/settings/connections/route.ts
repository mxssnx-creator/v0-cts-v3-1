import { type NextRequest, NextResponse } from "next/server"
import { connectionDb, connectionLogsDb } from "@/lib/db-service"

export async function GET() {
  try {
    const connections = await connectionDb.getAll()
    return NextResponse.json(connections)
  } catch (error) {
    console.error("[v0] Error fetching connections:", error)
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, exchange, api_type, connection_method, connection_library, api_key, api_secret, api_passphrase, margin_type, position_mode, is_testnet } = body

    if (!name || !exchange || !api_key || !api_secret) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const connection = await connectionDb.create({
      name,
      exchange,
      api_type,
      connection_method,
      connection_library,
      api_key,
      api_secret,
      api_passphrase,
      margin_type,
      position_mode,
      is_testnet,
      is_enabled: true,
      is_active: true,
      is_predefined: false,
    })

    if (!connection) {
      return NextResponse.json({ error: "Failed to create connection" }, { status: 500 })
    }

    await connectionLogsDb.add(connection.id, "creation", "success", `Connection ${name} created`)

    return NextResponse.json(connection, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating connection:", error)
    return NextResponse.json({ error: "Failed to create connection" }, { status: 500 })
  }
}
