import fs from "fs"
import path from "path"

const DB_DIR = path.join(process.cwd(), ".data")
const MIGRATIONS_DIR = path.join(DB_DIR, "migrations")
const MIGRATIONS_LOG_FILE = path.join(DB_DIR, ".migrations.json")

export interface MigrationFile {
  name: string
  version: number
  executed: boolean
  executedAt?: string
}

export async function ensureDatabaseDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
  }
}

export async function getMigrationsLog(): Promise<MigrationFile[]> {
  try {
    if (!fs.existsSync(MIGRATIONS_LOG_FILE)) {
      return []
    }
    const content = fs.readFileSync(MIGRATIONS_LOG_FILE, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.log("[v0] Could not read migrations log, starting fresh")
    return []
  }
}

export async function recordMigration(name: string, version: number) {
  const log = await getMigrationsLog()
  log.push({
    name,
    version,
    executed: true,
    executedAt: new Date().toISOString(),
  })
  fs.writeFileSync(MIGRATIONS_LOG_FILE, JSON.stringify(log, null, 2))
}

export async function hasMigrationRun(name: string): Promise<boolean> {
  const log = await getMigrationsLog()
  return log.some((m) => m.name === name && m.executed)
}

export const MIGRATIONS = [
  {
    version: 1,
    name: "001-init-connections",
    execute: async () => {
      const connectionsFile = path.join(DB_DIR, "connections.json")
      if (!fs.existsSync(connectionsFile)) {
        fs.writeFileSync(connectionsFile, JSON.stringify([], null, 2))
      }
    },
  },
  {
    version: 2,
    name: "002-init-connection-logs",
    execute: async () => {
      const logsFile = path.join(DB_DIR, "connection-logs.json")
      if (!fs.existsSync(logsFile)) {
        fs.writeFileSync(logsFile, JSON.stringify([], null, 2))
      }
    },
  },
  {
    version: 3,
    name: "003-init-settings",
    execute: async () => {
      const settingsFile = path.join(DB_DIR, "settings.json")
      if (!fs.existsSync(settingsFile)) {
        const defaultSettings = {
          autoTestConnections: false,
          testIntervalMinutes: 60,
          notifyOnConnectionFailure: true,
          logLevel: "info",
        }
        fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2))
      }
    },
  },
]

export async function runMigrations() {
  try {
    console.log("[v0] Starting database migrations...")
    await ensureDatabaseDirectory()

    for (const migration of MIGRATIONS) {
      const hasRun = await hasMigrationRun(migration.name)
      if (!hasRun) {
        console.log(`[v0] Running migration: ${migration.name}`)
        await migration.execute()
        await recordMigration(migration.name, migration.version)
        console.log(`[v0] Migration completed: ${migration.name}`)
      } else {
        console.log(`[v0] Migration already run: ${migration.name}`)
      }
    }

    console.log("[v0] All migrations completed successfully")
  } catch (error) {
    console.error("[v0] Migration error:", error)
    throw error
  }
}
