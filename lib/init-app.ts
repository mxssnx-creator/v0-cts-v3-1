"use server"

let initializationComplete = false
let initializationInProgress = false
let initializationPromise: Promise<any> | null = null
let initializationSkipped = false

/**
 * Initialize application database - gracefully handles DB not being ready
 * The app will start even if this fails, allowing web-based setup
 */
export async function initializeApplication() {
  // If already complete, return immediately
  if (initializationComplete) {
    return { success: true, message: "Application already initialized" }
  }

  // If initialization was skipped (DB not ready), return gracefully
  if (initializationSkipped) {
    return { success: false, skipped: true, message: "Database not configured yet - use /settings/install" }
  }

  // If in progress, wait for the same promise
  if (initializationInProgress && initializationPromise) {
    console.log("[v0] Initialization already in progress, waiting for completion...")
    return await initializationPromise
  }

  initializationInProgress = true

  // Create and store the initialization promise
  initializationPromise = (async () => {
    try {
      console.log("[v0] ================================================")
      console.log("[v0] CTS v3.1 - Checking Database Status")
      console.log("[v0] ================================================")

      // Try to initialize, but don't fail the app if DB is not ready
      try {
        const { runAllMigrations } = await import("@/lib/db-migration-runner")
        const { runAutoMigrations } = await import("@/lib/auto-migrate")

        console.log("[v0] Running Production Migration System...")
        const migrationResult = await runAllMigrations()

        if (!migrationResult.success) {
          console.warn("[v0] Migrations not successful, but continuing...")
        }

        console.log(`[v0] ✓ Database migrations: ${migrationResult.applied} applied, ${migrationResult.skipped} skipped`)

        // Step 2: Run auto-migrations for dynamic schema updates
        console.log("[v0] Running Auto-Migrations...")
        try {
          await runAutoMigrations()
          console.log("[v0] ✓ Auto-migrations complete")
        } catch (error) {
          console.warn("[v0] ⚠ Auto-migrations warning:", error instanceof Error ? error.message : String(error))
        }

        initializationComplete = true
        initializationInProgress = false

        console.log("[v0] ================================================")
        console.log("[v0] ✓ Application Ready")
        console.log("[v0] ================================================")

        return {
          success: true,
          message: "Application initialized successfully",
          migrationResult,
        }
      } catch (dbError) {
        // Database not ready - this is OK, allow web-based setup
        console.log("[v0] ================================================")
        console.log("[v0] ⚠ Database not ready - web setup available")
        console.log("[v0] ================================================")
        console.log("[v0] Visit /settings/install to configure database")

        initializationSkipped = true
        initializationInProgress = false

        return {
          success: false,
          skipped: true,
          message: "Database not configured - use /settings/install to set up",
          error: dbError instanceof Error ? dbError.message : String(dbError),
        }
      }
    } catch (error) {
      initializationInProgress = false
      initializationComplete = false
      initializationPromise = null

      console.error("[v0] ================================================")
      console.error("[v0] ✗ Initialization error")
      console.error("[v0] ================================================")
      console.error("[v0] Error:", error instanceof Error ? error.message : String(error))

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })()

  return await initializationPromise
}

/**
 * Reset initialization status - useful after database configuration
 */
export async function resetInitialization() {
  initializationComplete = false
  initializationInProgress = false
  initializationPromise = null
  initializationSkipped = false
}
