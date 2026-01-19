import { type NextRequest, NextResponse } from "next/server"
import { query, getDatabaseType } from "@/lib/db"
import { DatabaseInitializer } from "@/lib/db-initializer"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[DATABASE INIT] Starting database initialization...")
    console.log("[DATABASE INIT] Database type:", getDatabaseType())

    const success = await DatabaseInitializer.initialize()

    if (!success) {
      console.error("[DATABASE INIT] Initialization returned false")
      throw new Error("Database initialization failed")
    }

    const dbType = getDatabaseType()
    let tableCountQuery: string

    if (dbType === "postgresql") {
      tableCountQuery = `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`
    } else {
      tableCountQuery = `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    }

    const tables = await query(tableCountQuery, [])
    const tableCount = tables[0]?.count || 0

    console.log(`[DATABASE INIT] Success! Database type: ${dbType}, Tables created: ${tableCount}`)

    return NextResponse.json({
      success: true,
      tables_created: tableCount,
      database_type: dbType,
      message: `Database initialized successfully. ${tableCount} tables created.`,
      logs: [
        `Database type: ${dbType}`,
        `Tables created: ${tableCount}`,
        "Initialization completed successfully",
      ],
    })
  } catch (error) {
    console.error("[DATABASE INIT] Initialization failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
        logs: [
          "Database initialization failed",
          error instanceof Error ? error.message : "Unknown error",
        ],
      },
      { status: 500 },
    )
  }
}
