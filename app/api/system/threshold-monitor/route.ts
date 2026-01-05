import { type NextRequest, NextResponse } from "next/server"
import { positionThresholdManager } from "@/lib/position-threshold-manager"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === "start") {
      await positionThresholdManager.startMonitoring(60000)
      return NextResponse.json({ success: true, message: "Monitoring started" })
    } else if (action === "stop") {
      positionThresholdManager.stopMonitoring()
      return NextResponse.json({ success: true, message: "Monitoring stopped" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Failed to toggle monitoring:", error)
    return NextResponse.json({ error: "Failed to toggle monitoring" }, { status: 500 })
  }
}
