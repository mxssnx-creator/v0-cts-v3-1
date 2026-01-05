import { type NextRequest, NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function POST(request: NextRequest) {
  try {
    const { service } = await request.json()
    const success = await autoRecoveryManager.manualRestart(service)

    if (success) {
      return NextResponse.json({ success: true, message: `${service} restarted successfully` })
    } else {
      return NextResponse.json({ error: "Failed to restart service" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Failed to restart service:", error)
    return NextResponse.json({ error: "Failed to restart service" }, { status: 500 })
  }
}
