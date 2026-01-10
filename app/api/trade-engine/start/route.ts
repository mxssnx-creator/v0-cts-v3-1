import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { initializeGlobalCoordinator } from "@/lib/trade-engine"
import { SystemLogger } from "@/lib/system-logger"

const activeEngines = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [Trade Engine] Starting global trade engine...")
    await SystemLogger.logTradeEngine("Starting global trade engine", "info", {})

    const coordinator = initializeGlobalCoordinator()

    if (coordinator.getIsRunning()) {
      console.log("[v0] [Trade Engine] Already running")
      return NextResponse.json({
        success: true,
        message: "Trade engine is already running",
        alreadyRunning: true,
      })
    }

    const enabledConnections = await sql`
      SELECT * FROM exchange_connections
      WHERE is_enabled = true AND is_active = true
    `

    if (enabledConnections.length === 0) {
      return NextResponse.json(
        {
          error: "No enabled connections found",
          details: "Please enable at least one connection in Settings before starting the trade engine",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] [Trade Engine] Found ${enabledConnections.length} enabled connections`)

    await coordinator.start()

    console.log("[v0] [Trade Engine] Started successfully")
    await SystemLogger.logTradeEngine("Global trade engine started successfully", "info", {
      enabledConnections: enabledConnections.length,
    })

    return NextResponse.json({
      success: true,
      message: "Global trade engine started successfully",
      enabledConnections: enabledConnections.length,
    })
  } catch (error) {
    console.error("[v0] [Trade Engine] Failed to start:", error)
    await SystemLogger.logError(error, "trade-engine", "POST /api/trade-engine/start")

    return NextResponse.json(
      {
        error: "Failed to start trade engine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
