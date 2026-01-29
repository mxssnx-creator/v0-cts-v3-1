import { NextResponse } from "next/server"
import { getGlobalTradeEngineCoordinator } from "@/lib/trade-engine"

export async function GET() {
  try {
    console.log("[v0] [Trade Engine] Fetching trade engine status...")

    const coordinator = getGlobalTradeEngineCoordinator()

    if (!coordinator) {
      console.log("[v0] [Trade Engine] Coordinator not initialized")
      return NextResponse.json({
        running: false,
        paused: false,
        connections: [],
        totalConnections: 0,
      })
    }

    // Get status from coordinator
    const allStatus = await coordinator.getAllEnginesStatus()
    const isRunning = coordinator.isRunning()
    const isPaused = coordinator.isPausedState()
    const activeEngineCount = coordinator.getActiveEngineCount()

    console.log("[v0] [Trade Engine] Status retrieved:", {
      running: isRunning,
      paused: isPaused,
      activeEngines: activeEngineCount,
      statusCount: Object.keys(allStatus).length,
    })

    return NextResponse.json({
      running: isRunning,
      paused: isPaused,
      connectedExchanges: activeEngineCount,
      activePositions: 0,
      connections: allStatus,
      totalConnections: activeEngineCount,
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to get status:", error)
    return NextResponse.json({
      running: false,
      paused: false,
      message: "Failed to get status",
      connections: [],
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
