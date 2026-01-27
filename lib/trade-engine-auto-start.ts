/**
 * Trade Engine Auto-Start Service
 * Automatically starts trade engines for enabled/active connections
 */

import { getGlobalTradeEngineCoordinator } from "./trade-engine"
import { loadConnections, loadSettings } from "./file-storage"
import { SystemLogger } from "./system-logger"

let autoStartInitialized = false
let autoStartTimer: NodeJS.Timeout | null = null

export function isAutoStartInitialized(): boolean {
  return autoStartInitialized
}

/**
 * Initialize and start trade engines automatically
 */
export async function initializeTradeEngineAutoStart(): Promise<void> {
  if (autoStartInitialized) {
    return
  }

  try {
    const coordinator = getGlobalTradeEngineCoordinator()
    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_enabled === true && c.is_active === true)

    if (activeConnections.length === 0) {
      autoStartInitialized = true
      startConnectionMonitoring()
      return
    }

    const settings = loadSettings()
    const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
    const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
    const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

    let successCount = 0

    for (const connection of activeConnections) {
      try {
        await coordinator.startEngine(connection.id, {
          connectionId: connection.id,
          indicationInterval,
          strategyInterval,
          realtimeInterval,
        })
        successCount++

        await SystemLogger.logTradeEngine(
          `Auto-started engine for ${connection.name}`,
          "info",
          { connectionId: connection.id }
        )
      } catch (error) {
        await SystemLogger.logError(error, "trade-engine", `Failed to start ${connection.name}`)
      }
    }

    autoStartInitialized = true
    startConnectionMonitoring()
  } catch (error) {
    await SystemLogger.logError(error, "trade-engine", "Auto-start failed")
    autoStartInitialized = true
  }
}

/**
 * Monitor for connection changes and auto-start new engines
 */
function startConnectionMonitoring(): void {
  let lastConnectionCount = 0

  autoStartTimer = setInterval(async () => {
    try {
      const connections = loadConnections()
      const activeConnections = connections.filter((c) => c.is_enabled && c.is_active)

      if (activeConnections.length !== lastConnectionCount) {
        lastConnectionCount = activeConnections.length
      }

      const coordinator = getGlobalTradeEngineCoordinator()
      const settings = loadSettings()
      const indicationInterval = settings.mainEngineIntervalMs ? settings.mainEngineIntervalMs / 1000 : 5
      const strategyInterval = settings.strategyUpdateIntervalMs ? settings.strategyUpdateIntervalMs / 1000 : 10
      const realtimeInterval = settings.realtimeIntervalMs ? settings.realtimeIntervalMs / 1000 : 3

      for (const connection of activeConnections) {
        const manager = coordinator.getEngineManager(connection.id)
        if (!manager) {
          try {
            await coordinator.startEngine(connection.id, {
              connectionId: connection.id,
              indicationInterval,
              strategyInterval,
              realtimeInterval,
            })
          } catch (error) {
            // Ignore new connection startup errors
          }
        }
      }
    } catch (error) {
      // Ignore monitoring errors
    }
  }, 30000)
}

/**
 * Stop the auto-start service
 */
export function stopTradeEngineAutoStart(): void {
  if (autoStartTimer) {
    clearInterval(autoStartTimer)
    autoStartTimer = null
  }
  autoStartInitialized = false
}
