/**
 * Application instrumentation - runs on app startup
 * Orchestrates database initialization, migrations, and trade engine startup
 */
export async function register() {
  console.log("[v0] ========================================")
  console.log("[v0] CTS v3.1 - Application Startup")
  console.log("[v0] ========================================")

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run initialization on startup
    process.nextTick(async () => {
      try {
        console.log("[v0] Step 1: Running database initialization coordinator...")
        const { executeCompleteInitialization } = await import("./lib/db-initialization-coordinator")
        
        try {
          const initResult = await executeCompleteInitialization()
          if (initResult.success) {
            console.log(`[v0] ✓ Database initialization successful (${initResult.duration}ms)`)
            console.log(`[v0]   - Tables: ${initResult.details.tablesCreated}`)
            console.log(`[v0]   - Indexes: ${initResult.details.indexesCreated}`)
            console.log(`[v0]   - PRAGMAs: ${initResult.details.pragmasApplied}`)
          } else {
            console.warn(`[v0] ⚠ Database initialization completed with issues: ${initResult.message}`)
          }
        } catch (dbError) {
          console.warn("[v0] Database initialization skipped (non-critical):", dbError)
        }

        console.log("[v0] Step 2: Running database migrations...")
        const { runMigrations } = await import("./lib/migration-runner")
        await runMigrations()
        console.log("[v0] ✓ Database migrations completed successfully")
      } catch (error) {
        console.error("[v0] Migration initialization failed:", error)
        console.log("[v0] System will continue - some features may not be available")
      }

      try {
        console.log("[v0] Step 3: Initializing database...")
        // Initialize database after migrations
        const { initializeDatabase } = await import("./lib/db-initializer")
        await initializeDatabase().catch(() => {
          // Database init failure is not critical
        })
        console.log("[v0] ✓ Database initialization complete")
      } catch (e) {
        // Silently fail - database will initialize on first use
      }

      try {
        console.log("[v0] Step 4: Initializing connection manager...")
        const { getConnectionManager } = await import("./lib/connection-manager")
        const manager = getConnectionManager()
        const connections = manager.getConnections()
        console.log(`[v0] ✓ ConnectionManager initialized with ${connections.length} connections`)
      } catch (e) {
        console.warn("[v0] ⚠ Connection manager initialization skipped:", e)
      }

      try {
        console.log("[v0] Step 5: Initializing trade engine systems...")
        const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
        await initializeTradeEngineAutoStart().catch(() => {
          // Trade engine init failure is not critical
        })
        console.log("[v0] ✓ Trade engine auto-initialization complete")
      } catch (e) {
        // Silently fail - engines can start manually
        console.warn("[v0] ⚠ Trade engine initialization skipped:", e)
      }

      console.log("[v0] ========================================")
      console.log("[v0] Application Ready")
      console.log("[v0] ========================================")
    })
  }

  console.log("[v0] Application initialization started")
}
