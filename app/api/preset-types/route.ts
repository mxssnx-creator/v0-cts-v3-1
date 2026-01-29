import { type NextRequest, NextResponse } from "next/server"

// Lazy import db functions to prevent build-time database initialization
let query: any, execute: any

async function getDbFunctions() {
  if (!query) {
    const db = await import("@/lib/db")
    query = db.query
    execute = db.execute
  }
}

// GET /api/preset-types - Get all preset types
export async function GET(request: NextRequest) {
  try {
    await getDbFunctions()
    
    const types = await query(`
      SELECT 
        pt.*,
        COUNT(DISTINCT pts.configuration_set_id) as sets_count
      FROM preset_types pt
      LEFT JOIN preset_type_sets pts ON pt.id = pts.preset_type_id AND pts.is_active = true
      GROUP BY pt.id
      ORDER BY pt.created_at DESC
    `)

    return NextResponse.json(types)
  } catch (error) {
    console.error("[v0] GET /api/preset-types failed:", error)
    return NextResponse.json({ error: "Failed to fetch preset types" }, { status: 500 })
  }
}
