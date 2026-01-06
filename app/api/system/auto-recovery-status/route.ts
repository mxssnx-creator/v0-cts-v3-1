import { NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function GET() {
  try {
    const services = autoRecoveryManager.getServiceStatus()
    const history = autoRecoveryManager.getRecoveryHistory(20)

    const servicesArray = Array.from(services.values()).map((service) => ({
      name: service.name,
      status: service.status,
      lastHeartbeat: service.lastHeartbeat.toISOString(),
      errorCount: service.errorCount,
      restartCount: service.restartCount,
    }))

    const isMonitoring = servicesArray.length > 0 && servicesArray.some((s) => s.status === "running")

    return NextResponse.json({
      services: servicesArray,
      history: history.map((action) => ({
        id: action.id,
        type: action.type,
        timestamp: action.timestamp.toISOString(),
        status: action.status,
        error: action.error,
        retryCount: action.retryCount,
      })),
      isMonitoring,
    })
  } catch (error) {
    console.error("[v0] Failed to get recovery status:", error)
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 })
  }
}
