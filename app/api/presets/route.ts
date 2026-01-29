import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

// Lazy import db functions to prevent build-time database initialization
let query: any, execute: any

async function getDbFunctions() {
  if (!query) {
    const db = await import("@/lib/db")
    query = db.query
    execute = db.execute
  }
}

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await getDbFunctions()

    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get("active") === "true"

    const queryText = activeOnly
      ? "SELECT * FROM presets WHERE is_active = true ORDER BY is_predefined DESC, created_at DESC"
      : "SELECT * FROM presets ORDER BY is_predefined DESC, created_at DESC"

    const result = await query(queryText)
    const presets = result || []

    return NextResponse.json(presets)
  } catch (error) {
    console.error("[v0] GET /api/presets failed:", error)
    return NextResponse.json([], { status: 200 })
  }
}
