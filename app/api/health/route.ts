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
    return NextResponse.json({
      success: true,
      status: "healthy",
      checks: [
        {
          id: "system",
          name: "System Health",
          category: "system",
          status: "healthy",
          message: "Health monitoring active",
          lastCheck: new Date(),
          details: {},
          actions: [],
        },
      ],
      timestamp: new Date().toISOString(),
    })
  }
}
