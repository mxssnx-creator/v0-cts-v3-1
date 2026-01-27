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
 * Initialize and start trade engines automatically
 */
export async function initializeTradeEngineAutoStart(): Promise<void> {
  if (autoStartInitialized) {
    console.log("[v0] Trade engine auto-start already initialized")
    return
  }

  console.log("[v0] Initializing trade engine auto-start service...")

  try {
    // Wait a bit for system to stabilize
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Get or create global coordinator
    const coordinator = getGlobalTradeEngineCoordinator()

    console.log("[v0] Checking for active connections to auto-start...")

    // Load connections from file storage
    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_enabled && c.is_active)

    console.log(`[v0] Found ${activeConnections.length} active and enabled connections`)

    if (activeConnections.length === 0) {
      console.log("[v0] No active connections found - trade engines will start when connections are enabled")
      autoStartInitialized = true
      startConnectionMonitoring()
      return
    }

    // Load settings for intervals
    const settings = loadSettings()
    const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
    const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
    const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

    console.log("[v0] Starting trade engines with intervals:", {
      indication: indicationInterval + "s",
      strategy: strategyInterval + "s",
      realtime: realtimeInterval + "s",
    })

    // Start engines for each active connection
    let successCount = 0
    let failCount = 0

    for (const connection of activeConnections) {
      try {
        console.log(`[v0] Auto-starting trade engine for: ${connection.name} (${connection.exchange})`)

        await coordinator.startEngine(connection.id, {
          connectionId: connection.id,
          indicationInterval,
          strategyInterval,
          realtimeInterval,
        })

        await SystemLogger.logTradeEngine(
          `Trade engine auto-started for ${connection.name}`,
          "info",
          {
            connectionId: connection.id,
            exchange: connection.exchange,
          }
        )

        successCount++
        console.log(`[v0] ✓ Trade engine started for ${connection.name}`)
      } catch (error) {
        failCount++
        console.error(`[v0] ✗ Failed to start trade engine for ${connection.name}:`, error)

        await SystemLogger.logError(
          error,
          "trade-engine-auto-start",
          `Auto-start failed for ${connection.name}`
        )
      }
    }

    console.log(`[v0] Trade engine auto-start complete: ${successCount} started, ${failCount} failed`)

    if (successCount > 0) {
      await SystemLogger.logSystem(
        `Trade engines auto-started: ${successCount}/${activeConnections.length} connections`,
        "info"
      )
    }

    autoStartInitialized = true

    // Start monitoring for connection changes
    startConnectionMonitoring()
  } catch (error) {
    console.error("[v0] Trade engine auto-start initialization failed:", error)
    await SystemLogger.logError(error, "trade-engine-auto-start", "Initialization failed")

    // Still mark as initialized to prevent retries
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
 * Check if auto-start is initialized
 */
export function isAutoStartInitialized(): boolean {
  return autoStartInitialized
}
