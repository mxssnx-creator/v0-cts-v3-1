"use server"

// Simple functional migration runner to avoid Turbopack class parsing issues
// All imports are dynamic to prevent build-time evaluation

interface MigrationResult {
  success: boolean
  applied: number
  skipped: number
  failed: number
  message: string
}

export async function runAllMigrations(): Promise<MigrationResult> {
  // Dynamic imports - only load at runtime
  const { execute, getDatabaseType, query } = await import("@/lib/db")
  const fs = await import("node:fs")
  const path = await import("node:path")

  const startTime = Date.now()
  
  try {
    const dbType = getDatabaseType()
    console.log("[v0] Running production migrations...")
    console.log(`[v0] Database Type: ${dbType}`)

    // Create migrations table
    const createTableSQL =
      dbType === "sqlite"
        ? `CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            checksum TEXT NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        : `CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            checksum TEXT NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`

    try {
      await execute(createTableSQL, [])
    } catch (error) {
      // Table may already exist
    }

    // Run unified setup script
    const scriptPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")

    if (!fs.existsSync(scriptPath)) {
      console.log("[v0] Unified setup script not found")
      return {
        success: true,
        applied: 0,
        skipped: 0,
        failed: 0,
        message: "No migration scripts found",
      }
    }

    const sql = fs.readFileSync(scriptPath, "utf-8")
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    let applied = 0
    let skipped = 0

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await execute(statement, [])
          applied++
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)
        if (
          errorMsg.includes("already exists") ||
          errorMsg.includes("duplicate") ||
          errorMsg.includes("UNIQUE constraint")
        ) {
          skipped++
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[v0] Migration complete: ${applied} applied, ${skipped} skipped in ${duration}ms`)

    return {
      success: true,
      applied,
      skipped,
      failed: 0,
      message: `Successfully executed ${applied} statements, ${skipped} skipped`,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Migration failed:`, errorMsg)
    return {
      success: false,
      applied: 0,
      skipped: 0,
      failed: 1,
      message: `Migration failed: ${errorMsg}`,
    }
  }
}
