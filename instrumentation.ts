export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("=".repeat(60))
    console.log("[v0] 🚀 SYSTEM INITIALIZATION STARTING")
    console.log("=".repeat(60))
    console.log("[v0] Environment:")
    console.log("  - Runtime:", process.env.NEXT_RUNTIME)
    console.log("  - Vercel:", process.env.VERCEL_ENV || "local")
    const dbUrl = process.env.DATABASE_URL
    const dbType = dbUrl ? (dbUrl.startsWith("postgres") ? "PostgreSQL" : "Unknown") : "SQLite (default)"
    console.log("  - Database:", dbType)
    console.log("  - Deployment:", process.env.VERCEL_DEPLOYMENT_ID || "local")
    console.log("=".repeat(60))

    // Run database migrations/initialization
    try {
      const { getClient, getDatabaseType } = await import("./lib/db")
      const actualDbType = getDatabaseType()
      
      console.log("[v0] Running database initialization...")
      const startTime = Date.now()
      
      if (actualDbType === "sqlite") {
        // For SQLite, verify critical tables exist and create if missing
        try {
          const client = getClient() as any
          
          // Check if critical tables exist
          const checkTable = (tableName: string) => {
            try {
              const result = client.prepare(
                "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?"
              ).get(tableName)
              return result.count > 0
            } catch {
              return false
            }
          }
          
          const criticalTables = ['trade_engine_state', 'indications', 'preset_types', 'preset_type_sets']
          const missingTables = criticalTables.filter(table => !checkTable(table))
          
          if (missingTables.length > 0) {
            console.log(`[v0] Missing critical tables: ${missingTables.join(', ')}`)
            console.log("[v0] Running full database initialization...")
            
            const fs = await import("fs")
            const path = await import("path")
            const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
            
            if (fs.existsSync(sqlPath)) {
              const sql = fs.readFileSync(sqlPath, "utf-8")
              
              // Clean SQL: remove comment markers and normalize
              const cleanSql = sql
                .split('\n')
                .map(line => line.replace(/^\s*>\s*/, '').trim())
                .filter(line => line.length > 0 && !line.startsWith('--'))
                .join('\n')
              
              client.exec(cleanSql)
              console.log("[v0] Database schema initialized successfully")
              
              // Verify tables were created
              const stillMissing = criticalTables.filter(table => !checkTable(table))
              if (stillMissing.length > 0) {
                console.warn(`[v0] WARNING: Some tables still missing: ${stillMissing.join(', ')}`)
              } else {
                console.log("[v0] All critical tables verified")
              }
            } else {
              console.warn("[v0] unified_complete_setup.sql not found")
            }
          } else {
            console.log("[v0] All critical tables exist - skipping initialization")
          }
        } catch (sqlError) {
          console.error("[v0] Database initialization error:", sqlError)
        }
      } else {
        // For PostgreSQL, use migration runner
        const { runAllMigrations } = await import("./lib/db-migration-runner")
        const result = await runAllMigrations()
        console.log(`[v0] Migrations: ${result.applied} applied, ${result.skipped} skipped`)
      }
      
      const duration = Date.now() - startTime
      
      console.log("=".repeat(60))
      console.log("[v0] ✅ SYSTEM INITIALIZATION COMPLETED")
      console.log("=".repeat(60))
      console.log(`[v0] Database: ${dbType} - Ready`)
      console.log(`[v0] Initialization completed in ${duration}ms`)
      console.log("[v0] System ready to accept requests")
      console.log("=".repeat(60))
    } catch (error) {
      console.log("=".repeat(60))
      console.log("[v0] ⚠️  INITIALIZATION COMPLETED WITH WARNINGS")
      console.log("=".repeat(60))
      console.error("[v0] Migration error:", error)
      console.log("[v0] System may use file-based fallback")
      console.log("=".repeat(60))
    }
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
