import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")
    const indicationType = searchParams.get("indication_type") as "active" | "direction" | "move" | null
    const strategyType = searchParams.get("strategy_type") as "simple" | "advanced" | "step" | null

    let stats: any

    if (indicationType) {
      stats = await db.getIndicationStatistics(indicationType, connectionId || undefined)
    } else if (strategyType) {
      stats = await db.getStrategyStatistics(strategyType, connectionId || undefined)
    } else if (connectionId) {
      stats = await db.getPositionStats(connectionId)
    } else {
      stats = await db.getAggregatedStatistics({})
    }

    return NextResponse.json({
      stats: {
        total_positions: stats?.total_positions || 0,
        active_positions: stats?.active_positions || 0,
        closed_positions: stats?.closed_positions || 0,
        total_pnl: stats?.total_pnl || 0,
        win_rate: stats?.win_rate || 0,
        avg_profit: stats?.avg_profit || 0,
        avg_loss: stats?.avg_loss || 0,
      },
      metadata: {
        indicationType,
        strategyType,
        connectionId,
        querySource: indicationType || strategyType ? "separated_tables" : "aggregated",
      },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch position stats:", error)
    return NextResponse.json({ error: "Failed to fetch position stats" }, { status: 500 })
  }
}
