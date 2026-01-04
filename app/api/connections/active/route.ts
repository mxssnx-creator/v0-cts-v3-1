import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const connections = await query(
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
  } catch (error: any) {
    console.error("[API] Error fetching active connections:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
