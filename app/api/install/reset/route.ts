import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Reset database (delete all data)
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API: Resetting database...")

    const { resetDatabase } = await import("@/lib/db-initialization-coordinator")
    
    const result = await resetDatabase()
    
    console.log("[v0] Database reset completed:", result)
    
    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
      ...result,
    })
  } catch (error) {
    console.error("[v0] Database reset error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Reset failed",
      },
      { status: 500 }
    )
  }
}
