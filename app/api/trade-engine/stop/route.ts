import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId } = body

    console.log("[v0] [Trade Engine] Stopping trade engine for connection:", connectionId)

    await sql`
      UPDATE trade_engine_state
      SET state = 'stopped', updated_at = CURRENT_TIMESTAMP
      WHERE connection_id = ${connectionId}
    `

    console.log("[v0] [Trade Engine] Stopped successfully for connection:", connectionId)

    return NextResponse.json({
      success: true,
      message: "Trade engine stop signal sent",
      note: "Engine will stop on next cycle check",
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to stop:", error)
    return NextResponse.json(
      {
        error: "Failed to stop trade engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
