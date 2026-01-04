import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { ConnectionRow } from "@/lib/types"

export async function GET() {
  try {
    const connections = await query<ConnectionRow>(
      `SELECT 
        id, 
        name, 
        exchange, 
        is_testnet, 
        is_enabled,
        is_active,
        last_test_status,
        created_at
      FROM exchange_connections 
      WHERE is_active = true
      ORDER BY name ASC`,
      [],
    )

    return NextResponse.json(connections)
  } catch (error) {
    console.error("[API] Error fetching active connections:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
