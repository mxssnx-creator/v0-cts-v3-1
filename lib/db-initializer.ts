import { query, execute, getDatabaseType } from "@/lib/db"
import { DatabaseMigrations } from "@/lib/db-migrations"

export class DatabaseInitializer {
  private static isInitializing = false
  private static isInitialized = false
  private static initPromise: Promise<boolean> | null = null

  static async initialize(retries = 3, timeout = 30000): Promise<boolean> {
    if (this.isInitialized) {
      console.log("[v0] Database already initialized, skipping...")
      return true
    }

    if (this.isInitializing && this.initPromise) {
      console.log("[v0] Database initialization in progress, waiting...")
      return this.initPromise
    }

    this.isInitializing = true
    this.initPromise = this.performInitialization(retries, timeout)

    try {
      const result = await this.initPromise
      this.isInitialized = result
      return result
    } finally {
      this.isInitializing = false
    }
  }

  private static async performInitialization(retries: number, timeout: number): Promise<boolean> {
    const dbType = getDatabaseType()
    console.log(`[v0] Initializing ${dbType} database...`)

    if (process.env.USE_FILE_STORAGE === "true" || !process.env.DATABASE_URL) {
      console.log("[v0] Using file-based storage, skipping database initialization")
      return true
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[v0] Database initialization attempt ${attempt}/${retries}`)

        if (attempt > 1) {
          const waitTime = Math.min(2000 * attempt, 10000)
          console.log(`[v0] Waiting ${waitTime}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }

        try {
          console.log("[v0] Testing database connection...")
          const testPromise = query("SELECT 1 as test")
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection test timed out")), 10000),
          )
          await Promise.race([testPromise, timeoutPromise])
          console.log(`[v0] ${dbType} database connection established successfully`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)

          console.error("[v0] ==========================================")
          console.error("[v0] DATABASE CONNECTION FAILED")
          console.error("[v0] ==========================================")

          if (errorMessage.includes("password authentication failed")) {
            console.error("[v0] Error Type: AUTHENTICATION FAILURE")
            console.error("[v0] ")
            console.error("[v0] The PostgreSQL credentials are incorrect.")
            console.error("[v0] ")
            console.error("[v0] SOLUTIONS:")
            console.error("[v0] 1. Verify DATABASE_URL has correct username and password")
            console.error("[v0] 2. Check your DATABASE_URL environment variable format:")
            console.error("[v0]    postgresql://username:password@host:port/database")
            console.error("[v0] 3. OR switch to SQLite (default):")
            console.error("[v0]    Remove or comment out DATABASE_URL in .env.local")
            console.error("[v0]    System will automatically use SQLite")
            console.error("[v0] ")
            console.error("[v0] Current DATABASE_URL format (with hidden password):")
            if (process.env.DATABASE_URL) {
              console.error("[v0]   ", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"))
            } else {
              console.error("[v0]    Not set - using SQLite by default")
            }
          } else if (errorMessage.includes("ECONNREFUSED")) {
            console.error("[v0] Error Type: CONNECTION REFUSED")
            console.error("[v0] ")
            console.error("[v0] The PostgreSQL server is not accessible.")
            console.error("[v0] ")
            console.error("[v0] SOLUTIONS:")
            console.error("[v0] 1. Check if PostgreSQL server is running")
            console.error("[v0] 2. Verify firewall settings allow connection")
            console.error("[v0] 3. Check host and port are correct in DATABASE_URL")
            console.error("[v0] 4. OR switch to SQLite (no server required):")
            console.error("[v0]    Remove or comment out DATABASE_URL in .env.local")
            console.error("[v0]    System will automatically use local SQLite database")
          } else if (errorMessage.includes("getaddrinfo") || errorMessage.includes("ENOTFOUND")) {
            console.error("[v0] Error Type: HOST NOT FOUND")
            console.error("[v0] ")
            console.error("[v0] Cannot resolve the PostgreSQL host address.")
            console.error("[v0] ")
            console.error("[v0] SOLUTIONS:")
            console.error("[v0] 1. Check DATABASE_URL has correct hostname")
            console.error("[v0] 2. Verify internet connection")
            console.error("[v0] 3. Use IP address instead of hostname")
            console.error("[v0] 4. OR switch to SQLite (no network required):")
            console.error("[v0]    Remove DATABASE_URL from .env.local")
          } else {
            console.error("[v0] Error Type: UNKNOWN")
            console.error("[v0] Error Message:", errorMessage)
            console.error("[v0] ")
            console.error("[v0] TIP: Switch to SQLite for easier setup:")
            console.error("[v0]      Remove DATABASE_URL from .env.local")
            console.error("[v0]      SQLite requires no configuration and works out of the box")
          }

          console.error("[v0] ==========================================")

          throw new Error("Database connection failed: " + errorMessage)
        }

        await this.runMigrations(timeout)

        console.log(`[v0] ${dbType} database initialized successfully`)
        return true
      } catch (error) {
        console.error(`[v0] Initialization attempt ${attempt} failed:`, error)

        if (attempt === retries) {
          console.error("[v0] ==========================================")
          console.error("[v0] ALL INITIALIZATION ATTEMPTS FAILED")
          console.error("[v0] ==========================================")
          console.error("[v0] ")
          console.error("[v0] SWITCHING TO FILE-BASED STORAGE MODE")
          console.error("[v0] Connection management will use JSON files")
          console.error("[v0] ")
          console.error("[v0] ==========================================")
          return true
        }
      }
    }

    return false
  }

  private static async runMigrations(timeout: number): Promise<void> {
    console.log("[v0] Running database migrations...")
    await this.createEssentialTables()

    await DatabaseMigrations.runPendingMigrations()

    console.log("[v0] Migrations completed successfully")
  }

  private static async createEssentialTables(): Promise<void> {
    const dbType = getDatabaseType()
    console.log(`[v0] Creating essential tables for ${dbType}...`)

    const essentialTables =
      dbType === "postgresql"
        ? [
            {
              name: "site_logs",
              sql: `CREATE TABLE IF NOT EXISTS site_logs (
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
        )`,
            },
            { name: "site_logs_level_idx", sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level)` },
            {
              name: "site_logs_category_idx",
              sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category)`,
            },
            {
              name: "site_logs_timestamp_idx",
              sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp)`,
            },
          ]
        : [
            {
              name: "site_logs",
              sql: `CREATE TABLE IF NOT EXISTS site_logs (
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
        )`,
            },
            { name: "site_logs_level_idx", sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_level ON site_logs(level)` },
            {
              name: "site_logs_category_idx",
              sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_category ON site_logs(category)`,
            },
            {
              name: "site_logs_timestamp_idx",
              sql: `CREATE INDEX IF NOT EXISTS idx_site_logs_timestamp ON site_logs(timestamp)`,
            },
          ]

    let successCount = 0
    let skipCount = 0

    for (const { name, sql } of essentialTables) {
      try {
        await execute(sql, [])
        console.log(`[v0]   Created: ${name}`)
        successCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("already exists")) {
          console.log(`[v0]   Skipped: ${name} (already exists)`)
          skipCount++
        } else {
          console.error(`[v0]   Failed: ${name}:`, errorMessage)
          throw error
        }
      }
    }

    console.log(`[v0] Tables Summary: ${successCount} created, ${skipCount} skipped`)
  }

  static async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }
    return this.initialize()
  }
}
