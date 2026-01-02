import { NextResponse } from "next/server"
import { getDatabaseType, query, execute } from "@/lib/db"

export async function GET() {
  try {
    const retentionSettings = await query(
      "SELECT connection_id, retention_hours, auto_cleanup_enabled FROM exchange_retention_settings ORDER BY connection_id",
    )

    return NextResponse.json({ retentionSettings })
  } catch (error) {
    console.error("[v0] Error fetching retention settings:", error)
    return NextResponse.json({ error: "Failed to fetch retention settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { connectionId, retentionHours, autoCleanupEnabled } = await request.json()

    if (!connectionId || retentionHours === undefined) {
      return NextResponse.json({ error: "connectionId and retentionHours are required" }, { status: 400 })
    }

    const dbType = getDatabaseType()

    if (dbType === "postgres") {
      await execute(
        `INSERT INTO exchange_retention_settings (connection_id, retention_hours, auto_cleanup_enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (connection_id)
         DO UPDATE SET 
           retention_hours = $2,
           auto_cleanup_enabled = $3,
           updated_at = NOW()`,
        [connectionId, retentionHours, autoCleanupEnabled ?? true],
      )
    } else {
      await execute(
        `INSERT INTO exchange_retention_settings (connection_id, retention_hours, auto_cleanup_enabled)
         VALUES (?, ?, ?)
         ON CONFLICT(connection_id) 
         DO UPDATE SET retention_hours = ?, auto_cleanup_enabled = ?, updated_at = datetime('now')`,
        [connectionId, retentionHours, autoCleanupEnabled ?? true, retentionHours, autoCleanupEnabled ?? true],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving retention settings:", error)
    return NextResponse.json({ error: "Failed to save retention settings" }, { status: 500 })
  }
}
