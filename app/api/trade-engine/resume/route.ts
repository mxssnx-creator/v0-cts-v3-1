import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Resume the Global Trade Engine Coordinator
 * Resumes all trading operations across all connections
 */
export async function POST(): Promise<NextResponse> {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      return NextResponse.json({ error: "Trade engine not initialized" }, { status: 400 })
    }

    await engine.resume()
    await SystemLogger.logTradeEngine("Global Trade Engine Coordinator resumed", "info")

    return NextResponse.json({ success: true, message: "Trade engine coordinator resumed" })
  } catch (error) {
    console.error("[v0] Failed to resume trade engine coordinator:", error)
    await SystemLogger.logError(error, "api", "POST /api/trade-engine/resume")

    return NextResponse.json(
      {
        error: "Failed to resume trade engine coordinator",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
