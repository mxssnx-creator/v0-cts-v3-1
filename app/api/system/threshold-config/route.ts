import { type NextRequest, NextResponse } from "next/server"
import { DatabaseManager } from "@/lib/database"

export async function GET() {
  try {
    const db = DatabaseManager.getInstance()
    const settings = await db.getAllSettings()

    const config = {
      basePositionLimit: Number.parseInt(settings.databaseSizeBase || "250"),
      mainPositionLimit: Number.parseInt(settings.databaseSizeMain || "250"),
      realPositionLimit: Number.parseInt(settings.databaseSizeReal || "250"),
      presetPositionLimit: Number.parseInt(settings.databaseSizePreset || "500"),
      optimalPositionLimit: Number.parseInt(settings.databaseSizeOptimal || "300"),
      autoPositionLimit: Number.parseInt(settings.databaseSizeAuto || "300"),
      adxDatabaseLength: Number.parseInt(settings.adxDatabaseLength || "10000"),
      thresholdPercent: Number.parseInt(settings.databaseThresholdPercent || "20"),
      maxDatabaseSizeGB: Number.parseInt(settings.maxDatabaseSizeGB || "20"),
    }

    return NextResponse.json({
      config,
      isMonitoring: true, // TODO: Get actual monitoring status
    })
  } catch (error) {
    console.error("[v0] Failed to get threshold config:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const db = DatabaseManager.getInstance()

    await db.setSetting("databaseSizeBase", String(config.basePositionLimit))
    await db.setSetting("databaseSizeMain", String(config.mainPositionLimit))
    await db.setSetting("databaseSizeReal", String(config.realPositionLimit))
    await db.setSetting("databaseSizePreset", String(config.presetPositionLimit))
    await db.setSetting("databaseSizeOptimal", String(config.optimalPositionLimit))
    await db.setSetting("databaseSizeAuto", String(config.autoPositionLimit))
    await db.setSetting("adxDatabaseLength", String(config.adxDatabaseLength))
    await db.setSetting("databaseThresholdPercent", String(config.thresholdPercent))
    await db.setSetting("maxDatabaseSizeGB", String(config.maxDatabaseSizeGB))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to save threshold config:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
