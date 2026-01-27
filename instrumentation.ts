export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("\n" + "=".repeat(60))
    console.log("[v0] CTS v3.1 - SYSTEM INITIALIZATION")
    console.log("=".repeat(60))
    console.log("[v0] Initialization will complete in background")
    console.log("=".repeat(60))

    // All initialization happens in background - non-blocking
    setImmediate(async () => {
      try {
        console.log("[v0] Starting background initialization...")
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
              console.log("[v0] Database appears empty - initializing...")
              const { initializeDatabase } = await import("./lib/db-initializer")
              await initializeDatabase()
            }
          } catch (err) {
            console.warn("[v0] Could not check database tables:", err)
          }
        }
        
        const duration = Date.now() - startTime
        
        console.log("[v0] Database ready in " + duration + "ms")
        console.log("[v0] SYSTEM READY")
        console.log("=".repeat(60) + "\n")
        
        // Start background services
        try {
          const { getAutoBackupManager } = await import("./lib/auto-backup")
          const backupManager = getAutoBackupManager()
          backupManager.start(6)
          console.log("[v0] Auto-backup started")
        } catch (err) {
          console.warn("[v0] Auto-backup unavailable")
        }

        // Trade engine auto-start
        setTimeout(async () => {
          try {
            const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
            console.log("[v0] Starting trade engine auto-start...")
            await initializeTradeEngineAutoStart()
            console.log("[v0] Trade engine auto-start completed")
          } catch (err) {
            console.warn("[v0] Trade engine auto-start failed:", err instanceof Error ? err.message : String(err))
          }
        }, 5000)
        
      } catch (error) {
        console.error("[v0] Background initialization error:", error instanceof Error ? error.message : String(error))
      }
    })
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
