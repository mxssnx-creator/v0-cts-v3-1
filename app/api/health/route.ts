import { NextResponse } from "next/server"
import { SystemHealthMonitor } from "@/lib/system-health-monitor"

export async function GET() {
  try {
    const healthChecks = await SystemHealthMonitor.getAllHealthChecks()

    const overallStatus = healthChecks.some((c) => c.status === "critical")
      ? "critical"
      : healthChecks.some((c) => c.status === "warning")
        ? "warning"
        : "healthy"

    return NextResponse.json({
      success: true,
      status: overallStatus,
      checks: healthChecks,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Health API] Failed to get health status:", error)
    return NextResponse.json({ success: false, error: "Failed to get health status" }, { status: 500 })
  }
}
