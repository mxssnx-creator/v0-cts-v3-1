import { Pool } from "./pg-compat"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

process.env.NODE_PG_FORCE_NATIVE = "false"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

function getDatabaseURL(): string | undefined {
  const possibleUrls = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.REMOTE_POSTGRES_URL].filter(
    Boolean,
  )

  for (const url of possibleUrls) {
    if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
      return url
    }
  }

  return undefined
}

const DATABASE_URL = getDatabaseURL()

let sqlClient: Pool | null = null
let sqliteClient: Database.Database | null = null

function getDatabaseTypeFromSettings(): string {
  // Priority: ENV var -> Valid PostgreSQL URL -> Settings file -> Default SQLite

  if (process.env.DATABASE_TYPE) {
    console.log("[DB] Using DATABASE_TYPE from environment:", process.env.DATABASE_TYPE)
    return process.env.DATABASE_TYPE
  }

  if (DATABASE_URL) {
    console.log("[DB] Valid PostgreSQL DATABASE_URL detected, using PostgreSQL")
    console.log("[DB] Database URL:", DATABASE_URL.replace(/:[^:@]+@/, ":****@"))
    return "postgresql"
  }

  try {
    const settingsPath = path.join(process.cwd(), "data", "settings.json")
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
      if (settings.database_type) {
        console.log("[DB] Using database_type from settings file:", settings.database_type)
        return settings.database_type
      }
    }
  } catch (error) {
    console.log("[DB] Could not load database type from settings, using default")
  }

  console.log("[DB] Using default database type: sqlite")
  return "sqlite"
}

const DATABASE_TYPE = getDatabaseTypeFromSettings()

function getClient(): Database.Database | Pool {
  if (isBuildPhase) {
    throw new Error("[DB] Database not available during build phase")
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
        console.error("[DB] Failed to create database directory:", error)
        const tmpDbPath = path.join("/tmp", "cts.db")
        console.log(`[DB] Using temporary database at ${tmpDbPath}`)
        sqliteClient = new Database(tmpDbPath)
        console.log("[DB] SQLite database client initialized successfully (temporary)")
        return sqliteClient
      }

      console.log(`[DB] Initializing SQLite database at ${dbPath}...`)
      sqliteClient = new Database(dbPath)

      sqliteClient.pragma("journal_mode = WAL")
      sqliteClient.pragma("synchronous = NORMAL")
      sqliteClient.pragma("cache_size = 10000")
      sqliteClient.pragma("temp_store = MEMORY")

      console.log("[DB] SQLite database client initialized with optimizations")
    }
    return sqliteClient
  } else if (DATABASE_TYPE === "postgresql" || DATABASE_TYPE === "remote") {
    if (!DATABASE_URL) {
      throw new Error(
        "[DB] PostgreSQL selected but no valid DATABASE_URL found. " +
          "Please set DATABASE_URL with a valid PostgreSQL connection string " +
          "(postgresql://username:password@host:port/database)",
      )
    }

    if (!sqlClient) {
      console.log(`[DB] Initializing PostgreSQL database client...`)
      const connectionString = DATABASE_URL

      try {
        const url = new URL(connectionString)
        console.log("[DB] PostgreSQL connection details:")
        console.log(`  - Host: ${url.hostname}`)
        console.log(`  - Port: ${url.port || 5432}`)
        console.log(`  - Database: ${url.pathname.slice(1)}`)
        console.log(`  - User: ${url.username}`)
        console.log(`  - SSL: ${process.env.NODE_ENV === "production" ? "enabled" : "disabled"}`)
      } catch (err) {
        console.error("[DB] Invalid PostgreSQL connection string format")
        throw new Error("Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database")
      }

      sqlClient = new Pool({
        connectionString,
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        native: false,
      })
      console.log("[DB] PostgreSQL database client initialized successfully")
    }
    return sqlClient
  }

  throw new Error(`[DB] Unsupported database type: ${DATABASE_TYPE}`)
}

export function resetDatabaseClients() {
  console.log("[DB] Resetting database clients...")
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
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[DB] Query:", queryPreview, `(${params.length} params)`)

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
    console.error("[DB] Database query error:", error)
    console.error("[DB] Query:", queryText.substring(0, 100))
    if (process.env.NODE_ENV !== "production") {
      console.error("[DB] Params:", params)
    }
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
    console.error("[DB] Database queryOne error:", error)
    throw error
  }
}

export async function execute(
  queryText: string,
  params: any[] = [],
): Promise<{ rowCount: number; lastInsertRowid?: number }> {
  try {
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[DB] Execute:", queryPreview, `(${params.length} params)`)

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
    console.error("[DB] Database execute error:", error)
    console.error("[DB] Query:", queryText.substring(0, 100))
    if (process.env.NODE_ENV !== "production") {
      console.error("[DB] Params:", params)
    }
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
    console.error("[DB] Database insertReturning error:", error)
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
