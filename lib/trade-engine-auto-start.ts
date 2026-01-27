/**
 * Trade Engine Auto-Start Service
 * Automatically starts trade engines for all active and enabled connections
 */

import { getGlobalTradeEngineCoordinator } from "./trade-engine"
import { loadConnections, loadSettings } from "./file-storage"
import { SystemLogger } from "./system-logger"

let autoStartInitialized = false
let autoStartTimer: NodeJS.Timeout | null = null

/**
 * Check if auto-start service is initialized
 */
export function isAutoStartInitialized(): boolean {
  return autoStartInitialized
}

/**
 * Initialize and start trade engines automatically
 */
export async function initializeTradeEngineAutoStart(): Promise<void> {
  if (autoStartInitialized) {
    console.log("[v0] [AUTO-START] Already initialized")
    return
  }

  console.log("[v0] [AUTO-START] Starting auto-start service")

  try {
    // Get or create coordinator
    const coordinator = getGlobalTradeEngineCoordinator()
    console.log("[v0] [AUTO-START] Coordinator obtained")

    // Load connections
    const connections = loadConnections()
    console.log(`[v0] [AUTO-START] Loaded ${connections.length} connections from file`)

    // Filter for enabled and active connections
    const activeConnections = connections.filter((c) => {
      const isEnabled = c.is_enabled === true
      const isActive = c.is_active === true
      console.log(`[v0] [AUTO-START] Connection ${c.name}: enabled=${isEnabled}, active=${isActive}`)
      return isEnabled && isActive
    })

    console.log(`[v0] [AUTO-START] Found ${activeConnections.length} connections to start`)

    if (activeConnections.length === 0) {
      console.log("[v0] [AUTO-START] No enabled/active connections - skipping engine startup")
      autoStartInitialized = true
      startConnectionMonitoring()
      return
    }

    // Load settings
    const settings = loadSettings()
    const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
    const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
    const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

    console.log("[v0] [AUTO-START] Starting engines with intervals:", {
      indication: `${indicationInterval}s`,
      strategy: `${strategyInterval}s`,
      realtime: `${realtimeInterval}s`,
    })

    // Start engines
    let successCount = 0
    let failCount = 0

    for (const connection of activeConnections) {
      try {
        console.log(`[v0] [AUTO-START] Starting engine for ${connection.name} (${connection.exchange})`)

        await coordinator.startEngine(connection.id, {
          connectionId: connection.id,
          indicationInterval,
          strategyInterval,
          realtimeInterval,
        })

        await SystemLogger.logTradeEngine(
          `Auto-started engine for ${connection.name}`,
          "info",
          { connectionId: connection.id, exchange: connection.exchange }
        )

        successCount++
        console.log(`[v0] [AUTO-START] Engine started: ${connection.name}`)
      } catch (error) {
        failCount++
        console.error(`[v0] [AUTO-START] Failed to start ${connection.name}:`, error instanceof Error ? error.message : String(error))

        await SystemLogger.logError(
          error,
          "trade-engine",
          `Auto-start failed for ${connection.name}`
        )
      }
    }

    console.log(`[v0] [AUTO-START] Complete: ${successCount} started, ${failCount} failed`)

    if (successCount > 0) {
      await SystemLogger.logSystem(
        `Trade engines auto-started: ${successCount}/${activeConnections.length}`,
        "info"
      )
    }

    autoStartInitialized = true
    startConnectionMonitoring()
  } catch (error) {
    console.error("[v0] [AUTO-START] Initialization failed:", error instanceof Error ? error.message : String(error))
    await SystemLogger.logError(error, "trade-engine", "Auto-start failed")
    autoStartInitialized = true
  }
}

/**
 * Monitor for connection changes and auto-start new engines
 */
function startConnectionMonitoring(): void {
  console.log("[v0] Starting connection monitoring for auto-start...")

  // Check every 30 seconds for new active connections
  autoStartTimer = setInterval(async () => {
    try {
      const coordinator = getGlobalTradeEngineCoordinator()
      const connections = loadConnections()
      const activeConnections = connections.filter((c) => c.is_enabled && c.is_active)

      // Get currently running engines
      const currentEngineCount = coordinator.getActiveEngineCount()

      // If we have more active connections than running engines, start the missing ones
      if (activeConnections.length > currentEngineCount) {
        console.log(`[v0] Detected ${activeConnections.length - currentEngineCount} new active connections`)

        const settings = loadSettings()
        const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
        const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
        const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

        for (const connection of activeConnections) {
          // Check if engine is already running
          const manager = coordinator.getEngineManager(connection.id)
          if (!manager) {
            console.log(`[v0] Auto-starting engine for newly enabled connection: ${connection.name}`)

            try {
              await coordinator.startEngine(connection.id, {
                connectionId: connection.id,
                indicationInterval,
                strategyInterval,
                realtimeInterval,
              })

              await SystemLogger.logTradeEngine(
                `Trade engine auto-started for newly enabled connection: ${connection.name}`,
                "info",
                { connectionId: connection.id }
              )
            } catch (error) {
              console.error(`[v0] Failed to auto-start engine for ${connection.name}:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Connection monitoring error:", error)
    }
  }, 30000) // Check every 30 seconds
}

/**
 * Stop the auto-start service
 */
export function stopTradeEngineAutoStart(): void {
  if (autoStartTimer) {
    clearInterval(autoStartTimer)
    autoStartTimer = null
    console.log("[v0] Trade engine auto-start monitoring stopped")
  }
  autoStartInitialized = false
}

/**
 * Monitor for new connections and auto-start their engines
 */
function startConnectionMonitoring() {
  console.log("[v0] [AUTO-START] Starting connection monitor (30s interval)")
  
  let lastConnectionCount = 0

  const interval = setInterval(async () => {
    try {
      const connections = loadConnections()
      const activeConnections = connections.filter((c) => c.is_enabled && c.is_active)

      if (activeConnections.length !== lastConnectionCount) {
        console.log(`[v0] [AUTO-START] Connection count changed: ${lastConnectionCount} → ${activeConnections.length}`)
        lastConnectionCount = activeConnections.length
      }

      // Find new connections not yet started
      const coordinator = getGlobalTradeEngineCoordinator()
      const settings = loadSettings()
      const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
      const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
      const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

      for (const connection of activeConnections) {
        const manager = coordinator.getEngineManager(connection.id)
        if (!manager) {
          try {
            console.log(`[v0] [AUTO-START] Found new connection: ${connection.name} - starting engine`)

            await coordinator.startEngine(connection.id, {
              connectionId: connection.id,
              indicationInterval,
              strategyInterval,
              realtimeInterval,
            })

            console.log(`[v0] [AUTO-START] New engine started: ${connection.name}`)
          } catch (error) {
            console.warn(`[v0] [AUTO-START] Failed to start new connection ${connection.name}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn("[v0] [AUTO-START] Monitor error:", error instanceof Error ? error.message : String(error))
    }
  }, 30000)

  return interval
}
