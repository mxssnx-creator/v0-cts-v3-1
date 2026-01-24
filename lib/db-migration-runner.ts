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
    
    // Clean up SQL statements - remove comment markers and normalize
    const allStatements = sql
      .split(";")
      .map((s) => {
        // Remove leading > markers from multi-line comments
        return s.replace(/^>\s*/gm, "").trim()
      })
      .filter((s) => {
        if (s.length === 0) return false
        if (s.startsWith("--")) return false
        // Skip standalone comment markers
        if (s === ">") return false
        return true
      })

    // Separate statements by type for proper execution order
    const createTableStatements: string[] = []
    const createIndexStatements: string[] = []
    const otherStatements: string[] = []

    for (const stmt of allStatements) {
      const upperStmt = stmt.toUpperCase()
      if (upperStmt.startsWith("CREATE TABLE") || upperStmt.includes("CREATE TABLE IF NOT EXISTS")) {
        createTableStatements.push(stmt)
      } else if (upperStmt.startsWith("CREATE INDEX") || upperStmt.startsWith("CREATE UNIQUE INDEX")) {
        createIndexStatements.push(stmt)
      } else {
        otherStatements.push(stmt)
      }
    }

    // Execute in order: tables first, then other statements, then indexes
    const orderedStatements = [
      ...createTableStatements,
      ...otherStatements,
      ...createIndexStatements,
    ]

    let applied = 0
    let skipped = 0
    let failed = 0

    console.log(`[v0] Executing ${createTableStatements.length} CREATE TABLE statements...`)
    console.log(`[v0] Executing ${otherStatements.length} other statements...`)
    console.log(`[v0] Executing ${createIndexStatements.length} CREATE INDEX statements...`)

    for (const statement of orderedStatements) {
      try {
        if (statement.trim()) {
          await execute(statement, [])
          applied++
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)
        const stmtPreview = statement.substring(0, 80).replace(/\s+/g, " ")
        
        // Only skip errors that indicate the object already exists
        if (
          errorMsg.includes("already exists") ||
          errorMsg.includes("duplicate column") ||
          errorMsg.includes("UNIQUE constraint")
        ) {
          skipped++
        } else if (errorMsg.includes("no such table")) {
          // Table doesn't exist - skip index creation
          console.log(`[v0] Skipping index (table missing): ${stmtPreview}`)
          skipped++
        } else {
          // Log real errors
          console.error(`[v0] Migration error: ${errorMsg}`)
          console.error(`[v0] Statement: ${stmtPreview}`)
          failed++
          // Continue with other migrations
        }
      }
    }

    const duration = Date.now() - startTime
    const success = failed === 0
    console.log(`[v0] Migration complete: ${applied} applied, ${skipped} skipped, ${failed} failed in ${duration}ms`)

    return {
      success,
      applied,
      skipped,
      failed,
      message: success 
        ? `Successfully executed ${applied} statements, ${skipped} skipped`
        : `Executed ${applied} statements, ${skipped} skipped, ${failed} failed`,
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
