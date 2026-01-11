import { type NextRequest, NextResponse } from "next/server"
import { loadActiveConnections, saveActiveConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

export async function GET() {
  try {
    console.log("[v0] Fetching active dashboard connections...")
    const connections = loadActiveConnections()

    console.log("[v0] Loaded active connections:", connections.length)

    return NextResponse.json(connections, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching active connections:", error)
    await SystemLogger.logError(error, "api", "GET /api/active-connections")
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connections } = body

    if (!Array.isArray(connections)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    console.log("[v0] Saving active connections:", connections.length)
    saveActiveConnections(connections)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error saving active connections:", error)
    await SystemLogger.logError(error, "api", "POST /api/active-connections")
    return NextResponse.json({ error: "Failed to save active connections" }, { status: 500 })
  }
}
