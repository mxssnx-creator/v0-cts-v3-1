import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"

export async function POST(): Promise<NextResponse> {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      return NextResponse.json({ error: "Trade engine not initialized" }, { status: 400 })
    }

    if (!engine.isRunning()) {
      return NextResponse.json({ message: "Trade engine already paused" })
    }

    await engine.stop()
    await SystemLogger.logTradeEngine("Trade engine paused for database reorganization", "info")

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
