import { NextResponse } from "next/server"
import { TradeEnginePerformanceMonitor } from "@/lib/trade-engine-performance-monitor"

export async function GET() {
  try {
    const summary = TradeEnginePerformanceMonitor.getMetricsSummary()
    const health = TradeEnginePerformanceMonitor.getHealthStatus()

    return NextResponse.json({
      success: true,
      health,
      metrics: summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to get performance metrics:", error)
    return NextResponse.json({ success: false, error: "Failed to get performance metrics" }, { status: 500 })
  }
}
