/**
 * Instrumentation - Trade Engine System Initialization
 * Runs when the server starts to initialize the global trade engine coordinator
 * and connection manager
 */

console.log("[v0] ========================================")
console.log("[v0] CTS v3.1 - Trade Engine System Startup")
console.log("[v0] ========================================")

/**
 * Server Initialization
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[v0] Server runtime detected - initializing trade engine systems...")

    try {
      // Safe dynamic imports to prevent circular dependencies
      const { initializeTradeEngineAutoStart, stopConnectionMonitoring } = await import(
        "@/lib/trade-engine-auto-start"
      )
      const { getConnectionManager } = await import("@/lib/connection-manager")
      const { initializeGlobalCoordinator, getGlobalTradeEngineCoordinator } = await import(
        "@/lib/trade-engine"
      )

      // Initialize ConnectionManager singleton
      console.log("[v0] Initializing ConnectionManager...")
      const manager = getConnectionManager()
      const connections = manager.getConnections()
      console.log(`[v0] ConnectionManager initialized with ${connections.length} connections`)

      // Initialize GlobalTradeEngineCoordinator singleton
      console.log("[v0] Initializing GlobalTradeEngineCoordinator...")
      const coordinator = initializeGlobalCoordinator()
      if (coordinator) {
        console.log("[v0] GlobalTradeEngineCoordinator initialized successfully")
      } else {
        console.error("[v0] Failed to initialize GlobalTradeEngineCoordinator")
      }

      // Start auto-initialization of trade engines for enabled connections
      console.log("[v0] Starting trade engine auto-initialization...")
      try {
        await initializeTradeEngineAutoStart()
        console.log("[v0] Trade engine auto-initialization complete")
      } catch (autoStartError) {
        console.error("[v0] Auto-start failed:", autoStartError)
      }

      console.log("[v0] ========================================")
      console.log("[v0] Trade Engine System Ready")
      console.log("[v0] ========================================")

      // Graceful shutdown
      process.on("SIGTERM", async () => {
        console.log("[v0] Received SIGTERM - gracefully shutting down...")
        stopConnectionMonitoring()

        const coordinator = getGlobalTradeEngineCoordinator()
        if (coordinator) {
          console.log("[v0] Stopping all trade engines...")
          try {
            await coordinator.stopAllEngines()
            console.log("[v0] All trade engines stopped")
          } catch (error) {
            console.error("[v0] Error stopping engines:", error)
          }
        }

        process.exit(0)
      })

      process.on("SIGINT", async () => {
        console.log("[v0] Received SIGINT - gracefully shutting down...")
        stopConnectionMonitoring()

        const coordinator = getGlobalTradeEngineCoordinator()
        if (coordinator) {
          console.log("[v0] Stopping all trade engines...")
          try {
            await coordinator.stopAllEngines()
            console.log("[v0] All trade engines stopped")
          } catch (error) {
            console.error("[v0] Error stopping engines:", error)
          }
        }

        process.exit(0)
      })
    } catch (error) {
      console.error("[v0] Failed to initialize trade engine systems:", error)
      // Don't throw - allow the server to continue even if initialization fails
    }
  }
}
