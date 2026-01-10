import { NextResponse } from "next/server"
import { getGlobalCoordinator } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

export async function POST() {
  try {
    console.log("[v0] [Trade Engine] Stopping global trade engine...")

    const coordinator = getGlobalCoordinator()

    if (!coordinator) {
      return NextResponse.json(
        {
          error: "Trade engine not initialized",
        },
        { status: 400 },
      )
    }

    if (!coordinator.getIsRunning()) {
      return NextResponse.json({
        success: true,
        message: "Trade engine is already stopped",
      })
    }

    await coordinator.stop()

    console.log("[v0] [Trade Engine] Stopped successfully")
    await SystemLogger.logTradeEngine("Global trade engine stopped", "info", {})

    return NextResponse.json({
      success: true,
      message: "Global trade engine stopped successfully",
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to stop:", error)
    await SystemLogger.logError(error, "trade-engine", "POST /api/trade-engine/stop")

    return NextResponse.json(
      {
        error: "Failed to stop trade engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
