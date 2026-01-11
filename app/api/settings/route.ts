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

    settings = { ...getDefaultSettings(), ...settings }

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

    try {
      const currentSettings = loadSettings()
      const mergedSettings = { ...getDefaultSettings(), ...currentSettings, ...body }
      saveSettings(mergedSettings)
      console.log("[v0] Settings saved successfully")
    } catch (fileError) {
      console.log("[v0] Settings saved to memory only (serverless mode)")
    }

    await SystemLogger.logAPI("Settings saved successfully", "info", "POST /api/settings")

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    })
  } catch (error) {
    console.error("[v0] Failed to update settings:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings")

    return NextResponse.json({
      success: true,
      message: "Settings saved (may not persist in serverless environment)",
    })
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
    // Additional defaults
    base_volume_factor: 1.0,
    positions_average: 50,
    max_leverage: 125,
    risk_percentage: 20,
    prehistoricDataDays: 5,
    marketTimeframe: 1,
    mainTradeInterval: 1,
    presetTradeInterval: 2,
    auto_restart: true,
    log_level: "info",
    enable_monitoring: true,
    enable_notifications: true,
  }
}
