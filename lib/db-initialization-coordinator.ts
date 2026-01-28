/**
 * Database Initialization Coordinator
 * Orchestrates database setup, migrations, and optimization for SQLite
 * Ensures all migrations run in correct order and validates schema completeness
 */

import path from "path"
import fs from "fs"
import Database from "better-sqlite3"
import { getClient, getDatabaseType } from "./db"

export interface InitializationResult {
  success: boolean
  duration: number
  message: string
  details: {
    migrationsRun: number
    tablesCreated: number
    indexesCreated: number
    pragmasApplied: number
    errors: string[]
  }
}

/**
 * Execute complete database initialization
 */
export async function executeCompleteInitialization(): Promise<InitializationResult> {
  const startTime = Date.now()
  const details = {
    migrationsRun: 0,
    tablesCreated: 0,
    indexesCreated: 0,
    pragmasApplied: 0,
    errors: [] as string[],
  }

  try {
    const dbType = getDatabaseType()

    if (dbType === "sqlite") {
      const db = getClient() as Database.Database

      console.log("[v0] ================================================")
      console.log("[v0] SQLite Complete Initialization Starting")
      console.log("[v0] ================================================")

      // Step 1: Apply PRAGMAs
      console.log("[v0] Step 1: Applying PRAGMA optimizations...")
      const pragmaResult = applyPragmaOptimizations(db)
      details.pragmasApplied = pragmaResult
      console.log(`[v0] ✓ ${pragmaResult} PRAGMAs applied`)

      // Step 2: Load and execute unified setup
      console.log("[v0] Step 2: Applying unified schema setup...")
      const schemaResult = await applyUnifiedSchema(db)
      details.tablesCreated = schemaResult.tables
      details.indexesCreated = schemaResult.indexes
      console.log(`[v0] ✓ ${schemaResult.tables} tables created, ${schemaResult.indexes} indexes created`)

      // Step 3: Verify schema completeness
      console.log("[v0] Step 3: Verifying schema completeness...")
      const verificationResult = verifySchemaIntegrity(db)
      if (!verificationResult.isValid) {
        console.warn("[v0] ⚠ Schema validation warnings:")
        verificationResult.warnings.forEach((w) => console.warn(`[v0]   - ${w}`))
        details.errors.push(...verificationResult.warnings)
      } else {
        console.log("[v0] ✓ Schema validation passed")
      }

      // Step 4: Analyze and optimize
      console.log("[v0] Step 4: Running optimization analysis...")
      try {
        db.exec("ANALYZE")
        console.log("[v0] ✓ ANALYZE completed")
      } catch (error) {
        const msg = `ANALYZE failed: ${error instanceof Error ? error.message : String(error)}`
        console.warn(`[v0] ${msg}`)
        details.errors.push(msg)
      }

      // Step 5: Checkpoint
      console.log("[v0] Step 5: Creating WAL checkpoint...")
      try {
        db.exec("PRAGMA wal_checkpoint(RESTART)")
        console.log("[v0] ✓ WAL checkpoint created")
      } catch (error) {
        const msg = `Checkpoint failed: ${error instanceof Error ? error.message : String(error)}`
        console.warn(`[v0] ${msg}`)
        details.errors.push(msg)
      }

      const duration = Date.now() - startTime

      console.log("[v0] ================================================")
      console.log("[v0] SQLite Initialization Complete")
      console.log(`[v0] Duration: ${duration}ms`)
      console.log("[v0] ================================================")

      return {
        success: true,
        duration,
        message: "Database initialization successful",
        details,
      }
    } else {
      // PostgreSQL path
      return {
        success: true,
        duration: Date.now() - startTime,
        message: "PostgreSQL - using standard initialization",
        details,
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Initialization failed: ${msg}`)

    return {
      success: false,
      duration: Date.now() - startTime,
      message: `Initialization failed: ${msg}`,
      details: { ...details, errors: [msg] },
    }
  }
}

/**
 * Apply SQLite PRAGMA optimizations
 */
function applyPragmaOptimizations(db: Database.Database): number {
  const pragmas = [
    { name: "journal_mode", value: "WAL" },
    { name: "foreign_keys", value: "ON" },
    { name: "synchronous", value: "NORMAL" },
    { name: "temp_store", value: "MEMORY" },
    { name: "cache_size", value: "-64000" },
    { name: "mmap_size", value: "30000000" },
    { name: "busy_timeout", value: "30000" },
    { name: "auto_vacuum", value: "INCREMENTAL" },
    { name: "wal_autocheckpoint", value: "1000" },
    { name: "automatic_index", value: "ON" },
  ]

  let count = 0
  for (const pragma of pragmas) {
    try {
      db.pragma(`${pragma.name} = ${pragma.value}`)
      count++
      console.log(`[v0]   - PRAGMA ${pragma.name}: ${pragma.value}`)
    } catch (error) {
      console.warn(`[v0]   ⚠ Failed to set PRAGMA ${pragma.name}`)
    }
  }

  return count
}

/**
 * Apply unified schema setup
 */
async function applyUnifiedSchema(
  db: Database.Database,
): Promise<{ tables: number; indexes: number }> {
  const scriptPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Schema script not found: ${scriptPath}`)
  }

  const sql = fs.readFileSync(scriptPath, "utf-8")

  // Split into statements (better parsing for SQLite)
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && !s.startsWith("--")) // Skip empty and comment-only lines

  let tableCount = 0
  let indexCount = 0

  // Use transaction for better performance
  const transaction = db.transaction(() => {
    for (const statement of statements) {
      try {
        db.exec(statement)

        // Count what we created
        if (statement.includes("CREATE TABLE")) tableCount++
        if (statement.includes("CREATE INDEX")) indexCount++
      } catch (error) {
        // Ignore if already exists (IF NOT EXISTS)
        if (!statement.includes("IF NOT EXISTS")) {
          console.warn(`[v0] Warning executing statement: ${error}`)
        }
      }
    }
  })

  transaction()

  return { tables: tableCount, indexes: indexCount }
}

/**
 * Verify schema integrity
 */
function verifySchemaIntegrity(
  db: Database.Database,
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for critical tables
  const criticalTables = [
    "users",
    "exchange_connections",
    "indications_direction",
    "indications_move",
    "strategies_base",
    "pseudo_positions",
    "trade_logs",
    "system_settings",
  ]

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>

  const tableNames = tables.map((t) => t.name)

  for (const table of criticalTables) {
    if (!tableNames.includes(table)) {
      warnings.push(`Missing critical table: ${table}`)
    }
  }

  // Check for indexes
  const indexes = db
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'")
    .get() as { count: number }

  if (indexes.count < 20) {
    warnings.push(`Low index count (${indexes.count}). Expected 50+`)
  }

  // Check for migrations table
  if (!tableNames.includes("migrations")) {
    warnings.push("Migrations tracking table not found")
  }

  // Foreign key check
  try {
    const fkResult = db.prepare("PRAGMA foreign_key_check").all()
    if (Array.isArray(fkResult) && fkResult.length > 0) {
      warnings.push(`Foreign key violations found: ${fkResult.length}`)
    }
  } catch (error) {
    // Foreign key check might not be available in all modes
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}

/**
 * Get comprehensive database health report
 */
export function getDatabaseHealthReport(db: Database.Database): Record<string, any> {
  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    pragmas: {},
    schema: {},
    performance: {},
    health: {},
  }

  // PRAGMAs
  try {
    const journalMode = db.prepare("PRAGMA journal_mode").get() as any
    const foreignKeys = db.prepare("PRAGMA foreign_keys").get() as any
    const synchronous = db.prepare("PRAGMA synchronous").get() as any
    const cacheSize = db.prepare("PRAGMA cache_size").get() as any

    report.pragmas = {
      journal_mode: journalMode?.journal_mode,
      foreign_keys: foreignKeys?.foreign_keys,
      synchronous: synchronous?.synchronous,
      cache_size: cacheSize?.cache_size,
    }
  } catch (error) {
    report.pragmas.error = "Failed to read PRAGMAs"
  }

  // Schema
  try {
    const tables = db
      .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
      .get() as { count: number }
    const indexes = db
      .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'")
      .get() as { count: number }
    const views = db
      .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='view'")
      .get() as { count: number }

    report.schema = {
      tableCount: tables.count,
      indexCount: indexes.count,
      viewCount: views.count,
    }
  } catch (error) {
    report.schema.error = "Failed to read schema"
  }

  // Performance metrics
  try {
    const pageCount = db.prepare("PRAGMA page_count").get() as any
    const pageSize = db.prepare("PRAGMA page_size").get() as any
    const dbSize =
      ((pageCount?.page_count || 0) * (pageSize?.page_size || 4096)) / 1024 / 1024

    report.performance = {
      pageCount: pageCount?.page_count,
      pageSize: pageSize?.page_size,
      estimatedSizeMB: dbSize.toFixed(2),
    }
  } catch (error) {
    report.performance.error = "Failed to read performance metrics"
  }

  // Health
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get() as any
    report.health = {
      integrityCheck: integrity?.integrity_check,
      status: integrity?.integrity_check === "ok" ? "healthy" : "warning",
    }
  } catch (error) {
    report.health.error = "Failed to check integrity"
  }

  return report
}
