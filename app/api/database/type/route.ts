import { NextResponse } from "next/server"
import { getDatabaseType } from "@/lib/db"

export async function GET() {
  try {
    const type = getDatabaseType()
    return NextResponse.json({ type })
  } catch (error) {
    console.error("[v0] Failed to get database type:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get database type"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
