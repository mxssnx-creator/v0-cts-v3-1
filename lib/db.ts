import { Pool } from "./pg-compat"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// Ensure pg uses pure JavaScript implementation
process.env.NODE_PG_FORCE_NATIVE = "false"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.REMOTE_POSTGRES_URL

let sqlClient: Pool | null = null
let sqliteClient: Database.Database | null = null

function getDatabaseTypeFromSettings(): string {
  // Check environment variable first
  if (process.env.DATABASE_TYPE) {
    console.log("[v0] Using DATABASE_TYPE from environment:", process.env.DATABASE_TYPE)
    return process.env.DATABASE_TYPE
  }

  // Check if DATABASE_URL is set
  if (DATABASE_URL) {
    console.log("[v0] DATABASE_URL detected, using PostgreSQL")
    return "postgresql"
  }

  // Try to load from settings file
  try {
    const settingsPath = path.join(process.cwd(), "data", "settings.json")
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
      if (settings.database_type) {
        console.log("[v0] Using database_type from settings file:", settings.database_type)
        return settings.database_type
      }
    }
  } catch (error) {
    console.log("[v0] Could not load database type from settings, using default")
  }

  // Default to sqlite
  console.log("[v0] Using default database type: sqlite")
  return "sqlite"
}

const DATABASE_TYPE = getDatabaseTypeFromSettings()

function getClient(): Database.Database | Pool {
  if (isBuildPhase) {
    throw new Error("[v0] Database not available during build phase")
  }

  if (DATABASE_TYPE === "sqlite") {
    if (!sqliteClient) {
      const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
      const dbDir = path.dirname(dbPath)

      try {
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true })
        }
      } catch (error) {
        console.error("[v0] Failed to create database directory:", error)
        // In serverless environment, use /tmp directory instead
        const tmpDbPath = path.join("/tmp", "cts.db")
        console.log(`[v0] Using temporary database at ${tmpDbPath}`)
        sqliteClient = new Database(tmpDbPath)
        console.log("[v0] SQLite database client initialized successfully (temporary)")
        return sqliteClient
      }

      console.log(`[v0] Initializing SQLite database at ${dbPath}...`)
      sqliteClient = new Database(dbPath)
      console.log("[v0] SQLite database client initialized successfully")
    }
    return sqliteClient
  } else if (DATABASE_TYPE === "postgresql" || DATABASE_TYPE === "remote") {
    // PostgreSQL logic
    if (!DATABASE_URL) {
      console.warn("[v0] PostgreSQL selected but DATABASE_URL not set, check environment variables")
      // For local PostgreSQL, use default connection
      const localDbUrl = process.env.POSTGRES_LOCAL_URL || "postgresql://postgres:postgres@localhost:5432/cts"
      console.log("[v0] Using local PostgreSQL connection:", localDbUrl.replace(/:[^:]*@/, ":****@"))
      // Set for this session
      process.env.DATABASE_URL = localDbUrl
    }

    if (!sqlClient) {
      console.log(`[v0] Initializing PostgreSQL database client...`)
      const connectionString = process.env.DATABASE_URL!
      console.log("[v0] PostgreSQL connection string:", connectionString.replace(/:[^:]*@/, ":****@"))

      sqlClient = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        native: false,
      })
      console.log("[v0] PostgreSQL database client initialized successfully")
    }
    return sqlClient
  }

  throw new Error(`[v0] Unsupported database type: ${DATABASE_TYPE}`)
}

export function resetDatabaseClients() {
  console.log("[v0] Resetting database clients...")
  if (sqlClient) {
    sqlClient.end().catch(console.error)
    sqlClient = null
  }
  if (sqliteClient) {
    sqliteClient.close()
    sqliteClient = null
  }
}

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    console.log("[v0] Executing query:", { query: queryText.substring(0, 100), paramCount: params.length })

    if (DATABASE_TYPE === "sqlite") {
      const client = getClient() as Database.Database
      const stmt = client.prepare(queryText)
      const result = stmt.all(...params)
      return result as T[]
    } else {
      const client = getClient() as Pool
      const result = await client.query(queryText, params)
      return result.rows as unknown as T[]
    }
  } catch (error) {
    console.error("[v0] Database query error:", error)
    console.error("[v0] Query:", queryText)
    console.error("[v0] Params:", params)
    throw error
  }
}

export async function queryOne<T = any>(queryText: string, params: any[] = []): Promise<T | null> {
  try {
    if (DATABASE_TYPE === "sqlite") {
      const client = getClient() as Database.Database
      const stmt = client.prepare(queryText)
      const result = stmt.get(...params)
      return (result as T) || null
    } else {
      const client = getClient() as Pool
      const result = await client.query(queryText, params)
      return (result.rows[0] as T) || null
    }
  } catch (error) {
    console.error("[v0] Database queryOne error:", error)
    throw error
  }
}

export async function execute(
  queryText: string,
  params: any[] = [],
): Promise<{ rowCount: number; lastInsertRowid?: number }> {
  try {
    console.log("[v0] Executing command:", { query: queryText.substring(0, 100), paramCount: params.length })

    if (DATABASE_TYPE === "sqlite") {
      const client = getClient() as Database.Database
      const stmt = client.prepare(queryText)
      const result = stmt.run(...params)
      return {
        rowCount: result.changes,
        lastInsertRowid: result.lastInsertRowid as number,
      }
    } else {
      const client = getClient() as Pool
      const result = await client.query(queryText, params)
      return { rowCount: result.rowCount || 0 }
    }
  } catch (error) {
    console.error("[v0] Database execute error:", error)
    console.error("[v0] Query:", queryText)
    console.error("[v0] Params:", params)
    throw error
  }
}

export async function insertReturning<T = any>(queryText: string, params: any[] = []): Promise<T | null> {
  try {
    if (DATABASE_TYPE === "sqlite") {
      const client = getClient() as Database.Database
      const stmt = client.prepare(queryText)
      const result = stmt.run(...params)

      if (result.lastInsertRowid) {
        const tableName = queryText.match(/INSERT INTO (\w+)/i)?.[1]
        if (tableName) {
          const selectStmt = client.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`)
          return selectStmt.get(result.lastInsertRowid) as T
        }
      }
      return null
    } else {
      const client = getClient() as Pool
      const result = await client.query(queryText, params)
      return (result.rows[0] as T) || null
    }
  } catch (error) {
    console.error("[v0] Database insertReturning error:", error)
    throw error
  }
}

export const sql = async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> => {
  if (DATABASE_TYPE === "sqlite") {
    let queryText = strings[0]
    const params: any[] = []

    for (let i = 0; i < values.length; i++) {
      queryText += "?" + strings[i + 1]
      params.push(values[i])
    }

    const client = getClient() as Database.Database
    const stmt = client.prepare(queryText)
    return stmt.all(...params) as T[]
  } else {
    let queryText = strings[0]
    const params: any[] = []

    for (let i = 0; i < values.length; i++) {
      queryText += `$${i + 1}` + strings[i + 1]
      params.push(values[i])
    }

    const client = getClient() as Pool
    const result = await client.query(queryText, params)
    return result.rows as unknown as T[]
  }
}

export const db = getClient
export const getDb = getClient
export { getClient }
export const getDatabaseType = () => DATABASE_TYPE
export default getClient
