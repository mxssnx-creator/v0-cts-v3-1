import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId } = body

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: "Connection ID is required" },
        { status: 400 }
      )
    }

    console.log("[v0] [Trade Engine] Stopping trade engine for connection:", connectionId)

    // Verify connection exists
    const connections = loadConnections()
    
    // Ensure connections is an array
    if (!Array.isArray(connections)) {
      console.error("[v0] [Trade Engine] Connections is not an array:", typeof connections)
      return NextResponse.json(
        { success: false, error: "Invalid connections data" },
        { status: 500 }
      )
    }

    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      console.error("[v0] [Trade Engine] Connection not found:", connectionId)
      return NextResponse.json(
        { success: false, error: "Connection not found" },
        { status: 404 }
      )
    }

    // Update engine state in database
    await sql`
      UPDATE trade_engine_state
      SET state = 'stopped', updated_at = CURRENT_TIMESTAMP
      WHERE connection_id = ${connectionId}
    `

    await SystemLogger.logTradeEngine(
      `Trade engine stop signal sent for connection: ${connection.name}`,
      "info",
      { connectionId, connectionName: connection.name }
    )

    console.log("[v0] [Trade Engine] Stop signal sent successfully for connection:", connectionId)

    return NextResponse.json({
      success: true,
      message: "Trade engine stop signal sent",
      note: "Engine will stop on next cycle check",
      connectionId,
      connectionName: connection.name
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] [Trade Engine] Failed to stop:", errorMessage)
    await SystemLogger.logError(error, "trade-engine", "POST /api/trade-engine/stop")
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop trade engine",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
