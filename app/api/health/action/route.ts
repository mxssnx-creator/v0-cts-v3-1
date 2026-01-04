import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { checkId, actionId } = await request.json()

    if (!checkId || !actionId) {
      return NextResponse.json({ success: false, error: "Missing checkId or actionId" }, { status: 400 })
    }

    console.log(`[Health Action] Executing ${actionId} for ${checkId}`)

    let result: any = { success: true, message: "Action completed" }

    // Execute specific actions based on checkId and actionId
    switch (`${checkId}:${actionId}`) {
      case "connections:reconnect-all":
        await sql`UPDATE exchange_connections SET is_active = false WHERE is_enabled = true`
        await sql`UPDATE exchange_connections SET is_active = true WHERE is_enabled = true`
        result.message = "All connections reconnected"
        break

      case "trade-engine:restart-all":
        await sql`UPDATE trade_engine_state SET status = 'restarting', updated_at = NOW()`
        result.message = "Trade engines restarting"
        break

      case "trade-engine:clear-errors":
        await sql`UPDATE trade_engine_state SET error_count = 0, status = 'stopped' WHERE status = 'error'`
        result.message = "Errors cleared"
        break

      case "database:optimize":
        await sql`VACUUM ANALYZE`
        result.message = "Database optimized"
        break

      case "position-sync:force-sync":
        await sql`UPDATE exchange_positions SET last_sync_at = NULL`
        result.message = "Position sync triggered"
        break

      default:
        result = { success: false, message: "Unknown action" }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Health Action API] Failed to execute action:", error)
    return NextResponse.json({ success: false, error: "Failed to execute action" }, { status: 500 })
  }
}
