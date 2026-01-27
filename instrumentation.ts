export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[v0] CTS v3.1 - Initializing system")
    
    // Non-blocking initialization in background
    setImmediate(async () => {
      try {
        console.log("[v0] [INIT] Database initialization starting...")
        const { initializeDatabase } = await import("./lib/db-initializer")
        await initializeDatabase()
        console.log("[v0] [INIT] Database ready")

        // Wait for database to stabilize
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log("[v0] [INIT] Trade engine auto-start beginning...")
        const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
        await initializeTradeEngineAutoStart()
        console.log("[v0] [INIT] System initialization complete")
      } catch (error) {
        console.error("[v0] [INIT] Critical error:", error instanceof Error ? error.message : String(error))
      }
    })
  }
}
