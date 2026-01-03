#!/usr/bin/env node

/**
 * CTS v3.1 - Database Migration Runner
 * Executes all pending database migrations
 */

const path = require("path")
const fs = require("fs")

console.log("🔄 CTS v3.1 - Database Migration Runner")
console.log("=".repeat(50))
console.log()

async function main() {
  try {
    // Load environment variables
    const envPath = path.join(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      require("dotenv").config({ path: envPath })
      console.log("✅ Loaded environment from .env.local")
    } else {
      console.log("⚠️  No .env.local found, using environment variables")
    }

    // Check database connection
    const { getDatabaseType } = require("../lib/db")
    const dbType = getDatabaseType()
    console.log(`📊 Database Type: ${dbType}`)
    console.log()

    // Initialize database
    console.log("🔧 Initializing database...")
    const { DatabaseInitializer } = require("../lib/db-initializer")
    const initialized = await DatabaseInitializer.initialize(3, 60000)

    if (!initialized) {
      console.error("❌ Database initialization failed")
      process.exit(1)
    }
    console.log("✅ Database initialized")
    console.log()

    // Run main migrations
    console.log("🔄 Running main migrations...")
    const { DatabaseMigrations } = require("../lib/db-migrations")
    await DatabaseMigrations.runPendingMigrations()
    console.log("✅ Main migrations completed")
    console.log()

    // Run auto migrations
    console.log("🔄 Running auto migrations...")
    const { runAutoMigrations } = require("../lib/auto-migrate")
    const autoResult = await runAutoMigrations()

    if (autoResult.success) {
      console.log("✅ Auto migrations completed")
    } else {
      console.log("⚠️  Auto migrations had warnings:", autoResult.error || autoResult.message)
    }
    console.log()

    // Run additional migrations
    console.log("🔄 Running additional migrations...")
    const { runAdditionalMigrations } = require("../lib/db-migrations-additions")
    await runAdditionalMigrations()
    console.log("✅ Additional migrations completed")
    console.log()

    console.log("=".repeat(50))
    console.log("✅ All migrations completed successfully!")
    console.log("=".repeat(50))
    console.log()
    console.log("Next steps:")
    console.log("  • Run 'npm run db:status' to check database status")
    console.log("  • Run 'npm run dev' to start the application")
    console.log()

    process.exit(0)
  } catch (error) {
    console.error()
    console.error("=".repeat(50))
    console.error("❌ Migration failed!")
    console.error("=".repeat(50))
    console.error()
    console.error("Error:", error.message)
    console.error()
    console.error("Stack trace:")
    console.error(error.stack)
    console.error()
    console.error("Troubleshooting:")
    console.error("  • Check DATABASE_URL in .env.local")
    console.error("  • Ensure database server is running")
    console.error("  • Check database permissions")
    console.error("  • Review error message above")
    console.error()
    process.exit(1)
  }
}

main()
