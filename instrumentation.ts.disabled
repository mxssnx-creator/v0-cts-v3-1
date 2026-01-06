export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.log("[v0] Skipping instrumentation during build phase")
    return
  }

  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.log("[v0] Skipping initialization (Edge Runtime)")
    return
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[v0] Skipping instrumentation in development")
    return
  }

  console.log("=".repeat(60))
  console.log("[v0] 🚀 AUTOMATIC DEPLOYMENT INITIALIZATION STARTING")
  console.log("=".repeat(60))
  console.log("[v0] Environment Details:")
  console.log("  - Runtime:", process.env.NEXT_RUNTIME)
  console.log("  - Vercel Environment:", process.env.VERCEL_ENV || "local")
  console.log("  - Database Connected:", !!process.env.DATABASE_URL)
  console.log("  - Deployment ID:", process.env.VERCEL_DEPLOYMENT_ID || "local")
  console.log("=".repeat(60))

  try {
    const { autoRecoveryManager } = await import("./lib/auto-recovery-manager")
    await autoRecoveryManager.startHealthMonitoring()
    console.log("[v0] ✅ Auto-recovery system started")

    const { DatabaseInitializer } = await import("./lib/db-initializer")

    console.log("[v0] Starting database initialization...")
    const startTime = Date.now()

    const success = await DatabaseInitializer.initialize()

    const duration = Date.now() - startTime

    if (success) {
      console.log("=".repeat(60))
      console.log("[v0] ✅ DEPLOYMENT INITIALIZATION SUCCESSFUL")
      console.log("=".repeat(60))
      console.log("[v0] Database initialized with default Bybit and BingX connections")
      console.log("[v0] Initialization completed in", duration, "ms")
      console.log("[v0] System is ready to accept requests")
      console.log("=".repeat(60))

      try {
        const { positionThresholdManager } = await import("./lib/position-threshold-manager")
        await positionThresholdManager.startMonitoring(60000)
        console.log("[v0] ✅ Position threshold monitoring started")
      } catch (error) {
        console.error("[v0] ⚠️  Failed to start position threshold monitoring:", error)
      }
    } else {
      console.log("=".repeat(60))
      console.error("[v0] ❌ DEPLOYMENT INITIALIZATION FAILED")
      console.log("=".repeat(60))
      console.error("[v0] Database initialization did not complete successfully")
      console.error("[v0] Auto-recovery system will attempt to fix this")
      console.log("=".repeat(60))
    }
  } catch (error) {
    console.log("=".repeat(60))
    console.error("[v0] ❌ DEPLOYMENT INITIALIZATION ERROR")
    console.log("=".repeat(60))
    console.error("[v0] Error during initialization:", error)
    console.error("[v0] Auto-recovery system will attempt to fix this")
    console.log("=".repeat(60))
  }
}
