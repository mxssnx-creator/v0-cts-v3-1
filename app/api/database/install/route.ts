import { type NextRequest, NextResponse } from "next/server"
import { query, execute, getDatabaseType } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"
import { SQLiteTablesV3, PostgreSQLTablesV3 } from "@/lib/database-schemas"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Installing/initializing database...")
    await SystemLogger.logAPI("Installing database tables", "info", "POST /api/database/install")

    const databaseType = getDatabaseType()
    console.log("[v0] Using database type:", databaseType)

    const tables = databaseType === "sqlite" ? SQLiteTablesV3 : PostgreSQLTablesV3

    let installedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const [tableName, createStatement] of Object.entries(tables)) {
      try {
        // Check if table exists
        const tableCheckQuery =
          databaseType === "sqlite"
            ? `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
            : `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`

        const existingTable = await query(tableCheckQuery, [tableName])

        if (existingTable && existingTable.length > 0) {
          console.log(`[v0] Table ${tableName} already exists, skipping`)
          skippedCount++
          continue
        }

        // Create table
        console.log(`[v0] Creating table: ${tableName}`)
        await execute(createStatement, [])
        installedCount++
        await SystemLogger.logAPI(`Created table: ${tableName}`, "info", "POST /api/database/install")
      } catch (error) {
        const errorMsg = `Failed to create table ${tableName}: ${error instanceof Error ? error.message : "Unknown error"}`
        console.error(`[v0] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const message = `Database installation complete. Created: ${installedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`
    console.log(`[v0] ${message}`)
    await SystemLogger.logAPI(message, errors.length > 0 ? "warn" : "info", "POST /api/database/install")

    return NextResponse.json({
      success: true,
      message,
      installed: installedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      databaseType,
    })
  } catch (error) {
    console.error("[v0] Database installation failed:", error)
    await SystemLogger.logError(error, "api", "POST /api/database/install")

    return NextResponse.json(
      {
        error: "Database installation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
