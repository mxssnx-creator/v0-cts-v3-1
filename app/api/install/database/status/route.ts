import { NextResponse } from "next/server"
import { query, getDatabaseType } from "@/lib/db"

export async function GET() {
  try {
    const dbType = getDatabaseType()

    // Check essential tables
    const essentialTables = [
      "site_logs",
      "base_pseudo_positions",
      "optimal_pseudo_positions",
      "optimal_market_changes",
      "optimal_performance_thresholds",
    ]

    const tableChecks = await Promise.all(
      essentialTables.map(async (tableName) => {
        try {
          const checkQuery =
            dbType === "postgresql"
              ? `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`
              : `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`

          const result = await query(checkQuery)
          const exists = dbType === "postgresql" ? result[0]?.exists === true : result.length > 0

          return { name: tableName, exists }
        } catch {
          return { name: tableName, exists: false }
        }
      }),
    )

    // Check migrations
    let migrations = []
    try {
      migrations = await query(`
        SELECT migration_id as id, migration_name as name, executed_at
        FROM schema_migrations
        ORDER BY migration_id ASC
      `)
    } catch {
      // Migrations table doesn't exist yet
      migrations = [{ id: 36, name: "create_optimal_indication_tables", executed: false }]
    }

    const allTablesExist = tableChecks.every((t) => t.exists)
    const allMigrationsExecuted = migrations.length > 0 && migrations.every((m: any) => m.executed_at)

    return NextResponse.json({
      initialized: allTablesExist && allMigrationsExecuted,
      tables: tableChecks,
      migrations: migrations.map((m: any) => ({
        id: m.id,
        name: m.name,
        executed: !!m.executed_at,
        executed_at: m.executed_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Error checking database status:", error)
    return NextResponse.json(
      {
        initialized: false,
        tables: [],
        migrations: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
