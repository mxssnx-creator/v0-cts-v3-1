import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { loadConnections } from "@/lib/file-storage"

export async function GET() {
  try {
    // Check database tables
    let tablesCount = 0
    let dbInitialized = false
    
    try {
      const tables = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      tablesCount = tables[0]?.count || 0
      dbInitialized = tablesCount >= 20 // Expect at least 20 tables
    } catch (dbError) {
      console.warn("[v0] Database check failed:", dbError)
    }

    // Check connections
    let connectionsCount = 0
    let enabledConnectionsCount = 0
    
    try {
      const connections = loadConnections()
      connectionsCount = connections.length
      enabledConnectionsCount = connections.filter(c => c.is_enabled).length
    } catch (connError) {
      console.warn("[v0] Connections check failed:", connError)
    }

    const status = {
      database: {
        initialized: dbInitialized,
        tablesCount,
      },
      connections: {
        total: connectionsCount,
        enabled: enabledConnectionsCount,
      },
      ready: dbInitialized && enabledConnectionsCount > 0,
    }

    console.log("[v0] System init status:", status)

    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Failed to get init status:", error)
    return NextResponse.json(
      { error: "Failed to get initialization status" },
      { status: 500 }
    )
  }
}
