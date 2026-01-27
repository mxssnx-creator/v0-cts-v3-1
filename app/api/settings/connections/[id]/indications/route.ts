import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get connection indication settings
    const result = await sql`
      SELECT 
        indication_type,
        is_enabled,
        range_value,
        timeout_value,
        interval_value
      FROM connection_indication_settings
      WHERE connection_id = ${id}
      ORDER BY indication_type
    `

    return NextResponse.json({
      indications: result || [],
    })
  } catch (error) {
    console.error("[v0] Failed to fetch connection indications:", error)
    return NextResponse.json({ error: "Failed to fetch indications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { indications } = await request.json()

    // Update indication settings
    for (const ind of indications) {
      await sql`
        INSERT INTO connection_indication_settings (connection_id, indication_type, is_enabled, range_value, timeout_value, interval_value)
        VALUES (${id}, ${ind.indication_type}, ${ind.is_enabled}, ${ind.range_value || null}, ${ind.timeout_value || null}, ${ind.interval_value || null})
        ON CONFLICT (connection_id, indication_type) 
        DO UPDATE SET 
          is_enabled = ${ind.is_enabled},
          range_value = ${ind.range_value || null},
          timeout_value = ${ind.timeout_value || null},
          interval_value = ${ind.interval_value || null},
          updated_at = CURRENT_TIMESTAMP
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update connection indications:", error)
    return NextResponse.json({ error: "Failed to update indications" }, { status: 500 })
  }
}
