import { NextResponse, type NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Alert {
  id: string
  level: "critical" | "warning" | "info"
  category: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

/**
 * GET /api/monitoring/alerts
 * Fetch active alerts based on system monitoring
 */
export async function GET() {
  try {
    const alerts: Alert[] = []

    // Check trade engine states for errors
    const engineStates = await sql`
      SELECT connection_id, status, error_message, updated_at
      FROM trade_engine_state
      WHERE status = 'error' OR error_message IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 10
    `

    for (const state of engineStates) {
      alerts.push({
        id: `engine-${state.connection_id}`,
        level: "critical",
        category: "Trade Engine",
        message: `Trade engine error on connection ${state.connection_id}: ${state.error_message || "Unknown error"}`,
        timestamp: new Date(state.updated_at),
        acknowledged: false
      })
    }

    // Check for failed orders (if orders table exists)
    try {
      const failedOrders = await sql`
        SELECT COUNT(*) as count
        FROM orders
        WHERE status = 'failed'
          AND created_at > NOW() - INTERVAL '1 hour'
      `

      if (failedOrders[0]?.count > 5) {
        alerts.push({
          id: "orders-failed",
          level: "warning",
          category: "Order Execution",
          message: `${failedOrders[0].count} orders failed in the last hour`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    } catch {
      // Orders table might not exist yet
    }

    // Check for inactive connections that should be active
    const inactiveConnections = await sql`
      SELECT id, name
      FROM exchange_connections
      WHERE is_enabled = TRUE
        AND (is_live_trade = TRUE OR is_preset_trade = TRUE)
        AND updated_at < NOW() - INTERVAL '5 minutes'
    `

    for (const conn of inactiveConnections) {
      alerts.push({
        id: `conn-inactive-${conn.id}`,
        level: "warning",
        category: "Connection",
        message: `Connection "${conn.name}" has not been active in the last 5 minutes`,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Check for high error rate in logs
    try {
      const recentErrors = await sql`
        SELECT COUNT(*) as count
        FROM site_logs
        WHERE level = 'error'
          AND created_at > NOW() - INTERVAL '10 minutes'
      `

      if (recentErrors[0]?.count > 10) {
        alerts.push({
          id: "high-error-rate",
          level: "critical",
          category: "System Health",
          message: `High error rate detected: ${recentErrors[0].count} errors in last 10 minutes`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    } catch {
      // site_logs table might not exist
    }

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      criticalCount: alerts.filter(a => a.level === "critical").length,
      warningCount: alerts.filter(a => a.level === "warning").length
    })

  } catch (error) {
    console.error("[v0] Failed to fetch alerts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch monitoring alerts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring/alerts
 * Acknowledge an alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId } = body

    await SystemLogger.logAPI(`Alert acknowledged: ${alertId}`, "info", "POST /api/monitoring/alerts")

    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} acknowledged`
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to acknowledge alert"
      },
      { status: 500 }
    )
  }
}
