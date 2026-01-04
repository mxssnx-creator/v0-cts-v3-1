// Re-export TradeEngine class and config from subdirectory for convenient imports
export { TradeEngine, type TradeEngineConfig } from "./trade-engine/trade-engine"
export { TradeEngineManager } from "./trade-engine/engine-manager"

/**
 * GlobalTradeEngineCoordinator class definition
 */
export class GlobalTradeEngineCoordinator {
  private isPaused = false
  private engines: Map<string, any> = new Map()
  private isInitialized = false

  constructor() {
    this.isInitialized = true
    console.log("[v0] GlobalTradeEngineCoordinator initialized")
  }

  /**
   * Pause all trading operations
   * Stops all active connections from executing trades
   */
  public async pause(): Promise<void> {
    if (this.isPaused) {
      console.log("[v0] GlobalTradeEngineCoordinator already paused")
      return
    }

    this.isPaused = true
    console.log("[v0] Pausing all registered engines:", this.engines.size)

    const pausePromises: Promise<void>[] = []

    for (const [connectionId, engine] of this.engines.entries()) {
      try {
        if (engine && typeof engine.stop === "function") {
          pausePromises.push(
            engine.stop().then(() => {
              console.log(`[v0] Paused engine for connection: ${connectionId}`)
            }),
          )
        }
      } catch (error) {
        console.error(`[v0] Error pausing engine ${connectionId}:`, error)
      }
    }

    await Promise.allSettled(pausePromises)
    console.log("[v0] All engines paused successfully")
  }

  /**
   * Resume all trading operations
   * Resumes all active connections to execute trades
   */
  public async resume(): Promise<void> {
    if (!this.isPaused) {
      console.log("[v0] GlobalTradeEngineCoordinator not paused, nothing to resume")
      return
    }

    this.isPaused = false
    console.log("[v0] Resuming all registered engines:", this.engines.size)

    const resumePromises: Promise<void>[] = []

    for (const [connectionId, engine] of this.engines.entries()) {
      try {
        if (engine && typeof engine.start === "function") {
          resumePromises.push(
            engine.start().then(() => {
              console.log(`[v0] Resumed engine for connection: ${connectionId}`)
            }),
          )
        }
      } catch (error) {
        console.error(`[v0] Error resuming engine ${connectionId}:`, error)
      }
    }

    await Promise.allSettled(resumePromises)
    console.log("[v0] All engines resumed successfully")
  }

  /**
   * Check if the coordinator is currently paused
   */
  public isPausedState(): boolean {
    return this.isPaused
  }

  /**
   * Register an engine for a connection
   */
  public registerEngine(connectionId: string, engine: any): void {
    this.engines.set(connectionId, engine)
  }

  /**
   * Unregister an engine for a connection
   */
  public unregisterEngine(connectionId: string): void {
    this.engines.delete(connectionId)
  }

  /**
   * Get all registered engines
   */
  public getEngines(): Map<string, any> {
    return this.engines
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

import { query } from "./db"

/**
 * Check if a specific trade engine type is enabled
 * @param engineType - The type of engine to check ('main' or 'preset')
 * @returns Promise resolving to true if enabled, false otherwise
 */
export async function isTradeEngineTypeEnabled(engineType: "main" | "preset"): Promise<boolean> {
  try {
    const settingKey = engineType === "main" ? "mainTradeEngineEnabled" : "presetTradeEngineEnabled"
    const result = await query("SELECT value FROM system_settings WHERE key = $1", [settingKey])

    if (result.length === 0) {
      // Default to enabled if not found
      return true
    }

    return result[0].value === true || result[0].value === "true"
  } catch (error) {
    console.error(`[v0] Failed to check ${engineType} trade engine status:`, error)
    // Default to enabled on error to avoid blocking trading
    return true
  }
}
