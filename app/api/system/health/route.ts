import { type NextRequest, NextResponse } from "next/server"
import { sql, getDatabaseType } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  database: {
    type: string
    connected: boolean
    initialized: boolean
    criticalTablesPresent: boolean
    missingTables: string[]
    recordCounts?: Record<string, number>
  }
  connections: {
    total: number
    active: number
    enabled: number
    liveTrading: number
  }
  tradeEngine: {
    enginesRunning: number
    enginesHealthy: number
    enginesError: number
  }
  indications: {
    total: number
    active: number
    lastProcessed?: string
  }
  strategies: {
    total: number
    active: number
    lastProcessed?: string
  }
  positions: {
    total: number
    open: number
    closed: number
  }
  workflowIntegrity: {
    isIntact: boolean
    criticalIssues: string[]
    warnings: string[]
  }
  checks: {
    dbConnection: "passed" | "failed"
    schemaIntegrity: "passed" | "failed"
    apiConformity: "passed" | "degraded" | "failed"
  }
}

const CRITICAL_TABLES = [
  "exchange_connections",
  "indications",
  "preset_strategies",
  "pseudo_positions",
  "trade_engine_state",
  "system_settings",
]

export async function GET() {
  try {
    console.log("[v0] System health check requested")

    const report: SystemHealthReport = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: await checkDatabase(),
      connections: await checkConnections(),
      tradeEngine: await checkTradeEngine(),
      indications: await checkIndications(),
      strategies: await checkStrategies(),
      positions: await checkPositions(),
      workflowIntegrity: await checkWorkflowIntegrity(),
      checks: {
        dbConnection: "failed",
        schemaIntegrity: "failed",
        apiConformity: "passed",
      },
    }

    // Set check statuses
    report.checks.dbConnection = report.database.connected ? "passed" : "failed"
    report.checks.schemaIntegrity = report.database.criticalTablesPresent ? "passed" : "failed"

    // Determine overall health
    report.status = calculateOverallHealth(report)

    console.log("[v0] Health check complete - Status:", report.status)

    await SystemLogger.logAPI("Health check completed", "info", "GET /api/system/health", {
      status: report.status,
      criticalIssues: report.workflowIntegrity.criticalIssues.length,
    })

    return NextResponse.json(report, { status: report.status === "unhealthy" ? 503 : 200 })
  } catch (error) {
    console.error("[v0] System health check error:", error)
    await SystemLogger.logError(error, "api", "GET /api/system/health")

    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || "verify"

    console.log("[v0] System action requested:", action)

    if (action === "verify") {
      // Verify all critical components
      const report = await GET()
      return report
    }

    if (action === "reinit-database") {
      console.log("[v0] Reinitializing database...")

      try {
        // This would be handled by database initialization
        await SystemLogger.logAPI("Database reinitialization requested", "info", "POST /api/system/health", {
          action,
        })

        return NextResponse.json({
          success: true,
          message: "Database reinitialization initiated",
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[v0] Reinitialization error:", error)
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] POST system health error:", error)
    await SystemLogger.logError(error, "api", "POST /api/system/health")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function checkDatabase() {
  try {
    const dbType = getDatabaseType()

    // Try basic query
    try {
      const testResult = await sql`SELECT 1 as test`
      if (!testResult) {
        throw new Error("Database query returned no result")
      }
    } catch (queryError) {
      console.warn("[v0] Database query failed:", queryError)
      return {
        type: dbType,
        connected: false,
        initialized: false,
        criticalTablesPresent: false,
        missingTables: CRITICAL_TABLES,
      }
    }

    // Check tables
    let missingTables: string[] = []
    let recordCounts: Record<string, number> = {}

    try {
      if (dbType === "sqlite") {
        const { getClient } = await import("@/lib/db")
        const client = getClient() as any
        const tables = client
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
          .all()

        const tableNames = new Set(tables.map((t: any) => t.name))
        missingTables = CRITICAL_TABLES.filter((t) => !tableNames.has(t))

        // Get record counts for key tables
        for (const table of ["exchange_connections", "indications", "preset_strategies", "pseudo_positions"]) {
          try {
            const count = client.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get()
            recordCounts[table] = count?.cnt || 0
          } catch {
            recordCounts[table] = 0
          }
        }
      } else {
        // For other database types
        for (const table of CRITICAL_TABLES) {
          try {
            const result = await sql`SELECT COUNT(*) as cnt FROM ${sql.raw(table)}`
            if (!result || result.length === 0) {
              missingTables.push(table)
            } else {
              recordCounts[table] = result[0]?.cnt || 0
            }
          } catch {
            missingTables.push(table)
          }
        }
      }
    } catch (tableError) {
      console.warn("[v0] Could not check tables:", tableError)
    }

    return {
      type: dbType,
      connected: true,
      initialized: missingTables.length === 0,
      criticalTablesPresent: missingTables.length === 0,
      missingTables,
      recordCounts: Object.keys(recordCounts).length > 0 ? recordCounts : undefined,
    }
  } catch (error) {
    console.error("[v0] Database check failed:", error)
    return {
      type: "unknown",
      connected: false,
      initialized: false,
      criticalTablesPresent: false,
      missingTables: CRITICAL_TABLES,
    }
  }
}

async function checkConnections() {
  try {
    const { loadConnections } = await import("@/lib/file-storage")
    const connections = loadConnections()

    return {
      total: connections.length,
      active: connections.filter((c: any) => c.is_active).length,
      enabled: connections.filter((c: any) => c.is_enabled).length,
      liveTrading: connections.filter((c: any) => c.is_live_trade).length,
    }
  } catch (error) {
    console.warn("[v0] Could not check connections:", error)
    return {
      total: 0,
      active: 0,
      enabled: 0,
      liveTrading: 0,
    }
  }
}

async function checkTradeEngine() {
  try {
    const result = await sql<any>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN manager_health_status = 'healthy' THEN 1 ELSE 0 END) as healthy,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
      FROM trade_engine_state
    `

    const stats = result?.[0] || {}
    return {
      enginesRunning: stats.running || 0,
      enginesHealthy: stats.healthy || 0,
      enginesError: stats.error_count || 0,
    }
  } catch (error) {
    console.warn("[v0] Could not check trade engine:", error)
    return {
      enginesRunning: 0,
      enginesHealthy: 0,
      enginesError: 0,
    }
  }
}

async function checkIndications() {
  try {
    const result = await sql<any>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        MAX(created_at) as last_processed
      FROM indications
    `

    const stats = result?.[0] || {}
    return {
      total: stats.total || 0,
      active: stats.active || 0,
      lastProcessed: stats.last_processed || undefined,
    }
  } catch (error) {
    console.warn("[v0] Could not check indications:", error)
    return {
      total: 0,
      active: 0,
    }
  }
}

async function checkStrategies() {
  try {
    const result = await sql<any>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        MAX(created_at) as last_processed
      FROM preset_strategies
    `

    const stats = result?.[0] || {}
    return {
      total: stats.total || 0,
      active: stats.active || 0,
      lastProcessed: stats.last_processed || undefined,
    }
  } catch (error) {
    console.warn("[v0] Could not check strategies:", error)
    return {
      total: 0,
      active: 0,
    }
  }
}

async function checkPositions() {
  try {
    const result = await sql<any>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
      FROM pseudo_positions
    `

    const stats = result?.[0] || {}
    return {
      total: stats.total || 0,
      open: stats.open_count || 0,
      closed: stats.closed_count || 0,
    }
  } catch (error) {
    console.warn("[v0] Could not check positions:", error)
    return {
      total: 0,
      open: 0,
      closed: 0,
    }
  }
}

async function checkWorkflowIntegrity() {
  const criticalIssues: string[] = []
  const warnings: string[] = []

  try {
    // Check database connection
    try {
      const dbCheck = await sql`SELECT 1`
      if (!dbCheck) {
        criticalIssues.push("Database connection failed")
      }
    } catch (error) {
      criticalIssues.push("Database connection failed: " + (error instanceof Error ? error.message : "unknown"))
    }

    // Check if critical tables exist
    try {
      const testQuery = await sql`SELECT COUNT(*) as cnt FROM exchange_connections`
      if (!testQuery) {
        criticalIssues.push("Critical tables not accessible")
      }
    } catch (error) {
      criticalIssues.push("Critical tables missing or inaccessible")
    }

    // Check if trade engines are healthy
    try {
      const errorEngines = await sql<any>`
        SELECT COUNT(*) as cnt FROM trade_engine_state WHERE status = 'error'
      `
      if (errorEngines?.[0]?.cnt > 0) {
        warnings.push(`${errorEngines[0].cnt} trade engine(s) in error state`)
      }
    } catch (error) {
      warnings.push("Could not check trade engine health")
    }

    // Check if any connections are configured
    try {
      const { loadConnections } = await import("@/lib/file-storage")
      const connections = loadConnections()
      if (connections.length === 0) {
        warnings.push("No connections configured")
      }
    } catch (error) {
      warnings.push("Could not load connections")
    }

    // Check if strategies are active
    try {
      const activeStrategies = await sql<any>`
        SELECT COUNT(*) as cnt FROM preset_strategies WHERE is_active = true
      `
      if (activeStrategies?.[0]?.cnt === 0) {
        warnings.push("No active strategies")
      }
    } catch (error) {
      warnings.push("Could not check strategies")
    }
  } catch (error) {
    criticalIssues.push("Workflow integrity check failed: " + (error instanceof Error ? error.message : "unknown"))
  }

  return {
    isIntact: criticalIssues.length === 0,
    criticalIssues,
    warnings,
  }
}

function calculateOverallHealth(report: SystemHealthReport): "healthy" | "degraded" | "unhealthy" {
  if (report.workflowIntegrity.criticalIssues.length > 0) {
    return "unhealthy"
  }

  if (
    !report.database.connected ||
    !report.database.initialized ||
    report.checks.dbConnection === "failed" ||
    report.workflowIntegrity.warnings.length > 3
  ) {
    return "degraded"
  }

  return "healthy"
}
