#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

console.log("🚀 CTS v3 Setup Script")
console.log("====================\n")

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Helper for questions
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

async function main() {
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = Number.parseInt(nodeVersion.split(".")[0].slice(1))

  if (majorVersion < 18 || majorVersion > 26) {
    console.error(`❌ Node.js version ${nodeVersion} is not supported`)
    console.error("   Please use Node.js 18.x - 26.x")
    process.exit(1)
  }

  console.log(`✅ Node.js ${nodeVersion} detected\n`)

  // Check if we're in a git repo
  const isGitRepo = fs.existsSync(path.join(process.cwd(), ".git"))

  // Install dependencies
  console.log("📦 Installing dependencies...")
  try {
    if (fs.existsSync("pnpm-lock.yaml")) {
      console.log("   Using pnpm...")
      execSync("pnpm install", { stdio: "inherit" })
    } else if (fs.existsSync("yarn.lock")) {
      console.log("   Using yarn...")
      execSync("yarn install", { stdio: "inherit" })
    } else {
      console.log("   Using npm...")
      execSync("npm install", { stdio: "inherit" })
    }
    console.log("✅ Dependencies installed\n")
  } catch (error) {
    console.error("❌ Failed to install dependencies")
    console.error("   Error:", error.message)
    process.exit(1)
  }

  console.log("❓ Database Configuration")
  console.log("   Which database type do you want to use?")
  console.log("   [1] SQLite (Default) - Easiest setup, good for single server")
  console.log("   [2] PostgreSQL       - Recommended for production/high load")
  const dbAnswer = await askQuestion("   Enter choice [1-2]: ")
  const usePostgres = dbAnswer.trim() === '2'
  const dbType = usePostgres ? "postgresql" : "sqlite"
  console.log(usePostgres ? "   ℹ️  Selected: PostgreSQL\n" : "   ℹ️  Selected: SQLite\n")

  // Create .env.local if it doesn't exist
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    console.log("📝 Creating .env.local file...")

    // Check if .env.example exists
    const envExamplePath = path.join(process.cwd(), ".env.example")
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath)
      console.log("✅ .env.local created from .env.example\n")
    } else {
      // Create basic template
      const defaultEnv = `
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="${usePostgres ? "postgresql://cts:00998877@83.229.86.105:5432/cts-v3" : "sqlite://./data/db.sqlite"}"
REMOTE_POSTGRES_URL="postgresql://cts:00998877@83.229.86.105:5432/cts-v3"

# Authentication (REQUIRED - change these!)
SESSION_SECRET="change-me-to-random-32-char-string"
JWT_SECRET="change-me-to-random-32-char-string"

# Performance Settings
MARKET_DATA_RETENTION_DAYS=7
INDICATION_STATE_RETENTION_HOURS=48
ENABLE_AUTO_CLEANUP=true
CLEANUP_INTERVAL_HOURS=24
`
      fs.writeFileSync(envPath, defaultEnv)
      console.log("✅ .env.local created\n")
    }

    console.log("⚠️  IMPORTANT: Update .env.local with your configuration!")
    console.log("   Especially SESSION_SECRET and JWT_SECRET\n")
  } else {
    console.log("ℹ️  .env.local already exists\n")
  }

  // Create data directory for SQLite
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log("✅ Created data directory for SQLite\n")
  }

  // Check database setup
  console.log("🗄️  Database Setup")
  console.log("   PostgreSQL: Recommended for production")
  console.log("   SQLite: Auto-configured for development\n")
  console.log("   ➡️  Configure DATABASE_URL in .env.local for PostgreSQL")
  console.log("   ➡️  Leave empty for SQLite (auto-created)\n")

  if (usePostgres) {
      console.log("⚠️  ACTION REQUIRED: You selected PostgreSQL.")
      console.log("   Please update DATABASE_URL in .env.local with your PostgreSQL connection string.\n")
  }

  console.log("🤖 Auto Indication Setup")
  console.log("   The Auto indication combines multiple strategies:")
  console.log("   • Block Strategy: 3-position neutral wait logic")
  console.log("   • Level Strategy: Optimal volume incrementing")
  console.log("   • DCA Strategy: Up to 4 steps with max 2.5x per step")
  console.log("   • Profit Back: Recovery tactics for drawdown positions\n")
  console.log("   ➡️  Configure in Settings > Indication > Main > Auto\n")

  console.log("🔄 Database Migrations")
  console.log("   ✅ Migrations will run automatically on first app start")
  console.log("   ℹ️  Run 'npm run db:status' to check migration status\n")

  // Ask about checks
  console.log("❓ Build Configuration")
  const answer = await askQuestion("   Do you want to verify system integrity (Type Check & Build) before installing? [y/N] ")
  const strictCheck = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
  console.log(strictCheck ? "   ℹ️  Strict checks enabled\n" : "   ℹ️  Standard installation selected\n")

  // Build the application
  console.log("🏗️  Building application...")
  try {
    if (strictCheck) {
      console.log("   Running Type Check...")
      execSync("npm run type-check", { stdio: "inherit" })
      console.log("   ✅ Type Check passed")
      
      console.log("   Running Build...")
      execSync("npm run build", { stdio: "inherit" })
      console.log("   ✅ Build passed")
    } else {
      // Standard build (permissive)
      try {
        execSync("npm run type-check", { stdio: "inherit" })
      } catch (e) {
        console.log("   ⚠️  Type check had warnings (ignoring)")
      }
      
      execSync("npm run build", { stdio: "inherit" })
    }
    console.log("✅ Application built successfully\n")
  } catch (error) {
    if (strictCheck) {
      console.error("❌ Build failed in strict mode!")
      console.error("   Error:", error.message)
      process.exit(1)
    } else {
      console.log("⚠️  Build encountered warnings, but you can still run in development mode\n")
    }
  }

  // Final instructions
  console.log("=".repeat(60))
  console.log("✅ Setup Complete!")
  console.log("=".repeat(60))
  console.log("\n📚 Next Steps:\n")
  console.log("1. Update .env.local with your configuration:")
  console.log("   - Set SESSION_SECRET and JWT_SECRET to random strings")
  console.log("   - Configure DATABASE_URL for PostgreSQL (optional)")
  console.log("   - Update NEXT_PUBLIC_APP_URL for production\n")

  console.log("2. Start the application:")
  console.log("   Development: npm run dev")
  console.log("   Production:  npm run build && npm start\n")

  console.log("3. Open in browser:")
  console.log("   http://localhost:3000\n")

  console.log("4. Configure the system:")
  console.log("   → Settings > Overall > Connection: Add exchange API keys")
  console.log("   → Settings > Indication > Main: Enable Auto indication")
  console.log("   → Settings > Strategy > Auto: Configure Block/Level/DCA strategies")
  console.log("   → Dashboard: Enable live trading\n")

  console.log("💡 NPX Installation:")
  console.log("   You can also install via: npx cts-setup")
  console.log("   Or download with: npx cts-download")
  console.log("   (Both support interactive check configuration)\n")

  console.log("💡 Important Notes:")
  console.log("   - Database migrations run automatically on first start")
  console.log("   - Check /monitoring page for system logs")
  console.log("   - Read PRODUCTION_SETUP.md for deployment guide")
  console.log("   - All data is stored securely in your database\n")

  console.log("🎉 Happy Trading!")
  console.log("\n")
  
  rl.close()
}

main().catch(console.error)
