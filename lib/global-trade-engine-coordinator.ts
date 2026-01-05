/**
 * Global Trade Engine Coordinator
 * Manages all trade engines across connections with real-time coordination
 */

import { TradeEngineManager } from "./trade-engine/engine-manager"
import { loadSettings, saveSettings } from "./file-storage"
import { SystemLogger } from "./system-logger"

export interface EngineStatus {
  status: "idle" | "running" | "stopped" | "paused" | "error"
  startedAt?: Date
  stoppedAt?: Date
  errorMessage?: string
  engineType?: "main" | "preset"
  isEnabled?: boolean
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

/**
 * GlobalTradeEngineCoordinator class
 * Singleton coordinator for all trade engines
 */
export class GlobalTradeEngineCoordinator {
  private static instance: GlobalTradeEngineCoordinator | null = null
  private isPaused = false
  private engines: Map<string, TradeEngineManager> = new Map()
  private engineStatuses: Map<string, EngineStatus> = new Map()
  private isInitialized = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map()

  private constructor() {
    this.isInitialized = true
    SystemLogger.logSystem("GlobalTradeEngineCoordinator initialized", "info")
    this.startHealthMonitoring()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GlobalTradeEngineCoordinator {
    if (!GlobalTradeEngineCoordinator.instance) {
      GlobalTradeEngineCoordinator.instance = new GlobalTradeEngineCoordinator()
    }
    return GlobalTradeEngineCoordinator.instance
  }

  /**
   * Initialize or start a trade engine for a connection
   */
  public async startEngine(
    connectionId: string,
    config: {
      indicationInterval: number
      strategyInterval: number
      realtimeInterval: number
    },
  ): Promise<void> {
    try {
      SystemLogger.logSystem(`Starting engine for connection: ${connectionId}`, "info")

      // Check if engine already exists
      let engine = this.engines.get(connectionId)

      if (!engine) {
        // Create new engine
        engine = new TradeEngineManager({
          connectionId,
          indicationInterval: config.indicationInterval,
          strategyInterval: config.strategyInterval,
          realtimeInterval: config.realtimeInterval,
        })

        this.engines.set(connectionId, engine)
        this.initializePerformanceMetrics(connectionId)
      }

      // Start the engine
      await engine.start({
        connectionId,
        indicationInterval: config.indicationInterval,
        strategyInterval: config.strategyInterval,
        realtimeInterval: config.realtimeInterval,
      })

      // Update status
      this.engineStatuses.set(connectionId, {
        status: "running",
        startedAt: new Date(),
        isEnabled: true,
      })

      SystemLogger.logSystem(`Engine started successfully for connection: ${connectionId}`, "info")
    } catch (error) {
      SystemLogger.logError(error, "trade-engine", `Failed to start engine for ${connectionId}`)
      this.engineStatuses.set(connectionId, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  /**
   * Stop a trade engine for a connection
   */
  public async stopEngine(connectionId: string): Promise<void> {
    try {
      SystemLogger.logSystem(`Stopping engine for connection: ${connectionId}`, "info")

      const engine = this.engines.get(connectionId)
      if (!engine) {
        SystemLogger.logSystem(`No engine found for connection: ${connectionId}`, "warn")
        return
      }

      await engine.stop()

      this.engineStatuses.set(connectionId, {
        status: "stopped",
        stoppedAt: new Date(),
      })

      SystemLogger.logSystem(`Engine stopped for connection: ${connectionId}`, "info")
    } catch (error) {
      SystemLogger.logError(error, "trade-engine", `Failed to stop engine for ${connectionId}`)
      throw error
    }
  }

  /**
   * Pause all trading operations
   */
  public async pause(): Promise<void> {
    if (this.isPaused) {
      SystemLogger.logSystem("GlobalTradeEngineCoordinator already paused", "info")
      return
    }

    this.isPaused = true
    SystemLogger.logSystem(`Pausing all registered engines: ${this.engines.size}`, "info")

    const pausePromises: Promise<void>[] = []

    for (const [connectionId, engine] of this.engines.entries()) {
      try {
        pausePromises.push(
          engine.stop().then(() => {
            SystemLogger.logSystem(`Paused engine for connection: ${connectionId}`, "info")
            this.engineStatuses.set(connectionId, { status: "paused" })
          }),
        )
      } catch (error) {
        SystemLogger.logError(error, "trade-engine", `Error pausing engine ${connectionId}`)
      }
    }

    await Promise.allSettled(pausePromises)
    SystemLogger.logSystem("All engines paused successfully", "info")

    // Save paused state
    await this.savePausedState(true)
  }

  /**
   * Resume all trading operations
   */
  public async resume(): Promise<void> {
    if (!this.isPaused) {
      SystemLogger.logSystem("GlobalTradeEngineCoordinator not paused, nothing to resume", "info")
      return
    }

    this.isPaused = false
    SystemLogger.logSystem(`Resuming all registered engines: ${this.engines.size}`, "info")

    const resumePromises: Promise<void>[] = []

    for (const [connectionId, engine] of this.engines.entries()) {
      try {
        const status = this.engineStatuses.get(connectionId)
        if (status && status.isEnabled) {
          resumePromises.push(
            engine
              .start({
                connectionId,
                indicationInterval: 60,
                strategyInterval: 120,
                realtimeInterval: 30,
              })
              .then(() => {
                SystemLogger.logSystem(`Resumed engine for connection: ${connectionId}`, "info")
                this.engineStatuses.set(connectionId, { status: "running" })
              }),
          )
        }
      } catch (error) {
        SystemLogger.logError(error, "trade-engine", `Error resuming engine ${connectionId}`)
      }
    }

    await Promise.allSettled(resumePromises)
    SystemLogger.logSystem("All engines resumed successfully", "info")

    // Save resumed state
    await this.savePausedState(false)
  }

  /**
   * Check if the coordinator is currently paused
   */
  public isPausedState(): boolean {
    return this.isPaused
  }

  /**
   * Register an engine for a connection (manual registration)
   */
  public registerEngine(connectionId: string, engine: TradeEngineManager): void {
    this.engines.set(connectionId, engine)
    this.initializePerformanceMetrics(connectionId)
    SystemLogger.logSystem(`Engine registered for connection: ${connectionId}`, "info")
  }

  /**
   * Unregister an engine for a connection
   */
  public unregisterEngine(connectionId: string): void {
    this.engines.delete(connectionId)
    this.engineStatuses.delete(connectionId)
    this.performanceMetrics.delete(connectionId)
    SystemLogger.logSystem(`Engine unregistered for connection: ${connectionId}`, "info")
  }

  /**
   * Get all registered engines
   */
  public getEngines(): Map<string, TradeEngineManager> {
    return this.engines
  }

  /**
   * Get engine status for a connection
   */
  public getEngineStatus(connectionId: string): EngineStatus | undefined {
    return this.engineStatuses.get(connectionId)
  }

  /**
   * Get all engine statuses
   */
  public getAllEngineStatuses(): Map<string, EngineStatus> {
    return this.engineStatuses
  }

  /**
   * Get overall health status
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const components: Record<string, ComponentHealth> = {}

    for (const [connectionId, engine] of this.engines.entries()) {
      try {
        const status = await engine.getStatus()
        if (status && status.health) {
          components[connectionId] = {
            status: status.health.overall,
            lastCycleDuration: 0,
            errorCount: 0,
            successRate: 100,
          }
        }
      } catch (error) {
        components[connectionId] = {
          status: "unhealthy",
          lastCycleDuration: 0,
          errorCount: 1,
          successRate: 0,
        }
      }
    }

    // Calculate overall health
    const healthValues = Object.values(components)
    const unhealthyCount = healthValues.filter((c) => c.status === "unhealthy").length
    const degradedCount = healthValues.filter((c) => c.status === "degraded").length

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy"
    if (unhealthyCount > 0) overall = "unhealthy"
    else if (degradedCount > 0) overall = "degraded"

    return {
      overall,
      components,
      lastCheck: new Date(),
    }
  }

  /**
   * Get performance metrics for a connection
   */
  public getPerformanceMetrics(connectionId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(connectionId)
  }

  /**
   * Initialize performance metrics tracking
   */
  private initializePerformanceMetrics(connectionId: string): void {
    this.performanceMetrics.set(connectionId, {
      cycleCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      errorCount: 0,
      successRate: 100,
      lastCycleTime: Date.now(),
    })
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus()
        if (health.overall !== "healthy") {
          SystemLogger.logSystem(`Coordinator health: ${health.overall}`, "warn")
        }
      } catch (error) {
        SystemLogger.logError(error, "system", "Health monitoring error")
      }
    }, 30000)
  }

  /**
   * Save paused state to file storage
   */
  private async savePausedState(isPaused: boolean): Promise<void> {
    try {
      const settings = await loadSettings()
      settings.globalTradeEnginePaused = isPaused
      await saveSettings(settings)
    } catch (error) {
      SystemLogger.logError(error, "system", "Failed to save paused state")
    }
  }

  /**
   * Shutdown the coordinator
   */
  public async shutdown(): Promise<void> {
    SystemLogger.logSystem("Shutting down GlobalTradeEngineCoordinator", "info")

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Stop all engines
    await this.pause()

    SystemLogger.logSystem("GlobalTradeEngineCoordinator shutdown complete", "info")
  }
}

interface PerformanceMetrics {
  cycleCount: number
  totalDuration: number
  avgDuration: number
  errorCount: number
  successRate: number
  lastCycleTime: number
}

// Export singleton instance functions
export function getGlobalCoordinator(): GlobalTradeEngineCoordinator {
  return GlobalTradeEngineCoordinator.getInstance()
}

export function initializeGlobalCoordinator(): GlobalTradeEngineCoordinator {
  return GlobalTradeEngineCoordinator.getInstance()
}

export function getTradeEngine(): GlobalTradeEngineCoordinator {
  return GlobalTradeEngineCoordinator.getInstance()
}

export function initializeTradeEngine(): GlobalTradeEngineCoordinator {
  return GlobalTradeEngineCoordinator.getInstance()
}

export type TradeEngineInterface = GlobalTradeEngineCoordinator
