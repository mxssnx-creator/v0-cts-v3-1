import { query, execute } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

/**
 * Position Threshold Manager
 *
 * Core logic for managing position database sizes with threshold-based cleanup.
 * Each configuration (Base/Main/Real/Preset) can have independent position limits.
 *
 * Example: If position_limit = 250 and threshold = 20%
 * - Actual storage limit = 250 * 1.2 = 300 positions
 * - When reaching 300, reorganize back to 250 keeping most recent
 *
 * High-performance implementation with:
 * - Batch operations for cleanup
 * - Indexed queries for fast lookups
 * - Parallel processing per connection
 * - Minimal locking with optimistic updates
 */

export interface ThresholdConfig {
  basePositionLimit: number
  mainPositionLimit: number
  realPositionLimit: number
  presetPositionLimit: number
  thresholdPercent: number
  maxDatabaseSizeGB: number
}

export class PositionThresholdManager {
  private static instance: PositionThresholdManager | null = null
  private isRunning = false
  private monitorInterval: NodeJS.Timeout | null = null

  private constructor() {}

  public static getInstance(): PositionThresholdManager {
    if (!PositionThresholdManager.instance) {
      PositionThresholdManager.instance = new PositionThresholdManager()
    }
    return PositionThresholdManager.instance
  }

  /**
   * Calculate actual storage limit with threshold
   */
  private calculateStorageLimit(positionLimit: number, thresholdPercent: number): number {
    return Math.ceil(positionLimit * (1 + thresholdPercent / 100))
  }

  /**
   * Start monitoring and automatic cleanup
   */
  public async startMonitoring(intervalMs = 60000): Promise<void> {
    if (this.isRunning) {
      await SystemLogger.logSystem("Position threshold monitoring already running", "info")
      return
    }

    this.isRunning = true
    await SystemLogger.logSystem("Starting position threshold monitoring", "info")

    // Run initial check
    await this.checkAndCleanupAllConfigurations()

    // Schedule periodic checks
    this.monitorInterval = setInterval(async () => {
      await this.checkAndCleanupAllConfigurations()
    }, intervalMs)
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    this.isRunning = false
    SystemLogger.logSystem("Position threshold monitoring stopped", "info")
  }

  /**
   * Check and cleanup all configuration types
   */
  public async checkAndCleanupAllConfigurations(): Promise<void> {
    try {
      const config = await this.getThresholdConfig()

      // Process each configuration type in parallel for high performance
      await Promise.allSettled([
        this.checkAndCleanupConfiguration("base_pseudo_positions", config.basePositionLimit, config.thresholdPercent),
        this.checkAndCleanupConfiguration("pseudo_positions", config.mainPositionLimit, config.thresholdPercent),
        this.checkAndCleanupConfiguration("real_pseudo_positions", config.realPositionLimit, config.thresholdPercent),
        this.checkAndCleanupConfiguration(
          "preset_pseudo_positions",
          config.presetPositionLimit,
          config.thresholdPercent,
        ),
      ])

      // Check overall database size
      await this.checkDatabaseSize(config.maxDatabaseSizeGB)
    } catch (error) {
      await SystemLogger.logError(error, "system", "Position threshold check")
    }
  }

  /**
   * Check and cleanup a specific configuration type
   */
  private async checkAndCleanupConfiguration(
    tableName: string,
    positionLimit: number,
    thresholdPercent: number,
  ): Promise<void> {
    const storageLimit = this.calculateStorageLimit(positionLimit, thresholdPercent)

    // Get all connections that need cleanup
    const connections = await query<{ connection_id: string; count: number }>(
      `SELECT connection_id, COUNT(*) as count 
       FROM ${tableName} 
       WHERE status IN ('active', 'closed')
       GROUP BY connection_id 
       HAVING COUNT(*) > $1`,
      [storageLimit],
    )

    if (connections.length === 0) {
      return
    }

    await SystemLogger.logSystem(`Threshold exceeded for ${tableName}`, "info", {
      affectedConnections: connections.length,
      storageLimit,
      positionLimit,
    })

    // Process each connection in parallel
    await Promise.allSettled(
      connections.map((conn) =>
        this.reorganizePositionsForConnection(tableName, conn.connection_id, positionLimit, storageLimit),
      ),
    )
  }

  /**
   * Reorganize positions for a specific connection
   * Keep only the most recent positions up to the base limit
   */
  private async reorganizePositionsForConnection(
    tableName: string,
    connectionId: string,
    targetLimit: number,
    currentLimit: number,
  ): Promise<void> {
    try {
      await SystemLogger.logSystem(`Reorganizing ${tableName} for connection ${connectionId}`, "info", {
        targetLimit,
        currentLimit,
      })

      // Step 1: Archive old positions before deletion
      await execute(
        `INSERT INTO archived_positions 
         (original_id, connection_id, table_name, symbol, status, entry_price, current_price, 
          profit_factor, position_cost, created_at, closed_at, archived_at, position_data)
         SELECT id, connection_id, $1, symbol, status, entry_price, current_price, 
                profit_factor, position_cost, created_at, closed_at, NOW(), 
                row_to_json(${tableName}.*)
         FROM ${tableName}
         WHERE connection_id = $2 
         AND id NOT IN (
           SELECT id FROM ${tableName}
           WHERE connection_id = $2
           ORDER BY 
             CASE WHEN status = 'active' THEN 0 ELSE 1 END,
             created_at DESC
           LIMIT $3
         )`,
        [tableName, connectionId, targetLimit],
      )

      // Step 2: Delete old positions (keeping only the most recent up to targetLimit)
      const deleted = await execute(
        `DELETE FROM ${tableName}
         WHERE connection_id = $1 
         AND id NOT IN (
           SELECT id FROM ${tableName}
           WHERE connection_id = $1
           ORDER BY 
             CASE WHEN status = 'active' THEN 0 ELSE 1 END,
             created_at DESC
           LIMIT $2
         )`,
        [connectionId, targetLimit],
      )

      await SystemLogger.logSystem(`Reorganization complete for ${tableName}`, "info", {
        connectionId,
        deletedCount: deleted.rowCount || 0,
        remainingLimit: targetLimit,
      })

      // Step 3: Update cleanup log
      await execute(
        `INSERT INTO data_cleanup_log 
         (cleanup_type, table_name, connection_id, records_cleaned, records_archived, 
          cleanup_started_at, cleanup_completed_at, status)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)`,
        ["threshold_reorganization", tableName, connectionId, deleted.rowCount || 0, deleted.rowCount || 0, "success"],
      )
    } catch (error) {
      await SystemLogger.logError(error, "database", `Reorganize ${tableName} for ${connectionId}`)

      // Log failure
      await execute(
        `INSERT INTO data_cleanup_log 
         (cleanup_type, table_name, connection_id, records_cleaned, cleanup_started_at, 
          cleanup_completed_at, status, error_message)
         VALUES ($1, $2, $3, 0, NOW(), NOW(), $4, $5)`,
        ["threshold_reorganization", tableName, connectionId, "failed", String(error)],
      )
    }
  }

  /**
   * Check overall database size and trigger cleanup if needed
   */
  private async checkDatabaseSize(maxSizeGB: number): Promise<void> {
    try {
      const sizeResult = await query<{ size_mb: number }>(
        `SELECT pg_database_size(current_database()) / 1024.0 / 1024.0 as size_mb`,
      )

      if (sizeResult.length === 0) return

      const currentSizeMB = sizeResult[0].size_mb
      const currentSizeGB = currentSizeMB / 1024
      const maxSizeMB = maxSizeGB * 1024

      await SystemLogger.logSystem("Database size check", "info", {
        currentSizeMB: currentSizeMB.toFixed(2),
        maxSizeMB: maxSizeMB.toFixed(2),
        utilizationPercent: ((currentSizeMB / maxSizeMB) * 100).toFixed(2),
      })

      if (currentSizeMB > maxSizeMB * 0.9) {
        await SystemLogger.logSystem("Database approaching size limit", "warn", {
          currentSizeGB: currentSizeGB.toFixed(2),
          maxSizeGB,
        })

        // Trigger aggressive cleanup
        await this.aggressiveCleanup()
      }
    } catch (error) {
      await SystemLogger.logError(error, "database", "Database size check")
    }
  }

  /**
   * Aggressive cleanup when database size limit is approached
   */
  private async aggressiveCleanup(): Promise<void> {
    await SystemLogger.logSystem("Starting aggressive database cleanup", "warn")

    try {
      // Archive and delete very old archived positions (>90 days)
      await execute(
        `DELETE FROM archived_positions 
         WHERE archived_at < NOW() - INTERVAL '90 days'`,
      )

      // Archive and delete old market data (>30 days)
      await execute(
        `DELETE FROM archived_market_data 
         WHERE archived_at < NOW() - INTERVAL '30 days'`,
      )

      // Clean up old logs (>30 days)
      await execute(
        `DELETE FROM logs 
         WHERE timestamp < NOW() - INTERVAL '30 days'`,
      )

      // Clean up old cleanup logs (>90 days)
      await execute(
        `DELETE FROM data_cleanup_log 
         WHERE cleanup_completed_at < NOW() - INTERVAL '90 days'`,
      )

      // Vacuum database to reclaim space
      await execute(`VACUUM ANALYZE`)

      await SystemLogger.logSystem("Aggressive cleanup completed", "info")
    } catch (error) {
      await SystemLogger.logError(error, "database", "Aggressive cleanup")
    }
  }

  /**
   * Get current threshold configuration from settings
   */
  private async getThresholdConfig(): Promise<ThresholdConfig> {
    const settings = await query<{ key: string; value: string }>(
      `SELECT key, value FROM system_settings 
       WHERE key IN ('databaseSizeBase', 'databaseSizeMain', 'databaseSizeReal', 
                     'databaseSizePreset', 'databaseThresholdPercent', 'maxDatabaseSizeGB')`,
    )

    const config: ThresholdConfig = {
      basePositionLimit: 250,
      mainPositionLimit: 250,
      realPositionLimit: 250,
      presetPositionLimit: 250,
      thresholdPercent: 20,
      maxDatabaseSizeGB: 20,
    }

    for (const setting of settings) {
      const value = Number.parseInt(setting.value, 10)
      switch (setting.key) {
        case "databaseSizeBase":
          config.basePositionLimit = value
          break
        case "databaseSizeMain":
          config.mainPositionLimit = value
          break
        case "databaseSizeReal":
          config.realPositionLimit = value
          break
        case "databaseSizePreset":
          config.presetPositionLimit = value
          break
        case "databaseThresholdPercent":
          config.thresholdPercent = value
          break
        case "maxDatabaseSizeGB":
          config.maxDatabaseSizeGB = value
          break
      }
    }

    return config
  }

  /**
   * Manually trigger cleanup for a specific connection
   */
  public async manualCleanup(connectionId: string): Promise<void> {
    const config = await this.getThresholdConfig()

    await Promise.allSettled([
      this.reorganizePositionsForConnection(
        "base_pseudo_positions",
        connectionId,
        config.basePositionLimit,
        this.calculateStorageLimit(config.basePositionLimit, config.thresholdPercent),
      ),
      this.reorganizePositionsForConnection(
        "pseudo_positions",
        connectionId,
        config.mainPositionLimit,
        this.calculateStorageLimit(config.mainPositionLimit, config.thresholdPercent),
      ),
      this.reorganizePositionsForConnection(
        "real_pseudo_positions",
        connectionId,
        config.realPositionLimit,
        this.calculateStorageLimit(config.realPositionLimit, config.thresholdPercent),
      ),
      this.reorganizePositionsForConnection(
        "preset_pseudo_positions",
        connectionId,
        config.presetPositionLimit,
        this.calculateStorageLimit(config.presetPositionLimit, config.thresholdPercent),
      ),
    ])
  }

  /**
   * Get statistics for position counts per connection
   */
  public async getPositionStatistics(): Promise<any> {
    const tables = ["base_pseudo_positions", "pseudo_positions", "real_pseudo_positions", "preset_pseudo_positions"]
    const stats: any = {}

    for (const table of tables) {
      const results = await query(
        `SELECT connection_id, 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE status = 'closed') as closed
         FROM ${table}
         GROUP BY connection_id`,
      )
      stats[table] = results
    }

    return stats
  }
}

export const positionThresholdManager = PositionThresholdManager.getInstance()
