import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching trade engine progression")
    
    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_active)
    
    // Get progression status for each connection
    const progressionData = await Promise.all(
      activeConnections.map(async (conn) => {
        try {
          // Get trade count
          const trades = await query(
            `SELECT COUNT(*) as count FROM trades WHERE connection_id = ?`,
            [conn.id]
          )
          
          // Get engine state
          const state = await query(
            `SELECT state, updated_at FROM trade_engine_state WHERE connection_id = ?`,
            [conn.id]
          )
          
          const tradeCount = (trades as any[])[0]?.count || 0
          const engineState = (state as any[])[0]?.state || 'idle'
          const updatedAt = (state as any[])[0]?.updated_at
          
          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            isEnabled: conn.is_enabled,
            isActive: conn.is_active,
            isLiveTrading: conn.is_live_trade,
            engineState,
            tradeCount,
            lastUpdate: updatedAt,
          }
        } catch (err) {
          console.warn(`[v0] Failed to get progression for ${conn.id}:`, err)
          return {
            connectionId: conn.id,
            connectionName: conn.name,
            exchange: conn.exchange,
            isEnabled: conn.is_enabled,
            isActive: conn.is_active,
            isLiveTrading: conn.is_live_trade,
            engineState: 'error',
            tradeCount: 0,
            lastUpdate: null,
          }
        }
      })
    )
    
    console.log(`[v0] Progression data for ${progressionData.length} connections`)
    return NextResponse.json(progressionData)
  } catch (error) {
    console.error("[v0] Failed to fetch progression:", error)
    await SystemLogger.logError(error, "api", "GET /api/trade-engine/progression")
    return NextResponse.json({ error: "Failed to fetch progression" }, { status: 500 })
  }
}
