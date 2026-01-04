import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      await SystemLogger.logError(
        new Error("GlobalTradeEngineCoordinator not initialized"),
        "trade-engine",
        "pause-endpoint",
      )
      return NextResponse.json({ success: false, error: "Trade engine not initialized" }, { status: 503 })
    }

    await engine.pause()
    await SystemLogger.logTradeEngine("Global trade engine paused successfully", "info", { action: "pause" })

    return NextResponse.json({ success: true, message: "Trade engine paused" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await SystemLogger.logError(
      error instanceof Error ? error : new Error(errorMessage),
      "trade-engine",
      "pause-endpoint",
    )
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
