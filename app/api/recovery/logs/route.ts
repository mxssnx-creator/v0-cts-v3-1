import { type NextRequest, NextResponse } from "next/server"
import { autoRecoveryManager } from "@/lib/auto-recovery-manager"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7", 10)

    const logs = await autoRecoveryManager.getRecoveryLogs(days)

    return NextResponse.json({
      success: true,
      logs,
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
