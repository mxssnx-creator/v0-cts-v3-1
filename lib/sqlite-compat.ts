/**
 * SQLite Database Compatibility Layer
 * Automatically uses sql.js in preview/browser environments
 * and better-sqlite3 in Node.js environments
 */

import type Database from "better-sqlite3"

// Detect environment
const isNodeEnvironment = typeof window === "undefined" && typeof process !== "undefined"
const isPreviewEnvironment = process.env.NEXT_RUNTIME === "edge" || process.env.NEXT_RUNTIME === "nodejs" === false

let databaseClient: any = null

/**
 * Get or create database client
 * Returns either better-sqlite3 instance (production) or sql.js (preview)
 */
export async function getSQLiteClient(dbPath?: string) {
  if (databaseClient) {
    return databaseClient
  }

  if (!isNodeEnvironment || isPreviewEnvironment) {
    // Use sql.js for browser/preview environments
    console.log("[v0] Using sql.js for preview environment")
    return await initializeSqlJs(dbPath)
  } else {
    // Use better-sqlite3 for Node.js
    console.log("[v0] Using better-sqlite3 for Node.js environment")
    try {
      const Database = require("better-sqlite3")
      const path = require("path")
      const fs = require("fs")

      const dataDir = path.join(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      const finalDbPath = dbPath || path.join(dataDir, "app.db")
      databaseClient = new Database(finalDbPath)

      // Apply PRAGMAs
      databaseClient.pragma("journal_mode = WAL")
      databaseClient.pragma("foreign_keys = ON")
      databaseClient.pragma("synchronous = NORMAL")
      databaseClient.pragma("temp_store = MEMORY")
      databaseClient.pragma("cache_size = -64000")

      console.log("[v0] SQLite database initialized at:", finalDbPath)
      return databaseClient
    } catch (error) {
      console.warn("[v0] Failed to load better-sqlite3, falling back to sql.js:", error)
      return await initializeSqlJs(dbPath)
    }
  }
}

/**
 * Initialize sql.js for preview/browser environments
 */
async function initializeSqlJs(dbPath?: string) {
  try {
    const initSqlJs = require("sql.js")
    const SQL = await initSqlJs()

    // For preview, use memory database
    const db = new SQL.Database()

    // Create a proxy that mimics better-sqlite3 API
    const proxy = {
      prepare: (sql: string) => {
        try {
          const stmt = db.prepare(sql)
          return {
            run: (...params: any[]) => {
              try {
                stmt.bind(params)
                stmt.step()
                stmt.free()
                return { changes: db.getRowsModified() }
              } catch (e) {
                console.warn("[v0] sql.js run error:", e)
                return { changes: 0 }
              }
            },
            all: (...params: any[]) => {
              try {
                stmt.bind(params)
                const results = []
                while (stmt.step()) {
                  results.push(stmt.getAsObject())
                }
                stmt.free()
                return results
              } catch (e) {
                console.warn("[v0] sql.js all error:", e)
                return []
              }
            },
            get: (...params: any[]) => {
              try {
                stmt.bind(params)
                if (stmt.step()) {
                  const result = stmt.getAsObject()
                  stmt.free()
                  return result
                }
                stmt.free()
                return undefined
              } catch (e) {
                console.warn("[v0] sql.js get error:", e)
                return undefined
              }
            },
            finalize: () => {
              stmt.free()
            },
          }
        } catch (error) {
          console.warn("[v0] sql.js prepare error:", error)
          // Return a dummy statement object
          return {
            run: () => ({ changes: 0 }),
            all: () => [],
            get: () => undefined,
            finalize: () => {},
          }
        }
      },
      exec: (sql: string) => {
        try {
          db.run(sql)
          return []
        } catch (error) {
          console.warn("[v0] sql.js exec error:", error)
          return []
        }
      },
      pragma: (pragma: string) => {
        // sql.js doesn't support PRAGMA, but we can safely ignore
        console.log("[v0] PRAGMA ignored in preview:", pragma)
        return { value: "" }
      },
      close: () => {
        db.close()
        databaseClient = null
      },
    }

    console.log("[v0] sql.js database initialized (preview mode)")
    databaseClient = proxy
    return proxy
  } catch (error) {
    console.error("[v0] Failed to initialize sql.js:", error)
    throw new Error("No database driver available")
  }
}

/**
 * Create a mock database for testing
 */
export function createMockDatabase() {
  return {
    prepare: (sql: string) => ({
      run: () => ({ changes: 0 }),
      all: () => [],
      get: () => undefined,
      finalize: () => {},
    }),
    exec: () => [],
    pragma: () => ({ value: "" }),
    close: () => {},
  }
}
