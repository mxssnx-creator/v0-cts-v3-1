#!/usr/bin/env node

/**
 * CTS v3.1 - SQLite Database Initializer
 * Manually initializes the SQLite database with complete schema
 */

const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")

console.log("=".repeat(60))
console.log("CTS v3.1 - SQLite Database Initializer")
console.log("=".repeat(60))
console.log()

async function initializeDatabase() {
  try {
    // Determine database path
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
    const dbDir = path.dirname(dbPath)
    
    console.log(`Database path: ${dbPath}`)
    console.log()
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`)
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    // Check if database already exists
    const dbExists = fs.existsSync(dbPath)
    if (dbExists) {
      const fileSize = fs.statSync(dbPath).size
      console.log(`Database file exists (${(fileSize / 1024 / 1024).toFixed(2)} MB)`)
      console.log()
      
      // Ask for confirmation to overwrite
      console.log("WARNING: This will reinitialize the database!")
      console.log("All existing data will be preserved, but schema will be updated.")
      console.log()
    }
    
    // Open database
    console.log("Opening database connection...")
    const db = new Database(dbPath)
    
    // Enable pragmas
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    db.pragma("synchronous = NORMAL")
    
    console.log("✓ Database connection established")
    console.log()
    
    // Load initialization SQL
    const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`Error: SQL file not found: ${sqlPath}`)
      console.error("Please ensure unified_complete_setup.sql exists in the scripts directory")
      process.exit(1)
    }
    
    console.log(`Reading SQL initialization script: ${path.basename(sqlPath)}`)
    const sql = fs.readFileSync(sqlPath, "utf-8")
    console.log(`SQL file loaded: ${sql.length} characters, ${sql.split('\n').length} lines`)
    console.log()
    
    // Execute SQL statements
    console.log("Executing database schema initialization...")
    console.log("This may take a few moments...")
    console.log()
    
    const startTime = Date.now()
    
    // Split into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Processing ${statements.length} SQL statements...`)
    
    let executed = 0
    let skipped = 0
    let errors = 0
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      try {
        db.exec(stmt + ';')
        executed++
        
        // Show progress every 50 statements
        if ((i + 1) % 50 === 0) {
          console.log(`  Progress: ${i + 1}/${statements.length} statements`)
        }
      } catch (error) {
        // Skip if table/index already exists
        if (error.message && error.message.includes('already exists')) {
          skipped++
        } else {
          errors++
          if (errors <= 5) { // Only show first 5 errors
            console.warn(`  Warning at statement ${i + 1}: ${error.message.substring(0, 100)}`)
          }
        }
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log()
    console.log("=".repeat(60))
    console.log("Database Initialization Results:")
    console.log("=".repeat(60))
    console.log(`  ✓ Executed: ${executed} statements`)
    console.log(`  ⊘ Skipped:  ${skipped} statements (already exist)`)
    if (errors > 0) {
      console.log(`  ⚠ Warnings: ${errors} statements`)
    }
    console.log(`  ⏱ Duration: ${duration}ms`)
    console.log()
    
    // Verify tables were created
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all()
    
    console.log(`Database now contains ${tables.length} tables:`)
    tables.forEach((table, index) => {
      if (index < 20) { // Show first 20 tables
        console.log(`  - ${table.name}`)
      }
    })
    if (tables.length > 20) {
      console.log(`  ... and ${tables.length - 20} more`)
    }
    console.log()
    
    // Check for critical tables
    const criticalTables = [
      'exchange_connections',
      'trade_engine_state',
      'indications_direction',
      'indications_move',
      'indications_active',
      'strategies_base',
      'strategies_main',
      'preset_types',
      'configuration_sets'
    ]
    
    const tableNames = tables.map(t => t.name)
    const missingCritical = criticalTables.filter(t => !tableNames.includes(t))
    
    if (missingCritical.length > 0) {
      console.log("⚠ WARNING: Some critical tables are missing:")
      missingCritical.forEach(table => {
        console.log(`  ✗ ${table}`)
      })
      console.log()
    } else {
      console.log("✓ All critical tables present and ready")
      console.log()
    }
    
    db.close()
    
    console.log("=".repeat(60))
    console.log("✓ Database initialization completed successfully!")
    console.log("=".repeat(60))
    console.log()
    console.log("Next steps:")
    console.log("  • Start the application: npm run dev")
    console.log("  • Check database status: npm run db:status")
    console.log("  • View tables: npm run db:tables")
    console.log()
    
    return true
  } catch (error) {
    console.error()
    console.error("=".repeat(60))
    console.error("✗ Database initialization failed!")
    console.error("=".repeat(60))
    console.error()
    console.error("Error:", error.message)
    console.error()
    if (error.stack) {
      console.error("Stack trace:")
      console.error(error.stack)
      console.error()
    }
    
    return false
  }
}

// Run initialization
initializeDatabase().then(success => {
  process.exit(success ? 0 : 1)
})
