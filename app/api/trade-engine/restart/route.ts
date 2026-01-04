import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, force = false, clearCache = false } = body

    if (!connectionId) {
      return NextResponse.json({ success: false, error: "Connection ID required" }, { status: 400 })
    }

    console.log("[v0] [Trade Engine] Restarting trade engine for connection:", connectionId, {
      force,
      clearCache,
    })
    await SystemLogger.logTradeEngine(`Restarting trade engine for connection: ${connectionId}`, "info", {
      connectionId,
      force,
      clearCache,
    })

    await sql`
      UPDATE trade_engine_state
      SET state = 'stopped', updated_at = CURRENT_TIMESTAMP
      WHERE connection_id = ${connectionId}
    `

    console.log("[v0] [Trade Engine] Stop signal sent, waiting for engine to stop...")

    // Wait for engine to stop (give it time to complete current cycle)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    await sql`
      UPDATE trade_engine_state
      SET state = 'running', updated_at = CURRENT_TIMESTAMP
      WHERE connection_id = ${connectionId}
    `

    console.log("[v0] [Trade Engine] Restart signal sent successfully")
    await SystemLogger.logTradeEngine(`Trade engine restart signal sent for connection: ${connectionId}`, "info", {
      connectionId,
    })

    return NextResponse.json({
      success: true,
      message: "Trade engine restart initiated",
      note: "Engine will restart on next cycle check",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Error restarting trade engine:", error)
    await SystemLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      "trade-engine",
      "POST /api/trade-engine/restart",
    )

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
