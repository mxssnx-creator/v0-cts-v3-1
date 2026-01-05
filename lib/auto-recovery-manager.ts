import { SystemLogger } from "./system-logger"
import { DatabaseManager } from "./database"
import { positionThresholdManager } from "./position-threshold-manager"
import { promises as fs } from "fs"
import path from "path"

interface RecoveryAction {
  id: string
  type: "database_reconnect" | "service_restart" | "connection_reset" | "cache_clear" | "health_check"
  timestamp: Date
  status: "pending" | "success" | "failed"
  error?: string
  retryCount: number
}

interface ServiceState {
  name: string
  status: "running" | "stopped" | "error" | "recovering"
  lastHeartbeat: Date
  errorCount: number
  restartCount: number
}

const RECOVERY_LOG_DIR = path.join(process.cwd(), "logs", "recovery")
const MAX_RESTART_ATTEMPTS = 3
const RESTART_COOLDOWN = 60000 // 1 minute
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const MAX_ERROR_THRESHOLD = 10

export class AutoRecoveryManager {
  private static instance: AutoRecoveryManager
  private services: Map<string, ServiceState> = new Map()
  private recoveryActions: RecoveryAction[] = []
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isRecovering = false

  private constructor() {
    this.initializeServices()
  }

  public static getInstance(): AutoRecoveryManager {
    if (!AutoRecoveryManager.instance) {
      AutoRecoveryManager.instance = new AutoRecoveryManager()
    }
    return AutoRecoveryManager.instance
  }

  private initializeServices(): void {
    this.services.set("database", {
      name: "Database Connection",
      status: "running",
      lastHeartbeat: new Date(),
      errorCount: 0,
      restartCount: 0,
    })

    this.services.set("position-threshold", {
      name: "Position Threshold Monitor",
      status: "running",
      lastHeartbeat: new Date(),
      errorCount: 0,
      restartCount: 0,
    })

    this.services.set("trade-engine", {
      name: "Trade Engine Coordinator",
      status: "running",
      lastHeartbeat: new Date(),
      errorCount: 0,
      restartCount: 0,
    })
  }

  private async ensureLogDir(): Promise<void> {
    try {
      await fs.mkdir(RECOVERY_LOG_DIR, { recursive: true })
    } catch (error) {
      SystemLogger.logError(error, "system", "AutoRecovery: Failed to create recovery log directory")
    }
  }

  private async logRecoveryAction(action: RecoveryAction): Promise<void> {
    try {
      await this.ensureLogDir()
      const logFile = path.join(RECOVERY_LOG_DIR, `recovery-${new Date().toISOString().split("T")[0]}.log`)
      const logLine = `${action.timestamp.toISOString()} | ${action.type} | ${action.status} | ${action.error || "N/A"} | Retry: ${action.retryCount}\n`
      await fs.appendFile(logFile, logLine, "utf8")
    } catch (error) {
      SystemLogger.logError(error, "system", "AutoRecovery: Failed to log recovery action")
    }
  }

  public async startHealthMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      return
    }

    SystemLogger.logSystem("AutoRecovery", "info", "Starting automatic health monitoring")

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, HEALTH_CHECK_INTERVAL)

    // Run immediately on start
    await this.performHealthChecks()
  }

  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      SystemLogger.logSystem("AutoRecovery", "info", "Stopped automatic health monitoring")
    }
  }

  private async performHealthChecks(): Promise<void> {
    await Promise.all([this.checkDatabaseHealth(), this.checkPositionThresholdHealth(), this.checkTradeEngineHealth()])
  }

  private async checkDatabaseHealth(): Promise<void> {
    const service = this.services.get("database")
    if (!service) return

    try {
      const db = DatabaseManager.getInstance()
      await db.executeQuery("SELECT 1", [])

      // Database is healthy
      service.status = "running"
      service.lastHeartbeat = new Date()
      service.errorCount = 0
    } catch (error) {
      service.errorCount++
      SystemLogger.logError(error, "database", "AutoRecovery: Database health check failed")

      if (service.errorCount >= MAX_ERROR_THRESHOLD) {
        await this.recoverDatabase()
      }
    }
  }

  private async checkPositionThresholdHealth(): Promise<void> {
    const service = this.services.get("position-threshold")
    if (!service) return

    try {
      const stats = await positionThresholdManager.getStats()

      service.status = "running"
      service.lastHeartbeat = new Date()
      service.errorCount = 0
    } catch (error) {
      service.errorCount++
      SystemLogger.logError(error, "system", "AutoRecovery: Position threshold health check failed")

      if (service.errorCount >= MAX_ERROR_THRESHOLD) {
        await this.recoverPositionThreshold()
      }
    }
  }

  private async checkTradeEngineHealth(): Promise<void> {
    const service = this.services.get("trade-engine")
    if (!service) return

    try {
      const { loadSettings } = await import("./file-storage")
      const settings = await loadSettings()

      service.status = "running"
      service.lastHeartbeat = new Date()
      service.errorCount = 0
    } catch (error) {
      service.errorCount++
      SystemLogger.logError(error, "trade-engine", "AutoRecovery: Trade engine health check failed")

      if (service.errorCount >= MAX_ERROR_THRESHOLD) {
        await this.recoverTradeEngine()
      }
    }
  }

  private async recoverDatabase(): Promise<void> {
    if (this.isRecovering) {
      return
    }

    const service = this.services.get("database")
    if (!service) return

    if (service.restartCount >= MAX_RESTART_ATTEMPTS) {
      const error = new Error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached`)
      SystemLogger.logError(error, "database", "AutoRecovery: Database recovery failed")
      service.status = "error"
      return
    }

    this.isRecovering = true
    service.status = "recovering"

    const action: RecoveryAction = {
      id: `db-recover-${Date.now()}`,
      type: "database_reconnect",
      timestamp: new Date(),
      status: "pending",
      retryCount: service.restartCount,
    }

    try {
      SystemLogger.logSystem("AutoRecovery", "info", "Attempting database recovery")

      const { DatabaseInitializer } = await import("./db-initializer")
      const success = await DatabaseInitializer.initialize()

      if (success) {
        action.status = "success"
        service.status = "running"
        service.errorCount = 0
        service.restartCount++
        SystemLogger.logSystem("AutoRecovery", "info", "Database recovery successful")
      } else {
        throw new Error("Database initialization returned false")
      }
    } catch (error) {
      action.status = "failed"
      action.error = String(error)
      service.status = "error"
      service.restartCount++
      SystemLogger.logError(error, "database", "AutoRecovery: Database recovery failed")
    } finally {
      this.isRecovering = false
      this.recoveryActions.push(action)
      await this.logRecoveryAction(action)

      if (action.status === "success") {
        setTimeout(() => {
          if (service) {
            service.restartCount = 0
          }
        }, RESTART_COOLDOWN)
      }
    }
  }

  private async recoverPositionThreshold(): Promise<void> {
    if (this.isRecovering) {
      return
    }

    const service = this.services.get("position-threshold")
    if (!service) return

    if (service.restartCount >= MAX_RESTART_ATTEMPTS) {
      const error = new Error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached`)
      SystemLogger.logError(error, "system", "AutoRecovery: Position threshold recovery failed")
      service.status = "error"
      return
    }

    this.isRecovering = true
    service.status = "recovering"

    const action: RecoveryAction = {
      id: `threshold-recover-${Date.now()}`,
      type: "service_restart",
      timestamp: new Date(),
      status: "pending",
      retryCount: service.restartCount,
    }

    try {
      SystemLogger.logSystem("AutoRecovery", "info", "Attempting position threshold recovery")

      positionThresholdManager.stopMonitoring()
      await positionThresholdManager.startMonitoring(60000)

      action.status = "success"
      service.status = "running"
      service.errorCount = 0
      service.restartCount++
      SystemLogger.logSystem("AutoRecovery", "info", "Position threshold recovery successful")
    } catch (error) {
      action.status = "failed"
      action.error = String(error)
      service.status = "error"
      service.restartCount++
      SystemLogger.logError(error, "system", "AutoRecovery: Position threshold recovery failed")
    } finally {
      this.isRecovering = false
      this.recoveryActions.push(action)
      await this.logRecoveryAction(action)

      if (action.status === "success") {
        setTimeout(() => {
          if (service) {
            service.restartCount = 0
          }
        }, RESTART_COOLDOWN)
      }
    }
  }

  private async recoverTradeEngine(): Promise<void> {
    if (this.isRecovering) {
      return
    }

    const service = this.services.get("trade-engine")
    if (!service) return

    if (service.restartCount >= MAX_RESTART_ATTEMPTS) {
      const error = new Error(`Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached`)
      SystemLogger.logError(error, "trade-engine", "AutoRecovery: Trade engine recovery failed")
      service.status = "error"
      return
    }

    this.isRecovering = true
    service.status = "recovering"

    const action: RecoveryAction = {
      id: `engine-recover-${Date.now()}`,
      type: "service_restart",
      timestamp: new Date(),
      status: "pending",
      retryCount: service.restartCount,
    }

    try {
      SystemLogger.logSystem("AutoRecovery", "info", "Attempting trade engine recovery")

      // Just clear error state and let coordinator reinitialize
      const { loadSettings, saveSettings } = await import("./file-storage")
      const settings = await loadSettings()

      // Clear any error states
      settings.trade_engine_auto_restart = true
      await saveSettings(settings)

      action.status = "success"
      service.status = "running"
      service.errorCount = 0
      service.restartCount++
      SystemLogger.logSystem("AutoRecovery", "info", "Trade engine recovery successful")
    } catch (error) {
      action.status = "failed"
      action.error = String(error)
      service.status = "error"
      service.restartCount++
      SystemLogger.logError(error, "trade-engine", "AutoRecovery: Trade engine recovery failed")
    } finally {
      this.isRecovering = false
      this.recoveryActions.push(action)
      await this.logRecoveryAction(action)

      if (action.status === "success") {
        setTimeout(() => {
          if (service) {
            service.restartCount = 0
          }
        }, RESTART_COOLDOWN)
      }
    }
  }

  public async manualRestart(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName)
    if (!service) {
      return false
    }

    SystemLogger.logSystem("AutoRecovery", "info", `Manual restart requested for ${serviceName}`)

    switch (serviceName) {
      case "database":
        await this.recoverDatabase()
        break
      case "position-threshold":
        await this.recoverPositionThreshold()
        break
      case "trade-engine":
        await this.recoverTradeEngine()
        break
      default:
        return false
    }

    return service.status === "running"
  }

  public getServiceStatus(): Map<string, ServiceState> {
    return this.services
  }

  public getRecoveryHistory(limit = 50): RecoveryAction[] {
    return this.recoveryActions.slice(-limit)
  }

  public async getRecoveryLogs(days = 7): Promise<string[]> {
    try {
      await this.ensureLogDir()
      const files = await fs.readdir(RECOVERY_LOG_DIR)
      const logFiles = files
        .filter((f) => f.startsWith("recovery-") && f.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, days)

      const logs: string[] = []

      for (const file of logFiles) {
        const content = await fs.readFile(path.join(RECOVERY_LOG_DIR, file), "utf8")
        logs.push(...content.split("\n").filter((l) => l.trim()))
      }

      return logs
    } catch (error) {
      SystemLogger.logError(error, "system", "AutoRecovery: Failed to read recovery logs")
      return []
    }
  }
}

export const autoRecoveryManager = AutoRecoveryManager.getInstance()
