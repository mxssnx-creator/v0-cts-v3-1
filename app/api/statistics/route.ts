import { DatabaseManager } from "@/lib/database"
import { successResponse, errorResponse } from "@/lib/api-response"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")
    const indicationType = searchParams.get("indication_type") as "active" | "direction" | "move" | null
    const strategyType = searchParams.get("strategy_type") as "simple" | "advanced" | "step" | null
    const timeRange = searchParams.get("time_range") || "24h"

    const dbManager = DatabaseManager.getInstance()

    let statistics

    if (indicationType) {
      // Get indication-specific statistics from separated tables
      statistics = await dbManager.getIndicationStatistics(indicationType, connectionId || undefined)
    } else if (strategyType) {
      // Get strategy-specific statistics from separated tables
      statistics = await dbManager.getStrategyStatistics(strategyType, connectionId || undefined)
    } else if (connectionId) {
      // Get all statistics for a specific connection
      statistics = await dbManager.getConnectionStatistics(connectionId)
    } else {
      // Get aggregated statistics across all tables
      statistics = await dbManager.getAggregatedStatistics({ timeRange })
    }

    return successResponse({
      statistics,
      metadata: {
        indicationType,
        strategyType,
        connectionId,
        timeRange,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Statistics API error:", error)
    return errorResponse("Failed to fetch statistics", {
      status: 500,
      code: "STATISTICS_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
