export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[v0] CTS v3.1 - Initializing")
    
    // Non-blocking background initialization
    setImmediate(async () => {
      try {
        const { initializeDatabase } = await import("./lib/db-initializer")
        await initializeDatabase()
        console.log("[v0] Database initialized")
        
        // Start trade engine auto-start after database is ready
        setTimeout(async () => {
          try {
            const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
            await initializeTradeEngineAutoStart()
            console.log("[v0] Trade engine auto-start completed")
          } catch (err) {
            console.warn("[v0] Trade engine auto-start failed:", err)
          }
        }, 2000)
      } catch (error) {
        console.error("[v0] Initialization error:", error)
      }
    })
  }
}
