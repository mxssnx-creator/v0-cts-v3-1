import { type NextRequest, NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function POST(request: NextRequest) {
  try {
    const { service } = await request.json()

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Service name is required",
        },
        { status: 400 },
      )
    }

    const success = await autoRecoveryManager.manualRestart(service)

    return NextResponse.json({
      success,
      message: success ? `Service ${service} restarted successfully` : `Failed to restart service ${service}`,
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
