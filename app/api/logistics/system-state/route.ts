import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get trade engine states
    const engineStates = await sql`
      SELECT 
        tes.connection_id,
        tes.status,
        tes.prehistoric_data_loaded,
        tes.active_positions_count,
        ec.name as connection_name,
        ec.exchange,
        ec.is_enabled,
        ec.is_live_trade
      FROM trade_engine_state tes
      JOIN exchange_connections ec ON ec.id = tes.connection_id
      WHERE ec.is_enabled = 1
    `

    // Get active indications count
    const indicationsCount = await sql`
      SELECT indication_type, COUNT(*) as count
      FROM indications
      WHERE is_active = 1
      GROUP BY indication_type
    `

    // Get active pseudo positions count
    const pseudoPositions = await sql`
      SELECT COUNT(*) as count
      FROM pseudo_positions
      WHERE is_active = 1
    `

    // Get real positions count
    const realPositions = await sql`
      SELECT COUNT(*) as count
      FROM real_positions
      WHERE status IN ('open', 'partial')
    `

    // Get system performance metrics
    const metrics = await sql`
      SELECT 
        AVG(cycle_duration) as avg_cycle_duration,
        MAX(cycle_duration) as max_cycle_duration,
        COUNT(*) as total_cycles
      FROM trade_engine_logs
      WHERE created_at > datetime('now', '-1 hour')
    `

    return NextResponse.json({
      engines: engineStates,
      indications: Object.fromEntries(indicationsCount.map((i: any) => [i.indication_type, i.count])),
      pseudoPositions: pseudoPositions[0]?.count || 0,
      realPositions: realPositions[0]?.count || 0,
      performance: metrics[0] || {},
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Logistics API] Error fetching system state:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch system state",
        engines: [],
        indications: {},
        pseudoPositions: 0,
        realPositions: 0,
        performance: {},
      },
      { status: 500 },
    )
  }
}
