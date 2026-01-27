/**
 * Background Database Initializer - Non-blocking
 */

export async function initializeDatabase(): Promise<void> {
  try {
    const { getClient, getDatabaseType } = await import("./db")
    const dbType = getDatabaseType()

    if (dbType !== "sqlite") {
      return // PostgreSQL handles migrations separately
    }

    const client = getClient() as any
    const result = client.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get()
    const tableCount = result?.count || 0

    if (tableCount >= 10) {
      return // Database already initialized
    }

    // Try to initialize from SQL script
    try {
      const fs = await import("fs")
      const path = await import("path")
      
      const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
      if (!fs.existsSync(sqlPath)) {
        return
      }

      const sql = fs.readFileSync(sqlPath, "utf-8")
      const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 10)

      let count = 0
      for (const stmt of statements) {
        try {
          client.prepare(stmt).run()
          count++
        } catch (e) {
          // Ignore "already exists" errors
        }
      }
    } catch (e) {
      // Database initialization is optional
    }
  } catch (error) {
    // Silently fail - not critical
  }
}
  console.log("[v0] Starting background database initialization...")

  try {
    const dbType = getDatabaseType()
    const client = getClient()

    if (dbType !== "sqlite") {
      console.log("[v0] PostgreSQL detected - using migration runner")
      const { runAllMigrations } = await import("./db-migration-runner")
      const result = await runAllMigrations()
      console.log(`[v0] Migrations: ${result.applied} applied, ${result.skipped} skipped`)
      initializationComplete = true
      return
    }

    const sqliteClient = client as any

    // Check which tables exist
    const checkTable = (tableName: string) => {
      try {
        const result = sqliteClient
          .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?")
          .get(tableName)
        return result.count > 0
      } catch {
        return false
      }
    }

    const criticalTables = ["trade_engine_state", "indications", "preset_types", "trades"]
    const missingTables = criticalTables.filter((table) => !checkTable(table))

    if (missingTables.length === 0) {
      console.log("[v0] All critical tables exist")
      initializationComplete = true
      return
    }

    console.log(`[v0] Missing tables: ${missingTables.join(", ")} - initializing...`)

    const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")

    if (!fs.existsSync(sqlPath)) {
      console.error("[v0] unified_complete_setup.sql not found!")
      return
    }

    const sql = fs.readFileSync(sqlPath, "utf-8")
    console.log(`[v0] Loaded SQL file: ${(sql.length / 1024).toFixed(1)}KB`)

    // Execute SQL statements
    const statements = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 10)

    let executed = 0
    let skipped = 0

    for (const stmt of statements) {
      try {
        sqliteClient.prepare(stmt).run()
        executed++
      } catch (err: any) {
        if (err.message?.includes("already exists")) {
          skipped++
        }
      }
    }

    console.log(`[v0] Database initialized: ${executed} executed, ${skipped} skipped`)

    const finalTables = sqliteClient
      .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
      .get()
    console.log(`[v0] Database now has ${finalTables.count} tables`)

    initializationComplete = true
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
  } finally {
    initializationInProgress = false
  }
}

export function isInitializationComplete(): boolean {
  return initializationComplete
}
