import { NextResponse } from "next/server"
import { getDatabaseType, query } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Database health check endpoint
 * GET /api/health/database
 */
export async function GET() {
  try {
    const dbType = getDatabaseType()
    
    // Test database connectivity
    const testQuery = dbType === "postgresql" 
      ? "SELECT 1 as test"
      : "SELECT 1 as test"
    
    const startTime = Date.now()
    await query(testQuery)
    const responseTime = Date.now() - startTime

    // Get table count
    const tableCountQuery = dbType === "postgresql"
      ? "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      : "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
    
    const tableResult = await query(tableCountQuery)
    const tableCount = tableResult[0]?.count || 0

    // Check critical tables
    const criticalTables = [
      "users",
      "system_settings",
      "site_logs",
      "exchange_connections",
      "migrations"
    ]

    const existingTablesQuery = dbType === "postgresql"
      ? "SELECT tablename as name FROM pg_tables WHERE schemaname = 'public'"
      : "SELECT name FROM sqlite_master WHERE type='table'"
    
    const existingTablesResult = await query(existingTablesQuery)
    const existingTables = existingTablesResult.map((r: any) => r.name)
    
    const missingTables = criticalTables.filter(t => !existingTables.includes(t))
    const isHealthy = missingTables.length === 0

    return NextResponse.json({
      status: isHealthy ? "healthy" : "degraded",
      database: {
        type: dbType,
        connected: true,
        responseTime: `${responseTime}ms`,
        tableCount,
        criticalTables: {
          total: criticalTables.length,
          existing: criticalTables.length - missingTables.length,
          missing: missingTables
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] Database health check failed:", error)
    
    return NextResponse.json({
      status: "unhealthy",
      database: {
        type: getDatabaseType(),
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
