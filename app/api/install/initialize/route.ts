import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] ================================================")
    console.log("[v0] Web-Based Database Installation Started")
    console.log("[v0] ================================================")

    // Use direct SQL execution for reliable initialization
    const { getClient, getDatabaseType } = await import("@/lib/db")
    const fs = await import("fs")
    const path = await import("path")

    const dbType = getDatabaseType()
    console.log("[v0] Database Type:", dbType)

    if (dbType === "sqlite") {
      // For SQLite, use direct batch execution
      const client = getClient() as any
      const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
      const sql = fs.readFileSync(sqlPath, "utf-8")

      console.log("[v0] Executing unified_complete_setup.sql directly...")
      const startTime = Date.now()
      
      // Use exec for batch SQL execution
      client.exec(sql)
      
      const duration = Date.now() - startTime
      console.log(`[v0] Database initialized successfully in ${duration}ms`)

      // Count tables
      const tables = client.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      ).all()
      
      console.log(`[v0] Found ${tables.length} tables:`, tables.map((t: any) => t.name).join(", "))

      // Run optimization migration if not already applied
      console.log("[v0] Applying performance optimizations...")
      try {
        const { getDatabaseStats, optimizeDatabase, checkpoint } = await import("@/lib/sqlite-bulk-operations")
        
        // Apply optimization pragmas
        const stats = await getDatabaseStats()
        console.log("[v0] Database stats before optimization:", stats)
        
        // Optimize
        const optResult = await optimizeDatabase()
        console.log(`[v0] Database optimization completed in ${optResult.duration}ms`)
        
        // Checkpoint
        const checkpointResult = await checkpoint()
        console.log(`[v0] WAL checkpoint completed in ${checkpointResult.duration}ms`)
      } catch (error) {
        console.warn("[v0] Performance optimization skipped:", error)
      }

      // Run auto-migrations for additional setup
      console.log("[v0] Running auto-migrations...")
      try {
        const { runAutoMigrations } = await import("@/lib/auto-migrate")
        await runAutoMigrations()
        console.log("[v0] Auto-migrations complete")
      } catch (error) {
        console.warn("[v0] Auto-migrations warning:", error)
      }

      console.log("[v0] ================================================")
      console.log("[v0] Database Installation Complete!")
      console.log("[v0] ================================================")

      return NextResponse.json({
        success: true,
        applied: tables.length,
        skipped: 0,
        failed: 0,
        tables: tables.map((t: any) => t.name),
        message: `Database initialized successfully with ${tables.length} tables`,
      })
    } else {
      // For PostgreSQL, use the migration runner
      const { runAllMigrations } = await import("@/lib/db-migration-runner")
      console.log("[v0] Running database migrations...")
      const migrationResult = await runAllMigrations()

      if (!migrationResult.success) {
        throw new Error(migrationResult.message)
      }

      console.log(`[v0] Migrations complete: ${migrationResult.applied} applied, ${migrationResult.skipped} skipped`)

      // Run auto-migrations
      console.log("[v0] Running auto-migrations...")
      try {
        const { runAutoMigrations } = await import("@/lib/auto-migrate")
        await runAutoMigrations()
        console.log("[v0] Auto-migrations complete")
      } catch (error) {
        console.warn("[v0] Auto-migrations warning:", error)
      }

      console.log("[v0] ================================================")
      console.log("[v0] Database Installation Complete!")
      console.log("[v0] ================================================")

      return NextResponse.json({
        success: true,
        applied: migrationResult.applied,
        skipped: migrationResult.skipped,
        failed: migrationResult.failed,
        message: "Database initialized successfully",
      })
    }
  } catch (error) {
    console.error("[v0] Installation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Installation failed",
      },
      { status: 500 }
    )
  }
}
