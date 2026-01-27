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
