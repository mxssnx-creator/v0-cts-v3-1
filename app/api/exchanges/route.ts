import { NextResponse } from "next/server"

// Lazy import db functions to prevent build-time database initialization
let query: any

async function getDbFunctions() {
  if (!query) {
    const db = await import("@/lib/db")
    query = db.query
  }
}

export async function GET() {
  try {
    await getDbFunctions()

    const exchanges = await query(`
      SELECT 
        id,
        name,
        display_name,
        is_active,
        supports_spot,
        supports_futures,
        supports_margin,
        api_endpoint,
        websocket_endpoint
      FROM exchanges
      WHERE is_active = 1
      ORDER BY display_name
    `)

    return NextResponse.json(exchanges || [])
  } catch (error) {
    console.error("[v0] GET /api/exchanges failed:", error)
    return NextResponse.json([])
  }
}
