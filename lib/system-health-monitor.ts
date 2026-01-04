import { sql } from "./db"
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

const HEALTH_LOG_DIR = path.join(process.cwd(), "logs", "health")

export class SystemHealthMonitor {
  private static async ensureLogDir(): Promise<void> {
    try {
      await fs.mkdir(HEALTH_LOG_DIR, { recursive: true })
    } catch (error) {
      console.error("[HealthMonitor] Failed to create log directory:", error)
    }
  }

  private static async writeLog(log: SystemHealthLog): Promise<void> {
    try {
      await this.ensureLogDir()
      const logFile = path.join(HEALTH_LOG_DIR, `health-${new Date().toISOString().split("T")[0]}.log`)
      const logLine = `${log.timestamp.toISOString()} | ${log.checkId} | ${log.status} | ${log.message} | ${JSON.stringify(log.details)}\n`
      await fs.appendFile(logFile, logLine, "utf8")
    } catch (error) {
      console.error("[HealthMonitor] Failed to write log:", error)
    }
  }

  static async checkConnectionHealth(): Promise<SystemHealthCheck> {
    try {
      const connections = await sql`
        SELECT id, name, exchange, is_enabled, is_active, last_test_status, last_test_at
        FROM exchange_connections
        WHERE is_enabled = true
      `

      const activeConnections = connections.filter((c: any) => c.is_active)
      const failedTests = connections.filter((c: any) => c.last_test_status === "failed")

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = `${activeConnections.length} active connections`

      if (activeConnections.length === 0) {
        status = "critical"
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
          connections: connections.map((c: any) => ({
            name: c.name,
            exchange: c.exchange,
            status: c.last_test_status,
            lastTest: c.last_test_at,
          })),
        },
        actions: [
          { id: "reconnect-all", label: "Reconnect All", type: "reconnect", endpoint: "/api/connections/reconnect" },
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
        status: "critical",
        message: "Failed to check connection health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkTradeEngineHealth(): Promise<SystemHealthCheck> {
    try {
      const engineStates = await sql`
        SELECT connection_id, status, last_heartbeat, error_count
        FROM trade_engine_state
        WHERE status IN ('running', 'paused', 'error')
      `

      const running = engineStates.filter((e: any) => e.status === "running")
      const errors = engineStates.filter((e: any) => e.status === "error")
      const stale = engineStates.filter((e: any) => {
        const lastBeat = new Date(e.last_heartbeat)
        return Date.now() - lastBeat.getTime() > 300000 // 5 minutes
      })

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = `${running.length} engine(s) running`

      if (errors.length > 0) {
        status = "critical"
        message = `${errors.length} engine(s) in error state`
      } else if (stale.length > 0) {
        status = "warning"
        message = `${stale.length} engine(s) not responding`
      }

      const check: SystemHealthCheck = {
        id: "trade-engine",
        name: "Trade Engine",
        category: "engine",
        status,
        message,
        lastCheck: new Date(),
        details: {
          running: running.length,
          errors: errors.length,
          stale: stale.length,
          engines: engineStates.map((e: any) => ({
            connectionId: e.connection_id,
            status: e.status,
            lastHeartbeat: e.last_heartbeat,
            errorCount: e.error_count,
          })),
        },
        actions: [
          {
            id: "restart-all",
            label: "Restart All",
            type: "restart",
            endpoint: "/api/trade-engine/restart",
            dangerous: true,
          },
          { id: "clear-errors", label: "Clear Errors", type: "clear", endpoint: "/api/trade-engine/clear-errors" },
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
        status: "critical",
        message: "Failed to check engine health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkDatabaseHealth(): Promise<SystemHealthCheck> {
    try {
      const dbCheck = await sql`SELECT 1 as health`

      const tables = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `

      const positions = await sql`SELECT COUNT(*) as count FROM pseudo_positions WHERE status = 'active'`
      const orders = await sql`SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'open')`

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = "Database operational"

      if (tables.length < 20) {
        status = "warning"
        message = `Only ${tables.length} tables found`
      }

      const check: SystemHealthCheck = {
        id: "database",
        name: "Database",
        category: "database",
        status,
        message,
        lastCheck: new Date(),
        details: {
          connected: dbCheck.length > 0,
          tableCount: tables.length,
          activePositions: positions[0]?.count || 0,
          pendingOrders: orders[0]?.count || 0,
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
        status: "critical",
        message: "Database connection failed",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [{ id: "reconnect", label: "Reconnect", type: "reconnect", endpoint: "/api/database/reconnect" }],
      }
    }
  }

  static async checkAPIHealth(): Promise<SystemHealthCheck> {
    try {
      const recentErrors = await sql`
        SELECT COUNT(*) as count FROM system_logs
        WHERE level = 'error' AND created_at > NOW() - INTERVAL '1 hour'
      `

      const errorCount = recentErrors[0]?.count || 0

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
        status: "warning",
        message: "Could not check API health",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async checkPositionSyncHealth(): Promise<SystemHealthCheck> {
    try {
      const positions = await sql`
        SELECT connection_id, COUNT(*) as count, MAX(last_sync_at) as last_sync
        FROM exchange_positions
        GROUP BY connection_id
      `

      const stalePositions = positions.filter((p: any) => {
        if (!p.last_sync) return true
        const lastSync = new Date(p.last_sync)
        return Date.now() - lastSync.getTime() > 600000 // 10 minutes
      })

      let status: "healthy" | "warning" | "critical" = "healthy"
      let message = "Position sync active"

      if (stalePositions.length > 0) {
        status = "warning"
        message = `${stalePositions.length} connection(s) not syncing`
      }

      const check: SystemHealthCheck = {
        id: "position-sync",
        name: "Position Synchronization",
        category: "integration",
        status,
        message,
        lastCheck: new Date(),
        details: {
          connections: positions.length,
          stale: stalePositions.length,
          positions: positions.map((p: any) => ({
            connectionId: p.connection_id,
            count: p.count,
            lastSync: p.last_sync,
          })),
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
        status: "warning",
        message: "Could not check sync status",
        lastCheck: new Date(),
        details: { error: String(error) },
        actions: [],
      }
    }
  }

  static async getAllHealthChecks(): Promise<SystemHealthCheck[]> {
    const [connections, engine, database, api, positionSync] = await Promise.all([
      this.checkConnectionHealth(),
      this.checkTradeEngineHealth(),
      this.checkDatabaseHealth(),
      this.checkAPIHealth(),
      this.checkPositionSyncHealth(),
    ])

    return [connections, engine, database, api, positionSync]
  }

  static async getHealthLogs(checkId?: string, limit = 100): Promise<SystemHealthLog[]> {
    try {
      await this.ensureLogDir()
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
