import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pause the Global Trade Engine Coordinator
 * Pauses all trading operations across all connections
 */
export async function POST() {
  try {
    const coordinator = getTradeEngine()

    if (!coordinator) {
      return NextResponse.json({ success: false, error: "Trade engine coordinator not initialized" }, { status: 503 })
    }

    await coordinator.pause()
    await SystemLogger.logTradeEngine("Global Trade Engine Coordinator paused via API", "info")

    return NextResponse.json({
      success: true,
      message: "Trade engine paused successfully",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await SystemLogger.logError(error, "trade-engine", "Pause API")

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
