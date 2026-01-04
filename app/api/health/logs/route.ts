import { NextResponse } from "next/server"
import { SystemHealthMonitor } from "@/lib/system-health-monitor"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkId = searchParams.get("checkId") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const logs = await SystemHealthMonitor.getHealthLogs(checkId, limit)

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    })
  } catch (error) {
    console.error("[Health Logs API] Failed to get logs:", error)
    return NextResponse.json({ success: false, error: "Failed to get logs" }, { status: 500 })
  }
}
