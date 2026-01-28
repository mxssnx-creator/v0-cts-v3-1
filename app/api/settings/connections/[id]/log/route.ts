import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get connection logs from database
    const logs = await query(
      `SELECT * FROM connection_logs 
       WHERE connection_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 100`,
      [id],
    )

    // Get connection info
    const connection = await query(
      `SELECT name, exchange, is_enabled, last_test_status, last_test_timestamp 
       FROM exchange_connections 
       WHERE id = $1`,
      [id],
    )

    return NextResponse.json({
      connection: connection[0] || null,
      logs: logs || [],
      summary: {
        total: logs.length,
        errors: logs.filter((l: any) => l.level === "error").length,
        warnings: logs.filter((l: any) => l.level === "warn").length,
        info: logs.filter((l: any) => l.level === "info").length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching connection logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
