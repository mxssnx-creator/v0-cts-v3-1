import { NextResponse } from "next/server"
import { query, getDatabaseType } from "@/lib/db"

export async function GET() {
  try {
    const dbType = getDatabaseType()
    const isPostgreSQL = dbType === "postgresql"

    let logStats, errorRate, topErrors, criticalErrors, errorsByCategory, recentActivity

    if (isPostgreSQL) {
      // PostgreSQL syntax
      logStats = await query(`
        SELECT 
          level,
          COUNT(*) as count
        FROM site_logs
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY level
      `)

      errorRate = await query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as count
        FROM site_logs
        WHERE level = 'error' AND timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour DESC
      `)

      topErrors = await query(`
        SELECT 
          message,
          category,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM site_logs
        WHERE level = 'error' AND timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY message, category
        ORDER BY count DESC
        LIMIT 10
      `)

      criticalErrors = await query(`
        SELECT *
        FROM site_logs
        WHERE level = 'error' AND timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        LIMIT 20
      `)

      errorsByCategory = await query(`
        SELECT 
          category,
          COUNT(*) as count
        FROM site_logs
        WHERE level = 'error' AND timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY category
        ORDER BY count DESC
      `)

      recentActivity = await query(`
        SELECT 
          DATE_TRUNC('minute', timestamp) as minute,
          level,
          COUNT(*) as count
        FROM site_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY minute, level
        ORDER BY minute DESC
      `)
    } else {
      // SQLite syntax
      logStats = await query(`
        SELECT 
          level,
          COUNT(*) as count
        FROM site_logs
        WHERE timestamp > datetime('now', '-24 hours')
        GROUP BY level
      `)

      errorRate = await query(`
        SELECT 
          strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
          COUNT(*) as count
        FROM site_logs
        WHERE level = 'error' AND timestamp > datetime('now', '-24 hours')
        GROUP BY hour
        ORDER BY hour DESC
      `)

      topErrors = await query(`
        SELECT 
          message,
          category,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM site_logs
        WHERE level = 'error' AND timestamp > datetime('now', '-24 hours')
        GROUP BY message, category
        ORDER BY count DESC
        LIMIT 10
      `)

      criticalErrors = await query(`
        SELECT *
        FROM site_logs
        WHERE level = 'error' AND timestamp > datetime('now', '-1 hour')
        ORDER BY timestamp DESC
        LIMIT 20
      `)

      errorsByCategory = await query(`
        SELECT 
          category,
          COUNT(*) as count
        FROM site_logs
        WHERE level = 'error' AND timestamp > datetime('now', '-24 hours')
        GROUP BY category
        ORDER BY count DESC
      `)

      recentActivity = await query(`
        SELECT 
          strftime('%Y-%m-%d %H:%M:00', timestamp) as minute,
          level,
          COUNT(*) as count
        FROM site_logs
        WHERE timestamp > datetime('now', '-1 hour')
        GROUP BY minute, level
        ORDER BY minute DESC
      `)
    }

    const totalLogs = logStats.reduce((sum: number, stat: any) => sum + Number.parseInt(stat.count), 0)
    const errorCount = logStats.find((stat: any) => stat.level === "error")?.count || 0
    const warningCount = logStats.find((stat: any) => stat.level === "warning")?.count || 0
    const infoCount = logStats.find((stat: any) => stat.level === "info")?.count || 0

    const errorPercentage = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(2) : "0.00"
    const healthScore = Math.max(0, 100 - Number.parseInt(errorCount) * 2 - Number.parseInt(warningCount) * 0.5)

    return NextResponse.json({
      stats: {
        summary: {
          totalLogs,
          errorCount,
          warningCount,
          infoCount,
          errorPercentage,
          healthScore: healthScore.toFixed(1),
        },
        byLevel: logStats,
        errorRate,
        topErrors,
        criticalErrors,
        errorsByCategory,
        recentActivity,
      },
      generatedAt: new Date().toISOString(),
      databaseType: dbType,
    })
  } catch (error) {
    console.error("[v0] Error fetching monitoring stats:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
        stats: {
          summary: {
            totalLogs: 0,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            errorPercentage: "0.00",
            healthScore: "0.0",
          },
          byLevel: [],
          errorRate: [],
          topErrors: [],
          criticalErrors: [],
          errorsByCategory: [],
          recentActivity: [],
        },
      },
      { status: 500 },
    )
  }
}
