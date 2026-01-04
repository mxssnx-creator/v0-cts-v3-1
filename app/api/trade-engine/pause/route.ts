import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pause the Global Trade Engine Coordinator
 * Pauses all trading operations across all connections
 */
export async function POST(): Promise<NextResponse> {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      return NextResponse.json({ error: "Trade engine not initialized" }, { status: 400 })
    }

    await engine.pause()
    await SystemLogger.logTradeEngine("Global Trade Engine Coordinator paused", "info")

    return NextResponse.json({ success: true, message: "Trade engine coordinator paused" })
  } catch (error) {
    console.error("[v0] Failed to pause trade engine coordinator:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/pause")

    return NextResponse.json(
      {
        error: "Failed to pause trade engine coordinator",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
