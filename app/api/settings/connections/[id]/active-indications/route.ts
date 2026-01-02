import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id

    const result = await sql`
      SELECT value FROM system_settings
      WHERE key = ${`connection_${connectionId}_active_indications`}
      LIMIT 1
    `
    const settings = result[0] as { value: string } | undefined

    if (!settings) {
      // Return default configuration
      return NextResponse.json({
        direction: true,
        move: true,
        active: true,
        optimal: false,
        active_advanced: false,
      })
    }

    return NextResponse.json(JSON.parse(settings.value))
  } catch (error) {
    console.error("[v0] Error fetching active indications:", error)
    return NextResponse.json({ error: "Failed to fetch active indications" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    const body = await request.json()

    await sql`
      INSERT INTO system_settings (key, value)
      VALUES (${`connection_${connectionId}_active_indications`}, ${JSON.stringify(body)})
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving active indications:", error)
    return NextResponse.json({ error: "Failed to save active indications" }, { status: 500 })
  }
}
