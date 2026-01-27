import { type NextRequest, NextResponse } from "next/server"
import DatabaseInitializer from "@/lib/db-initialization"
import DatabaseManager from "@/lib/database"
import { SystemLogger } from "@/lib/system-logger"

/**
 * System Health Check API
 * GET /api/system/health
 * POST /api/system/health/init (initializes database)
 */

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] System health check requested")

    // Initialize database if needed
    const initSuccess = await DatabaseInitializer.initialize()

    if (!initSuccess) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Database initialization failed",
          database: {
            initialized: false,
            healthy: false,
          },
        },
        { status: 503 },
      )
    }

    // Verify database integrity
    const integrity = await DatabaseInitializer.verifyIntegrity()

    // Get database stats
    let databaseStats = {
      tableCount: 0,
      recordCount: 0,
    }

    try {
      const db = await DatabaseManager.getInstance()
      const stats = await db.getSystemStats()
      databaseStats = stats || databaseStats
    } catch (statsError) {
      console.warn("[v0] Could not retrieve database stats:", statsError)
    }

    // Compile health report
    const healthStatus =
      integrity.isValid && initSuccess
        ? "healthy"
        : integrity.missingTables.length > 0
          ? "degraded"
          : "unhealthy"

    const report = {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      database: {
        initialized: initSuccess,
        healthy: integrity.isValid,
        missingTables: integrity.missingTables,
        errors: integrity.errors,
        stats: databaseStats,
      },
      checks: {
        dbConnection: initSuccess ? "passed" : "failed",
        schemaIntegrity: integrity.isValid ? "passed" : "failed",
        criticalTables: integrity.missingTables.length === 0 ? "passed" : "failed",
      },
    }

    await SystemLogger.logAPI("System health check completed", "info", "GET /api/system/health", report)

    return NextResponse.json(report)
  } catch (error) {
    console.error("[v0] System health check error:", error)
    await SystemLogger.logError(error, "api", "GET /api/system/health")

    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || "init"

    if (action === "init") {
      console.log("[v0] System initialization requested")

      // Initialize database
      const initSuccess = await DatabaseInitializer.initialize()

      if (!initSuccess) {
        await SystemLogger.logAPI("System initialization failed", "error", "POST /api/system/health", { action })

        return NextResponse.json(
          {
            success: false,
            message: "Database initialization failed",
          },
          { status: 500 },
        )
      }

      // Verify integrity
      const integrity = await DatabaseInitializer.verifyIntegrity()

      await SystemLogger.logAPI("System initialization completed", "info", "POST /api/system/health", {
        action,
        success: integrity.isValid,
        missingTables: integrity.missingTables,
      })

      return NextResponse.json({
        success: integrity.isValid,
        message: integrity.isValid ? "System initialized successfully" : "System partially initialized",
        integrity,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] System initialization error:", error)
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
