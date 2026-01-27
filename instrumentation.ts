/**
 * Application instrumentation - runs on app startup
 */
export async function register() {
  console.log("[v0] Initializing application...")

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run migrations immediately on startup
    process.nextTick(async () => {
      try {
        console.log("[v0] Starting database migrations...")
        const { runMigrations } = await import("./lib/migration-runner")
        await runMigrations()
        console.log("[v0] Database migrations completed successfully")
      } catch (error) {
        console.error("[v0] Migration initialization failed:", error)
        console.log("[v0] System will continue - some features may not be available")
      }

      try {
        // Initialize database after migrations
        const { initializeDatabase } = await import("./lib/db-initializer")
        await initializeDatabase().catch(() => {
          // Database init failure is not critical
        })
      } catch (e) {
        // Silently fail - database will initialize on first use
      }

      try {
        // Initialize trade engines after migrations
        const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
        await initializeTradeEngineAutoStart().catch(() => {
          // Trade engine init failure is not critical
        })
      } catch (e) {
        // Silently fail - engines can start manually
      }
    })
  }

  console.log("[v0] Application initialization started")
}
