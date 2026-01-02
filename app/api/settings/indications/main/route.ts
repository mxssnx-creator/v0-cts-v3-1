import { NextResponse } from "next/server"
import { loadMainIndicationSettings, saveMainIndicationSettings } from "@/lib/file-storage"

export async function GET() {
  try {
    const settings = loadMainIndicationSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[v0] Error loading main indication settings:", error)
    return NextResponse.json({ success: false, error: "Failed to load main indication settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings are required" }, { status: 400 })
    }

    saveMainIndicationSettings(settings)

    return NextResponse.json({ success: true, message: "Main indication settings saved successfully" })
  } catch (error) {
    console.error("[v0] Error saving main indication settings:", error)
    return NextResponse.json({ success: false, error: "Failed to save main indication settings" }, { status: 500 })
  }
}
