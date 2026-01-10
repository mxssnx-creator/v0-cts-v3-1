import { sql } from "@/lib/db"
import { TradeEngineManager, type EngineConfig } from "./trade-engine/engine-manager"

// Re-export TradeEngine class and config from subdirectory for convenient imports
export { TradeEngine, type TradeEngineConfig, TRADE_SERVICE_NAME } from "./trade-engine/trade-engine"
export { TradeEngineManager, type EngineConfig } from "./trade-engine/engine-manager"

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

/**
 * GlobalTradeEngineCoordinator
 *
 * Manages TradeEngineManagers for all connections system-wide.
 * Acts as the central coordinator for trade processing across multiple exchanges.
 */
export class GlobalTradeEngineCoordinator {
  private engineManagers: Map<string, TradeEngineManager> = new Map()
  private isGloballyRunning = false
  private healthCheckTimer?: NodeJS.Timeout

  constructor() {
    console.log("[v0] GlobalTradeEngineCoordinator initialized")
  }

  /**
   * Initialize engine for a specific connection
   */
  async initializeEngine(connectionId: string, config: EngineConfig): Promise<TradeEngineManager> {
    console.log(`[v0] Initializing TradeEngine for connection: ${connectionId}`)

    // Check if engine already exists
    if (this.engineManagers.has(connectionId)) {
      console.log(`[v0] Engine already exists for connection: ${connectionId}`)
      return this.engineManagers.get(connectionId)!
    }

    // Create new engine manager
    const manager = new TradeEngineManager(config)
    this.engineManagers.set(connectionId, manager)

    // Initialize database state
    try {
      await this.ensureEngineState(connectionId)
    } catch (error) {
      console.error(`[v0] Failed to initialize engine state for ${connectionId}:`, error)
    }

    console.log(`[v0] TradeEngine initialized for connection: ${connectionId}`)
    return manager
  }

  /**
   * Start engine for a specific connection
   */
  async startEngine(connectionId: string, config: EngineConfig): Promise<void> {
    console.log(`[v0] Starting TradeEngine for connection: ${connectionId}`)

    let manager = this.engineManagers.get(connectionId)

    if (!manager) {
      manager = await this.initializeEngine(connectionId, config)
    }

    await manager.start(config)
    console.log(`[v0] TradeEngine started for connection: ${connectionId}`)
  }

  /**
   * Stop engine for a specific connection
   */
  async stopEngine(connectionId: string): Promise<void> {
    console.log(`[v0] Stopping TradeEngine for connection: ${connectionId}`)

    const manager = this.engineManagers.get(connectionId)

    if (!manager) {
      console.log(`[v0] No engine found for connection: ${connectionId}`)
      return
    }

    await manager.stop()
    this.engineManagers.delete(connectionId)

    console.log(`[v0] TradeEngine stopped for connection: ${connectionId}`)
  }

  /**
   * Start all engines (for all active connections)
   */
  async startAllEngines(): Promise<void> {
    console.log("[v0] Starting all TradeEngines...")

    try {
      // Get all active connections
      const connections = await sql<any>`
        SELECT id, exchange, api_key, api_secret 
        FROM connections 
        WHERE is_active = true
      `

      console.log(`[v0] Found ${connections.length} active connections`)

      // Start engine for each connection
      for (const connection of connections) {
        try {
          const config: EngineConfig = {
            connectionId: connection.id,
            indicationInterval: 5, // 5 seconds
            strategyInterval: 10, // 10 seconds
            realtimeInterval: 3, // 3 seconds
          }

          await this.startEngine(connection.id, config)
        } catch (error) {
          console.error(`[v0] Failed to start engine for connection ${connection.id}:`, error)
        }
      }

      this.isGloballyRunning = true
      this.startGlobalHealthMonitoring()

      console.log("[v0] All TradeEngines started")
    } catch (error) {
      console.error("[v0] Failed to start all engines:", error)
      throw error
    }
  }

  /**
   * Stop all engines
   */
  async stopAllEngines(): Promise<void> {
    console.log("[v0] Stopping all TradeEngines...")

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Stop all engine managers
    for (const [connectionId, manager] of this.engineManagers.entries()) {
      try {
        await manager.stop()
      } catch (error) {
        console.error(`[v0] Failed to stop engine for connection ${connectionId}:`, error)
      }
    }

    this.engineManagers.clear()
    this.isGloballyRunning = false

    console.log("[v0] All TradeEngines stopped")
  }

  /**
   * Get engine manager for a specific connection
   */
  getEngineManager(connectionId: string): TradeEngineManager | null {
    return this.engineManagers.get(connectionId) || null
  }

  /**
   * Get status of all engines
   */
  async getAllEnginesStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {}

    for (const [connectionId, manager] of this.engineManagers.entries()) {
      try {
        status[connectionId] = await manager.getStatus()
      } catch (error) {
        status[connectionId] = { error: error instanceof Error ? error.message : "Unknown error" }
      }
    }

    return status
  }

  /**
   * Get status of a specific engine
   */
  async getEngineStatus(connectionId: string): Promise<any | null> {
    const manager = this.engineManagers.get(connectionId)
    if (!manager) return null

    return manager.getStatus()
  }

  /**
   * Get global system health
   */
  async getGlobalHealth(): Promise<HealthStatus> {
    const allStatus = await this.getAllEnginesStatus()
    const components: Record<string, ComponentHealth> = {}

    let healthyCount = 0
    let degradedCount = 0
    let unhealthyCount = 0

    for (const [connectionId, status] of Object.entries(allStatus)) {
      if (status.health) {
        components[connectionId] = {
          status: status.health.overall,
          lastCycleDuration: 0,
          errorCount: 0,
          successRate: 100,
        }

        if (status.health.overall === "healthy") healthyCount++
        else if (status.health.overall === "degraded") degradedCount++
        else unhealthyCount++
      }
    }

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
   * Ensure engine state exists in database
   */
  private async ensureEngineState(connectionId: string): Promise<void> {
    try {
      // Check if state exists
      const [existing] = await sql`
        SELECT id FROM trade_engine_state WHERE connection_id = ${connectionId}
      `

      if (!existing) {
        // Create initial state
        await sql`
          INSERT INTO trade_engine_state (
            connection_id, 
            status, 
            prehistoric_data_loaded,
            created_at,
            updated_at
          ) VALUES (
            ${connectionId}, 
            'idle', 
            false,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `
        console.log(`[v0] Created engine state for connection: ${connectionId}`)
      }
    } catch (error) {
      console.error(`[v0] Failed to ensure engine state for ${connectionId}:`, error)
    }
  }

  /**
   * Start global health monitoring
   */
  private startGlobalHealthMonitoring(): void {
    const healthCheckInterval = 30000 // Check every 30 seconds

    console.log("[v0] Starting global trade engine health monitoring")

    this.healthCheckTimer = setInterval(async () => {
      if (!this.isGloballyRunning) return

      try {
        const health = await this.getGlobalHealth()

        if (health.overall !== "healthy") {
          console.warn(`[v0] Global trade engine health: ${health.overall}`)
        }

        // Log unhealthy connections
        for (const [connectionId, component] of Object.entries(health.components)) {
          if (component.status !== "healthy") {
            console.warn(`[v0] Connection ${connectionId} is ${component.status}`)
          }
        }
      } catch (error) {
        console.error("[v0] Global health monitoring error:", error)
      }
    }, healthCheckInterval)
  }

  /**
   * Check if coordinator is running
   */
  isRunning(): boolean {
    return this.isGloballyRunning
  }

  /**
   * Get count of active engines
   */
  getActiveEngineCount(): number {
    return this.engineManagers.size
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
    console.log("[v0] Global trade engine coordinator initialized")
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
