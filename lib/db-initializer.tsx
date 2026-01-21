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

    if (process.env.USE_FILE_STORAGE === "true") {
      console.log("[v0] File-based storage mode enabled, skipping database initialization")
      this.isInitialized = true
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
            setTimeout(() => reject(new Error("Connection test timed out")), 5000),
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
            console.error("[v0] The PostgreSQL credentials are incorrect.")
            console.error("[v0] SOLUTION: Switch to SQLite (default) by removing DATABASE_URL")
          } else if (errorMessage.includes("ECONNREFUSED")) {
            console.error("[v0] Error Type: CONNECTION REFUSED")
            console.error("[v0] The PostgreSQL server is not accessible.")
            console.error("[v0] SOLUTION: Using SQLite as fallback")
          } else {
            console.error("[v0] Error Type:", errorMessage)
            console.error("[v0] SOLUTION: Using SQLite/file-based storage")
          }

          console.error("[v0] ==========================================")

          if (dbType === "sqlite") {
            console.log("[v0] SQLite is resilient, continuing with table creation...")
          } else {
            throw new Error("Database connection failed: " + errorMessage)
          }
        }

        try {
          await this.createEssentialTables()
        } catch (error) {
          console.warn("[v0] Failed to create essential tables:", error)
          // For SQLite, continue anyway
          if (dbType !== "sqlite") {
            throw error
          }
        }

        console.log("[v0] Running database migrations...")
        const migrationResult = await DatabaseMigrations.runMigrations()
        console.log(`[v0] Migrations completed: ${migrationResult.message}`)

        console.log(`[v0] ${dbType} database initialized successfully`)
        return true
      } catch (error) {
        console.error(`[v0] Initialization attempt ${attempt} failed:`, error)

        if (attempt === retries) {
          console.error("[v0] ==========================================")
          console.error("[v0] ALL INITIALIZATION ATTEMPTS FAILED")
          console.error("[v0] ==========================================")
          console.error("[v0] SWITCHING TO FILE-BASED STORAGE MODE")
          console.error("[v0] System will use JSON files for data persistence")
          console.error("[v0] ==========================================")
          this.isInitialized = true
          return true
        }
      }
    }

    return false
  }

  private static async createEssentialTables(): Promise<void> {
    const dbType = getDatabaseType()
    console.log(`[v0] Running master initialization script for ${dbType}...`)

    try {
      // Try to read and execute the master initialization script
      const fs = await import("fs")
      const path = await import("path")
      const scriptPath = path.join(process.cwd(), "scripts", "000_master_initialization.sql")
      
      if (fs.existsSync(scriptPath)) {
        console.log(`[v0] Found master initialization script at ${scriptPath}`)
        const sql = fs.readFileSync(scriptPath, "utf-8")
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"))
        
        let successCount = 0
        let skipCount = 0
        
        for (const statement of statements) {
          try {
            if (statement.trim()) {
              await execute(statement, [])
              successCount++
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
              skipCount++
            } else {
              console.warn(`[v0] Warning during table creation:`, errorMessage)
            }
          }
        }
        
        console.log(`[v0] Master initialization: ${successCount} statements executed, ${skipCount} skipped`)
      } else {
        console.log(`[v0] Master initialization script not found, using fallback`)
        await this.createFallbackTables(dbType)
      }
    } catch (error) {
      console.error(`[v0] Error loading master script, using fallback:`, error)
      await this.createFallbackTables(dbType)
    }
  }

  private static async createFallbackTables(dbType: string): Promise<void> {
    console.log(`[v0] Creating fallback essential tables for ${dbType}...`)

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
        console.log(`[v0]   ✓ Created: ${name}`)
        successCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("already exists")) {
          console.log(`[v0]   - Skipped: ${name} (already exists)`)
          skipCount++
        } else {
          console.error(`[v0]   ✗ Failed: ${name}:`, errorMessage)
          throw error
        }
      }
    }

    console.log(`[v0] Tables: ${successCount} created, ${skipCount} skipped`)
  }

  static async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }
    return this.initialize()
  }
}
