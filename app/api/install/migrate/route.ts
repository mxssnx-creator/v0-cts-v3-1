import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Run migrations
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API: Running migrations...")

    const { runMigrations } = await import("@/lib/migration-runner")
    
    const result = await runMigrations()
    
    console.log("[v0] Migrations completed:", result)
    
    return NextResponse.json({
      success: true,
      message: "Migrations completed successfully",
      ...result,
    })
  } catch (error) {
    console.error("[v0] Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migrations failed",
      },
      { status: 500 }
    )
  }
}
