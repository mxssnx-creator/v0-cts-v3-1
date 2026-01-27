import { NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"

export async function GET() {
  try {
    const connections = loadConnections()
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
      { success: false, error: "Failed to load active connections" },
      { status: 500 }
    )
  }
}
