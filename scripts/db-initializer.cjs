const path = require("path")
const fs = require("fs")

// Simple database initializer for setup script
class DatabaseInitializerSetup {
  static async initialize() {
    try {
      // Check if .env.local exists
      const envPath = path.join(process.cwd(), ".env.local")
      if (!fs.existsSync(envPath)) {
        console.log("   ⚠️  No .env.local file found - skipping database initialization")
        return false
      }

      // Load environment variables from .env.local
      const envContent = fs.readFileSync(envPath, "utf8")
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
        if (match) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
        }
      })

      const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL
      if (!databaseUrl) {
        console.log("   ⚠️  No DATABASE_URL found - skipping database initialization")
        return false
      }

      const isPostgres = databaseUrl.startsWith("postgres")
      const dbType = isPostgres ? "PostgreSQL" : "SQLite"

      console.log(`   → Detected ${dbType} database`)

      if (isPostgres) {
        // For PostgreSQL, use @neondatabase/serverless library
        try {
          const { neon } = require("@neondatabase/serverless")
          const sql = neon(databaseUrl)

          console.log("   → Testing PostgreSQL connection...")
          const result = await sql`SELECT 1 as test`
          console.log("   ✅ PostgreSQL connection successful")

          console.log("   → Creating essential tables...")
          await sql`
            CREATE TABLE IF NOT EXISTS site_logs (
              id SERIAL PRIMARY KEY,
              timestamp TIMESTAMP DEFAULT NOW(),
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              context TEXT,
              user_id TEXT,
              connection_id TEXT,
              error_message TEXT,
              error_stack TEXT,
              metadata JSONB DEFAULT '{}'::jsonb,
              created_at TIMESTAMP DEFAULT NOW()
            )
          `
          await sql`CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level)`
          await sql`CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category)`
          await sql`CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp)`

          console.log("   ✅ Essential tables created")
          return true
        } catch (pgError) {
          console.error("   ❌ PostgreSQL initialization failed:", pgError.message)
          if (pgError.message.includes("password authentication failed")) {
            console.error("   → Check your database credentials in .env.local")
          }
          return false
        }
      } else {
        // For SQLite, use better-sqlite3
        try {
          const Database = require("better-sqlite3")
          const dbPath = databaseUrl.replace("file:", "")
          const dbDir = path.dirname(dbPath)

          // Ensure data directory exists
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
          }

          console.log(`   → Opening SQLite database at ${dbPath}`)
          const db = new Database(dbPath)

          console.log("   → Creating essential tables...")
          db.exec(`
            CREATE TABLE IF NOT EXISTS site_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              context TEXT,
              user_id TEXT,
              connection_id TEXT,
              error_message TEXT,
              error_stack TEXT,
              metadata TEXT DEFAULT '{}',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
          db.exec(`CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level)`)
          db.exec(`CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category)`)
          db.exec(`CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp)`)

          db.close()
          console.log("   ✅ Essential tables created")
          return true
        } catch (sqliteError) {
          console.error("   ❌ SQLite initialization failed:", sqliteError.message)
          return false
        }
      }
    } catch (error) {
      console.error("   ❌ Database initialization error:", error.message)
      return false
    }
  }
}

module.exports = { DatabaseInitializer: DatabaseInitializerSetup }
