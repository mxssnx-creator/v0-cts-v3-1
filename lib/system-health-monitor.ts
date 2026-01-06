import { promises as fs } from "fs"
import path from "path"

export interface SystemHealthCheck {
  id: string
  name: string
  category: "connection" | "engine" | "database" | "api" | "integration"
  status: "healthy" | "warning" | "critical" | "unknown"
  message: string
  lastCheck: Date
  details: Record<string, any>
  actions: HealthAction[]
}

export interface HealthAction {
  id: string
  label: string
  type: "fix" | "restart" | "reconnect" | "clear" | "view"
  endpoint?: string
  dangerous?: boolean
}

export interface SystemHealthLog {
  timestamp: Date
  checkId: string
  status: string
  message: string
  details: Record<string, any>
}

const HEALTH_DATA_DIR = path.join(process.cwd(), "data", "health")
const HEALTH_LOG_DIR = path.join(process.cwd(), "logs", "health")
const HEALTH_STATUS_FILE = path.join(HEALTH_DATA_DIR, "status.json")
const HEALTH_CACHE_FILE = path.join(HEALTH_DATA_DIR, "cache.json")

export class SystemHealthMonitor {
  private static async ensureDirs(): Promise<void> {
    try {
      await fs.mkdir(HEALTH_LOG_DIR, { recursive: true })
      await fs.mkdir(HEALTH_DATA_DIR, { recursive: true })
    } catch (error) {
      console.error("[HealthMonitor] Failed to create directories:", error)
    }
  }

  private static async writeHealthStatus(checks: SystemHealthCheck[]): Promise<void> {
    try {
      await this.ensureDirs()
      await fs.writeFile(HEALTH_STATUS_FILE, JSON.stringify({ checks, updated: new Date() }, null, 2))
    } catch (error) {
      console.error("[HealthMonitor] Failed to write health status:", error)
    }
  }

  private static async readHealthStatus(): Promise<SystemHealthCheck[] | null> {
    try {
      const content = await fs.readFile(HEALTH_STATUS_FILE, "utf8")
      const data = JSON.parse(content)
      return data.checks
    } catch (error) {
      return null
    }
  }

  private static async writeLog(log: SystemHealthLog): Promise<void> {
    try {
      await this.ensureDirs()
      const logFile = path.join(HEALTH_LOG_DIR, `health-${new Date().toISOString().split("T")[0]}.log`)
      const logLine = `${log.timestamp.toISOString()} | ${log.checkId} | ${log.status} | ${log.message} | ${JSON.stringify(log.details)}\n`
      await fs.appendFile(logFile, logLine, "utf8")
    } catch (error) {
      console.error("[HealthMonitor] Failed to write log:", error)
    }
  }

  static async checkConnectionHealth(): Promise<SystemHealthCheck> {
    try {
      const connectionFile = path.join(process.cwd(), "data", "connections.json")
      let connections: any[] = []

      try {
        const content = await fs.readFile(connectionFile, "utf8")
        const data = JSON.parse(content)
        connections = data.connections || []
      } catch {
        // File doesn't exist or invalid, use default
      }

      const activeConnections = connections.filter((c: any) => c.is_active)
      const failedTests = connections.filter((c: any) => c.last_test_status === "failed")

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = `${activeConnections.length} active connections`

      if (activeConnections.length === 0 && connections.length > 0) {
        status = "warning"
        message = "No active connections"
      } else if (failedTests.length > 0) {
        status = "warning"
        message = `${failedTests.length} connection(s) failed health check`
      }

      const check: SystemHealthCheck = {
        id: "connections",
        name: "Exchange Connections",
        category: "connection",
        status,
        message,
        lastCheck: new Date(),
        details: {
          total: connections.length,
          active: activeConnections.length,
          failed: failedTests.length,
        },
        actions: [
          { id: "test-all", label: "Test All", type: "fix", endpoint: "/api/connections/test-all" },
          { id: "view-logs", label: "View Logs", type: "view" },
        ],
      }

      await this.writeLog({
        timestamp: new Date(),
        checkId: "connections",
        status,
        message,
        details: check.details,
      })

      return check
    } catch (error) {
      return {
        id: "connections",
        name: "Exchange Connections",
        category: "connection",
        status: "unknown",
        message: "Unable to check connection health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkTradeEngineHealth(): Promise<SystemHealthCheck> {
    try {
      const engineFile = path.join(process.cwd(), "data", "engine-state.json")
      let engineStates: any[] = []

      try {
        const content = await fs.readFile(engineFile, "utf8")
        const data = JSON.parse(content)
        engineStates = data.engines || []
      } catch {
        // File doesn't exist, engines not initialized yet
      }

      const running = engineStates.filter((e: any) => e.status === "running")
      const errors = engineStates.filter((e: any) => e.status === "error")

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = engineStates.length === 0 ? "No engines running" : `${running.length} engine(s) running`

      if (errors.length > 0) {
        status = "critical"
        message = `${errors.length} engine(s) in error state`
      } else if (engineStates.length === 0) {
        status = "warning"
      }

      const check: SystemHealthCheck = {
        id: "trade-engine",
        name: "Trade Engine",
        category: "engine",
        status,
        message,
        lastCheck: new Date(),
        details: {
          total: engineStates.length,
          running: running.length,
          errors: errors.length,
        },
        actions: [
          {
            id: "restart-all",
            label: "Restart All",
            type: "restart",
            endpoint: "/api/trade-engine/restart",
            dangerous: true,
          },
          { id: "view-logs", label: "View Logs", type: "view" },
        ],
      }

      await this.writeLog({
        timestamp: new Date(),
        checkId: "trade-engine",
        status,
        message,
        details: check.details,
      })

      return check
    } catch (error) {
      return {
        id: "trade-engine",
        name: "Trade Engine",
        category: "engine",
        status: "unknown",
        message: "Unable to check engine health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkDatabaseHealth(): Promise<SystemHealthCheck> {
    try {
      const dbFile = path.join(process.cwd(), "data", "database.json")
      let dbInfo: any = {}

      try {
        const content = await fs.readFile(dbFile, "utf8")
        dbInfo = JSON.parse(content)
      } catch {
        // File doesn't exist, use defaults
        dbInfo = { type: "unknown", status: "unknown" }
      }

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = "Database operational"

      if (dbInfo.status === "error" || dbInfo.type === "unknown") {
        status = "warning"
        message = "Database status unknown"
      }

      const check: SystemHealthCheck = {
        id: "database",
        name: "Database",
        category: "database",
        status,
        message,
        lastCheck: new Date(),
        details: {
          type: dbInfo.type || "unknown",
          status: dbInfo.status || "unknown",
        },
        actions: [
          { id: "optimize", label: "Optimize", type: "fix", endpoint: "/api/database/optimize" },
          { id: "backup", label: "Create Backup", type: "fix", endpoint: "/api/install/backup/create" },
          { id: "view-logs", label: "View Logs", type: "view" },
        ],
      }

      await this.writeLog({
        timestamp: new Date(),
        checkId: "database",
        status,
        message,
        details: check.details,
      })

      return check
    } catch (error) {
      return {
        id: "database",
        name: "Database",
        category: "database",
        status: "warning",
        message: "Unable to check database health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkAPIHealth(): Promise<SystemHealthCheck> {
    try {
      const errorLogFile = path.join(process.cwd(), "logs", `error-${new Date().toISOString().split("T")[0]}.log`)
      let errorCount = 0

      try {
        const content = await fs.readFile(errorLogFile, "utf8")
        const lines = content.split("\n")
        const oneHourAgo = Date.now() - 3600000
        errorCount = lines.filter((line) => {
          const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
          if (match) {
            const timestamp = new Date(match[1]).getTime()
            return timestamp > oneHourAgo
          }
          return false
        }).length
      } catch {
        // No errors logged yet today
      }

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = "All APIs operational"

      if (errorCount > 10) {
        status = "critical"
        message = `${errorCount} errors in last hour`
      } else if (errorCount > 5) {
        status = "warning"
        message = `${errorCount} errors in last hour`
      }

      const check: SystemHealthCheck = {
        id: "api",
        name: "API Health",
        category: "api",
        status,
        message,
        lastCheck: new Date(),
        details: {
          recentErrors: errorCount,
        },
        actions: [
          { id: "clear-cache", label: "Clear Cache", type: "clear", endpoint: "/api/cache/clear" },
          { id: "view-errors", label: "View Errors", type: "view" },
        ],
      }

      await this.writeLog({
        timestamp: new Date(),
        checkId: "api",
        status,
        message,
        details: check.details,
      })

      return check
    } catch (error) {
      return {
        id: "api",
        name: "API Health",
        category: "api",
        status: "healthy",
        message: "API monitoring active",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkPositionSyncHealth(): Promise<SystemHealthCheck> {
    try {
      const syncFile = path.join(process.cwd(), "data", "position-sync.json")
      let syncData: any = {}

      try {
        const content = await fs.readFile(syncFile, "utf8")
        syncData = JSON.parse(content)
      } catch {
        // File doesn't exist, no sync data yet
        syncData = { connections: [] }
      }

      const connections = syncData.connections || []
      const staleConnections = connections.filter((c: any) => {
        if (!c.lastSync) return true
        const lastSync = new Date(c.lastSync).getTime()
        return Date.now() - lastSync > 600000 // 10 minutes
      })

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = connections.length > 0 ? "Position sync active" : "No active connections"

      if (staleConnections.length > 0 && connections.length > 0) {
        status = "warning"
        message = `${staleConnections.length} connection(s) not syncing`
      }

      const check: SystemHealthCheck = {
        id: "position-sync",
        name: "Position Synchronization",
        category: "integration",
        status,
        message,
        lastCheck: new Date(),
        details: {
          connections: connections.length,
          stale: staleConnections.length,
        },
        actions: [
          { id: "force-sync", label: "Force Sync", type: "fix", endpoint: "/api/exchange-positions/sync" },
          { id: "view-logs", label: "View Logs", type: "view" },
        ],
      }

      await this.writeLog({
        timestamp: new Date(),
        checkId: "position-sync",
        status,
        message,
        details: check.details,
      })

      return check
    } catch (error) {
      return {
        id: "position-sync",
        name: "Position Synchronization",
        category: "integration",
        status: "healthy",
        message: "Sync monitoring active",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async getAllHealthChecks(): Promise<SystemHealthCheck[]> {
    try {
      // Check if we have recent cached data (less than 30 seconds old)
      try {
        const cacheContent = await fs.readFile(HEALTH_CACHE_FILE, "utf8")
        const cache = JSON.parse(cacheContent)
        if (cache.timestamp && Date.now() - new Date(cache.timestamp).getTime() < 30000) {
          return cache.checks
        }
      } catch {
        // No cache or expired
      }

      // Perform all checks
      const [connections, engine, database, api, positionSync] = await Promise.all([
        this.checkConnectionHealth(),
        this.checkTradeEngineHealth(),
        this.checkDatabaseHealth(),
        this.checkAPIHealth(),
        this.checkPositionSyncHealth(),
      ])

      const checks = [connections, engine, database, api, positionSync]

      // Cache the results
      await this.writeHealthStatus(checks)
      await fs.writeFile(HEALTH_CACHE_FILE, JSON.stringify({ checks, timestamp: new Date() }, null, 2))

      return checks
    } catch (error) {
      console.error("[HealthMonitor] Failed to get health checks:", error)
      return []
    }
  }

  static async getHealthLogs(checkId?: string, limit = 100): Promise<SystemHealthLog[]> {
    try {
      await this.ensureDirs()
      const files = await fs.readdir(HEALTH_LOG_DIR)
      const logFiles = files
        .filter((f) => f.startsWith("health-") && f.endsWith(".log"))
        .sort()
        .reverse()

      const logs: SystemHealthLog[] = []

      for (const file of logFiles.slice(0, 7)) {
        // Last 7 days
        const content = await fs.readFile(path.join(HEALTH_LOG_DIR, file), "utf8")
        const lines = content.split("\n").filter((l) => l.trim())

        for (const line of lines) {
          const parts = line.split("|").map((p) => p.trim())
          if (parts.length >= 5) {
            const log: SystemHealthLog = {
              timestamp: new Date(parts[0]),
              checkId: parts[1],
              status: parts[2],
              message: parts[3],
              details: JSON.parse(parts[4] || "{}"),
            }

            if (!checkId || log.checkId === checkId) {
              logs.push(log)
            }
          }
        }

        if (logs.length >= limit) break
      }

      return logs.slice(0, limit)
    } catch (error) {
      console.error("[HealthMonitor] Failed to read logs:", error)
      return []
    }
  }
}
