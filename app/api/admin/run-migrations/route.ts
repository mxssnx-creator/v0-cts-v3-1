import { NextResponse } from "next/server"
import { runAllMigrations } from "@/lib/db-migration-runner"

export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("[v0] Manual migration run requested...")

    const result = await runAllMigrations()

    return NextResponse.json({
      success: result.success,
      applied: result.applied,
      skipped: result.skipped,
      failed: result.failed,
      message: result.message,
    })
  } catch (error: any) {
    console.error("[v0] Migration API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Migration failed",
      },
      { status: 500 }
    )
  }
}
