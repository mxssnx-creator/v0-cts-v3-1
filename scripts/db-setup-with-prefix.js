#!/usr/bin/env node

const { Pool } = require("pg")
const fs = require("fs").promises
const path = require("path")
const readline = require("readline")

/**
 * Database Setup Script with Project Prefix Support
 *
 * This script:
 * 1. Prompts for project name
 * 2. Generates database prefix from project name
 * 3. Creates databases with prefix
 * 4. Runs all migrations with prefixed table names
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log("=".repeat(60))
  console.log("CTS v3.1 Database Setup with Project Prefix")
  console.log("=".repeat(60))
  console.log()

  const projectName = (await question("Enter project name (default: CTS v3.1): ")) || "CTS v3.1"

  const prefix =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") + "_"

  console.log()
  console.log(`Project Name: ${projectName}`)
  console.log(`Database Prefix: ${prefix}`)
  console.log()

  const confirm = await question("Continue with this configuration? (y/n): ")
  if (confirm.toLowerCase() !== "y") {
    console.log("Setup cancelled.")
    rl.close()
    process.exit(0)
  }

  const configDir = path.join(process.cwd(), "data")
  const configPath = path.join(configDir, "db-prefix-config.json")

  await fs.mkdir(configDir, { recursive: true })
  await fs.writeFile(
    configPath,
    JSON.stringify(
      {
        prefix,
        projectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )

  console.log()
  console.log("✓ Configuration saved")

  const envPath = path.join(process.cwd(), ".env")
  let envContent = ""
  try {
    envContent = await fs.readFile(envPath, "utf-8")
  } catch (error) {
    // File doesn't exist, will create new
  }

  if (!envContent.includes("DB_PREFIX=")) {
    envContent += `\n# Database Configuration\nDB_PREFIX=${prefix}\n`
    await fs.writeFile(envPath, envContent)
    console.log("✓ Environment file updated")
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL not configured")
    rl.close()
    process.exit(1)
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    console.log()
    console.log("Creating database...")

    const dbName = `${prefix}main`
    await pool.query(`CREATE DATABASE ${dbName}`)
    console.log(`✓ Database ${dbName} created`)

    const indicationTypes = ["active", "direction", "move"]
    for (const type of indicationTypes) {
      const indicationDb = `${prefix}indication_${type}`
      await pool.query(`CREATE DATABASE ${indicationDb}`)
      console.log(`✓ Database ${indicationDb} created`)
    }

    const strategyTypes = ["simple", "advanced", "step"]
    for (const type of strategyTypes) {
      const strategyDb = `${prefix}strategy_${type}`
      await pool.query(`CREATE DATABASE ${strategyDb}`)
      console.log(`✓ Database ${strategyDb} created`)
    }

    console.log()
    console.log("✓ All databases created successfully")
    console.log()
    console.log("Next steps:")
    console.log("  1. Run migrations: npm run db:migrate")
    console.log("  2. Start application: npm run dev")
  } catch (error) {
    console.error("Setup error:", error.message)
    process.exit(1)
  } finally {
    await pool.end()
    rl.close()
  }
}

main().catch(console.error)
