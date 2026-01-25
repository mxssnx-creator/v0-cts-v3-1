import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching trading statistics")
    
    const connections = loadConnections()
    const enabledConnections = connections.filter((c) => c.is_enabled && c.is_live_trade)
    
    if (enabledConnections.length === 0) {
      return NextResponse.json({
        total_positions: 0,
        open_positions: 0,
        closed_positions: 0,
        total_volume: 0,
        total_pnl: 0,
        win_rate: 0,
        avg_hold_time: 0,
        balance: 0,
        equity: 0,
      })
    }

    try {
      // Get stats from database
      const stats = await query(
        `SELECT 
          COUNT(CASE WHEN is_open = true THEN 1 END) as open_count,
          COUNT(CASE WHEN is_open = false THEN 1 END) as closed_count,
          COALESCE(SUM(quantity * entry_price), 0) as total_volume,
          COALESCE(SUM(pnl), 0) as total_pnl,
          COALESCE(AVG(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as win_rate
         FROM pseudo_positions`
      )
      
      const row = (stats as any[])[0]
      
      console.log(`[v0] Trading stats - Open: ${row.open_count}, Closed: ${row.closed_count}, PnL: ${row.total_pnl}`)
      
      return NextResponse.json({
        total_positions: (row.open_count || 0) + (row.closed_count || 0),
        open_positions: row.open_count || 0,
        closed_positions: row.closed_count || 0,
        total_volume: row.total_volume || 0,
        total_pnl: row.total_pnl || 0,
        win_rate: row.win_rate || 0,
        avg_hold_time: 0,
        balance: 10000,
        equity: 10000,
      })
    } catch (dbError) {
      console.warn("[v0] Database stats not available:", dbError)
      return NextResponse.json({
        total_positions: 0,
        open_positions: 0,
        closed_positions: 0,
        total_volume: 0,
        total_pnl: 0,
        win_rate: 0,
        avg_hold_time: 0,
        balance: 0,
        equity: 0,
      })
    }
  } catch (error) {
    console.error("[v0] Failed to fetch stats:", error)
    await SystemLogger.logError(error, "api", "GET /api/trading/stats")
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
