import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"

export async function GET() {
  try {
    const connections = loadConnections()
    
    // Ensure connections is an array before filtering
    if (!Array.isArray(connections)) {
      console.error("[v0] Connections is not an array:", typeof connections)
      return NextResponse.json(
        { success: false, error: "Invalid connections data", connections: [], total: 0, active: 0 },
        { status: 500 }
      )
    }

    const activeConnections = connections.filter(c => c.is_enabled === true && c.is_active === true)
    
    console.log(`[v0] Active connections: ${activeConnections.length} out of ${connections.length} total`)
    
    return NextResponse.json({
      success: true,
      connections: activeConnections,
      total: connections.length,
      active: activeConnections.length,
    })
  } catch (error) {
    console.error("[v0] Failed to load active connections:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load active connections", connections: [], total: 0, active: 0 },
      { status: 500 }
    )
  }
}
