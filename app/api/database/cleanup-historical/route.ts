import { NextResponse } from "next/server"
import { getDatabaseType, execute } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { connectionId, hoursToKeep } = await request.json()

    if (!connectionId || !hoursToKeep) {
      return NextResponse.json({ error: "connectionId and hoursToKeep are required" }, { status: 400 })
    }

    const dbType = getDatabaseType()

    // Calculate cutoff timestamp
    const cutoffTime = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000)

    // Archive old data first
    if (dbType === "postgresql" || dbType === "remote") {
      await execute(
        `INSERT INTO archived_market_data (connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, archived_at)
         SELECT connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, NOW()
         FROM market_data
         WHERE connection_id = $1 AND timestamp < $2`,
        [connectionId, cutoffTime.toISOString()],
      )
    } else {
      await execute(
        `INSERT INTO archived_market_data (connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, archived_at)
         SELECT connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, datetime('now')
         FROM market_data
         WHERE connection_id = ? AND timestamp < ?`,
        [connectionId, cutoffTime.toISOString()],
      )
    }

    // Delete old records
    let deletedCount = 0
    if (dbType === "postgresql" || dbType === "remote") {
      const result = await execute(`DELETE FROM market_data WHERE connection_id = $1 AND timestamp < $2`, [
        connectionId,
        cutoffTime.toISOString(),
      ])
      deletedCount = result.rowCount
    } else {
      const result = await execute(`DELETE FROM market_data WHERE connection_id = ? AND timestamp < ?`, [
        connectionId,
        cutoffTime.toISOString(),
      ])
      deletedCount = result.rowCount
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    })
  } catch (error) {
    console.error("[v0] Error cleaning up historical data:", error)
    return NextResponse.json({ error: "Failed to cleanup historical data" }, { status: 500 })
  }
}
