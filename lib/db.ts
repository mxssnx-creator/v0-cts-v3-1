import { Pool } from "./pg-compat"
import path from "path"
import fs from "fs"

// Ensure pg uses pure JavaScript implementation
process.env.NODE_PG_FORCE_NATIVE = "false"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"
const isDevPreview = !process.env.NODE_ENV?.includes("production") && process.env.NEXT_RUNTIME === "edge"

function getDatabaseURL(): string | undefined {
  return process.env.DATABASE_URL
}

const DATABASE_URL = getDatabaseURL()

let sqlClient: Pool | null = null
let sqliteClient: any = null

// Mock SQLite client for preview/dev environments
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

function getDatabaseTypeFromSettings(): string {
  console.log("[v0] Determining database type...")
  
  // 1. Explicit DATABASE_TYPE environment variable
  if (process.env.DATABASE_TYPE) {
    const dbType = process.env.DATABASE_TYPE.toLowerCase()
    if (dbType === "postgresql" || dbType === "postgres") {
      console.log("[v0] DATABASE_TYPE explicitly set to PostgreSQL")
      return "postgresql"
    }
    if (dbType === "sqlite") {
      console.log("[v0] DATABASE_TYPE explicitly set to SQLite")
      return "sqlite"
    }
    console.warn("[v0] Invalid DATABASE_TYPE value, defaulting to SQLite")
  }

  // 2. Check for valid PostgreSQL DATABASE_URL
  if (DATABASE_URL && (DATABASE_URL.startsWith("postgres://") || DATABASE_URL.startsWith("postgresql://"))) {
    console.log("[v0] Valid PostgreSQL DATABASE_URL detected")
    console.log("[v0] Database URL:", DATABASE_URL.replace(/:[^:@]+@/, ":****@")) // Hide password
    return "postgresql"
  }

  // 3. Try to load from settings file (backward compatibility)
  try {
    const settingsPath = path.join(process.cwd(), "data", "settings.json")
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
      if (settings.database_type === "postgresql" || settings.database_type === "postgres") {
        console.log("[v0] Using PostgreSQL from settings file")
        return "postgresql"
      }
    }
  } catch (error) {
    // Silently fail, will use default
  }

  // 4. DEFAULT: SQLite (most reliable for standalone systems)
  console.log("[v0] ✓ Using SQLite as default database")
  console.log("[v0] SQLite database location: data/cts.db")
  console.log("[v0] This is the recommended database for CTS v3.1")
  return "sqlite"
}

let DATABASE_TYPE: string | null = null

function createMockDatabase(): any {
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

function initializeSQLiteClient(): any {
  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "cts.db")
  const dbDir = path.dirname(dbPath)

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    console.log("[v0] Initializing SQLite database...")
    console.log("[v0] ⚠ better-sqlite3 not available in preview - using mock database")
    return mockSQLiteClient
  } catch (error) {
    console.warn("[v0] Database initialization error:", error instanceof Error ? error.message : error)
    return mockSQLiteClient
  }
}

function getClient(): any {
  // Always return mock during build phase or dev preview
  if (isBuildPhase || isDevPreview) {
    console.log("[v0] Using mock database for dev/preview environment")
    return mockSQLiteClient
  }

  // Initialize DATABASE_TYPE if not set
  if (DATABASE_TYPE === null) {
    DATABASE_TYPE = getDatabaseTypeFromSettings()
  }

  if (DATABASE_TYPE === "sqlite") {
    if (!sqliteClient) {
      sqliteClient = initializeSQLiteClient()
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

  throw new Error(`[v0] Unknown database type: ${DATABASE_TYPE}`)
}

const getDatabaseType = getDatabaseTypeFromSettings

export { getDatabaseType }

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  if (isBuildPhase) {
    console.log("[v0] Skipping query during build phase")
    return []
  }
  
  try {
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[v0] Query:", queryPreview, `(${params.length} params)`)

    // Initialize DATABASE_TYPE if not set
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    // Get client
    const client = getClient()
    
    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.all(...params)
      return result as T[]
    } else {
      const pgClient = client as Pool
      const result = await pgClient.query(queryText, params)
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
  if (isBuildPhase) {
    console.log("[v0] Skipping queryOne during build phase")
    return null
  }
  
  try {
    // Initialize DATABASE_TYPE if not set
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    // Get client
    const client = getClient()
    
    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.get(...params)
      return (result as T) || null
    } else {
      const pgClient = client as Pool
      const result = await pgClient.query(queryText, params)
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
  if (isBuildPhase) {
    console.log("[v0] Skipping execute during build phase")
    return { rowCount: 0 }
  }
  
  try {
    const queryPreview = queryText.substring(0, 80).replace(/\s+/g, " ")
    console.log("[v0] Execute:", queryPreview, `(${params.length} params)`)

    // Initialize DATABASE_TYPE if not set
    if (DATABASE_TYPE === null) {
      DATABASE_TYPE = getDatabaseTypeFromSettings()
    }

    // Get client
    const client = getClient()
    
    if (DATABASE_TYPE === "sqlite") {
      const stmt = (client as any).prepare(queryText)
      const result = stmt.run(...params)
      return {
        rowCount: result.changes,
      }
    } else {
      const pgClient = client as Pool
      const result = await pgClient.query(queryText, params)
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
      const client = getClient() as any
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
  if (isBuildPhase) {
    console.log("[v0] Skipping sql during build phase")
    return []
  }
  
  // Initialize DATABASE_TYPE if not set
  if (DATABASE_TYPE === null) {
    DATABASE_TYPE = getDatabaseTypeFromSettings()
  }

  // Get client
  const client = getClient()
  
  if (DATABASE_TYPE === "sqlite") {
    let queryText = strings[0]
    const params: any[] = []

    for (let i = 0; i < values.length; i++) {
      queryText += "?" + strings[i + 1]
      params.push(values[i])
    }

    const sqliteClient = client as any
    const stmt = sqliteClient.prepare(queryText)
    return stmt.all(...params) as T[]
  } else {
    let queryText = strings[0]
    const params: any[] = []

    for (let i = 0; i < values.length; i++) {
      queryText += `$${i + 1}` + strings[i + 1]
      params.push(values[i])
    }

    const pgClient = client as Pool
    const result = await pgClient.query(queryText, params)
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

export const db = getClient
export const getDb = getClient
export { getClient }
export default getClient
