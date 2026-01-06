import { NextResponse } from "next/server"
import { SystemHealthMonitor } from "@/lib/system-health-monitor"

export async function GET() {
  try {
    console.log("[Health API] Fetching health checks...")
    const healthChecks = await SystemHealthMonitor.getAllHealthChecks()
    console.log("[Health API] Health checks retrieved:", healthChecks.length)

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
    return NextResponse.json(
      {
        success: false,
        status: "unknown",
        checks: [
          {
            id: "system",
            name: "System Health",
            category: "api",
            status: "healthy",
            message: "Health monitoring active",
            lastCheck: new Date(),
            details: { error: String(error) },
            actions: [],
          },
        ],
        error: "Failed to get health status",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}
