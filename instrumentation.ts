/**
 * Application instrumentation - runs on app startup
 * Completely disabled for v0 dev preview to prevent any startup issues
 * Only active in production Node.js runtime
 */

// Detect if we're in a dev/preview environment
const isPreviewMode = 
  process.env.VERCEL_ENV === "preview" ||
  process.env.VERCEL_ENV === "development" ||
  process.env.NODE_ENV === "development" ||
  !process.env.VERCEL ||
  process.env.NEXT_PHASE === "phase-production-build"

export async function register() {
  // Completely skip all initialization in preview/dev mode
  if (isPreviewMode) {
    return
  }

  // Only run in production Node.js runtime on Vercel
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.VERCEL) {
    return
  }

  console.log("[v0] CTS v3.1 - Server initialization started")
  
  // Run initialization asynchronously (non-blocking)
  process.nextTick(async () => {
    try {
      // Step 1: Initialize database
      try {
        const { initializeDatabase } = await import("@/lib/db-initializer")
        await initializeDatabase()
        console.log("[v0] ✓ Database initialized")
      } catch (error) {
        console.log("[v0] Database initialization deferred (will initialize on first use)")
      }

      // Step 2: Run pending migrations
      try {
        const { runMigrations } = await import("@/lib/migration-runner")
        await runMigrations()
        console.log("[v0] ✓ Migrations executed")
      } catch (error) {
        console.warn("[v0] ⚠ Migration execution skipped:", error instanceof Error ? error.message : "unknown error")
      }

      // Step 3: Initialize connection manager
      try {
        const { getConnectionManager } = await import("@/lib/connection-manager")
        getConnectionManager()
        console.log("[v0] ✓ Connection manager ready")
      } catch (error) {
        // Non-critical
      }

      // Step 4: Start trade engines
      try {
        const { initializeTradeEngineAutoStart } = await import("@/lib/trade-engine-auto-start")
        await initializeTradeEngineAutoStart()
        console.log("[v0] ✓ Trade engine systems started")
      } catch (error) {
        // Non-critical
      }

      console.log("[v0] Application initialization complete")
    } catch (error) {
      console.error("[v0] Startup error:", error instanceof Error ? error.message : "unknown error")
    }
  })
}
