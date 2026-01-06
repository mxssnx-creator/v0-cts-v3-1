// Re-export TradeEngine class and config from subdirectory for convenient imports
export { TradeEngine, type TradeEngineConfig } from "./trade-engine/trade-engine"

/**
 * GlobalTradeEngineCoordinator class definition
 */
export class GlobalTradeEngineCoordinator {
  // Coordinator implementation details here
  private isPaused = false
  private isRunning = false
  private startTime?: Date

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
    console.log("[GlobalTradeEngineCoordinator] Trade engine started")
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error("Trade engine is not running")
    }

    this.isRunning = false
    this.isPaused = false
    console.log("[GlobalTradeEngineCoordinator] Trade engine stopped")
  }

  getStatus(): EngineStatus {
    if (!this.isRunning) {
      return { status: "stopped" }
    }

    if (this.isPaused) {
      return { status: "paused", startedAt: this.startTime }
    }

    return { status: "running", startedAt: this.startTime }
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
