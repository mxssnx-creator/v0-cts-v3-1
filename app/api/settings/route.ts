import { type NextRequest, NextResponse } from "next/server"
import { settingsDb } from "@/lib/db-service"

export async function GET() {
  try {
    const settings = await settingsDb.get()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = await settingsDb.update(body)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = await settingsDb.update(body)
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
