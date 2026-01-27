import { NextResponse } from "next/server"
import { DatabaseVerifier } from "@/lib/database-verifier"
import { SystemLogger } from "@/lib/system-logger"

export async function POST() {
  try {
    console.log("[v0] System repair initiated...")
    await SystemLogger.logAPI("System repair initiated", "info", "POST /api/system/repair")

    // Run database repair
    await DatabaseVerifier.repairDatabase()

    // Verify repair was successful
    const verificationResult = await DatabaseVerifier.verifyAndRepairDatabase()

    console.log("[v0] System repair completed")
    await SystemLogger.logAPI("System repair completed", "info", "POST /api/system/repair")

    return NextResponse.json({
      success: true,
      message: "System repair completed",
      verification: verificationResult,
    })
  } catch (error) {
    console.error("[v0] System repair error:", error)
    await SystemLogger.logError(error, "api", "POST /api/system/repair")

    return NextResponse.json(
      {
        error: "System repair failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
