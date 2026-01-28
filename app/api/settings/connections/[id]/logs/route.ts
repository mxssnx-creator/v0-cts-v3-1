import { type NextRequest, NextResponse } from "next/server"
import { connectionLogsDb } from "@/lib/db-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const logs = await connectionLogsDb.getByConnectionId(id)
    return NextResponse.json(logs)
  } catch (error) {
    console.error("[v0] Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
