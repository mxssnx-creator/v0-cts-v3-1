/**
 * Database Module - Dev/Preview Safe Version
 * Uses mock database by default, real DB only in production
 * No better-sqlite3 import at module load time
 */

import { Pool } from "./pg-compat"
import path from "path"
import fs from "fs"

// Ensure pg uses pure JavaScript implementation
process.env.NODE_PG_FORCE_NATIVE = "false"

// Safe environment detection - no assumptions
const isProduction = process.env.NODE_ENV === "production"
const isVercelProduction = process.env.VERCEL_ENV === "production"
const shouldUseMockDB = !isProduction && !isVercelProduction

let sqlClient: Pool | null = null
let sqliteClient: any = null
let DATABASE_TYPE: string | null = null

// Mock database - always available, no dependencies
const mockSQLiteClient = {
  prepare: (sql: string) => ({
    run: (...params: any[]) => ({ changes: 0, lastInsertRowid: 0 }),
    get: (...params: any[]) => undefined,
    all: (...params: any[]) => [],
    finalize: () => {},
  }),
  exec: (sql: string) => [],
  pragma: (pragma: string) => ({ value: "" }),
  close: () => {},
}

/**
 * Determine database type from environment
 */
function getDatabaseTypeFromSettings(): string {
  try {
    if (process.env.DATABASE_TYPE) {
      const dbType = process.env.DATABASE_TYPE.toLowerCase()
      if (dbType === "postgresql" || dbType === "postgres") return "postgresql"
      if (dbType === "sqlite") return "sqlite"
    }

    const DATABASE_URL = process.env.DATABASE_URL
    if (DATABASE_URL?.startsWith("postgres")) return "postgresql"

    // Only try to read settings file if we have a safe environment
    if (typeof process !== "undefined" && process.cwd && typeof fs?.existsSync === "function") {
      try {
        const settingsPath = path.join(process.cwd(), "data", "settings.json")
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
          if (settings.database_type === "postgresql") return "postgresql"
        }
      } catch (e) {
        // Silently fail - file system access not available
      }
    }
  } catch (e) {
    // If anything fails, silently continue
  }

  return "sqlite"
}

/**
 * Get database client
 */
function getClient(): any {
  // Use mock database in dev/preview - no native modules
  if (shouldUseMockDB) {
    return mockSQLiteClient
  }

  // Initialize DATABASE_TYPE if not set
  if (DATABASE_TYPE === null) {
    DATABASE_TYPE = getDatabaseTypeFromSettings()
  }

  if (DATABASE_TYPE === "sqlite") {
    if (!sqliteClient) {
      try {
        const Database = require("better-sqlite3")
        const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
        sqliteClient = new Database(dbPath)
        sqliteClient.pragma("journal_mode = WAL")
        console.log("[v0] SQLite database initialized")
      } catch (error) {
        console.warn("[v0] SQLite initialization failed, using mock")
        sqliteClient = mockSQLiteClient
      }
    }
    return sqliteClient
  } else if (DATABASE_TYPE === "postgresql") {
    if (!sqlClient) {
      try {
        sqlClient = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          native: false,
        })
        console.log("[v0] PostgreSQL database initialized")
      } catch (error) {
        console.warn("[v0] PostgreSQL initialization failed, using mock")
        return mockSQLiteClient
      }
    }
    return sqlClient
  }

  return mockSQLiteClient
}

/**
 * Execute query and return rows
 */
export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    const client = getClient()

    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.all(...params)
      return result as T[]
    } else {
      const result = await (client as Pool).query(queryText, params)
      return result.rows as unknown as T[]
    }
  } catch (error) {
    console.error("[v0] Query error:", error)
    return []
  }
}

/**
 * Execute query and return single row
 */
export async function queryOne<T = any>(queryText: string, params: any[] = []): Promise<T | null> {
  try {
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    const client = getClient()

    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.get(...params)
      return (result as T) || null
    } else {
      const result = await (client as Pool).query(queryText, params)
      return (result.rows[0] as T) || null
    }
  } catch (error) {
    console.error("[v0] QueryOne error:", error)
    return null
  }
}

/**
 * Execute insert/update/delete
 */
export async function execute(queryText: string, params: any[] = []): Promise<{ rowCount: number }> {
  try {
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    const client = getClient()

    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.run(...params)
      return { rowCount: result.changes }
    } else {
      const result = await (client as Pool).query(queryText, params)
      return { rowCount: result.rowCount || 0 }
    }
  } catch (error) {
    console.error("[v0] Execute error:", error)
    return { rowCount: 0 }
  }
}

/**
 * Insert and return the inserted row
 */
export async function insertReturning<T = any>(queryText: string, params: any[] = []): Promise<T | null> {
  try {
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    const client = getClient()

    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.run(...params)
      
      if (result.lastInsertRowid) {
        const tableName = queryText.match(/INTO\s+(\w+)/i)?.[1]
        if (tableName) {
          const selectStmt = (client as any).prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`)
          return selectStmt.get(result.lastInsertRowid) as T
        }
      }
      return null
    } else {
      const result = await (client as Pool).query(queryText, params)
      return (result.rows[0] as T) || null
    }
  } catch (error) {
    console.error("[v0] InsertReturning error:", error)
    return null
  }
}

/**
 * Template literal SQL query helper
 */
export async function sql<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  try {
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    const client = getClient()

    if (DATABASE_TYPE === "sqlite") {
      let queryText = strings[0]
      const params: any[] = []

      for (let i = 0; i < values.length; i++) {
        queryText += "?" + strings[i + 1]
        params.push(values[i])
      }

      const stmt = (client as any).prepare(queryText)
      return stmt.all(...params) as T[]
    } else {
      let queryText = strings[0]
      const params: any[] = []

      for (let i = 0; i < values.length; i++) {
        queryText += `$${i + 1}` + strings[i + 1]
        params.push(values[i])
      }

      const result = await (client as Pool).query(queryText, params)
      return result.rows as unknown as T[]
    }
  } catch (error) {
    console.error("[v0] SQL error:", error)
    return []
  }
}

/**
 * Reset database clients (cleanup)
 */
export function resetDatabaseClients(): void {
  console.log("[v0] Resetting database clients...")
  if (sqlClient) {
    sqlClient.end().catch((error: any) => console.error("[v0] Error closing pool:", error))
    sqlClient = null
  }
  if (sqliteClient) {
    try {
      (sqliteClient as any).close()
    } catch (error) {
      console.error("[v0] Error closing SQLite:", error)
    }
    sqliteClient = null
  }
}

export function getDatabaseType(): string {
  if (DATABASE_TYPE === null) {
    DATABASE_TYPE = getDatabaseTypeFromSettings()
  }
  return DATABASE_TYPE
}

export { getClient }
export const db = getClient
export const getDb = getClient
export default getClient
