import { query, execute } from "@/lib/db"
import { db } from "@/lib/database"

export class DataCleanupManager {
  private static instance: DataCleanupManager | null = null
  private cleanupInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private dbManager = db

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): DataCleanupManager {
    if (!DataCleanupManager.instance) {
      DataCleanupManager.instance = new DataCleanupManager()
    }
    return DataCleanupManager.instance
  }

  public static getOptimalQueryWindow(indicationType: string): number {
    // Return time window in minutes based on indication type
    switch (indicationType) {
      case "direction":
        return 60 // 1 hour for direction calculations
      case "move":
        return 30 // 30 minutes for move calculations
      case "optimal":
        return 120 // 2 hours for optimal calculations
      case "active_advanced":
        return 90 // 1.5 hours for active advanced calculations
      default:
        return 60 // Default 1 hour
    }
  }

  public async start(): Promise<void> {
    return this.startAutoCleanup()
  }

  public stop(): void {
    this.stopAutoCleanup()
  }

  public stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.isRunning = false
    console.log("[v0] Data cleanup manager stopped")
  }

  public async startAutoCleanup(): Promise<void> {
    console.log("[v0] Starting data cleanup manager...")

    const settingsRows = await query<{ value: string }>(
      `SELECT value FROM system_settings WHERE key = 'cleanupIntervalHours'`,
    )
    const intervalHours = settingsRows[0] ? Number.parseInt(settingsRows[0].value) : 24

    const enabledRows = await query<{ value: string }>(
      `SELECT value FROM system_settings WHERE key = 'enableAutoCleanup'`,
    )
    const enabled = enabledRows[0]?.value === "true"

    if (!enabled) {
      console.log("[v0] Auto cleanup is disabled in settings")
      return
    }

    this.isRunning = true

    // Run cleanup immediately
    await this.runCleanup()

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(
      async () => {
        await this.runCleanup()
      },
      intervalHours * 60 * 60 * 1000,
    ) // Convert hours to milliseconds

    console.log(`[v0] Auto cleanup scheduled every ${intervalHours} hour(s)`)
  }

  private async runCleanup(): Promise<void> {
    console.log("[v0] Running data cleanup...")

    try {
      const settings = await this.dbManager.getAllSettings()
      const maxPositionAge = Number.parseInt(settings.maxPositionAgeDays || "90")
      const maxMarketDataAge = Number.parseInt(settings.maxMarketDataDays || "30")

      const now = new Date()
      const positionCutoff = new Date(now.getTime() - maxPositionAge * 24 * 60 * 60 * 1000)
      const marketDataCutoff = new Date(now.getTime() - maxMarketDataAge * 24 * 60 * 60 * 1000)

      // Archive and delete old positions
      console.log(`[v0] Archiving positions older than ${positionCutoff.toISOString()}`)

      await execute(
        `INSERT INTO archived_positions 
         SELECT *, NOW() as archived_at FROM positions 
         WHERE closed_at < ? AND status = 'closed'`,
        [positionCutoff.toISOString()],
      )

      const positionsDeleted = await execute(
        `DELETE FROM positions 
         WHERE closed_at < ? AND status = 'closed'`,
        [positionCutoff.toISOString()],
      )

      console.log(`[v0] Archived and deleted ${positionsDeleted.rowCount} old positions`)

      // Archive and delete old market data
      console.log(`[v0] Archiving market data older than ${marketDataCutoff.toISOString()}`)

      await execute(
        `INSERT INTO archived_market_data 
         SELECT *, NOW() as archived_at FROM market_data 
         WHERE timestamp < ?`,
        [marketDataCutoff.toISOString()],
      )

      const marketDataDeleted = await execute(`DELETE FROM market_data WHERE timestamp < ?`, [
        marketDataCutoff.toISOString(),
      ])

      console.log(`[v0] Archived and deleted ${marketDataDeleted.rowCount} old market data records`)
    } catch (error) {
      console.error("[v0] Error during cleanup:", error)
    }
  }

  public async cleanupHistoricalDataPerExchange(connectionId: string, retentionHours: number): Promise<number> {
    console.log(`[v0] Cleaning up historical data for connection ${connectionId} (retention: ${retentionHours}h)`)

    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000)

    // Archive old data before deletion
    await execute(
      `INSERT INTO archived_market_data (connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, archived_at)
       SELECT connection_id, symbol, timeframe, timestamp, open, high, low, close, volume, NOW()
       FROM market_data
       WHERE connection_id = ? AND timestamp < ?`,
      [connectionId, cutoffTime.toISOString()],
    )

    // Delete old data
    const result = await execute(
      `DELETE FROM market_data 
       WHERE connection_id = ? AND timestamp < ?`,
      [connectionId, cutoffTime.toISOString()],
    )

    console.log(`[v0] Cleaned up ${result.rowCount} historical records for connection ${connectionId}`)

    return result.rowCount
  }

  public isCleanupRunning(): boolean {
    return this.isRunning
  }
}

export function getDataCleanupManager(): DataCleanupManager {
  return DataCleanupManager.getInstance()
}

export const dataCleanupManager = DataCleanupManager.getInstance()
