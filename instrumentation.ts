export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("\n" + "=".repeat(60))
    console.log("[v0] CTS v3.1 - SYSTEM INITIALIZATION")
    console.log("=".repeat(60))
    console.log("[v0] Runtime:", process.env.NEXT_RUNTIME)
    const dbUrl = process.env.DATABASE_URL
    const dbType = dbUrl ? (dbUrl.startsWith("postgres") ? "PostgreSQL" : "Unknown") : "SQLite"
    console.log("[v0] Database:", dbType)
    console.log("=".repeat(60))

    // Step 1: Database initialization
    try {
      console.log("\n[v0] Initializing database...")
      const startTime = Date.now()
      
      const { getClient, getDatabaseType } = await import("./lib/db")
      const actualDbType = getDatabaseType()
      console.log("[v0] Database type:", actualDbType)
      
      // Initialize database client
      const client = getClient()
      console.log("[v0] Database client initialized")
      
      // Check if database is initialized (quick check only)
      if (actualDbType === "sqlite") {
        const sqliteClient = client as any
        try {
          const tables = sqliteClient.prepare(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
          ).get()
          console.log(`[v0] Database has ${tables.count} tables`)
          
          if (tables.count < 5) {
            console.log("[v0] Database appears empty - will initialize in background")
            // Schedule background initialization (non-blocking)
            setImmediate(() => {
              import("./lib/db-initializer")
                .then(({ initializeDatabase }) => initializeDatabase())
                .catch((err) => console.error("[v0] Background DB init failed:", err))
            })
          }
        } catch (err) {
          console.warn("[v0] Could not check database tables:", err)
        }
      }
      
      const duration = Date.now() - startTime
      
      console.log("[v0] Database ready in " + duration + "ms")
      console.log("=".repeat(60))
      console.log("[v0] SYSTEM READY")
      console.log("=".repeat(60) + "\n")
      
      // Start background services (fully non-blocking - fire and forget)
      setImmediate(() => {
        // Auto-backup service
        import("./lib/auto-backup")
          .then(({ getAutoBackupManager }) => {
            const backupManager = getAutoBackupManager()
            backupManager.start(6)
            console.log("[v0] Auto-backup started (6h interval)")
          })
          .catch(() => {
            // Silently fail - not critical
          })

        // Trade engine auto-start (delayed to avoid blocking)
        setTimeout(() => {
          import("./lib/trade-engine-auto-start")
            .then(({ initializeTradeEngineAutoStart }) => {
              console.log("[v0] Starting trade engine auto-start...")
              return initializeTradeEngineAutoStart()
            })
            .then(() => {
              console.log("[v0] Trade engine auto-start completed")
            })
            .catch((err) => {
              console.warn("[v0] Trade engine auto-start failed:", err instanceof Error ? err.message : String(err))
            })
        }, 5000) // Wait 5 seconds after app starts
      })
      
    } catch (error) {
      console.error("[v0] Initialization error:", error instanceof Error ? error.message : String(error))
      console.log("[v0] System will use fallback mode")
      console.log("=".repeat(60) + "\n")
    }
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
