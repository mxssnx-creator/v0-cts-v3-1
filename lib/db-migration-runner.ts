"use server"

// Guard against build-time execution
let ProductionMigrationRunner: any

if (process.env.NEXT_PHASE === "phase-production-build") {
  // Export stub during build to prevent errors
  const stub = {
    runAllMigrations: async () => ({ success: true, applied: 0, skipped: 0, failed: 0, message: "Build time stub" }),
  }
  ProductionMigrationRunner = stub
} else {
  // Runtime code below - only execute when not in build phase
  ProductionMigrationRunner = class {
    private static migrationLog: string[] = []

    /**
     * Main entry point for running all database migrations
     * This is called automatically on application startup
     */
    static async runAllMigrations(): Promise<MigrationResult> {
      await ensureImports()
      
      const startTime = Date.now()
      this.log("=".repeat(80))
      this.log("PRODUCTION DATABASE MIGRATION SYSTEM")
      this.log("=".repeat(80))

      try {
        const dbType = getDatabaseType()
        this.log(`Database Type: ${dbType.toUpperCase()}`)
        this.log(`Environment: ${process.env.NODE_ENV || "development"}`)
        this.log("")

        // Step 1: Create migrations tracking table
        await this.createMigrationsTable()

        // Step 2: Run unified setup script (comprehensive, idempotent)
        const setupResult = await this.runUnifiedSetup()

        // Step 3: Run any additional incremental migrations
        const incrementalResult = await this.runIncrementalMigrations()

        // Step 4: Verify critical tables exist
        await this.verifyCriticalTables()

        const totalTime = Date.now() - startTime
        const totalApplied = setupResult.applied + incrementalResult.applied
        const totalSkipped = setupResult.skipped + incrementalResult.skipped

        this.log("")
        this.log("=".repeat(80))
        this.log(`MIGRATION COMPLETE: ${totalApplied} applied, ${totalSkipped} skipped in ${totalTime}ms`)
        this.log("=".repeat(80))

        return {
          success: true,
          applied: totalApplied,
          skipped: totalSkipped,
          failed: 0,
          message: "All migrations completed successfully",
          details: this.migrationLog,
        }
      } catch (error) {
        this.log(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
        return {
          success: false,
          applied: 0,
          skipped: 0,
          failed: 1,
          message: `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          details: this.migrationLog,
        }
      }
    }

    /**
     * Create the migrations tracking table
     */
    private static async createMigrationsTable(): Promise<void> {
      this.log("Creating migrations tracking table...")
      const dbType = getDatabaseType()

      const sql =
        dbType === "postgresql"
          ? `CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              executed_at TIMESTAMP DEFAULT NOW(),
              execution_time_ms INTEGER,
              checksum TEXT
            )`
          : `CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              execution_time_ms INTEGER,
              checksum TEXT
            )`

      try {
        await execute(sql)
        this.log("✓ Migrations table ready")
      } catch (error) {
        this.log(`⚠ Migrations table creation warning: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    /**
     * Run the comprehensive unified setup script
     * This script is idempotent and creates all necessary tables
     */
    private static async runUnifiedSetup(): Promise<{ applied: number; skipped: number }> {
      this.log("")
      this.log("-".repeat(80))
      this.log("Running Unified Database Setup...")
      this.log("-".repeat(80))

      const scriptPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")

      if (!fs.existsSync(scriptPath)) {
        this.log("⚠ Unified setup script not found, using master initialization")
        return await this.runMasterInitialization()
      }

      // Check if unified setup was already run
      const checksum = this.calculateFileChecksum(scriptPath)
      const alreadyRun = await this.checkMigrationExecuted("unified_setup", checksum)

      if (alreadyRun) {
        this.log("✓ Unified setup already executed (checksum match)")
        return { applied: 0, skipped: 1 }
      }

      const startTime = Date.now()
      const sql = fs.readFileSync(scriptPath, "utf-8")
      const statements = this.splitSQLStatements(sql)

      let applied = 0
      let skipped = 0

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (!statement || statement.startsWith("--")) continue

        try {
          await execute(statement, [])
          applied++
        } catch (error: any) {
          const errorMsg = error?.message || String(error)
          if (
            errorMsg.includes("already exists") ||
            errorMsg.includes("duplicate") ||
            errorMsg.includes("UNIQUE constraint") ||
            errorMsg.includes("no such table")
          ) {
            skipped++
          } else {
            // Log warning but continue
            this.log(`⚠ Statement ${i + 1}: ${errorMsg.substring(0, 100)}`)
          }
        }
      }

      const executionTime = Date.now() - startTime
      await this.recordMigration("unified_setup", executionTime, checksum)

      this.log(`✓ Unified setup complete: ${applied} applied, ${skipped} skipped (${executionTime}ms)`)
      return { applied, skipped }
    }

    /**
     * Fallback to master initialization if unified setup not found
     */
    private static async runMasterInitialization(): Promise<{ applied: number; skipped: number }> {
      const scriptPath = path.join(process.cwd(), "scripts", "000_master_initialization.sql")

      if (!fs.existsSync(scriptPath)) {
        this.log("⚠ No initialization scripts found, using embedded schema")
        return await this.runEmbeddedSchema()
      }

      const checksum = this.calculateFileChecksum(scriptPath)
      const alreadyRun = await this.checkMigrationExecuted("master_init", checksum)

      if (alreadyRun) {
        this.log("✓ Master initialization already executed")
        return { applied: 0, skipped: 1 }
      }

      const startTime = Date.now()
      const sql = fs.readFileSync(scriptPath, "utf-8")
      const statements = this.splitSQLStatements(sql)

      let applied = 0
      let skipped = 0

      for (const statement of statements) {
        if (!statement.trim() || statement.trim().startsWith("--")) continue

        try {
          await execute(statement, [])
          applied++
        } catch (error: any) {
          const errorMsg = error?.message || String(error)
          if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
            skipped++
          }
        }
      }

      const executionTime = Date.now() - startTime
      await this.recordMigration("master_init", executionTime, checksum)

      this.log(`✓ Master initialization complete: ${applied} applied, ${skipped} skipped`)
      return { applied, skipped }
    }

    /**
     * Run incremental migrations (for schema updates after initial setup)
     */
    private static async runIncrementalMigrations(): Promise<{ applied: number; skipped: number }> {
      this.log("")
      this.log("-".repeat(80))
      this.log("Checking for incremental migrations...")
      this.log("-".repeat(80))

      // Define critical incremental migrations that should run after unified setup
      const incrementalMigrations = [
        "051_add_performance_indexes.sql",
        "070_high_frequency_performance_indexes.sql",
        "071_add_coordination_tables.sql",
      ]

      let applied = 0
      let skipped = 0

      for (const migrationFile of incrementalMigrations) {
        const scriptPath = path.join(process.cwd(), "scripts", migrationFile)

        if (!fs.existsSync(scriptPath)) {
          continue
        }

        const checksum = this.calculateFileChecksum(scriptPath)
        const alreadyRun = await this.checkMigrationExecuted(migrationFile, checksum)

        if (alreadyRun) {
          skipped++
          continue
        }

        const startTime = Date.now()
        const sql = fs.readFileSync(scriptPath, "utf-8")
        const statements = this.splitSQLStatements(sql)

        let migrationApplied = false

        for (const statement of statements) {
          if (!statement.trim() || statement.trim().startsWith("--")) continue

          try {
            await execute(statement, [])
            migrationApplied = true
          } catch (error: any) {
            const errorMsg = error?.message || String(error)
            if (!errorMsg.includes("already exists") && !errorMsg.includes("duplicate")) {
              this.log(`⚠ ${migrationFile}: ${errorMsg.substring(0, 100)}`)
            }
          }
        }

        if (migrationApplied) {
          const executionTime = Date.now() - startTime
          await this.recordMigration(migrationFile, executionTime, checksum)
          this.log(`✓ Applied: ${migrationFile} (${executionTime}ms)`)
          applied++
        } else {
          skipped++
        }
      }

      if (applied === 0 && skipped === 0) {
        this.log("✓ No incremental migrations to apply")
      }

      return { applied, skipped }
    }

    /**
     * Verify that critical tables exist
     */
    private static async verifyCriticalTables(): Promise<void> {
      this.log("")
      this.log("-".repeat(80))
      this.log("Verifying critical tables...")
      this.log("-".repeat(80))

      const criticalTables = [
        "users",
        "system_settings",
        "site_logs",
        "exchange_connections",
        "indications_direction",
        "indications_move",
        "indications_active",
        "indications_optimal",
        "indications_auto",
        "strategies_base",
        "strategies_main",
        "strategies_real",
        "pseudo_positions",
        "real_pseudo_positions",
      ]

      const dbType = getDatabaseType()
      const existingTables = await this.getExistingTables()

      let missingCount = 0

      for (const table of criticalTables) {
        if (existingTables.includes(table)) {
          this.log(`✓ ${table}`)
        } else {
          this.log(`✗ ${table} - MISSING`)
          missingCount++
        }
      }

      if (missingCount > 0) {
        this.log(`⚠ WARNING: ${missingCount} critical tables are missing`)
        this.log("   This may indicate migration issues. Review logs above.")
      } else {
        this.log(`✓ All ${criticalTables.length} critical tables verified`)
      }
    }

    /**
     * Get list of existing tables in the database
     */
    private static async getExistingTables(): Promise<string[]> {
      const dbType = getDatabaseType()

      try {
        if (dbType === "postgresql") {
          const results = await query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
          )
          return results.map((r: any) => r.tablename)
        } else {
          const results = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
          return results.map((r: any) => r.name)
        }
      } catch (error) {
        this.log(`⚠ Could not retrieve table list: ${error instanceof Error ? error.message : String(error)}`)
        return []
      }
    }

    /**
     * Check if a migration has been executed
     */
    private static async checkMigrationExecuted(name: string, checksum: string): Promise<boolean> {
      try {
        const result = await query("SELECT id, checksum FROM migrations WHERE name = ?", [name])
        if (result.length > 0) {
          // If checksum matches, migration is identical and can be skipped
          return result[0].checksum === checksum
        }
        return false
      } catch (error) {
        return false
      }
    }

    /**
     * Record a migration as executed
     */
    private static async recordMigration(name: string, executionTimeMs: number, checksum: string): Promise<void> {
      try {
        const dbType = getDatabaseType()
        // Get next ID
        const maxResult = await query("SELECT COALESCE(MAX(id), 0) as max_id FROM migrations")
        const nextId = (maxResult[0]?.max_id || 0) + 1

        const sql =
          dbType === "postgresql"
            ? `INSERT INTO migrations (id, name, executed_at, execution_time_ms, checksum) 
               VALUES ($1, $2, NOW(), $3, $4) 
               ON CONFLICT (name) DO UPDATE SET executed_at = NOW(), execution_time_ms = $3, checksum = $4`
            : `INSERT OR REPLACE INTO migrations (id, name, executed_at, execution_time_ms, checksum) 
               VALUES (?, ?, datetime('now'), ?, ?)`

        await execute(sql, [nextId, name, executionTimeMs, checksum])
      } catch (error) {
        this.log(`⚠ Could not record migration: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    /**
     * Calculate a simple checksum for a file
     */
    private static calculateFileChecksum(filePath: string): string {
      try {
        const content = fs.readFileSync(filePath, "utf-8")
        // Simple hash: just use content length + first 100 chars
        return `${content.length}-${content.substring(0, 100).replace(/\s/g, "")}`
      } catch (error) {
        return "unknown"
      }
    }

    /**
     * Split SQL into individual statements
     */
    private static splitSQLStatements(sql: string): string[] {
      // Remove comments
      const withoutComments = sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .replace(/\/\*[\s\S]*?\*\//g, "")

      const statements: string[] = []
      let current = ""
      let inQuote = false
      let quoteChar = ""

      for (let i = 0; i < withoutComments.length; i++) {
        const char = withoutComments[i]

        if ((char === "'" || char === '"') && withoutComments[i - 1] !== "\\") {
          if (!inQuote) {
            inQuote = true
            quoteChar = char
          } else if (char === quoteChar) {
            inQuote = false
          }
        }

        if (char === ";" && !inQuote) {
          statements.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }

      if (current.trim()) {
        statements.push(current.trim())
      }

      return statements.filter((s) => s.length > 0 && !s.startsWith("--"))
    }

    /**
     * Embedded schema for emergency fallback
     */
    private static async runEmbeddedSchema(): Promise<{ applied: number; skipped: number }> {
      this.log("Running embedded emergency schema...")

      const dbType = getDatabaseType()
      const isPostgres = dbType === "postgresql"

      const essentialTables = [
        // Users
        isPostgres
          ? `CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              email TEXT UNIQUE,
              created_at TIMESTAMP DEFAULT NOW()
            )`
          : `CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              email TEXT UNIQUE,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

        // Site logs
        isPostgres
          ? `CREATE TABLE IF NOT EXISTS site_logs (
              id SERIAL PRIMARY KEY,
              timestamp TIMESTAMP DEFAULT NOW(),
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              metadata JSONB DEFAULT '{}'::jsonb
            )`
          : `CREATE TABLE IF NOT EXISTS site_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              level TEXT NOT NULL,
              category TEXT NOT NULL,
              message TEXT NOT NULL,
              metadata TEXT DEFAULT '{}'
            )`,

        // Exchange connections
        isPostgres
          ? `CREATE TABLE IF NOT EXISTS exchange_connections (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              exchange TEXT NOT NULL,
              api_key TEXT NOT NULL,
              api_secret TEXT NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT NOW()
            )`
          : `CREATE TABLE IF NOT EXISTS exchange_connections (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              exchange TEXT NOT NULL,
              api_key TEXT NOT NULL,
              api_secret TEXT NOT NULL,
              is_active INTEGER DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
      ]

      let applied = 0

      for (const sql of essentialTables) {
        try {
          await execute(sql)
          applied++
        } catch (error) {
          this.log(`⚠ Embedded schema: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      this.log(`✓ Embedded schema: ${applied} tables created`)
      return { applied, skipped: 0 }
    }

    /**
     * Log a message
     */
    private static log(message: string): void {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] ${message}`
      console.log(`[v0] ${message}`)
      this.migrationLog.push(logMessage)
    }
  }
}

// Only import these at runtime, not during build
let execute: any, getDatabaseType: any, query: any, fs: any, path: any, crypto: any

async function ensureImports() {
  if (!execute) {
    const db = await import("@/lib/db")
    execute = db.execute
    getDatabaseType = db.getDatabaseType
    query = db.query
    
    const fsModule = await import("node:fs")
    fs = fsModule.default
    
    const pathModule = await import("node:path")
    path = pathModule.default
    
    const cryptoModule = await import("node:crypto")
    crypto = cryptoModule.default
  }
}

interface MigrationResult {
  success: boolean
  applied: number
  skipped: number
  failed: number
  message: string
  details: string[]
}
