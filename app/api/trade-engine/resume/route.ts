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

    await engine.resume()
    await SystemLogger.logTradeEngine("Global Trade Engine resumed", "info")

    return NextResponse.json({ success: true, message: "Trade engine resumed" })
  } catch (error) {
    console.error("[v0] Failed to resume trade engine:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/resume")

    return NextResponse.json(
      { error: "Failed to resume trade engine", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
