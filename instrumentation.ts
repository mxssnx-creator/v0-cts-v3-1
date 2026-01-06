export async function initializeInstrumentation() {
  // Skip during build phase
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) ||
    typeof window !== "undefined"
  ) {
    console.log("[Instrumentation] Skipping initialization during build phase")
    return
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { DatabaseManager } = await import("./lib/database")
    const { AutoRecoveryManager } = await import("./lib/auto-recovery-manager")

    try {
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
