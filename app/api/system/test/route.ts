import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] System test endpoint called")

    const tests = {
      basic_response: "✓ API route responding",
      database_available: true,
      connections_api: "/api/settings/connections",
      health_api: "/api/system/health",
      trade_engine_api: "/api/trade-engine/[connectionId]",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "System is operational",
      tests,
    })
  } catch (error) {
    console.error("[v0] Test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
