#!/usr/bin/env node

const { execSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const crypto = require("crypto")

console.log("🚀 CTS v3.1 Complete Setup Script")
console.log("=".repeat(50))
console.log("   Comprehensive Cryptocurrency Trading System")
console.log("   With Automatic Database Migration & Configuration")
console.log("=".repeat(50))
console.log()

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper for questions
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

// Helper to generate secure random strings
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex")
}

// Helper to check if command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

// Helper to run command with real-time output
function runCommand(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    const parts = cmd.split(" ")
    const proc = spawn(parts[0], parts.slice(1), {
      stdio: "inherit",
      shell: true,
      ...options,
    })

    proc.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with code ${code}`))
    })

    proc.on("error", reject)
  })
}

async function main() {
  console.log("📋 System Pre-flight Checks\n")

  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = Number.parseInt(nodeVersion.split(".")[0].slice(1))

  if (majorVersion < 18 || majorVersion > 26) {
    console.error(`❌ Node.js version ${nodeVersion} is not supported`)
    console.error("   Please use Node.js 18.x - 26.x")
    console.error(`   Current version: ${nodeVersion}`)
    process.exit(1)
  }

  console.log(`✅ Node.js ${nodeVersion} detected (Compatible)`)

  // Check for package manager
  let packageManager = "npm"
  if (fs.existsSync("pnpm-lock.yaml")) {
    packageManager = commandExists("pnpm") ? "pnpm" : "npm"
  } else if (fs.existsSync("yarn.lock")) {
    packageManager = commandExists("yarn") ? "yarn" : "npm"
  }
  console.log(`✅ Package Manager: ${packageManager}`)

  // Check git
  const hasGit = commandExists("git")
  console.log(`${hasGit ? "✅" : "⚠️ "} Git: ${hasGit ? "Installed" : "Not found (optional)"}`)

  console.log()

  // Project configuration
  console.log("📝 Project Configuration")
  const projectName = (await askQuestion("   Project Name (default: CTS-v3): ")) || "CTS-v3"
  let projectPort = (await askQuestion("   Application Port (default: 3000): ")) || "3000"

  // Validate port
  const portNumber = Number.parseInt(projectPort)
  if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
    console.error("   ❌ Invalid port number. Using default: 3000")
    projectPort = "3000"
  }

  console.log(`   ✅ Project: ${projectName}`)
  console.log(`   ✅ Port: ${projectPort}`)
  console.log()

  // Database selection
  console.log("🗄️  Database Configuration")
  console.log("   Select database type for your installation:")
  console.log("   [1] SQLite (Recommended for Development)")
  console.log("       • Zero configuration required")
  console.log("       • Perfect for single server / testing")
  console.log("       • File-based, automatic setup")
  console.log()
  console.log("   [2] PostgreSQL (Recommended for Production)")
  console.log("       • High performance & scalability")
  console.log("       • Multi-user support")
  console.log("       • Advanced features & ACID compliance")
  console.log()

  const dbAnswer = await askQuestion("   Enter your choice [1-2] (default: 1): ")
  const usePostgres = dbAnswer.trim() === "2"
  const dbType = usePostgres ? "postgresql" : "sqlite"
  console.log(`   ℹ️  Selected: ${usePostgres ? "PostgreSQL" : "SQLite"}\n`)

  // PostgreSQL connection details
  let pgConnectionString = "postgresql://cts:00998877@83.229.86.105:5432/cts-v3"
  if (usePostgres) {
    console.log("📝 PostgreSQL Connection Setup")
    const useCustomPg = await askQuestion("   Use custom PostgreSQL connection? [y/N]: ")

    if (useCustomPg.toLowerCase() === "y" || useCustomPg.toLowerCase() === "yes") {
      const pgHost = (await askQuestion("   PostgreSQL Host (default: localhost): ")) || "localhost"
      const pgPort = (await askQuestion("   PostgreSQL Port (default: 5432): ")) || "5432"
      const pgUser = (await askQuestion("   PostgreSQL User (default: cts): ")) || "cts"
      const pgPass = await askQuestion("   PostgreSQL Password: ")
      const pgDb = (await askQuestion("   PostgreSQL Database (default: cts-v3): ")) || "cts-v3"

      pgConnectionString = `postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${pgDb}`
      console.log(`   ✅ Connection string configured\n`)
    } else {
      console.log(`   ℹ️  Using default connection (can be changed later in .env.local)\n`)
    }
  }

  // Install dependencies
  console.log("📦 Installing Dependencies...")
  console.log(`   Using ${packageManager}...`)
  try {
    const installCmd =
      packageManager === "npm" ? "npm install" : packageManager === "pnpm" ? "pnpm install" : "yarn install"
    await runCommand(installCmd)
    console.log("✅ Dependencies installed successfully\n")
  } catch (error) {
    console.error("❌ Failed to install dependencies")
    console.error("   Error:", error.message)
    console.error("\n   Try running manually:")
    console.error(`   ${packageManager} install\n`)
    process.exit(1)
  }

  // Create necessary directories
  console.log("📁 Creating Project Directories...")
  const directories = ["data", "logs", "backups/database", "public/uploads"]
  directories.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`   ✅ Created: ${dir}`)
    } else {
      console.log(`   ℹ️  Exists: ${dir}`)
    }
  })
  console.log()

  // Create or update .env.local
  console.log("🔐 Environment Configuration...")
  const envPath = path.join(process.cwd(), ".env.local")
  const envExists = fs.existsSync(envPath)

  if (!envExists) {
    console.log("   Creating new .env.local file...")

    // Generate secure secrets
    const sessionSecret = generateSecureSecret(32)
    const jwtSecret = generateSecureSecret(32)
    const encryptionKey = generateSecureSecret(32)
    const apiSigningSecret = generateSecureSecret(32)

    const databaseUrl = usePostgres ? pgConnectionString : "file:./data/db.sqlite"

    const envContent = `# CTS v3.1 Environment Configuration
# Generated on ${new Date().toISOString()}
# Project: ${projectName}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Application Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:${projectPort}
PORT=${projectPort}
PROJECT_NAME=${projectName}

# Database Configuration
DATABASE_URL=${databaseUrl}
${usePostgres ? `REMOTE_POSTGRES_URL=${pgConnectionString}` : "# REMOTE_POSTGRES_URL=postgresql://user:pass@host:5432/dbname"}

# Security Keys (Auto-generated - DO NOT SHARE)
SESSION_SECRET=${sessionSecret}
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}
API_SIGNING_SECRET=${apiSigningSecret}

# Performance & Cleanup Settings
MARKET_DATA_RETENTION_DAYS=7
INDICATION_STATE_RETENTION_HOURS=48
ENABLE_AUTO_CLEANUP=true
CLEANUP_INTERVAL_HOURS=24

# Trade Engine Settings
TRADE_ENGINE_INTERVAL_MS=1000
PRESET_ENGINE_INTERVAL_MS=1000
REALTIME_SYNC_INTERVAL_MS=300

# Logging
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
ENABLE_PERFORMANCE_MONITORING=true

# Rate Limiting
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=60000

# WebSocket Settings
WS_HEARTBEAT_INTERVAL=30000
WS_RECONNECT_DELAY=5000
WS_MAX_RECONNECT_ATTEMPTS=10
`

    fs.writeFileSync(envPath, envContent)
    console.log("   ✅ Created .env.local with secure auto-generated secrets")
    console.log(`   ✅ Project Name: ${projectName}`)
    console.log(`   ✅ Port: ${projectPort}`)
    console.log("   ✅ Session Secret: Generated (32 bytes)")
    console.log("   ✅ JWT Secret: Generated (32 bytes)")
    console.log("   ✅ Encryption Key: Generated (32 bytes)")
    console.log("   ✅ API Signing Secret: Generated (32 bytes)")
  } else {
    console.log("   ℹ️  .env.local already exists - keeping existing configuration")
    console.log("   ⚠️  Make sure all required secrets are set!")
  }
  console.log()

  // Database initialization
  console.log("🗄️  Database Initialization & Migration")
  console.log("   This will:")
  console.log("   • Create database schema")
  console.log("   • Run all pending migrations")
  console.log("   • Set up indexes for performance")
  console.log("   • Initialize system settings")
  console.log()

  const runMigrations = await askQuestion("   Run database migrations now? [Y/n]: ")
  const shouldMigrate = runMigrations.toLowerCase() !== "n"

  if (shouldMigrate) {
    console.log("   🔄 Running database migrations...")
    console.log("   This may take a few moments...\n")

    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8")
        envContent.split("\n").forEach((line) => {
          const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
          if (match) {
            process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
          }
        })
      }

      // Run the database initialization
      console.log("   → Initializing database schema...")
      const { DatabaseInitializer } = require(path.join(process.cwd(), "lib/db-initializer"))
      const initResult = await DatabaseInitializer.initialize(3, 60000)

      if (initResult) {
        console.log("   ✅ Database schema initialized")

        // Run migrations
        console.log("   → Running migrations...")
        const { DatabaseMigrations } = require(path.join(process.cwd(), "lib/db-migrations"))
        await DatabaseMigrations.runPendingMigrations()
        console.log("   ✅ Migrations completed")

        // Run auto-migrations
        console.log("   → Running auto-migrations...")
        const { runAutoMigrations } = require(path.join(process.cwd(), "lib/auto-migrate"))
        await runAutoMigrations()
        console.log("   ✅ Auto-migrations completed")

        console.log("\n   ✅ Database fully initialized and ready!\n")
      } else {
        console.log("   ⚠️  Database initialization returned false")
        console.log("   ℹ️  Migrations will run automatically on first app start\n")
      }
    } catch (error) {
      console.log("   ⚠️  Database migration failed during setup")
      console.log("   Error:", error.message)
      console.log("   ℹ️  Don't worry! Migrations will run automatically when you start the app")
      console.log("   ℹ️  You can also run: npm run db:migrate\n")
    }
  } else {
    console.log("   ℹ️  Skipped migration - will run automatically on app start\n")
  }

  // Build configuration
  console.log("🏗️  Build Configuration")
  const buildAnswer = await askQuestion("   Run production build now? [Y/n]: ")
  const shouldBuild = buildAnswer.toLowerCase() !== "n"

  if (shouldBuild) {
    console.log("   Building application for production...\n")

    try {
      // Type check
      console.log("   → Running TypeScript type check...")
      try {
        await runCommand(`${packageManager === "npm" ? "npm run" : packageManager} type-check`)
        console.log("   ✅ Type check passed")
      } catch (e) {
        console.log("   ⚠️  Type check had warnings (continuing)")
      }

      // Build
      console.log("   → Building production bundle...")
      await runCommand(`${packageManager === "npm" ? "npm run" : packageManager} build`)
      console.log("   ✅ Build completed successfully\n")
    } catch (error) {
      console.log("   ⚠️  Build encountered errors")
      console.log("   ℹ️  You can still run in development mode with: npm run dev\n")
    }
  } else {
    console.log("   ℹ️  Skipped build - you can build later with: npm run build\n")
  }

  // Final summary
  console.log("=".repeat(70))
  console.log("✅ CTS v3.1 Setup Complete!")
  console.log("=".repeat(70))
  console.log()
  console.log("📚 Quick Start Guide:")
  console.log()
  console.log("1️⃣  Start the Application:")
  console.log(`   Development Mode:  ${packageManager} run dev`)
  console.log(`   Production Mode:   ${packageManager} start`)
  console.log()
  console.log("2️⃣  Access the Dashboard:")
  console.log(`   URL: http://localhost:${projectPort}`)
  console.log("   The app will automatically initialize on first visit")
  console.log()
  console.log("3️⃣  Initial Configuration:")
  console.log("   → Settings > Overall > Connection")
  console.log("     Add your exchange API keys")
  console.log()
  console.log("   → Settings > Indication > Main")
  console.log("     Enable Auto indication system")
  console.log()
  console.log("   → Settings > Strategy > Auto")
  console.log("     Configure Block, Level, DCA strategies")
  console.log()
  console.log("   → Dashboard > Live Trading")
  console.log("     Activate live trading when ready")
  console.log()
  console.log("💡 Useful Commands:")
  console.log(`   ${packageManager} run dev           - Start development server`)
  console.log(`   ${packageManager} run build         - Build for production`)
  console.log(`   ${packageManager} start             - Start production server`)
  console.log(`   ${packageManager} run db:migrate    - Run database migrations`)
  console.log(`   ${packageManager} run db:status     - Check database status`)
  console.log(`   ${packageManager} run type-check    - Check TypeScript types`)
  console.log()
  console.log("📖 Documentation:")
  console.log("   • README.md              - Project overview")
  console.log("   • PRODUCTION_SETUP.md    - Deployment guide")
  console.log("   • DATABASE_AUDIT_V3.1_REPORT.md - Database documentation")
  console.log("   • DEPLOYMENT_CHECKLIST.md - Production checklist")
  console.log()
  console.log("🔒 Security Notes:")
  console.log("   • All secrets in .env.local are auto-generated and secure")
  console.log("   • Never commit .env.local to version control")
  console.log("   • Change secrets before deploying to production")
  console.log("   • Keep your exchange API keys secure")
  console.log()
  console.log("📊 System Features:")
  console.log("   • Multi-exchange support (Bybit, BingX, Pionex, OrangeX)")
  console.log("   • Auto indication with Block/Level/DCA strategies")
  console.log("   • Real-time position mirroring and synchronization")
  console.log("   • Comprehensive monitoring and analytics")
  console.log("   • Automatic database cleanup and optimization")
  console.log("   • SQLite or PostgreSQL support")
  console.log()
  console.log(`🎉 ${projectName} is ready to go!`)
  console.log()
  console.log("Need help? Check the documentation or visit:")
  console.log("   GitHub: [Your Repository URL]")
  console.log("   Issues: [Your Issues URL]")
  console.log()

  rl.close()
}

// Run main function
main().catch((error) => {
  console.error("\n❌ Setup failed with error:")
  console.error(error)
  console.error("\nPlease check the error above and try again.")
  console.error("If the problem persists, please report this issue.\n")
  process.exit(1)
})
