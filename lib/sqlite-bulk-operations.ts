/**
 * SQLite Bulk Operations Helper
 * Optimized bulk insert, update, and delete operations for SQLite with proper transaction management
 * Uses prepare + transaction batching for maximum performance
 */

import Database from "better-sqlite3"
import { getClient } from "./db"

/**
 * Configuration for bulk operations
 */
export interface BulkOperationConfig {
  batchSize?: number // Default: 1000
  transactionSize?: number // Default: 5000
  verbose?: boolean
}

const DEFAULT_CONFIG: BulkOperationConfig = {
  batchSize: 1000,
  transactionSize: 5000,
  verbose: false,
}

/**
 * Result of bulk operation
 */
export interface BulkOperationResult {
  totalInserted: number
  totalUpdated: number
  totalDeleted: number
  duration: number // milliseconds
  batchesProcessed: number
  errors: string[]
}

/**
 * Bulk insert multiple rows with transaction batching
 * Ideal for inserting 100k+ rows efficiently
 * 
 * @example
 * await bulkInsert("users", 
 *   ["id", "name", "email"],
 *   data,
 *   { batchSize: 5000, transactionSize: 10000 }
 * )
 */
export async function bulkInsert(
  table: string,
  columns: string[],
  rows: any[][],
  config?: BulkOperationConfig,
): Promise<BulkOperationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()
  const errors: string[] = []
  let totalInserted = 0

  try {
    const db = getClient() as Database.Database
    const placeholders = columns.map(() => "?").join(", ")
    const insertQuery = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`
    const stmt = db.prepare(insertQuery)

    // Process in transaction batches
    let transactionBatch = 0

    for (let i = 0; i < rows.length; i += mergedConfig.transactionSize!) {
      const transactionRows = rows.slice(
        i,
        Math.min(i + mergedConfig.transactionSize!, rows.length),
      )

      try {
        const transaction = db.transaction((rows: any[][]) => {
          let count = 0
          for (const row of rows) {
            stmt.run(...row)
            count++
          }
          return count
        })

        const count = transaction(transactionRows)
        totalInserted += count

        if (mergedConfig.verbose) {
          console.log(
            `[v0] Bulk insert batch ${++transactionBatch}: ${count} rows inserted (total: ${totalInserted})`,
          )
        }
      } catch (error) {
        const errorMsg = `Transaction batch error at row ${i}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        if (mergedConfig.verbose) {
          console.error(`[v0] ${errorMsg}`)
        }
        // Continue with next batch
      }
    }

    if (mergedConfig.verbose) {
      console.log(
        `[v0] Bulk insert completed: ${totalInserted} rows in ${Date.now() - startTime}ms`,
      )
    }

    return {
      totalInserted,
      totalUpdated: 0,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: transactionBatch,
      errors,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    errors.push(`Fatal error: ${msg}`)
    console.error(`[v0] Bulk insert failed: ${msg}`)

    return {
      totalInserted,
      totalUpdated: 0,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: 0,
      errors,
    }
  }
}

/**
 * Bulk update with WHERE clause
 * Use for batch updating matching records
 * 
 * @example
 * await bulkUpdate(
 *   "orders",
 *   { status: "completed" },
 *   "id IN (?, ?, ?)",
 *   [1, 2, 3]
 * )
 */
export async function bulkUpdate(
  table: string,
  updates: Record<string, any>,
  whereClause: string,
  whereParams: any[],
  config?: BulkOperationConfig,
): Promise<BulkOperationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()
  const errors: string[] = []

  try {
    const db = getClient() as Database.Database

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ")

    const updateQuery = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`

    try {
      const stmt = db.prepare(updateQuery)
      const result = stmt.run(...Object.values(updates), ...whereParams)

      if (mergedConfig.verbose) {
        console.log(
          `[v0] Bulk update completed: ${result.changes} rows updated in ${Date.now() - startTime}ms`,
        )
      }

      return {
        totalInserted: 0,
        totalUpdated: result.changes,
        totalDeleted: 0,
        duration: Date.now() - startTime,
        batchesProcessed: 1,
        errors,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(msg)
      throw error
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Bulk update failed: ${msg}`)

    return {
      totalInserted: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: 0,
      errors: [msg],
    }
  }
}

/**
 * Bulk delete with WHERE clause
 * Use for batch deleting matching records
 */
export async function bulkDelete(
  table: string,
  whereClause: string,
  whereParams: any[],
  config?: BulkOperationConfig,
): Promise<BulkOperationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()
  const errors: string[] = []

  try {
    const db = getClient() as Database.Database
    const deleteQuery = `DELETE FROM ${table} WHERE ${whereClause}`

    try {
      const stmt = db.prepare(deleteQuery)
      const result = stmt.run(...whereParams)

      if (mergedConfig.verbose) {
        console.log(
          `[v0] Bulk delete completed: ${result.changes} rows deleted in ${Date.now() - startTime}ms`,
        )
      }

      return {
        totalInserted: 0,
        totalUpdated: 0,
        totalDeleted: result.changes,
        duration: Date.now() - startTime,
        batchesProcessed: 1,
        errors,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(msg)
      throw error
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[v0] Bulk delete failed: ${msg}`)

    return {
      totalInserted: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: 0,
      errors: [msg],
    }
  }
}

/**
 * Upsert (insert or update) with duplicate key handling
 * SQLite equivalent of MySQL's ON DUPLICATE KEY UPDATE
 * 
 * @example
 * await bulkUpsert(
 *   "user_cache",
 *   ["user_id", "data"],
 *   rows,
 *   "user_id" // unique key column
 * )
 */
export async function bulkUpsert(
  table: string,
  columns: string[],
  rows: any[][],
  uniqueKeyColumn: string,
  updateColumns?: string[], // columns to update on conflict, default: all except unique key
  config?: BulkOperationConfig,
): Promise<BulkOperationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()
  const errors: string[] = []
  let totalInserted = 0
  let totalUpdated = 0

  try {
    const db = getClient() as Database.Database

    // Determine which columns to update on conflict
    const colsToUpdate = updateColumns || columns.filter((col) => col !== uniqueKeyColumn)

    // Build the UPSERT query with ON CONFLICT clause (SQLite 3.24.0+)
    const placeholders = columns.map(() => "?").join(", ")
    const setClause = colsToUpdate.map((col) => `${col} = excluded.${col}`).join(", ")

    const upsertQuery = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(${uniqueKeyColumn}) DO UPDATE SET ${setClause}
    `

    const stmt = db.prepare(upsertQuery)

    // Process in transaction batches
    let transactionBatch = 0

    for (let i = 0; i < rows.length; i += mergedConfig.transactionSize!) {
      const transactionRows = rows.slice(
        i,
        Math.min(i + mergedConfig.transactionSize!, rows.length),
      )

      try {
        const transaction = db.transaction((rows: any[][]) => {
          let inserted = 0
          let updated = 0

          for (const row of rows) {
            const result = stmt.run(...row)
            // In SQLite, we can check if it was an insert or update by checking result.changes
            // but this doesn't distinguish between insert vs update directly
            inserted += result.changes > 0 ? 1 : 0
          }

          return inserted
        })

        const count = transaction(transactionRows)
        totalInserted += count

        if (mergedConfig.verbose) {
          console.log(
            `[v0] Bulk upsert batch ${++transactionBatch}: ${count} rows processed (total: ${totalInserted})`,
          )
        }
      } catch (error) {
        const errorMsg = `Transaction batch error at row ${i}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        if (mergedConfig.verbose) {
          console.error(`[v0] ${errorMsg}`)
        }
      }
    }

    if (mergedConfig.verbose) {
      console.log(
        `[v0] Bulk upsert completed: ${totalInserted} rows in ${Date.now() - startTime}ms`,
      )
    }

    return {
      totalInserted,
      totalUpdated,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: transactionBatch,
      errors,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    errors.push(`Fatal error: ${msg}`)
    console.error(`[v0] Bulk upsert failed: ${msg}`)

    return {
      totalInserted,
      totalUpdated,
      totalDeleted: 0,
      duration: Date.now() - startTime,
      batchesProcessed: 0,
      errors,
    }
  }
}

/**
 * Get comprehensive database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, any>> {
  try {
    const db = getClient() as Database.Database

    // Get table information
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>

    const stats: Record<string, any> = {
      tables: tables.length,
      tableList: tables.map((t) => t.name),
      indexes: 0,
      totalRows: 0,
      cacheStats: {},
    }

    // Count indexes
    const indexes = db
      .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'")
      .get() as { count: number }
    stats.indexes = indexes.count

    // Get row count for each table
    const tableStats: Record<string, number> = {}
    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as {
          count: number
        }
        tableStats[table.name] = result.count
        stats.totalRows += result.count
      } catch (error) {
        // Ignore errors for individual tables
      }
    }
    stats.tableStats = tableStats

    // Get cache stats
    const cacheInfo = db.prepare("PRAGMA cache_size").get() as any
    stats.cacheStats.cacheSize = cacheInfo?.cache_size || "N/A"

    const pageCount = db.prepare("PRAGMA page_count").get() as any
    const pageSize = db.prepare("PRAGMA page_size").get() as any
    stats.cacheStats.pageCount = pageCount?.page_count
    stats.cacheStats.pageSize = pageSize?.page_size
    stats.cacheStats.estimatedSizeMB =
      ((pageCount?.page_count || 0) * (pageSize?.page_size || 4096)) / 1024 / 1024

    return stats
  } catch (error) {
    console.error(`[v0] Failed to get database stats: ${error}`)
    return { error: "Failed to retrieve stats" }
  }
}

/**
 * Optimize database (VACUUM, ANALYZE, etc.)
 */
export async function optimizeDatabase(): Promise<{ success: boolean; duration: number }> {
  const startTime = Date.now()

  try {
    const db = getClient() as Database.Database

    console.log("[v0] Starting database optimization...")

    // VACUUM - reclaims unused space
    db.exec("VACUUM")
    console.log("[v0] VACUUM completed")

    // ANALYZE - updates query optimizer statistics
    db.exec("ANALYZE")
    console.log("[v0] ANALYZE completed")

    const duration = Date.now() - startTime
    console.log(`[v0] Database optimization completed in ${duration}ms`)

    return { success: true, duration }
  } catch (error) {
    console.error(`[v0] Database optimization failed: ${error}`)
    return { success: false, duration: Date.now() - startTime }
  }
}

/**
 * Create a database checkpoint
 */
export async function checkpoint(): Promise<{ success: boolean; duration: number }> {
  const startTime = Date.now()

  try {
    const db = getClient() as Database.Database

    // Perform WAL checkpoint (if WAL mode is enabled)
    db.exec("PRAGMA wal_checkpoint(RESTART)")

    const duration = Date.now() - startTime
    console.log(`[v0] Database checkpoint completed in ${duration}ms`)

    return { success: true, duration }
  } catch (error) {
    console.error(`[v0] Database checkpoint failed: ${error}`)
    return { success: false, duration: Date.now() - startTime }
  }
}
