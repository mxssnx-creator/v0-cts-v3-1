import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Check which tables exist
    const tables = await query(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      []
    )

    // For each table, get column info
    const tableInfo: Record<string, any> = {}
    
    for (const table of tables.rows) {
      const tableName = table.name
      const columns = await query(`PRAGMA table_info(${tableName})`, [])
      tableInfo[tableName] = {
        columns: columns.rows,
        count: (await query(`SELECT COUNT(*) as count FROM ${tableName}`, [])).rows[0].count
      }
    }

    return NextResponse.json({
      success: true,
      tableCount: tables.rows.length,
      tables: tables.rows.map((t: any) => t.name),
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
