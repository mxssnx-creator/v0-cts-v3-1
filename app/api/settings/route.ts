import { NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadSettings, saveSettings } from "@/lib/file-storage"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("[v0] GET /api/settings - Loading settings...")
    await SystemLogger.logAPI("Loading system settings", "info", "GET /api/settings")

    let settings: Record<string, any> = {}

    try {
      settings = loadSettings()
      console.log("[v0] Settings loaded from file:", Object.keys(settings).length, "keys")
    } catch (error) {
      console.log("[v0] Could not load settings from file, returning defaults")
      settings = getDefaultSettings()
    }

    await SystemLogger.logAPI(`Settings loaded: ${Object.keys(settings).length} keys`, "info", "GET /api/settings")

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[v0] Failed to get settings:", error)
    await SystemLogger.logError(error, "api", "GET /api/settings")

    return NextResponse.json({ settings: getDefaultSettings() }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0] Saving settings:", Object.keys(body).length, "keys")
    await SystemLogger.logAPI(`Saving ${Object.keys(body).length} settings`, "info", "POST /api/settings")

    const currentSettings = loadSettings()
    const mergedSettings = { ...currentSettings, ...body }

    saveSettings(mergedSettings)

    console.log("[v0] Settings saved successfully to file")
    await SystemLogger.logAPI("Settings saved successfully", "info", "POST /api/settings")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update settings:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings")

    return NextResponse.json(
      { error: "Failed to update settings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

function getDefaultSettings(): Record<string, any> {
  return {
    database_type: "sqlite",
    databaseSizeBase: 250,
    databaseSizeMain: 250,
    databaseSizeReal: 250,
    databaseSizePreset: 250,
    mainEngineIntervalMs: 100,
    presetEngineIntervalMs: 100,
    activeOrderHandlingIntervalMs: 50,
    maxSymbolsPerCycle: 50,
    enableAutoTrading: false,
    defaultLeverage: 10,
    defaultMarginType: "cross",
    defaultPositionMode: "hedge",
  }
}
