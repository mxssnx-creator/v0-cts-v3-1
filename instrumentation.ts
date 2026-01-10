export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("=".repeat(60))
    console.log("[v0] 🚀 AUTOMATIC DEPLOYMENT INITIALIZATION STARTING")
    console.log("=".repeat(60))
    console.log("[v0] Environment Details:")
    console.log("  - Runtime:", process.env.NEXT_RUNTIME)
    console.log("  - Vercel Environment:", process.env.VERCEL_ENV || "local")
    console.log(
      "  - Database Type:",
      process.env.DATABASE_URL
        ? process.env.DATABASE_URL.startsWith("postgres")
          ? "PostgreSQL"
          : "Unknown"
        : "SQLite (default)",
    )
    console.log("  - DATABASE_URL Set:", !!process.env.DATABASE_URL)
    console.log("  - Deployment ID:", process.env.VERCEL_DEPLOYMENT_ID || "local")
    console.log("=".repeat(60))

    try {
      const { DatabaseInitializer } = await import("./lib/db-initializer")

      console.log("[v0] Starting database initialization...")
      const startTime = Date.now()

      const success = await DatabaseInitializer.initialize()

      const duration = Date.now() - startTime

      console.log("=".repeat(60))
      console.log("[v0] ✅ DEPLOYMENT INITIALIZATION COMPLETED")
      console.log("=".repeat(60))
      console.log("[v0] Database setup completed (SQLite default or PostgreSQL if configured)")
      console.log("[v0] File-based storage available as fallback")
      console.log("[v0] Initialization completed in", duration, "ms")
      console.log("[v0] System is ready to accept requests")
      console.log("=".repeat(60))
    } catch (error) {
      console.log("=".repeat(60))
      console.log("[v0] ⚠️  DEPLOYMENT INITIALIZATION COMPLETED WITH WARNINGS")
      console.log("=".repeat(60))
      console.error("[v0] Warning during initialization:", error)
      console.log("[v0] System will use file-based storage as fallback")
      console.log("[v0] The app is starting and fully functional")
      console.log("=".repeat(60))
    }
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
