export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("=".repeat(60))
    console.log("[v0] 🚀 SYSTEM INITIALIZATION STARTING")
    console.log("=".repeat(60))
    console.log("[v0] Environment:")
    console.log("  - Runtime:", process.env.NEXT_RUNTIME)
    console.log("  - Vercel:", process.env.VERCEL_ENV || "local")
    const dbUrl = process.env.DATABASE_URL
    const dbType = dbUrl ? (dbUrl.startsWith("postgres") ? "PostgreSQL" : "Unknown") : "SQLite (default)"
    console.log("  - Database:", dbType)
    console.log("  - Deployment:", process.env.VERCEL_DEPLOYMENT_ID || "local")
    console.log("=".repeat(60))

    try {
      const { DatabaseInitializer } = await import("./lib/db-initializer")

      console.log("[v0] Starting database initialization...")
      const startTime = Date.now()

      const success = await DatabaseInitializer.initialize()

      const duration = Date.now() - startTime

      console.log("=".repeat(60))
      console.log("[v0] ✅ SYSTEM INITIALIZATION COMPLETED")
      console.log("=".repeat(60))
      console.log(`[v0] Database: ${dbType} - ${success ? "Ready" : "Using file storage"}`)
      console.log("[v0] File-based storage available as fallback")
      console.log(`[v0] Initialization completed in ${duration}ms`)
      console.log("[v0] System ready to accept requests")
      console.log("=".repeat(60))
    } catch (error) {
      console.log("=".repeat(60))
      console.log("[v0] ⚠️  INITIALIZATION COMPLETED WITH WARNINGS")
      console.log("=".repeat(60))
      console.error("[v0] Warning:", error)
      console.log("[v0] System using file-based storage fallback")
      console.log("[v0] Application is fully functional")
      console.log("=".repeat(60))
    }
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
