#!/usr/bin/env node

/**
 * CTS v3.1 - Database Status Checker
 * Displays current database status and migration state
 */

const path = require("path")
const fs = require("fs")

console.log("📊 CTS v3.1 - Database Status")
console.log("=".repeat(50))
console.log()

async function main() {
  try {
    // Load environment
    const envPath = path.join(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      require("dotenv").config({ path: envPath })
    }

    // Get database info
    const { getDatabaseType, query } = require("../lib/db")
    const dbType = getDatabaseType()

    console.log("Database Configuration:")
    console.log(`  Type: ${dbType}`)
    console.log(`  URL: ${process.env.DATABASE_URL ? "✅ Configured" : "❌ Not configured"}`)
    console.log()

    // Check if database is accessible
    try {
      const testQuery = dbType === "postgresql" ? "SELECT NOW() as time" : "SELECT datetime('now') as time"

      const result = await query(testQuery, [])
      console.log("Connection Status: ✅ Connected")
      console.log(`  Server Time: ${result[0]?.time || "Unknown"}`)
      console.log()
    } catch (error) {
      console.log("Connection Status: ❌ Failed")
      console.log(`  Error: ${error.message}`)
      console.log()
      process.exit(1)
    }

    // Check migrations table
    try {
      const migrations = await query(
        "SELECT migration_id, migration_name, executed_at FROM schema_migrations ORDER BY migration_id",
        [],
      )

      console.log("Migration Status:")
      console.log(`  Total Executed: ${migrations.length}`)
      console.log()

      if (migrations.length > 0) {
        console.log("Executed Migrations:")
        migrations.forEach((m) => {
          console.log(`  ✅ ${m.migration_id}: ${m.migration_name}`)
        })
        console.log()

        const lastMigration = migrations[migrations.length - 1]
        console.log("Last Migration:")
        console.log(`  ID: ${lastMigration.migration_id}`)
        console.log(`  Name: ${lastMigration.migration_name}`)
        console.log(`  Date: ${lastMigration.executed_at}`)
      } else {
        console.log("⚠️  No migrations executed yet")
        console.log("   Run 'npm run db:migrate' to execute migrations")
      }
    } catch (error) {
      console.log("Migration Status: ⚠️  Table not found")
      console.log("  Run 'npm run db:migrate' to initialize")
    }

    console.log()

    // Check main tables
    console.log("Checking Main Tables:")
    const mainTables = [
      "exchange_connections",
      "pseudo_positions",
      "real_pseudo_positions",
      "base_pseudo_positions",
      "active_exchange_positions",
      "indication_states",
      "market_data",
      "system_settings",
    ]

    for (const table of mainTables) {
      try {
        const countQuery =
          dbType === "postgresql" ? `SELECT COUNT(*) as count FROM ${table}` : `SELECT COUNT(*) as count FROM ${table}`

        const result = await query(countQuery, [])
        const count = result[0]?.count || 0
        console.log(`  ✅ ${table}: ${count} records`)
      } catch (error) {
        console.log(`  ❌ ${table}: Not found or error`)
      }
    }

    console.log()
    console.log("=".repeat(50))
    console.log("✅ Database status check complete")
    console.log("=".repeat(50))

    process.exit(0)
  } catch (error) {
    console.error()
    console.error("❌ Status check failed:", error.message)
    console.error()
    process.exit(1)
  }
}

main()
