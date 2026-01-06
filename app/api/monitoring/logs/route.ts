import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const level = searchParams.get("level") || undefined
    const category = searchParams.get("category") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL || ""
    const isPostgreSQL = databaseUrl.startsWith("postgresql://")

    let sql = "SELECT * FROM site_logs WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (level) {
      params.push(level)
      sql += isPostgreSQL ? ` AND level = $${paramIndex}` : ` AND level = ?`
      paramIndex++
    }

    if (category) {
      params.push(category)
      sql += isPostgreSQL ? ` AND category = $${paramIndex}` : ` AND category = ?`
      paramIndex++
    }

    if (startDate) {
      params.push(startDate)
      sql += isPostgreSQL ? ` AND timestamp >= $${paramIndex}` : ` AND timestamp >= ?`
      paramIndex++
    }

    if (endDate) {
      params.push(endDate)
      sql += isPostgreSQL ? ` AND timestamp <= $${paramIndex}` : ` AND timestamp <= ?`
      paramIndex++
    }

    params.push(limit)
    sql += isPostgreSQL ? ` ORDER BY timestamp DESC LIMIT $${paramIndex}` : ` ORDER BY timestamp DESC LIMIT ?`

    const logs = await query(sql, params)

    const stats = {
      total: logs.length,
      byLevel: logs.reduce((acc: any, log: any) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      }, {}),
      byCategory: logs.reduce((acc: any, log: any) => {
        acc[log.category || "unknown"] = (acc[log.category || "unknown"] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({ logs, stats })
  } catch (error) {
    console.error("[v0] Error fetching site logs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch logs",
        details: error instanceof Error ? error.message : "Unknown error",
        logs: [],
        stats: { total: 0, byLevel: {}, byCategory: {} },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { level, category, message, details, stack, metadata } = await request.json()

    if (!level || !category || !message) {
      return NextResponse.json({ error: "Missing required fields: level, category, message" }, { status: 400 })
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL || ""
    const isPostgreSQL = databaseUrl.startsWith("postgresql://")

    if (isPostgreSQL) {
      await query(
        `INSERT INTO site_logs (level, category, message, details, stack, metadata, timestamp) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [level, category, message, details || null, stack || null, metadata ? JSON.stringify(metadata) : null],
      )
    } else {
      await query(
        `INSERT INTO site_logs (level, category, message, details, stack, metadata, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [level, category, message, details || null, stack || null, metadata ? JSON.stringify(metadata) : null],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error creating log entry:", error)
    return NextResponse.json(
      {
        error: "Failed to create log entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
