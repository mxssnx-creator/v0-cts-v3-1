import { NextResponse } from "next/server"
import { loadCommonIndicationSettings, saveCommonIndicationSettings } from "@/lib/file-storage"

export async function GET() {
  try {
    const settings = loadCommonIndicationSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[v0] Error loading common indication settings:", error)
    return NextResponse.json({ success: false, error: "Failed to load common indication settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings are required" }, { status: 400 })
    }

    saveCommonIndicationSettings(settings)

    return NextResponse.json({ success: true, message: "Common indication settings saved successfully" })
  } catch (error) {
    console.error("[v0] Error saving common indication settings:", error)
    return NextResponse.json({ success: false, error: "Failed to save common indication settings" }, { status: 500 })
  }
}
