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
    const envPath = path.join(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8")
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
        if (match) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
        }
      })
      console.log("✅ Loaded environment from .env.local")
    } else {
      console.log("⚠️  No .env.local found, using environment variables")
    }

    const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL
    if (!databaseUrl) {
      console.error("❌ No DATABASE_URL found")
      console.error("   Please set DATABASE_URL in .env.local")
      process.exit(1)
    }

    const dbType = databaseUrl.startsWith("postgres") ? "PostgreSQL" : "SQLite"
    console.log(`📊 Database Type: ${dbType}`)
    console.log()

    console.log("🔧 Initializing database...")
    const { DatabaseInitializer } = require("./db-initializer.cjs")
    const initialized = await DatabaseInitializer.initialize()

    if (!initialized) {
      console.error("❌ Database initialization failed")
      process.exit(1)
    }
    console.log("✅ Database initialized")
    console.log()

    console.log("=".repeat(50))
    console.log("✅ Database initialization completed successfully!")
    console.log("=".repeat(50))
    console.log()
    console.log("ℹ️  Note: Full migrations will run automatically when you start the app")
    console.log("   The TypeScript migration system requires the app to be running")
    console.log()
    console.log("Next steps:")
    console.log("  • Run 'npm run dev' to start the application")
    console.log("  • All pending migrations will run on startup")
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
