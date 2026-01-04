import { type NextRequest, NextResponse } from "next/server"
import { positionThresholdManager } from "@/lib/position-threshold-manager"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, type } = body

    if (type === "manual" && connectionId) {
      // Manual cleanup for specific connection
      await positionThresholdManager.manualCleanup(connectionId)
      return successResponse({ success: true }, `Cleanup completed for connection ${connectionId}`)
    } else if (type === "all") {
      // Cleanup all configurations
      await positionThresholdManager.checkAndCleanupAllConfigurations()
      return successResponse({ success: true }, "Cleanup completed for all connections")
    } else {
      return errorResponse(
        "Invalid cleanup type",
        "Bad Request",
        "Must specify 'manual' with connectionId or 'all'",
        400,
      )
    }
  } catch (error) {
    console.error("Threshold cleanup error:", error)
    return errorResponse("Cleanup failed", "Server Error", String(error), 500)
  }
}

export async function GET() {
  try {
    const stats = await positionThresholdManager.getPositionStatistics()
    return NextResponse.json({ success: true, statistics: stats })
  } catch (error) {
    console.error("Failed to fetch position statistics:", error)
    return errorResponse("Failed to fetch statistics", "Server Error", String(error), 500)
  }
}
