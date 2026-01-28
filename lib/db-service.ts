import fs from "fs"
import path from "path"
import crypto from "crypto"

const DB_DIR = path.join(process.cwd(), ".data")

export interface Connection {
  id: string
  name: string
  exchange: string
  api_type: string
  connection_method: string
  connection_library: string
  api_key: string
  api_secret: string
  api_passphrase?: string
  margin_type: string
  position_mode: string
  is_testnet: boolean
  is_enabled: boolean
  is_active: boolean
  is_predefined: boolean
  last_test_status?: "success" | "failed" | "error" | null
  last_test_timestamp?: string
  last_test_log?: string[]
  created_at: string
  updated_at: string
}

export interface ConnectionLog {
  id: string
  connection_id: string
  event_type: string
  status: string
  message: string
  details?: Record<string, any>
  created_at: string
}

export interface Settings {
  autoTestConnections: boolean
  testIntervalMinutes: number
  notifyOnConnectionFailure: boolean
  logLevel: string
}

// File paths
const CONNECTIONS_FILE = path.join(DB_DIR, "connections.json")
const LOGS_FILE = path.join(DB_DIR, "connection-logs.json")
const SETTINGS_FILE = path.join(DB_DIR, "settings.json")

// Utility functions
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue
    }
    const content = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.error(`[v0] Error reading ${filePath}:`, error)
    return defaultValue
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`[v0] Error writing ${filePath}:`, error)
    throw error
  }
}

function generateId(): string {
  return crypto.randomUUID()
}

// Connection Database Service
export const connectionDb = {
  getAll: async (): Promise<Connection[]> => {
    return readJsonFile(CONNECTIONS_FILE, [])
  },

  getById: async (id: string): Promise<Connection | null> => {
    const connections = await connectionDb.getAll()
    return connections.find((c) => c.id === id) || null
  },

  getByExchange: async (exchange: string): Promise<Connection[]> => {
    const connections = await connectionDb.getAll()
    return connections.filter((c) => c.exchange === exchange)
  },

  getActive: async (): Promise<Connection[]> => {
    const connections = await connectionDb.getAll()
    return connections.filter((c) => c.is_active && c.is_enabled)
  },

  create: async (data: Omit<Connection, "id" | "created_at" | "updated_at">): Promise<Connection> => {
    const connections = await connectionDb.getAll()
    const now = new Date().toISOString()
    const connection: Connection = {
      ...data,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }
    connections.push(connection)
    writeJsonFile(CONNECTIONS_FILE, connections)
    return connection
  },

  update: async (id: string, data: Partial<Connection>): Promise<Connection | null> => {
    const connections = await connectionDb.getAll()
    const index = connections.findIndex((c) => c.id === id)
    if (index === -1) return null

    connections[index] = {
      ...connections[index],
      ...data,
      id: connections[index].id,
      created_at: connections[index].created_at,
      updated_at: new Date().toISOString(),
    }

    writeJsonFile(CONNECTIONS_FILE, connections)
    return connections[index]
  },

  delete: async (id: string): Promise<boolean> => {
    const connections = await connectionDb.getAll()
    const filtered = connections.filter((c) => c.id !== id)
    if (filtered.length === connections.length) return false

    writeJsonFile(CONNECTIONS_FILE, filtered)
    return true
  },

  toggleEnabled: async (id: string): Promise<Connection | null> => {
    const connection = await connectionDb.getById(id)
    if (!connection) return null

    return connectionDb.update(id, { is_enabled: !connection.is_enabled })
  },

  toggleActive: async (id: string): Promise<Connection | null> => {
    const connection = await connectionDb.getById(id)
    if (!connection) return null

    return connectionDb.update(id, { is_active: !connection.is_active })
  },

  recordTestResult: async (id: string, status: "success" | "failed" | "error", log: string[]): Promise<Connection | null> => {
    return connectionDb.update(id, {
      last_test_status: status,
      last_test_timestamp: new Date().toISOString(),
      last_test_log: log,
    })
  },
}

// Connection Logs Database Service
export const connectionLogsDb = {
  getAll: async (): Promise<ConnectionLog[]> => {
    return readJsonFile(LOGS_FILE, [])
  },

  getByConnectionId: async (connectionId: string): Promise<ConnectionLog[]> => {
    const logs = await connectionLogsDb.getAll()
    return logs.filter((l) => l.connection_id === connectionId)
  },

  add: async (connectionId: string, eventType: string, status: string, message: string, details?: Record<string, any>): Promise<ConnectionLog> => {
    const logs = await connectionLogsDb.getAll()
    const log: ConnectionLog = {
      id: generateId(),
      connection_id: connectionId,
      event_type: eventType,
      status,
      message,
      details,
      created_at: new Date().toISOString(),
    }
    logs.push(log)
    writeJsonFile(LOGS_FILE, logs)
    return log
  },

  deleteByConnectionId: async (connectionId: string): Promise<void> => {
    const logs = await connectionLogsDb.getAll()
    const filtered = logs.filter((l) => l.connection_id !== connectionId)
    writeJsonFile(LOGS_FILE, filtered)
  },

  deleteOldLogs: async (daysOld: number = 30): Promise<void> => {
    const logs = await connectionLogsDb.getAll()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const filtered = logs.filter((l) => new Date(l.created_at) > cutoffDate)
    writeJsonFile(LOGS_FILE, filtered)
  },
}

// Settings Database Service
export const settingsDb = {
  get: async (): Promise<Settings> => {
    return readJsonFile(SETTINGS_FILE, {
      autoTestConnections: false,
      testIntervalMinutes: 60,
      notifyOnConnectionFailure: true,
      logLevel: "info",
    })
  },

  update: async (data: Partial<Settings>): Promise<Settings> => {
    const current = await settingsDb.get()
    const updated = { ...current, ...data }
    writeJsonFile(SETTINGS_FILE, updated)
    return updated
  },
}
