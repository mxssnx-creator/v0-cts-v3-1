import { type NextRequest, NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === "start") {
      await autoRecoveryManager.startHealthMonitoring()
      return NextResponse.json({ success: true, message: "Monitoring started" })
    } else if (action === "stop") {
      autoRecoveryManager.stopHealthMonitoring()
      return NextResponse.json({ success: true, message: "Monitoring stopped" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Failed to toggle monitoring:", error)
    return NextResponse.json({ error: "Failed to toggle monitoring" }, { status: 500 })
  }
}
