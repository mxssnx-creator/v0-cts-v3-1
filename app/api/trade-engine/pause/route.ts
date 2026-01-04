import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"

/**
 * Pause the Global Trade Engine
 */
export async function POST(): Promise<NextResponse> {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      return NextResponse.json({ error: "Trade engine not initialized" }, { status: 400 })
    }

    await engine.pause()
    await SystemLogger.logTradeEngine("Global Trade Engine paused", "info")

    return NextResponse.json({ success: true, message: "Trade engine paused" })
  } catch (error) {
    console.error("[v0] Failed to pause trade engine:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/pause")

    return NextResponse.json(
      { error: "Failed to pause trade engine", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
