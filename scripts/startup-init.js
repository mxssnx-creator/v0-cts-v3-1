#!/usr/bin/env node

/**
 * CTS v3.1 - Startup Initialization Script
 * Ensures database is properly initialized before Next.js starts
 * SKIPPED FOR V0 DEV PREVIEW - Database init deferred to first use
 */

const fs = require("fs")
const path = require("path")

// Skip initialization if we're in dev/preview mode
if (process.env.VERCEL || process.env.NODE_ENV === "production" || process.env.NEXT_PHASE === "phase-production-build") {
  console.log("[Init] Skipping database initialization in dev/preview mode")
  process.exit(0)
}

// Only proceed if we're in a production Node.js environment with better-sqlite3 available
let Database
try {
  Database = require("better-sqlite3")
} catch (e) {
  console.log("[Init] better-sqlite3 not available - database will initialize on first use")
  process.exit(0)
}

console.log("🚀 CTS v3.1 - Pre-Startup Initialization")
console.log("=".repeat(60))

async function initializeDatabase() {
  try {
    // Get database path
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
    const dbDir = path.dirname(dbPath)
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      console.log(`[Init] Creating database directory: ${dbDir}`)
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    // Check if database needs initialization
    const dbExists = fs.existsSync(dbPath)
    const needsInit = !dbExists || fs.statSync(dbPath).size < 1000
    
    if (needsInit) {
      console.log("[Init] New database detected - running full initialization...")
      
      // Open database
      const db = new Database(dbPath)
      db.pragma("journal_mode = WAL")
      db.pragma("foreign_keys = ON")
      
      // Load unified setup SQL
      const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
      
      if (!fs.existsSync(sqlPath)) {
        console.error("[Error] unified_complete_setup.sql not found!")
        process.exit(1)
      }
      
      const sql = fs.readFileSync(sqlPath, "utf-8")
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10)
      
      console.log(`[Init] Executing ${statements.length} SQL statements...`)
      
      let executed = 0
      for (const stmt of statements) {
        try {
          db.prepare(stmt).run()
          executed++
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.warn(`[Warning] ${err.message.substring(0, 80)}`)
          }
        }
      }
      
      console.log(`[Init] ✓ Database initialized: ${executed} statements executed`)
      
      db.close()
    } else {
      console.log("[Init] ✓ Database already initialized")
    }
    
    console.log("=".repeat(60))
    console.log("✓ Pre-startup initialization complete")
    console.log("=".repeat(60))
    console.log()
    
  } catch (error) {
    console.error()
    console.error("=".repeat(60))
    console.error("✗ Pre-startup initialization failed!")
    console.error("=".repeat(60))
    console.error("Error:", error.message)
    console.error()
    process.exit(1)
  }
}

// Run initialization
initializeDatabase().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
