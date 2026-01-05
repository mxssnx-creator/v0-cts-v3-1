import { type NextRequest, NextResponse } from "next/server"
import { getSystemIntegrityChecker } from "@/lib/system-integrity-checker"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const quick = searchParams.get("quick") === "true"

    const checker = getSystemIntegrityChecker()

    if (quick) {
      const result = await checker.quickHealthCheck()
      return NextResponse.json({
        success: true,
        ...result,
      })
    }

    const report = await checker.runFullCheck()

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("[v0] System integrity check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System integrity check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
