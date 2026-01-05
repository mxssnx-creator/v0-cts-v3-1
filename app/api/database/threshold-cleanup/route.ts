import { type NextRequest, NextResponse } from "next/server"
import { positionThresholdManager } from "@/lib/position-threshold-manager"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, type } = body

    if (type === "manual" && connectionId) {
      await positionThresholdManager.manualCleanup(connectionId)
      return successResponse({
        success: true,
        message: `Cleanup completed for connection ${connectionId}`,
      })
    } else if (type === "all") {
      await positionThresholdManager.checkAndCleanupAllConfigurations()
      return successResponse({
        success: true,
        message: "Cleanup completed for all connections",
      })
    } else {
      return errorResponse("Invalid cleanup type. Must specify 'manual' with connectionId or 'all'", {
        status: 400,
        code: "BAD_REQUEST",
        details: { type, connectionId },
      })
    }
  } catch (error) {
    console.error("Threshold cleanup error:", error)
    return errorResponse("Cleanup failed", {
      status: 500,
      code: "SERVER_ERROR",
      details: String(error),
    })
  }
}

export async function GET() {
  try {
    const stats = await positionThresholdManager.getPositionStatistics()
    return NextResponse.json({ success: true, statistics: stats })
  } catch (error) {
    console.error("Failed to fetch position statistics:", error)
    return errorResponse("Failed to fetch statistics", {
      status: 500,
      code: "SERVER_ERROR",
      details: String(error),
    })
  }
}
