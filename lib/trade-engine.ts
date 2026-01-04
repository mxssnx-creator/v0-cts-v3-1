/**
 * Global Trade Engine Coordinator
 *
 * Architecture Overview:
 * ----------------------
 * This is a GLOBAL SINGLETON that coordinates multiple exchange connections
 * and manages strategies/indications across the entire system.
 *
 * It runs continuously as a service/instance with:
 * - Main Engine Loop: Processes step-based indications & main strategies
 * - Preset Engine Loop: Processes common indicator-based strategies
 * - Active Order Loop: Manages positions and order execution
 *
 * For per-connection engines, use TradeEngine from lib/trade-engine/trade-engine.tsx
 *
 * Service Name: Global Trade Coordinator
 * Pattern: Singleton with multi-connection support
 */

import { type ExchangeConfig, createExchangeAPI } from "./exchanges"
import type { StrategyConfig } from "./strategies"
import { SystemLogger } from "./system-logger"
import DatabaseManager from "./database"

export interface TradeEngineInterface {
  start(): Promise<void>
  stop(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  isRunning(): boolean
  isPaused(): boolean
  getStatus(): EngineStatus
  getHealthStatus(): HealthStatus
  addConnection(config: ExchangeConfig): Promise<void>
  removeConnection(connectionId: string): Promise<void>
  getConnectionStatus(connectionId: string): ConnectionStatus | null
}

export interface EngineStatus {
  running: boolean
  paused: boolean
  connectedExchanges: number
  activePositions: number
  totalProfit: number
  uptime: number
  lastUpdate: Date
  connections: Map<string, ConnectionStatus>
  cycleStats: {
    mainEngineCycleCount: number
    presetEngineCycleCount: number
    activeOrderCycleCount: number
    avgMainCycleDuration: number
    avgPresetCycleDuration: number
    avgOrderCycleDuration: number
  }
}

export interface ConnectionStatus {
  id: string
  name: string
  status: "connected" | "disconnected" | "error"
  activePositions: number
  profit: number
  lastUpdate: Date
  healthScore: number
  lastHealthCheck: Date
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy"
  components: {
    mainEngine: ComponentHealth
    presetEngine: ComponentHealth
    orderHandler: ComponentHealth
    connections: Map<string, ComponentHealth>
  }
  lastCheck: Date
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy"
  lastCycleDuration: number
  errorCount: number
  successRate: number
}

export class GlobalTradeEngineCoordinator implements TradeEngineInterface {
  private running = false
  private paused = false
  private exchanges: Map<string, any> = new Map()
  private connectionConfigs: Map<string, ExchangeConfig> = new Map()
  private strategies: StrategyConfig[] = []
  private indications: any[] = []
  private positions: Map<string, any[]> = new Map()
  private startTime?: Date
  private pauseTime?: Date
  private mainEngineInterval?: NodeJS.Timeout
  private presetEngineInterval?: NodeJS.Timeout
  private activeOrderInterval?: NodeJS.Timeout
  private healthCheckInterval?: NodeJS.Timeout
  private statsCache: { data: any; timestamp: number } | null = null
  private readonly STATS_CACHE_TTL = 2000
  private settings: any = {}

  private healthStatus: HealthStatus = {
    overall: "healthy",
    components: {
      mainEngine: { status: "healthy", lastCycleDuration: 0, errorCount: 0, successRate: 100 },
      presetEngine: { status: "healthy", lastCycleDuration: 0, errorCount: 0, successRate: 100 },
      orderHandler: { status: "healthy", lastCycleDuration: 0, errorCount: 0, successRate: 100 },
      connections: new Map(),
    },
    lastCheck: new Date(),
  }

  private cycleStats = {
    mainEngineCycleCount: 0,
    presetEngineCycleCount: 0,
    activeOrderCycleCount: 0,
    mainEngineTotalDuration: 0,
    presetEngineTotalDuration: 0,
    activeOrderTotalDuration: 0,
    mainEngineErrors: 0,
    presetEngineErrors: 0,
    activeOrderErrors: 0,
  }

  constructor(strategies: StrategyConfig[], indications: any) {
    this.strategies = strategies
    this.indications = indications
    this.loadSettings()
    console.log("[v0] GlobalTradeEngineCoordinator initialized")
  }

  private async loadSettings(): Promise<void> {
    try {
      const db = await DatabaseManager.getInstance()
      const allSettings = await db.getAllSettings()

      this.settings = {
        ...allSettings,
        prehistoricDataDays: Number.parseInt(allSettings.prehistoricDataDays || "5"),
        marketTimeframe: Number.parseInt(allSettings.marketTimeframe || "1"),
        mainEngineIntervalMs: Number.parseInt(allSettings.mainEngineIntervalMs || "1000"),
        presetEngineIntervalMs: Number.parseInt(allSettings.presetEngineIntervalMs || "1000"),
        activeOrderHandlingIntervalMs: Number.parseInt(allSettings.activeOrderHandlingIntervalMs || "300"),
        databaseSizeBase: Number.parseInt(allSettings.databaseSizeBase || "250"),
        databaseSizeMain: Number.parseInt(allSettings.databaseSizeMain || "250"),
        databaseSizeReal: Number.parseInt(allSettings.databaseSizeReal || "250"),
        databaseSizePreset: Number.parseInt(allSettings.databaseSizePreset || "250"),
        maxPositionsPerExchange: allSettings.maxPositionsPerExchange
          ? JSON.parse(allSettings.maxPositionsPerExchange)
          : {},
        mainSymbols: allSettings.mainSymbols ? JSON.parse(allSettings.mainSymbols) : [],
        forcedSymbols: allSettings.forcedSymbols ? JSON.parse(allSettings.forcedSymbols) : [],
        directionIndicationInterval: Number.parseInt(allSettings.directionIndicationInterval || "100"),
        moveIndicationInterval: Number.parseInt(allSettings.moveIndicationInterval || "100"),
        activeIndicationInterval: Number.parseInt(allSettings.activeIndicationInterval || "100"),
        optimalIndicationInterval: Number.parseInt(allSettings.optimalIndicationInterval || "1000"),
        autoIndicationInterval: Number.parseInt(allSettings.autoIndicationInterval || "2000"),
        directionIndicationTimeout: Number.parseInt(allSettings.directionIndicationTimeout || "5"),
        moveIndicationTimeout: Number.parseInt(allSettings.moveIndicationTimeout || "5"),
        activeIndicationTimeout: Number.parseInt(allSettings.activeIndicationTimeout || "3"),
        optimalIndicationTimeout: Number.parseInt(allSettings.optimalIndicationTimeout || "10"),
        autoIndicationTimeout: Number.parseInt(allSettings.autoIndicationTimeout || "10"),
      }

      console.log("[v0] Global Trade Coordinator settings loaded:", {
        intervals: {
          main: `${this.settings.mainEngineIntervalMs}ms`,
          preset: `${this.settings.presetEngineIntervalMs}ms`,
          orders: `${this.settings.activeOrderHandlingIntervalMs}ms`,
        },
        databaseSizes: {
          base: this.settings.databaseSizeBase,
          main: this.settings.databaseSizeMain,
          real: this.settings.databaseSizeReal,
          preset: this.settings.databaseSizePreset,
        },
      })
    } catch (error) {
      console.error("[v0] Failed to load settings for Global Trade Coordinator:", error)
      this.settings = {
        prehistoricDataDays: 5,
        marketTimeframe: 1,
        mainEngineIntervalMs: 1000,
        presetEngineIntervalMs: 1000,
        activeOrderHandlingIntervalMs: 300,
        databaseSizeBase: 250,
        databaseSizeMain: 250,
        databaseSizeReal: 250,
        databaseSizePreset: 250,
        maxPositionsPerExchange: {},
        mainSymbols: [],
        forcedSymbols: [],
        directionIndicationInterval: 100,
        moveIndicationInterval: 100,
        activeIndicationInterval: 100,
        optimalIndicationInterval: 1000,
        autoIndicationInterval: 2000,
        directionIndicationTimeout: 5,
        moveIndicationTimeout: 5,
        activeIndicationTimeout: 3,
        optimalIndicationTimeout: 10,
        autoIndicationTimeout: 10,
      }
    }
  }

  async addConnection(config: ExchangeConfig): Promise<void> {
    console.log("[v0] [GlobalCoordinator] Adding connection:", config.name, config.exchange)
    await SystemLogger.logConnection(`Adding connection to Global Coordinator: ${config.name}`, config.id, "info", {
      exchangeType: config.exchange,
    })

    this.connectionConfigs.set(config.id, config)

    if (this.running && config.status === "connected") {
      try {
        const exchangeType = config.exchange.toLowerCase()
        const maxPositions = this.settings.maxPositionsPerExchange?.[exchangeType] || 100

        console.log(`[v0] Connection ${config.name} max positions limit: ${maxPositions}`)

        const api = createExchangeAPI(config)
        await api.connect()
        this.exchanges.set(config.id, api)
        this.positions.set(config.id, [])

        // Initialize connection health status
        this.healthStatus.components.connections.set(config.id, {
          status: "healthy",
          lastCycleDuration: 0,
          errorCount: 0,
          successRate: 100,
        })

        await SystemLogger.logConnection(
          `Successfully connected to ${config.name} (max positions: ${maxPositions})`,
          config.id,
          "info",
        )
      } catch (error) {
        console.error("[v0] Failed to add connection:", error)
        await SystemLogger.logError(error, "trade-engine", `Failed to connect to ${config.name}`, {
          connectionId: config.id,
        })
        // Consider setting connection status to 'error' here if not already handled elsewhere
        // this.connectionConfigs.get(config.id)!.status = "error";
        throw error
      }
    }
  }

  async removeConnection(connectionId: string): Promise<void> {
    await SystemLogger.logConnection(`Removing connection from Global Coordinator`, connectionId, "info")

    const api = this.exchanges.get(connectionId)
    if (api) {
      try {
        await api.disconnect()
        await SystemLogger.logConnection(`Disconnected successfully`, connectionId, "info")
      } catch (error) {
        await SystemLogger.logError(error, "trade-engine", `Error disconnecting`, { connectionId })
      }
    }

    this.exchanges.delete(connectionId)
    this.connectionConfigs.delete(connectionId)
    this.positions.delete(connectionId)
    this.healthStatus.components.connections.delete(connectionId) // Remove connection health

    this.statsCache = null
  }

  getConnectionStatus(connectionId: string): ConnectionStatus | null {
    const config = this.connectionConfigs.get(connectionId)
    const api = this.exchanges.get(connectionId)
    const positions = this.positions.get(connectionId) || []

    if (!config) return null

    const profit = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0)

    const componentHealth = this.healthStatus.components.connections.get(connectionId)
    const healthScore = componentHealth ? componentHealth.successRate : 100

    return {
      id: config.id,
      name: config.name,
      status: api ? "connected" : "disconnected",
      activePositions: positions.length,
      profit,
      lastUpdate: new Date(),
      healthScore,
      lastHealthCheck: this.healthStatus.lastCheck,
    }
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log("[v0] Global Trade Coordinator already running")
      await SystemLogger.logTradeEngine("Global Trade Coordinator already running", "warn")
      return
    }

    await this.loadSettings()

    console.log("[v0] Starting Global Trade Engine Coordinator")
    await SystemLogger.logTradeEngine("Starting Global Trade Engine Coordinator", "info")
    await SystemLogger.logTradeEngine(
      `Coordinator configuration: ${this.settings.prehistoricDataDays} days prehistoric data, ${this.settings.marketTimeframe}s timeframe`,
      "info",
    )

    this.running = true
    this.paused = false
    this.startTime = new Date()

    if (this.settings.prehistoricDataDays > 0) {
      console.log(`[v0] Loading ${this.settings.prehistoricDataDays} days of prehistoric data`)
      await SystemLogger.logTradeEngine(
        `Loading ${this.settings.prehistoricDataDays} days of prehistoric market data...`,
        "info",
      )
      // Prehistoric data loading logic would go here
    }

    const connectionPromises = Array.from(this.connectionConfigs.values())
      .filter((config) => config.status === "connected")
      .map(async (config) => {
        try {
          const exchangeType = config.exchange.toLowerCase()
          const maxPositions = this.settings.maxPositionsPerExchange?.[exchangeType] || 100

          console.log(`[v0] Connecting to ${config.name} with max ${maxPositions} positions`)

          const api = createExchangeAPI(config)
          await api.connect()
          this.exchanges.set(config.id, api)
          this.positions.set(config.id, [])

          // Initialize connection health status
          this.healthStatus.components.connections.set(config.id, {
            status: "healthy",
            lastCycleDuration: 0,
            errorCount: 0,
            successRate: 100,
          })

          await SystemLogger.logConnection(
            `Connected successfully (max: ${maxPositions} positions)`,
            config.id,
            "info",
            { exchangeName: config.name, maxPositions },
          )
          return { success: true, id: config.id }
        } catch (error) {
          console.error(`[v0] Failed to connect to ${config.name}:`, error)
          await SystemLogger.logError(error, "trade-engine", `Failed to connect`, {
            connectionId: config.id,
            exchangeName: config.name,
          })
          // Consider setting connection status to 'error' if not already handled elsewhere
          // this.connectionConfigs.get(config.id)!.status = "error";
          return { success: false, id: config.id, error }
        }
      })

    const results = await Promise.allSettled(connectionPromises)
    const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length

    console.log(`[v0] Connected to ${successCount}/${connectionPromises.length} exchanges`)
    await SystemLogger.logTradeEngine(`Connected to ${successCount}/${connectionPromises.length} exchanges`, "info")

    this.startContinuousMonitoring()
    this.startHealthMonitoring()
    console.log("[v0] Global Trade Coordinator started successfully")
    await SystemLogger.logTradeEngine("Global Trade Coordinator started successfully", "info")
  }

  async pause(): Promise<void> {
    if (!this.running || this.paused) {
      console.log("[v0] Global Trade Coordinator not running or already paused")
      return
    }

    console.log("[v0] Pausing Global Trade Coordinator")
    await SystemLogger.logTradeEngine("Pausing Global Trade Coordinator", "info")

    this.paused = true
    this.pauseTime = new Date()

    await SystemLogger.logTradeEngine("Global Trade Coordinator paused", "info")
  }

  async resume(): Promise<void> {
    if (!this.running || !this.paused) {
      console.log("[v0] Global Trade Coordinator not paused")
      return
    }

    console.log("[v0] Resuming Global Trade Coordinator")
    await SystemLogger.logTradeEngine("Resuming Global Trade Coordinator", "info")

    this.paused = false
    this.pauseTime = undefined

    await SystemLogger.logTradeEngine("Global Trade Coordinator resumed", "info")
  }

  async stop(): Promise<void> {
    if (!this.running) {
      await SystemLogger.logTradeEngine("Global Trade Coordinator not running", "warn")
      return
    }

    await SystemLogger.logTradeEngine("Stopping Global Trade Coordinator", "info")
    this.running = false
    this.paused = false

    if (this.mainEngineInterval) {
      clearInterval(this.mainEngineInterval)
      this.mainEngineInterval = undefined
    }
    if (this.presetEngineInterval) {
      clearInterval(this.presetEngineInterval)
      this.presetEngineInterval = undefined
    }
    if (this.activeOrderInterval) {
      clearInterval(this.activeOrderInterval)
      this.activeOrderInterval = undefined
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }

    const disconnectPromises = Array.from(this.exchanges.entries()).map(async ([exchangeId, api]) => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Disconnect timeout")), 5000),
        )
        await Promise.race([api.disconnect(), timeoutPromise])
        await SystemLogger.logConnection(`Disconnected`, exchangeId, "info")
      } catch (error) {
        await SystemLogger.logError(error, "trade-engine", `Error disconnecting`, { connectionId: exchangeId })
      }
    })

    await Promise.allSettled(disconnectPromises)

    this.exchanges.clear()
    this.statsCache = null
    await SystemLogger.logTradeEngine("Global Trade Coordinator stopped", "info")
  }

  isRunning(): boolean {
    return this.running
  }

  isPaused(): boolean {
    return this.paused
  }

  getStatus(): EngineStatus {
    const now = Date.now()
    if (this.statsCache && now - this.statsCache.timestamp < this.STATS_CACHE_TTL) {
      return this.statsCache.data
    }

    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0

    let totalProfit = 0
    let totalPositions = 0

    for (const positions of this.positions.values()) {
      totalProfit += positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0)
      totalPositions += positions.length
    }

    const connections = new Map<string, ConnectionStatus>()
    for (const connectionId of this.connectionConfigs.keys()) {
      const status = this.getConnectionStatus(connectionId)
      if (status) {
        connections.set(connectionId, status)
      }
    }

    const status = {
      running: this.running,
      paused: this.paused,
      connectedExchanges: this.exchanges.size,
      activePositions: totalPositions,
      totalProfit,
      uptime,
      lastUpdate: new Date(),
      connections,
      cycleStats: {
        mainEngineCycleCount: this.cycleStats.mainEngineCycleCount,
        presetEngineCycleCount: this.cycleStats.presetEngineCycleCount,
        activeOrderCycleCount: this.cycleStats.activeOrderCycleCount,
        avgMainCycleDuration:
          this.cycleStats.mainEngineCycleCount > 0
            ? this.cycleStats.mainEngineTotalDuration / this.cycleStats.mainEngineCycleCount
            : 0,
        avgPresetCycleDuration:
          this.cycleStats.presetEngineCycleCount > 0
            ? this.cycleStats.presetEngineTotalDuration / this.cycleStats.presetEngineCycleCount
            : 0,
        avgOrderCycleDuration:
          this.cycleStats.activeOrderCycleCount > 0
            ? this.cycleStats.activeOrderTotalDuration / this.cycleStats.activeOrderCycleCount
            : 0,
      },
    }

    this.statsCache = { data: status, timestamp: now }

    return status
  }

  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus }
  }

  private startContinuousMonitoring(): void {
    const mainInterval = this.settings.mainEngineIntervalMs || 1000
    const presetInterval = this.settings.presetEngineIntervalMs || 1000
    const activeOrderInterval = this.settings.activeOrderHandlingIntervalMs || 300

    console.log("[v0] Starting continuous monitoring with intervals:", {
      mainEngine: `${mainInterval}ms`,
      presetEngine: `${presetInterval}ms`,
      activeOrderHandling: `${activeOrderInterval}ms`,
    })

    SystemLogger.logTradeEngine(
      `Starting monitoring - Main: ${mainInterval}ms, Preset: ${presetInterval}ms, Orders: ${activeOrderInterval}ms`,
      "info",
    )

    let isProcessingMain = false
    let isProcessingPreset = false
    let isProcessingOrders = false

    this.mainEngineInterval = setInterval(async () => {
      if (!this.running || this.paused || isProcessingMain) return
      isProcessingMain = true
      const startTime = Date.now()

      try {
        await Promise.allSettled([this.processIndications(), this.executeMainStrategies(), this.updateStatistics()])

        const duration = Date.now() - startTime

        this.cycleStats.mainEngineCycleCount++
        this.cycleStats.mainEngineTotalDuration += duration
        this.healthStatus.components.mainEngine.lastCycleDuration = duration
        this.healthStatus.components.mainEngine.successRate =
          ((this.cycleStats.mainEngineCycleCount - this.cycleStats.mainEngineErrors) /
            this.cycleStats.mainEngineCycleCount) *
          100

        await SystemLogger.logTradeEngine(`Main engine cycle completed in ${duration}ms`, "debug")
      } catch (error) {
        this.cycleStats.mainEngineErrors++
        this.healthStatus.components.mainEngine.errorCount++
        await SystemLogger.logError(error, "trade-engine", "Main engine error")
      } finally {
        isProcessingMain = false
      }
    }, mainInterval)

    this.presetEngineInterval = setInterval(async () => {
      if (!this.running || this.paused || isProcessingPreset) return
      isProcessingPreset = true
      const startTime = Date.now()

      try {
        await this.executePresetStrategies()

        const duration = Date.now() - startTime

        this.cycleStats.presetEngineCycleCount++
        this.cycleStats.presetEngineTotalDuration += duration
        this.healthStatus.components.presetEngine.lastCycleDuration = duration
        this.healthStatus.components.presetEngine.successRate =
          ((this.cycleStats.presetEngineCycleCount - this.cycleStats.presetEngineErrors) /
            this.cycleStats.presetEngineCycleCount) *
          100

        await SystemLogger.logTradeEngine(`Preset engine cycle completed in ${duration}ms`, "debug")
      } catch (error) {
        this.cycleStats.presetEngineErrors++
        this.healthStatus.components.presetEngine.errorCount++
        await SystemLogger.logError(error, "trade-engine", "Preset engine error")
      } finally {
        isProcessingPreset = false
      }
    }, presetInterval)

    this.activeOrderInterval = setInterval(async () => {
      if (!this.running || this.paused || isProcessingOrders) return
      isProcessingOrders = true
      const startTime = Date.now()

      try {
        await this.managePositions()

        const duration = Date.now() - startTime

        this.cycleStats.activeOrderCycleCount++
        this.cycleStats.activeOrderTotalDuration += duration
        this.healthStatus.components.orderHandler.lastCycleDuration = duration
        this.healthStatus.components.orderHandler.successRate =
          ((this.cycleStats.activeOrderCycleCount - this.cycleStats.activeOrderErrors) /
            this.cycleStats.activeOrderCycleCount) *
          100

        if (duration > 500) {
          await SystemLogger.logTradeEngine(`Order handling took ${duration}ms (slow)`, "warn")
        }
      } catch (error) {
        this.cycleStats.activeOrderErrors++
        this.healthStatus.components.orderHandler.errorCount++
        await SystemLogger.logError(error, "trade-engine", "Order handling error")
      } finally {
        isProcessingOrders = false
      }
    }, activeOrderInterval)
  }

  private startHealthMonitoring(): void {
    const healthCheckInterval = 10000 // Check every 10 seconds

    console.log("[v0] Starting health monitoring (interval: 10s)")

    this.healthCheckInterval = setInterval(async () => {
      if (!this.running) return

      try {
        // Update component health statuses
        this.healthStatus.components.mainEngine.status = this.getComponentHealthStatus(
          this.healthStatus.components.mainEngine.successRate,
          this.healthStatus.components.mainEngine.lastCycleDuration,
          this.settings.mainEngineIntervalMs,
        )

        this.healthStatus.components.presetEngine.status = this.getComponentHealthStatus(
          this.healthStatus.components.presetEngine.successRate,
          this.healthStatus.components.presetEngine.lastCycleDuration,
          this.settings.presetEngineIntervalMs,
        )

        this.healthStatus.components.orderHandler.status = this.getComponentHealthStatus(
          this.healthStatus.components.orderHandler.successRate,
          this.healthStatus.components.orderHandler.lastCycleDuration,
          this.settings.activeOrderHandlingIntervalMs,
        )

        // Check connection health
        for (const [connectionId, api] of this.exchanges.entries()) {
          const health = await this.checkConnectionHealth(connectionId, api)
          this.healthStatus.components.connections.set(connectionId, health)
        }

        // Calculate overall health
        this.healthStatus.overall = this.calculateOverallHealth()
        this.healthStatus.lastCheck = new Date()

        // Log if health is degraded or unhealthy
        if (this.healthStatus.overall !== "healthy") {
          await SystemLogger.logTradeEngine(
            `Global Coordinator health: ${this.healthStatus.overall}`,
            this.healthStatus.overall === "degraded" ? "warn" : "error",
          )
        }
      } catch (error) {
        console.error("[v0] Health monitoring error:", error)
      }
    }, healthCheckInterval)
  }

  private getComponentHealthStatus(
    successRate: number,
    lastCycleDuration: number,
    expectedInterval: number,
  ): "healthy" | "degraded" | "unhealthy" {
    if (successRate < 80 || lastCycleDuration > expectedInterval * 3) {
      return "unhealthy"
    }
    if (successRate < 95 || lastCycleDuration > expectedInterval * 2) {
      return "degraded"
    }
    return "healthy"
  }

  private async checkConnectionHealth(connectionId: string, api: any): Promise<ComponentHealth> {
    try {
      // Simple ping check - try to get account info
      const startTime = Date.now()
      // await api.getBalance() // Uncomment when API supports it
      const duration = Date.now() - startTime

      return {
        status: duration < 1000 ? "healthy" : duration < 3000 ? "degraded" : "unhealthy",
        lastCycleDuration: duration,
        errorCount: 0,
        successRate: 100,
      }
    } catch (error) {
      return {
        status: "unhealthy",
        lastCycleDuration: 0,
        errorCount: 1,
        successRate: 0,
      }
    }
  }

  private calculateOverallHealth(): "healthy" | "degraded" | "unhealthy" {
    const components = [
      this.healthStatus.components.mainEngine.status,
      this.healthStatus.components.presetEngine.status,
      this.healthStatus.components.orderHandler.status,
      ...Array.from(this.healthStatus.components.connections.values()).map((c) => c.status),
    ]

    const unhealthyCount = components.filter((s) => s === "unhealthy").length
    const degradedCount = components.filter((s) => s === "degraded").length

    if (unhealthyCount > 0 || components.length === 0) return "unhealthy"
    if (degradedCount > 0) return "degraded"
    return "healthy"
  }

  private async processIndications(): Promise<void> {
    const indicationPromises = this.indications.map(async (indication) => {
      try {
        const pseudoPositions = await this.generatePseudoPositions(indication)
        ;(indication as any).positions = pseudoPositions
        ;(indication as any).profitFactor = this.calculateProfitFactor(pseudoPositions)
      } catch (error) {
        console.error(`[v0] Error processing indication ${indication.id}:`, error)
      }
    })

    await Promise.allSettled(indicationPromises)
  }

  private async executeMainStrategies(): Promise<void> {
    const activeConnections = Array.from(this.exchanges.keys())

    const strategyPromises = this.strategies
      .filter((strategy) => (strategy as any).type !== "preset")
      .flatMap((strategy) =>
        activeConnections.map(async (connectionId) => {
          try {
            const shouldExecute = await this.evaluateStrategy(strategy, connectionId)
            if (shouldExecute) {
              await this.executeStrategy(strategy, connectionId)
            }
          } catch (error) {
            console.error(`[v0] Error executing main strategy ${strategy.id} on ${connectionId}:`, error)
          }
        }),
      )

    await Promise.allSettled(strategyPromises)
  }

  private async executePresetStrategies(): Promise<void> {
    const activeConnections = Array.from(this.exchanges.keys())

    const strategyPromises = this.strategies
      .filter((strategy) => (strategy as any).type === "preset")
      .flatMap((strategy) =>
        activeConnections.map(async (connectionId) => {
          try {
            const shouldExecute = await this.evaluateStrategy(strategy, connectionId)
            if (shouldExecute) {
              await this.executeStrategy(strategy, connectionId)
            }
          } catch (error) {
            console.error(`[v0] Error executing preset strategy ${strategy.id} on ${connectionId}:`, error)
          }
        }),
      )

    await Promise.allSettled(strategyPromises)
  }

  private async managePositions(): Promise<void> {
    const connectionPromises = Array.from(this.positions.entries()).map(async ([connectionId, positions]) => {
      if (positions.length === 0) return

      const positionPromises = positions.map(async (position) => {
        try {
          await Promise.all([
            this.checkPositionConditions(position, connectionId),
            this.updatePositionData(position, connectionId),
          ])
        } catch (error) {
          console.error(`[v0] Error managing position ${position.id}:`, error)
        }
      })

      await Promise.allSettled(positionPromises)

      const profitableCount = positions.filter((p) => p.unrealizedPnl > 0).length
      const profitPercentage = (profitableCount / positions.length) * 100

      if (profitPercentage >= 20) {
        await this.rearrangePositions(connectionId)
      }
    })

    await Promise.allSettled(connectionPromises)
  }

  private async updateStatistics(): Promise<void> {
    const stats = {
      timestamp: new Date(),
      connections: Array.from(this.positions.entries()).map(([connectionId, positions]) => {
        const profitableCount = positions.filter((p) => p.unrealizedPnl > 0).length
        const totalProfit = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0)

        return {
          connectionId,
          totalPositions: positions.length,
          profitablePositions: profitableCount,
          totalProfit,
        }
      }),
      connectedExchanges: this.exchanges.size,
    }

    this.statsCache = null
  }

  private async generatePseudoPositions(indication: any): Promise<any[]> {
    const positions = []
    const indicationAny = indication as any
    const connectionId = indicationAny.connectionId
    const config = this.connectionConfigs.get(connectionId)
    const exchangeType = config?.exchange.toLowerCase()
    const exchangeMaxPositions = this.settings.maxPositionsPerExchange?.[exchangeType || ""] || 100

    const strategyType = indicationAny.strategyType || "main"

    let databaseLimit = 250 // Default

    switch (strategyType) {
      case "base":
        databaseLimit = this.settings.databaseSizeBase || 250
        break
      case "main":
        databaseLimit = this.settings.databaseSizeMain || 250
        break
      case "preset":
        databaseLimit = this.settings.databaseSizePreset || 250
        break
      case "real":
        databaseLimit = this.settings.databaseSizeReal || 250
        break
    }

    // This is NOT an overall position limit across configurations
    const maxPositions = Math.min(indicationAny.maxPositions || databaseLimit, exchangeMaxPositions, databaseLimit)

    const indicationType = indication.type
    const indicationInterval = this.getIndicationInterval(indicationType)
    const indicationTimeout = this.getIndicationTimeout(indicationType)
    const indicationRange = indicationAny.range || 10

    console.log(
      `[v0] Generating up to ${maxPositions} positions for ${strategyType} (database limit per config set) with ${indicationType} indication`,
    )

    const createdAt = new Date()

    for (let i = 0; i < maxPositions; i++) {
      const entryPrice = 50000 + (Math.random() - 0.5) * 1000
      const profitFactor = (Math.random() - 0.5) * 0.5

      positions.push({
        id: `pseudo-${indication.id}-${i}`,
        symbol: indication.symbol || "BTC/USDT",
        side: indication.type === "direction" ? indicationAny.direction || "long" : "long",
        size: indicationAny.positionSize || 100,
        entryPrice,
        unrealizedPnl: (Math.random() - 0.5) * 200,
        timestamp: createdAt,
        strategyType,

        // Indication tracking
        indication_type: indicationType,
        indication_range: indicationRange,
        indication_interval: indicationInterval,
        indication_timeout: indicationTimeout,

        // Strategy tracking
        strategy_interval: this.settings.mainEngineIntervalMs || 100,
        strategy_step: 1,

        // Time statistics
        position_age_seconds: 0,
        total_updates: 0,
        avg_update_interval: this.settings.mainEngineIntervalMs || 100,
        last_check_timestamp: createdAt.toISOString(),
        checks_per_minute: 60000 / (this.settings.mainEngineIntervalMs || 100),

        // Value statistics
        profit_factor: profitFactor,
        initial_profit_factor: profitFactor,
        max_profit_factor: profitFactor,
        min_profit_factor: profitFactor,
        avg_profit_factor: profitFactor,
        profit_factor_volatility: 0,
        price_updates_count: 0,
      })
    }

    return positions
  }

  private getIndicationInterval(indicationType: string): number {
    switch (indicationType) {
      case "direction":
        return this.settings.directionIndicationInterval || 100
      case "move":
        return this.settings.moveIndicationInterval || 100
      case "active":
        return this.settings.activeIndicationInterval || 100
      case "optimal":
        return this.settings.optimalIndicationInterval || 1000
      case "auto":
        return this.settings.autoIndicationInterval || 2000
      default:
        return 100
    }
  }

  private getIndicationTimeout(indicationType: string): number {
    switch (indicationType) {
      case "direction":
        return this.settings.directionIndicationTimeout || 5
      case "move":
        return this.settings.moveIndicationTimeout || 5
      case "active":
        return this.settings.activeIndicationTimeout || 3
      case "optimal":
        return this.settings.optimalIndicationTimeout || 10
      case "auto":
        return this.settings.autoIndicationTimeout || 10
      default:
        return 5
    }
  }

  private async updatePositionData(position: any, connectionId: string): Promise<void> {
    const now = new Date()
    const lastUpdate = position.last_check_timestamp ? new Date(position.last_check_timestamp) : now
    const intervalSinceLastUpdate = now.getTime() - lastUpdate.getTime()

    // Update time statistics
    position.position_age_seconds = Math.floor((now.getTime() - new Date(position.timestamp).getTime()) / 1000)
    position.last_update_interval = intervalSinceLastUpdate
    position.total_updates = (position.total_updates || 0) + 1
    position.avg_update_interval = (position.position_age_seconds * 1000) / position.total_updates
    position.last_check_timestamp = now.toISOString()
    position.checks_per_minute = position.total_updates / (position.position_age_seconds / 60)
    position.price_updates_count = (position.price_updates_count || 0) + 1

    // Update value statistics
    const currentProfitFactor = position.profit_factor || 0
    position.max_profit_factor = Math.max(position.max_profit_factor || currentProfitFactor, currentProfitFactor)
    position.min_profit_factor = Math.min(position.min_profit_factor || currentProfitFactor, currentProfitFactor)

    // Calculate running average and volatility
    const prevAvg = position.avg_profit_factor || currentProfitFactor
    position.avg_profit_factor = (prevAvg * (position.total_updates - 1) + currentProfitFactor) / position.total_updates

    // Simple volatility calculation (standard deviation approximation)
    const variance = Math.pow(currentProfitFactor - position.avg_profit_factor, 2)
    position.profit_factor_volatility = Math.sqrt(variance)

    // Existing update logic...
  }

  private calculateProfitFactor(positions: any[]): number {
    if (positions.length === 0) return 0

    const { totalProfit, totalLoss } = positions.reduce(
      (acc, p) => {
        if (p.unrealizedPnl > 0) {
          acc.totalProfit += p.unrealizedPnl
        } else {
          acc.totalLoss += Math.abs(p.unrealizedPnl)
        }
        return acc
      },
      { totalProfit: 0, totalLoss: 0 },
    )

    return totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0
  }

  private async evaluateStrategy(strategy: StrategyConfig, connectionId: string): Promise<boolean> {
    // This is a placeholder - implement actual strategy evaluation logic
    return Math.random() > 0.8
  }

  private async executeStrategy(strategy: StrategyConfig, connectionId: string): Promise<void> {
    console.log(`[v0] Executing strategy: ${strategy.name} on connection: ${connectionId}`)
  }

  private async checkPositionConditions(position: any, connectionId: string): Promise<void> {
    // Implement actual position condition checking logic
  }

  private async rearrangePositions(connectionId: string): Promise<void> {
    console.log(`[v0] Rearranging positions for connection ${connectionId} due to 20% profit threshold`)
  }
}

let globalCoordinator: GlobalTradeEngineCoordinator | null = null

export function getTradeEngine(): GlobalTradeEngineCoordinator | null {
  return globalCoordinator
}

export function getGlobalCoordinator(): GlobalTradeEngineCoordinator | null {
  return globalCoordinator
}

export function initializeTradeEngine(strategies: StrategyConfig[], indications: any): GlobalTradeEngineCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new GlobalTradeEngineCoordinator(strategies, indications)
  }
  return globalCoordinator
}

export function initializeGlobalCoordinator(
  strategies: StrategyConfig[],
  indications: any,
): GlobalTradeEngineCoordinator {
  return initializeTradeEngine(strategies, indications)
}
