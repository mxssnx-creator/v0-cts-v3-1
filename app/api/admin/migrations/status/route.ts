import { NextResponse } from "next/server"
import { query, getDatabaseType } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Get migration status
 * GET /api/admin/migrations/status
 */
export async function GET() {
  try {
    const dbType = getDatabaseType()

    // Get all applied migrations
    const migrations = await query(
      "SELECT id, name, executed_at, execution_time_ms, checksum FROM migrations ORDER BY id ASC"
    )

    // Get all tables
    const tablesQuery = dbType === "postgresql"
      ? "SELECT tablename as name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
      : "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    
    const tables = await query(tablesQuery)

    // Define expected table categories
    const expectedTables = {
      core: ["users", "system_settings", "site_logs", "migrations"],
      connections: ["exchange_connections", "connection_coordination"],
      indications: [
        "indications_direction",
        "indications_move", 
        "indications_active",
        "indications_optimal",
        "indications_auto",
        "indication_states"
      ],
      strategies: [
        "strategies_base",
        "strategies_main",
        "strategies_real",
        "strategies_block",
        "strategies_dca",
        "strategies_trailing"
      ],
      positions: [
        "pseudo_positions",
        "real_pseudo_positions",
        "exchange_positions"
      ],
      presets: [
        "presets",
        "preset_sets",
        "preset_connections",
        "preset_trade_settings"
      ],
      statistics: [
        "statistics_indication",
        "statistics_strategy",
        "statistics_daily"
      ]
    }

    const existingTableNames = tables.map((t: any) => t.name)
    
    // Check each category
    const tableStatus: any = {}
    let totalExpected = 0
    let totalExisting = 0

    for (const [category, tableList] of Object.entries(expectedTables)) {
      const existing = tableList.filter(t => existingTableNames.includes(t))
      const missing = tableList.filter(t => !existingTableNames.includes(t))
      
      totalExpected += tableList.length
      totalExisting += existing.length

      tableStatus[category] = {
        expected: tableList.length,
        existing: existing.length,
        missing,
        complete: missing.length === 0
      }
    }

    return NextResponse.json({
      success: true,
      database: {
        type: dbType,
        connected: true
      },
      migrations: {
        total: migrations.length,
        applied: migrations.map((m: any) => ({
          id: m.id,
          name: m.name,
          executedAt: m.executed_at,
          executionTime: m.execution_time_ms ? `${m.execution_time_ms}ms` : "unknown"
        }))
      },
      tables: {
        total: existingTableNames.length,
        expected: totalExpected,
        existing: totalExisting,
        categories: tableStatus
      },
      status: totalExisting === totalExpected ? "complete" : "incomplete",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] Migration status check failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
