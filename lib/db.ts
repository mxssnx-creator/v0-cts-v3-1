import { Pool } from "./pg-compat"
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// Ensure pg uses pure JavaScript implementation
process.env.NODE_PG_FORCE_NATIVE = "false"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

function getDatabaseURL(): string | undefined {
  return process.env.DATABASE_URL
}

const DATABASE_URL = getDatabaseURL()

let sqlClient: Pool | null = null
let sqliteClient: Database.Database | null = null

function getDatabaseTypeFromSettings(): string {
  if (process.env.DATABASE_TYPE) {
    const dbType = process.env.DATABASE_TYPE.toLowerCase()
    if (dbType === "postgresql" || dbType === "sqlite") {
      console.log("[v0] Using DATABASE_TYPE from environment:", dbType)
      return dbType
    }
  }

  if (DATABASE_URL && (DATABASE_URL.startsWith("postgres://") || DATABASE_URL.startsWith("postgresql://"))) {
    console.log("[v0] Valid PostgreSQL DATABASE_URL detected, using PostgreSQL")
    console.log("[v0] Database URL:", DATABASE_URL.replace(/:[^:@]+@/, ":****@")) // Hide password
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

  console.log("[v0] No DATABASE_URL set, using default: SQLite")
  console.log("[v0] SQLite database will be created at: data/cts.db")
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
    if (!DATABASE_URL) {
      throw new Error(
        "[v0] PostgreSQL selected but no valid DATABASE_URL found. " +
          "Please set DATABASE_URL with a valid PostgreSQL connection string " +
          "(postgresql://username:password@host:port/database)",
      )
    }

    if (!sqlClient) {
      console.log(`[v0] Initializing PostgreSQL database client...`)
      const connectionString = DATABASE_URL

      try {
        const url = new URL(connectionString)

        // Validate that we have a proper PostgreSQL URL
        if (!url.protocol.startsWith("postgres")) {
          throw new Error("Invalid protocol. Must be postgresql:// or postgres://")
        }

        if (!url.username || !url.password) {
          throw new Error("Missing username or password in DATABASE_URL")
        }

        if (!url.pathname || url.pathname === "/") {
          throw new Error("Missing database name in DATABASE_URL")
        }

        console.log("[v0] PostgreSQL connection details:")
        console.log(`  - Host: ${url.hostname}`)
        console.log(`  - Port: ${url.port || 5432}`)
        console.log(`  - Database: ${url.pathname.slice(1)}`)
        console.log(`  - User: ${url.username}`)
        console.log(`  - SSL: ${process.env.NODE_ENV === "production" ? "enabled" : "disabled"}`)
      } catch (err) {
        console.error("[v0] Invalid PostgreSQL connection string format")
        console.error("[v0] Error:", err instanceof Error ? err.message : String(err))
        console.error("[v0] Expected format: postgresql://username:password@host:port/database")
        console.error("[v0] Example: postgresql://cts:00998877@83.229.86.105:5432/cts-v3")
        throw new Error("Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database")
      }

      sqlClient = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        native: false,
      })
      console.log("[v0] PostgreSQL database client initialized successfully")
    }
    return sqlClient
  }

  throw new Error(`[v0] Unsupported database type: ${DATABASE_TYPE}`)
}

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[v0] Query:", queryPreview, `(${params.length} params)`)

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
    console.error("[v0] Query:", queryText.substring(0, 100))
    if (process.env.NODE_ENV !== "production") {
      console.error("[v0] Params:", params)
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
    console.error("[v0] Database queryOne error:", error)
    throw error
  }
}

export async function execute(
  queryText: string,
  params: any[] = [],
): Promise<{ rowCount: number; lastInsertRowid?: number }> {
  try {
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[v0] Execute:", queryPreview, `(${params.length} params)`)

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
    console.error("[v0] Query:", queryText.substring(0, 100))
    if (process.env.NODE_ENV !== "production") {
      console.error("[v0] Params:", params)
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

// Dynamic database type tracking (can be changed at runtime)
let currentDatabaseType = DATABASE_TYPE

export async function switchDatabase(newType: string, connectionUrl?: string): Promise<{ success: boolean; message: string; error?: string }> {
  console.log(`[v0] ========================================`)
  console.log(`[v0] SWITCHING DATABASE`)
  console.log(`[v0] From: ${currentDatabaseType}`)
  console.log(`[v0] To: ${newType}`)
  console.log(`[v0] ========================================`)
  
  try {
    // Reset existing connections
    resetDatabaseClients()
    
    // Update environment variable
    process.env.DATABASE_TYPE = newType
    
    // If PostgreSQL, update DATABASE_URL
    if (newType === "postgresql" && connectionUrl) {
      process.env.DATABASE_URL = connectionUrl
      console.log(`[v0] DATABASE_URL updated`)
    }
    
    // Update current type
    currentDatabaseType = newType
    
    // Try to initialize the new connection
    try {
      const client = getClient()
      console.log(`[v0] New ${newType} client initialized successfully`)
      
      return {
        success: true,
        message: `Successfully switched to ${newType}`
      }
    } catch (initError) {
      console.error(`[v0] Failed to initialize ${newType} client:`, initError)
      return {
        success: false,
        message: `Failed to initialize ${newType}`,
        error: initError instanceof Error ? initError.message : String(initError)
      }
    }
  } catch (error) {
    console.error(`[v0] Database switch failed:`, error)
    return {
      success: false,
      message: "Database switch failed",
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function testConnection(): Promise<{ connected: boolean; message: string; error?: string }> {
  try {
    const dbType = getDatabaseType()
    console.log(`[v0] Testing ${dbType} connection...`)
    
    if (dbType === "sqlite") {
      const client = getClient() as Database.Database
      const result = client.prepare("SELECT 1 as test").get() as { test: number }
      if (result && result.test === 1) {
        console.log(`[v0] SQLite connection test successful`)
        return { connected: true, message: "SQLite connected successfully" }
      }
    } else {
      const client = getClient() as Pool
      const result = await client.query("SELECT 1 as test")
      if (result.rows[0]?.test === 1) {
        console.log(`[v0] PostgreSQL connection test successful`)
        return { connected: true, message: "PostgreSQL connected successfully" }
      }
    }
    
    return { connected: false, message: "Connection test returned unexpected result" }
  } catch (error) {
    console.error(`[v0] Connection test failed:`, error)
    return {
      connected: false,
      message: "Connection test failed",
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function getCurrentDatabaseInfo(): { type: string; path?: string; host?: string; database?: string } {
  const dbType = getDatabaseType()
  
  if (dbType === "sqlite") {
    const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
    return { type: "sqlite", path: dbPath }
  } else {
    const url = process.env.DATABASE_URL
    if (url) {
      try {
        const parsed = new URL(url)
        return {
          type: "postgresql",
          host: parsed.hostname,
          database: parsed.pathname.slice(1)
        }
      } catch {
        return { type: "postgresql" }
      }
    }
    return { type: "postgresql" }
  }
}

export const db = getClient
export const getDb = getClient
export { getClient }
export const getDatabaseType = () => currentDatabaseType
export default getClient
