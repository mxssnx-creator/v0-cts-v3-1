export async function register() {
  // Skip during build phase - Next.js calls this during compilation
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NODE_ENV !== "production" ||
    !process.env.DATABASE_URL
  ) {
    return
  }

  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { DatabaseManager } = await import("./lib/database")
      const { AutoRecoveryManager } = await import("./lib/auto-recovery-manager")

      console.log("[Instrumentation] Initializing database...")
      await DatabaseManager.initialize()

      console.log("[Instrumentation] Initializing auto-recovery...")
      await AutoRecoveryManager.getInstance().initialize()

      console.log("[Instrumentation] Application initialized successfully")
    } catch (error) {
      console.error("[Instrumentation] Failed to initialize:", error)
    }
  }
}
