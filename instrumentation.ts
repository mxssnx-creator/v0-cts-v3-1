/**
 * Minimal instrumentation - system boots first, initialization happens in background
 */
export async function register() {
  // Do nothing synchronously - app loads immediately
  
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Schedule all initialization to happen after app is ready
    // Use process.nextTick to defer until after module loading
    process.nextTick(async () => {
      try {
        // Try to initialize database
        try {
          const { initializeDatabase } = await import("./lib/db-initializer")
          await initializeDatabase().catch(() => {
            // Database init failure is not critical
          })
        } catch (e) {
          // Silently fail - database will initialize on first use
        }

        // Try to initialize trade engines
        try {
          const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
          await initializeTradeEngineAutoStart().catch(() => {
            // Trade engine init failure is not critical
          })
        } catch (e) {
          // Silently fail - engines can start manually
        }
      } catch (error) {
        // Catch all - initialization errors don't affect app
      }
    })
  }
}
