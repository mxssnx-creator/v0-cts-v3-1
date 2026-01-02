import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] [Trade Engine] Fetching trade engine status...")

    const engineStates = await sql`
      SELECT 
        tes.*,
        ec.name as connection_name,
        ec.exchange
      FROM trade_engine_state tes
      JOIN exchange_connections ec ON tes.connection_id = ec.id
      WHERE ec.is_active = true
    `

    console.log("[v0] [Trade Engine] Status retrieved for", engineStates.length, "connections")

    return NextResponse.json({
      running: engineStates.some((s: any) => s.state === "running"),
      connections: engineStates,
      totalConnections: engineStates.length,
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to get status:", error)
    return NextResponse.json({
      running: false,
      message: "Failed to get status",
      connections: [],
    })
  }
}
