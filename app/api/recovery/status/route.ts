import { type NextRequest, NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function GET(request: NextRequest) {
  try {
    const services = autoRecoveryManager.getServiceStatus()
    const history = autoRecoveryManager.getRecoveryHistory(20)

    const servicesArray = Array.from(services.entries()).map(([id, state]) => ({
      id,
      ...state,
    }))

    return NextResponse.json({
      success: true,
      services: servicesArray,
      history,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
