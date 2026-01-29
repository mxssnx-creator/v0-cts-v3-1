import { NextResponse } from "next/server"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/trade-engine/resume
 * Resume the Global Trade Engine Coordinator
 * Resumes all trading operations across all connections
 */
export async function POST() {
  try {
    const coordinator = getGlobalTradeEngineCoordinator()

    if (!coordinator) {
      return NextResponse.json({ success: false, error: "Trade engine coordinator not initialized" }, { status: 503 })
    }

    await coordinator.resume()
    await SystemLogger.logTradeEngine("Global Trade Engine Coordinator resumed via API", "info")

    return NextResponse.json({
      success: true,
      message: "Trade engine resumed successfully",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await SystemLogger.logError(error, "trade-engine", "Resume API")

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
