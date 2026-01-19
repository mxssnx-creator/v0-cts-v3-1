import { NextResponse } from "next/server"
import { getDatabaseType, testConnection, getCurrentDatabaseInfo } from "@/lib/db"
import { loadSettings } from "@/lib/file-storage"

export async function GET() {
  try {
    const dbType = getDatabaseType()
    const settings = loadSettings()
    const configuredType = settings.database_type || "sqlite"
    
    // Test the actual connection
    const connectionTest = await testConnection()
    const dbInfo = getCurrentDatabaseInfo()
    
    return NextResponse.json({
      success: true,
      connected: connectionTest.connected,
      type: dbType,
      configuredType,
      typeMatch: dbType === configuredType,
      message: connectionTest.message,
      details: {
        ...dbInfo,
        error: connectionTest.error
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] Database status check failed:", error)
    return NextResponse.json({
      success: false,
      connected: false,
      type: "unknown",
      message: error instanceof Error ? error.message : "Failed to check database status",
      timestamp: new Date().toISOString()
    })
  }
}
