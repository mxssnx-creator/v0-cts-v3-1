import { NextResponse } from "next/server"

// Dynamic import for optional pg dependency
let Pool: any = null
try {
  const pg = require("pg")
  Pool = pg.Pool
} catch (error) {
  console.warn("[v0] pg module not available - PostgreSQL features disabled")
}

export async function POST(request: Request) {
  let testClient: any = null
  
  try {
    const body = await request.json()
    const { databaseType, databaseUrl } = body

    if (databaseType === "sqlite") {
      return NextResponse.json({
        success: true,
        data: {
          message: "SQLite uses local file storage - no connection test needed",
          connected: true,
        },
      })
    }

    if (databaseType === "postgresql") {
      if (!Pool) {
        return NextResponse.json(
          {
            success: false,
            error: "PostgreSQL support is not available in this deployment. Please use SQLite instead.",
          },
          { status: 500 }
        )
      }

      if (!databaseUrl) {
        throw new Error("Database URL is required for PostgreSQL")
      }

      console.log("[v0] Testing PostgreSQL connection...")
      
      // Create test connection
      testClient = new Pool({
        connectionString: databaseUrl,
        max: 1,
        connectionTimeoutMillis: 5000,
      })

      // Test query
      const result = await testClient.query("SELECT NOW() as current_time, version() as version")
      
      console.log("[v0] Connection successful!")
      console.log("[v0] PostgreSQL version:", result.rows[0]?.version?.split(",")[0])

      // Clean up
      await testClient.end()
      testClient = null

      return NextResponse.json({
        success: true,
        data: {
          message: "PostgreSQL connection successful",
          connected: true,
          version: result.rows[0]?.version,
          timestamp: result.rows[0]?.current_time,
        },
      })
    }

    throw new Error(`Unknown database type: ${databaseType}`)
  } catch (error) {
    console.error("[v0] Connection test failed:", error)
    
    // Clean up connection if it exists
    if (testClient) {
      try {
        await testClient.end()
      } catch (cleanupError) {
        console.error("[v0] Failed to clean up test connection:", cleanupError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
