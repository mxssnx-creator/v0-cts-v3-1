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
        const { getClient, getDatabaseType } = await import("@/lib/db")
        const fs = await import("fs")
        const path = await import("path")

        // First, try to initialize the database if it's empty
        const dbType = getDatabaseType()
        console.log("[v0] Database Type:", dbType)

        if (dbType === "sqlite") {
          // Check if tables exist
          const client = getClient() as any
          try {
            const tables = client
              .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
              .all()

            console.log(`[v0] Found ${tables.length} existing tables`)

            if (tables.length === 0) {
              // No tables exist - auto-initialize
              console.log("[v0] No tables found - auto-initializing database...")
              const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
              
              if (!fs.existsSync(sqlPath)) {
                console.error("[v0] unified_complete_setup.sql not found!")
                throw new Error("Database initialization script not found")
              }

              const sql = fs.readFileSync(sqlPath, "utf-8")
              console.log("[v0] Executing unified_complete_setup.sql...")
              
              // Execute the SQL
              client.exec(sql)
              
              // Verify tables were created
              const newTables = client
                .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                .all()
              
              console.log(`[v0] ✓ Database auto-initialized successfully - ${newTables.length} tables created`)
            } else {
              console.log("[v0] Database already initialized")
            }
          } catch (initError) {
            console.error("[v0] Database initialization error:", initError)
            throw initError
          }
        }

        // Now run migrations and auto-migrations
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
        // Database error - log and skip
        console.log("[v0] ================================================")
        console.log("[v0] ⚠ Database initialization warning")
        console.log("[v0] ================================================")
        console.warn("[v0] Error:", dbError instanceof Error ? dbError.message : String(dbError))

        initializationSkipped = true
        initializationInProgress = false

        return {
          success: false,
          skipped: true,
          message: "Database initialization skipped",
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
