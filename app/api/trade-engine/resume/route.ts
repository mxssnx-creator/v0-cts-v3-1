import { NextResponse } from "next/server"
import { getTradeEngine } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Import cache bust to force rebuild
import "@/.turbopack-cache-bust"

export async function POST() {
  try {
    const engine = getTradeEngine()

    if (!engine) {
      SystemLogger.logError("trade-engine", "GlobalTradeEngineCoordinator not initialized")
      return NextResponse.json({ success: false, error: "Trade engine not initialized" }, { status: 503 })
    }

    await engine.resume()
    SystemLogger.logTradeEngine("Global trade engine resumed successfully", { action: "resume" })

    return NextResponse.json({ success: true, message: "Trade engine resumed" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    SystemLogger.logError("trade-engine", `Failed to resume trade engine: ${errorMessage}`)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
