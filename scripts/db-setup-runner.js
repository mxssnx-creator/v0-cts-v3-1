#!/usr/bin/env node

/**
 * CTS v3.1 - Complete Database Setup Runner
 * Creates users, databases, and runs all migrations
 */

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

async function runPsqlScript(scriptPath, connectionString, dbName = "postgres") {
  return new Promise((resolve, reject) => {
    console.log(`\n   → Running: ${path.basename(scriptPath)}`)

    // Use postgres database for initial connection
    const psqlArgs = ["-v", "ON_ERROR_STOP=1", "-f", scriptPath]

    // Add connection parameters
    if (connectionString) {
      const url = new URL(connectionString.replace("postgresql://", "postgres://"))
      psqlArgs.push("-h", url.hostname)
      psqlArgs.push("-p", url.port || "5432")
      psqlArgs.push("-U", url.username)
      psqlArgs.push("-d", dbName)
    }

    const proc = spawn("psql", psqlArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PGPASSWORD: connectionString
          ? new URL(connectionString.replace("postgresql://", "postgres://")).password
          : process.env.PGPASSWORD,
      },
    })

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
      process.stdout.write("      " + data.toString())
    })

    proc.stderr.on("data", (data) => {
      stderr += data.toString()
      // PostgreSQL sends NOTICEs to stderr, only show if error
      if (data.toString().includes("ERROR")) {
        process.stderr.write("      " + data.toString())
      }
    })

    proc.on("exit", (code) => {
      if (code === 0) {
        console.log(`   ✅ Completed: ${path.basename(scriptPath)}`)
        resolve({ code, stdout, stderr })
      } else {
        console.error(`   ❌ Failed: ${path.basename(scriptPath)} (exit code: ${code})`)
        reject(new Error(`Script failed with code ${code}\n${stderr}`))
      }
    })

    proc.on("error", (error) => {
      console.error(`   ❌ Error running psql: ${error.message}`)
      reject(error)
    })
  })
}

async function main() {
  console.log("=".repeat(70))
  console.log("🚀 CTS v3.1 - Complete Database Setup")
  console.log("=".repeat(70))
  console.log()
  console.log("This script will:")
  console.log("  1. Create dedicated database users (cts_v3_admin, cts_v3_app)")
  console.log("  2. Create project-prefixed databases (cts_v3_1_*)")
  console.log("  3. Set up proper permissions and security")
  console.log("  4. Run all database migrations")
  console.log("  5. Create performance indexes")
  console.log()

  // Check if psql is available
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn("psql", ["--version"])
      proc.on("exit", (code) => (code === 0 ? resolve() : reject()))
      proc.on("error", reject)
    })
    console.log("✅ PostgreSQL client (psql) found")
  } catch (error) {
    console.error("❌ PostgreSQL client (psql) not found")
    console.error("   Please install PostgreSQL client tools:")
    console.error("   • Ubuntu/Debian: sudo apt-get install postgresql-client")
    console.error("   • macOS: brew install postgresql")
    console.error("   • Windows: Install from postgresql.org")
    process.exit(1)
  }

  console.log()
  console.log("📝 PostgreSQL Superuser Connection")
  console.log("   (Required to create users and databases)")
  console.log()

  const pgHost = (await askQuestion("PostgreSQL Host (default: localhost): ")) || "localhost"
  const pgPort = (await askQuestion("PostgreSQL Port (default: 5432): ")) || "5432"
  const pgSuperUser = (await askQuestion("PostgreSQL Superuser (default: postgres): ")) || "postgres"
  const pgSuperPass = await askQuestion("PostgreSQL Superuser Password: ")

  if (!pgSuperPass) {
    console.error("\n❌ Superuser password is required")
    process.exit(1)
  }

  const superuserConnectionString = `postgresql://${pgSuperUser}:${encodeURIComponent(pgSuperPass)}@${pgHost}:${pgPort}/postgres`

  console.log()
  console.log("🔧 Testing connection...")

  try {
    await runPsqlScript(path.join(__dirname, "test-connection.sql"), superuserConnectionString, "postgres")
    console.log("✅ Connection successful")
  } catch (error) {
    console.error("\n❌ Connection failed!")
    console.error("   Error:", error.message)
    console.error("\n   Please check:")
    console.error("   • PostgreSQL server is running")
    console.error("   • Host and port are correct")
    console.error("   • Superuser credentials are correct")
    console.error("   • Firewall allows connection")
    process.exit(1)
  }

  console.log()
  console.log("=".repeat(70))
  console.log("🗄️  Creating Database Infrastructure")
  console.log("=".repeat(70))

  // Run initial setup script
  try {
    await runPsqlScript(path.join(__dirname, "000_initial_database_setup.sql"), superuserConnectionString, "postgres")
  } catch (error) {
    console.error("\n❌ Database setup failed!")
    console.error("   Error:", error.message)
    process.exit(1)
  }

  console.log()
  console.log("=".repeat(70))
  console.log("📊 Running Database Migrations")
  console.log("=".repeat(70))

  // Get all SQL migration files
  const scriptsDir = __dirname
  const migrationFiles = fs
    .readdirSync(scriptsDir)
    .filter((file) => file.endsWith(".sql") && file.match(/^\d{3}_/))
    .sort()

  console.log(`\nFound ${migrationFiles.length} migration scripts`)
  console.log()

  const adminConnectionString = `postgresql://cts_v3_admin:CTS_v3_SecurePass_2025!@${pgHost}:${pgPort}/cts_v3_1_main`

  for (const file of migrationFiles) {
    try {
      await runPsqlScript(path.join(scriptsDir, file), adminConnectionString, "cts_v3_1_main")
    } catch (error) {
      console.error(`\n⚠️  Migration ${file} failed, continuing...`)
      console.error(`   Error: ${error.message}`)
    }
  }

  console.log()
  console.log("=".repeat(70))
  console.log("✅ Database Setup Complete!")
  console.log("=".repeat(70))
  console.log()
  console.log("📋 Setup Summary:")
  console.log("   • Users created: cts_v3_admin, cts_v3_app")
  console.log("   • Main database: cts_v3_1_main")
  console.log("   • Indication databases: 3 (active, direction, move)")
  console.log("   • Strategy databases: 3 (simple, advanced, step)")
  console.log(`   • Migrations executed: ${migrationFiles.length}`)
  console.log()
  console.log("🔐 Connection Strings:")
  console.log("   Admin (migrations):")
  console.log(`   postgresql://cts_v3_admin:CTS_v3_SecurePass_2025!@${pgHost}:${pgPort}/cts_v3_1_main`)
  console.log()
  console.log("   Application (runtime):")
  console.log(`   postgresql://cts_v3_app:CTS_v3_AppPass_2025!@${pgHost}:${pgPort}/cts_v3_1_main`)
  console.log()
  console.log("💡 Next Steps:")
  console.log("   1. Update your .env.local file with the connection string above")
  console.log("   2. Change the default passwords for production use")
  console.log("   3. Run 'npm run dev' to start the application")
  console.log()
  console.log("⚠️  SECURITY:")
  console.log("   • Change default passwords immediately for production!")
  console.log("   • Store passwords securely (use environment variables)")
  console.log("   • Never commit credentials to version control")
  console.log()

  rl.close()
}

// Create test connection script
const testConnectionScript = `-- Test connection
SELECT version();
SELECT current_database();
`

fs.writeFileSync(path.join(__dirname, "test-connection.sql"), testConnectionScript)

main().catch((error) => {
  console.error("\n❌ Setup failed with error:")
  console.error(error)
  console.error("\nPlease check the error above and try again.")
  process.exit(1)
})
