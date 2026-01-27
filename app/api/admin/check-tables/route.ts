import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Check which tables exist
    const tables = await query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      []
    )

    // For each table, get column info
    const tableInfo: Record<string, any> = {}
    
    for (const table of tables) {
      const tableName = table.name
      const columns = await query(`PRAGMA table_info(${tableName})`, [])
      const countResult = await query<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`, [])
      tableInfo[tableName] = {
        columns: columns,
        count: countResult[0]?.count || 0
      }
    }

    return NextResponse.json({
      success: true,
      tableCount: tables.length,
      tables: tables.map((t) => t.name),
      details: tableInfo
    })
  } catch (error: any) {
    console.error("[v0] Failed to check tables:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
