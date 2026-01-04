// Re-export TradeEngine class and config from subdirectory for convenient imports
export { TradeEngine, type TradeEngineConfig } from "./trade-engine/trade-engine"

/**
 * GlobalTradeEngineCoordinator class definition
 */
export class GlobalTradeEngineCoordinator {
  private isPaused = false

  // Coordinator implementation details here

  /**
   * Pause all trading operations
   * Stops all active connections from executing trades
   */
  public async pause(): Promise<void> {
    this.isPaused = true
    console.log("[v0] Global Trade Engine Coordinator paused")
    // TODO: Implement actual pause logic to stop all active engines
  }

  /**
   * Resume all trading operations
   * Resumes all active connections to execute trades
   */
  public async resume(): Promise<void> {
    this.isPaused = false
    console.log("[v0] Global Trade Engine Coordinator resumed")
    // TODO: Implement actual resume logic to restart all active engines
  }

  /**
   * Check if the coordinator is currently paused
   */
  public isPausedState(): boolean {
    return this.isPaused
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
