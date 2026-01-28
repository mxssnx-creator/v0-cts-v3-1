#!/usr/bin/env node

/**
 * CTS v3.1 - Database Initialization Checker
 * Ensures SQLite database is properly initialized before application starts
 */

const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")

console.log("=".repeat(60))
console.log("CTS v3.1 - Database Pre-Startup Check")
console.log("=".repeat(60))
console.log()

function ensureDatabase() {
  try {
    // Determine database path
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
    const dbDir = path.dirname(dbPath)
    
    console.log(`[Check] Database path: ${dbPath}`)
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      console.log(`[Create] Database directory: ${dbDir}`)
      fs.mkdirSync(dbDir, { recursive: true })
    } else {
      console.log(`[OK] Database directory exists`)
    }
    
    // Check if database file exists
    const dbExists = fs.existsSync(dbPath)
    console.log(`[Check] Database file: ${dbExists ? 'EXISTS' : 'NOT FOUND'}`)
    
    if (!dbExists) {
      console.log(`[Create] Creating new SQLite database...`)
    }
    
    // Open database
    const db = new Database(dbPath)
    
    // Enable pragmas
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    
    console.log(`[OK] Database connection successful`)
    
    // Check critical tables
    const criticalTables = [
      'trade_engine_state',
      'exchange_connections',
      'indications_direction',
      'indications_move',
      'indications_active',
      'preset_types',
      'configuration_sets'
    ]
    
    const existingTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all().map(row => row.name)
    
    console.log(`[Info] Database has ${existingTables.length} tables`)
    
    const missingTables = criticalTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      console.log(`[Warning] Missing critical tables: ${missingTables.join(', ')}`)
      console.log(`[Info] Tables will be created automatically on first request`)
      console.log(`[Info] Or run: npm run db:init`)
    } else {
      console.log(`[OK] All critical tables present`)
    }
    
    // Check row counts for key tables
    if (existingTables.includes('exchange_connections')) {
      const connections = db.prepare("SELECT COUNT(*) as count FROM exchange_connections").get()
      console.log(`[Info] Exchange connections: ${connections.count}`)
    }
    
    if (existingTables.includes('trade_engine_state')) {
      const engines = db.prepare("SELECT COUNT(*) as count FROM trade_engine_state").get()
      console.log(`[Info] Trade engine states: ${engines.count}`)
    }
    
    db.close()
    
    console.log()
    console.log("=".repeat(60))
    console.log("✓ Database check completed successfully")
    console.log("=".repeat(60))
    console.log()
    
    return true
  } catch (error) {
    console.error()
    console.error("=".repeat(60))
    console.error("✗ Database check failed!")
    console.error("=".repeat(60))
    console.error()
    console.error("Error:", error.message)
    console.error()
    console.error("Troubleshooting:")
    console.error("  1. Ensure the 'data' directory has write permissions")
    console.error("  2. Check disk space availability")
    console.error("  3. Verify better-sqlite3 is installed: npm install better-sqlite3")
    console.error()
    
    return false
  }
}

// Run the check
const success = ensureDatabase()
process.exit(success ? 0 : 1)
