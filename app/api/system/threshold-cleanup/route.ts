import { NextResponse } from "next/server"
import { positionThresholdManager } from "@/lib/position-threshold-manager"

export async function POST() {
  try {
    await positionThresholdManager.checkAndCleanupAllConfigurations()
    return NextResponse.json({ success: true, message: "Cleanup triggered successfully" })
  } catch (error) {
    console.error("[v0] Failed to trigger cleanup:", error)
    return NextResponse.json({ error: "Failed to trigger cleanup" }, { status: 500 })
  }
}
