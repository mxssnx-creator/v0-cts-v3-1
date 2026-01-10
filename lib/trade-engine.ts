// Re-export TradeEngine class and config from subdirectory for convenient imports
export { TradeEngine, type TradeEngineConfig } from "./trade-engine/trade-engine"

/**
 * GlobalTradeEngineCoordinator class definition
 * Manages trade engine lifecycle, pause/resume, and health monitoring
 */
export class GlobalTradeEngineCoordinator {
  private isPaused = false
  private isRunning = false
  private startTime?: Date
  private stoppedAt?: Date
  private errorMessage?: string
  private mainEngineEnabled = true
  private presetEngineEnabled = true
  private lastHealthCheck?: Date
  private healthStatus: "healthy" | "degraded" | "unhealthy" = "healthy"
  private errorCount = 0
  private successCount = 0
  private lastCycleDuration = 0

  async pause(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Trade engine is not running")
    }

    if (this.isPaused) {
      throw new Error("Trade engine is already paused")
    }

    this.isPaused = true
    console.log("[GlobalTradeEngineCoordinator] Trade engine paused")
  }

  async resume(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Trade engine is not running")
    }

    if (!this.isPaused) {
      throw new Error("Trade engine is not paused")
    }

    this.isPaused = false
    console.log("[GlobalTradeEngineCoordinator] Trade engine resumed")
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Trade engine is already running")
    }

    this.isRunning = true
    this.isPaused = false
    this.startTime = new Date()
    this.stoppedAt = undefined
    this.errorMessage = undefined
    this.errorCount = 0
    console.log("[GlobalTradeEngineCoordinator] Trade engine started")
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Trade engine is not running")
    }

    this.isRunning = false
    this.isPaused = false
    this.stoppedAt = new Date()
    console.log("[GlobalTradeEngineCoordinator] Trade engine stopped")
  }

  async restart(): Promise<void> {
    if (this.isRunning) {
      await this.stop()
    }
    await this.start()
    console.log("[GlobalTradeEngineCoordinator] Trade engine restarted")
  }

  setMainEngineEnabled(enabled: boolean): void {
    this.mainEngineEnabled = enabled
    console.log(`[GlobalTradeEngineCoordinator] Main engine ${enabled ? "enabled" : "disabled"}`)
  }

  setPresetEngineEnabled(enabled: boolean): void {
    this.presetEngineEnabled = enabled
    console.log(`[GlobalTradeEngineCoordinator] Preset engine ${enabled ? "enabled" : "disabled"}`)
  }

  isMainEngineEnabled(): boolean {
    return this.mainEngineEnabled
  }

  isPresetEngineEnabled(): boolean {
    return this.presetEngineEnabled
  }

  recordCycle(duration: number, success: boolean): void {
    this.lastCycleDuration = duration
    this.lastHealthCheck = new Date()

    if (success) {
      this.successCount++
      if (this.errorCount > 0) this.errorCount--
    } else {
      this.errorCount++
    }

    // Update health status based on error rate
    const totalCycles = this.successCount + this.errorCount
    if (totalCycles > 10) {
      const errorRate = this.errorCount / totalCycles
      if (errorRate > 0.3) {
        this.healthStatus = "unhealthy"
      } else if (errorRate > 0.1) {
        this.healthStatus = "degraded"
      } else {
        this.healthStatus = "healthy"
      }
    }
  }

  setError(message: string): void {
    this.errorMessage = message
    this.errorCount++
    this.healthStatus = "unhealthy"
  }

  clearError(): void {
    this.errorMessage = undefined
    if (this.errorCount > 0) this.errorCount--
  }

  getStatus(): EngineStatus {
    if (!this.isRunning) {
      return {
        status: "stopped",
        stoppedAt: this.stoppedAt,
        errorMessage: this.errorMessage,
      }
    }

    if (this.isPaused) {
      return {
        status: "paused",
        startedAt: this.startTime,
      }
    }

    if (this.errorMessage) {
      return {
        status: "error",
        startedAt: this.startTime,
        errorMessage: this.errorMessage,
      }
    }

    return {
      status: "running",
      startedAt: this.startTime,
    }
  }

  getHealth(): HealthStatus {
    return {
      overall: this.healthStatus,
      components: {
        mainEngine: {
          status: this.mainEngineEnabled ? this.healthStatus : "unhealthy",
          lastCycleDuration: this.lastCycleDuration,
          errorCount: this.errorCount,
          successRate: this.successCount / Math.max(1, this.successCount + this.errorCount),
        },
        presetEngine: {
          status: this.presetEngineEnabled ? this.healthStatus : "unhealthy",
          lastCycleDuration: this.lastCycleDuration,
          errorCount: this.errorCount,
          successRate: this.successCount / Math.max(1, this.successCount + this.errorCount),
        },
      },
      lastCheck: this.lastHealthCheck || new Date(),
    }
  }

  getIsRunning(): boolean {
    return this.isRunning
  }

  getIsPaused(): boolean {
    return this.isPaused
  }

  getUptime(): number {
    if (!this.startTime || !this.isRunning) return 0
    return Date.now() - this.startTime.getTime()
  }
}

/**
 * The global trade engine coordinator singleton instance
 */
let globalCoordinator: GlobalTradeEngineCoordinator | null = null

/**
 * Get the global trade engine coordinator singleton instance
 * @returns The GlobalTradeEngineCoordinator instance or null if not initialized
 */
export function getTradeEngine(): GlobalTradeEngineCoordinator | null {
  return globalCoordinator
}

/**
 * Initialize the global trade engine coordinator
 * This should be called once during application startup
 */
export function initializeGlobalCoordinator(): GlobalTradeEngineCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new GlobalTradeEngineCoordinator()
  }
  return globalCoordinator
}

export function getGlobalCoordinator(): GlobalTradeEngineCoordinator | null {
  return getTradeEngine()
}

export function initializeTradeEngine(): GlobalTradeEngineCoordinator {
  return initializeGlobalCoordinator()
}

export type TradeEngineInterface = GlobalTradeEngineCoordinator

export interface EngineStatus {
  status: "idle" | "running" | "stopped" | "paused" | "error"
  startedAt?: Date
  stoppedAt?: Date
  errorMessage?: string
}

export interface ConnectionStatus {
  connectionId: string
  status: "active" | "inactive" | "error"
  lastActivity?: Date
  errorCount: number
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy"
  components: Record<string, ComponentHealth>
  lastCheck: Date
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy"
  lastCycleDuration: number
  errorCount: number
  successRate: number
}
