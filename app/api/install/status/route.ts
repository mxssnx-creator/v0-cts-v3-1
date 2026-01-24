import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try to get database status, but don't fail if DB is not ready
    let dbType = "sqlite"
    let isConnected = false
    let error = null
    let tableCount = 0
    let hasMigrations = false
    let migrationsApplied = 0

    try {
      // Dynamically import to avoid startup failures
      const { query, getDatabaseType } = await import("@/lib/db")
      dbType = getDatabaseType()

      // Check if database is accessible
      try {
        await query("SELECT 1 as test", [])
        isConnected = true

        // Check if tables exist
        if (dbType === "sqlite") {
          const tables = await query(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            []
          )
          tableCount = tables[0]?.count || 0

          // Log existing tables for debugging
          const tableList = await query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            []
          )
          console.log("[v0] Existing tables:", tableList.map((t: any) => t.name).join(", "))

          const migTable = await query(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='migrations'",
            []
          )
          hasMigrations = migTable[0]?.count > 0

          if (hasMigrations) {
            const migCount = await query("SELECT COUNT(*) as count FROM migrations", [])
            migrationsApplied = migCount[0]?.count || 0
          }
        } else {
          const tables = await query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'",
            []
          )
          tableCount = parseInt(tables[0]?.count || "0")

          const migTable = await query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations'",
            []
          )
          hasMigrations = parseInt(migTable[0]?.count || "0") > 0

          if (hasMigrations) {
            const migCount = await query("SELECT COUNT(*) as count FROM migrations", [])
            migrationsApplied = parseInt(migCount[0]?.count || "0")
          }
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
        console.error("[v0] Database check error:", error)
      }
    } catch (importError) {
      error = importError instanceof Error ? importError.message : String(importError)
      console.error("[v0] Failed to import database module:", error)
    }

    // Consider system installed if we have enough tables (even without migrations table)
    // Direct SQL initialization doesn't create migrations table
    const isInstalled = isConnected && tableCount > 5

    return NextResponse.json({
      isInstalled,
      databaseType: dbType,
      databaseConnected: isConnected,
      tablesExist: tableCount > 0,
      tableCount,
      hasMigrations,
      migrationsApplied,
      error: !isConnected ? error : null,
    })
  } catch (error) {
    // Return a safe response even if everything fails
    return NextResponse.json({
      isInstalled: false,
      databaseType: "sqlite",
      databaseConnected: false,
      tablesExist: false,
      tableCount: 0,
      migrationsApplied: 0,
      error: error instanceof Error ? error.message : "Failed to check install status",
    })
  }
}
