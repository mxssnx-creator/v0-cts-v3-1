/**
 * Strategy Processor
 * Processes strategies asynchronously for symbols
 */

import { sql } from "@/lib/db"

export class StrategyProcessor {
  private connectionId: string
  private strategyCache: Map<string, { signal: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60000 // 60 seconds

  constructor(connectionId: string) {
    this.connectionId = connectionId
  }

  /**
   * Process strategy for a symbol in real-time
   */
  async processStrategy(symbol: string): Promise<void> {
    try {
      console.log(`[v0] Processing strategy for ${symbol}`)

      const indications = await this.getActiveIndications(symbol)

      if (indications.length === 0) {
        return
      }

      const settings = await this.getStrategySettings()

      const batchSize = 5
      for (let i = 0; i < indications.length; i += batchSize) {
        const batch = indications.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (indication) => {
            const strategySignal = await this.evaluateStrategy(symbol, indication, settings)

            if (strategySignal && strategySignal.profit_factor >= settings.minProfitFactor) {
              await this.createPseudoPosition(symbol, indication, strategySignal)
            }
          }),
        )
      }
    } catch (error) {
      console.error(`[v0] Failed to process strategy for ${symbol}:`, error)
    }
  }

  /**
   * Process historical strategies for prehistoric data
   */
  async processHistoricalStrategies(symbol: string, start: Date, end: Date): Promise<void> {
    try {
      console.log(`[v0] Processing historical strategies for ${symbol}`)

      // Get historical indications
      const indications = await this.getHistoricalIndications(symbol, start, end)

      // Get strategy settings
      const settings = await this.getStrategySettings()

      let recordsProcessed = 0

      // Evaluate each indication
      for (const indication of indications) {
        const strategySignal = await this.evaluateStrategy(symbol, indication, settings)

        if (strategySignal && strategySignal.profit_factor >= settings.minProfitFactor) {
          // Create historical pseudo position
          await this.createPseudoPosition(symbol, indication, strategySignal, indication.calculated_at)
          recordsProcessed++
        }
      }

      console.log(`[v0] Processed ${recordsProcessed} historical strategies for ${symbol}`)
    } catch (error) {
      console.error(`[v0] Failed to process historical strategies for ${symbol}:`, error)
    }
  }

  /**
   * Evaluate strategy based on indication
   */
  private async evaluateStrategy(symbol: string, indication: any, settings: any): Promise<any> {
    // Determine which strategies apply based on indication type and settings
    const strategies: any[] = []

    // Trailing strategy (Additional category) - enhances profit taking
    if (settings.trailingEnabled && indication.profit_factor >= 0.8) {
      const trailingSignal = this.evaluateTrailingStrategy(indication, settings)
      if (trailingSignal) strategies.push(trailingSignal)
    }

    // Block strategy (Adjust category) - position sizing adjustment
    if (settings.blockEnabled && indication.confidence >= 60) {
      const blockSignal = this.evaluateBlockStrategy(indication, settings)
      if (blockSignal) strategies.push(blockSignal)
    }

    // DCA strategy (Adjust category) - dollar cost averaging
    if (settings.dcaEnabled && indication.profit_factor >= 0.5) {
      const dcaSignal = this.evaluateDCAStrategy(indication, settings)
      if (dcaSignal) strategies.push(dcaSignal)
    }

    // Return the best strategy based on profit factor
    if (strategies.length === 0) return null

    return strategies.sort((a, b) => b.profit_factor - a.profit_factor)[0]
  }

  private evaluateTrailingStrategy(indication: any, settings: any): any {
    const direction = indication.metadata?.direction || "long"
    const baseTP = 1.5 + indication.profit_factor
    const baseSL = 0.5 + (1 - indication.profit_factor) * 0.5

    return {
      strategy: "trailing",
      category: "additional", // Trailing is in "Additional" category
      side: direction,
      entry_price: indication.value,
      takeprofit_factor: baseTP,
      stoploss_ratio: baseSL,
      profit_factor: indication.profit_factor * 1.2, // Trailing bonus
      trailing_enabled: true,
      trail_start: 1.0, // Start trailing at 1% profit
      trail_stop: 0.5, // Trail by 0.5%
    }
  }

  private evaluateBlockStrategy(indication: any, settings: any): any {
    const direction = indication.metadata?.direction || "long"
    const confidenceFactor = indication.confidence / 100

    // Block strategy adjusts position size based on confidence
    const adjustedTP = 1.2 + confidenceFactor
    const adjustedSL = 0.8 - confidenceFactor * 0.3

    return {
      strategy: "block",
      category: "adjust", // Block is in "Adjust" category
      side: direction,
      entry_price: indication.value,
      takeprofit_factor: adjustedTP,
      stoploss_ratio: adjustedSL,
      profit_factor: indication.profit_factor * (0.8 + confidenceFactor * 0.4),
      trailing_enabled: false,
      block_size: Math.ceil(confidenceFactor * 5), // 1-5 blocks based on confidence
    }
  }

  private evaluateDCAStrategy(indication: any, settings: any): any {
    const direction = indication.metadata?.direction || "long"

    // DCA strategy for averaging into positions
    return {
      strategy: "dca",
      category: "adjust", // DCA is in "Adjust" category
      side: direction,
      entry_price: indication.value,
      takeprofit_factor: 2.0, // Higher TP for DCA
      stoploss_ratio: 1.5, // Wider SL for DCA
      profit_factor: indication.profit_factor * 0.9,
      trailing_enabled: false,
      dca_levels: 3, // Number of DCA levels
      dca_spacing: 2.0, // Percentage between DCA entries
    }
  }

  /**
   * Create pseudo position
   */
  private async createPseudoPosition(
    symbol: string,
    indication: any,
    strategySignal: any,
    timestamp?: Date,
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO pseudo_positions (
          connection_id, symbol, indication_type, side,
          entry_price, current_price, quantity, position_cost,
          takeprofit_factor, stoploss_ratio, profit_factor,
          trailing_enabled, opened_at
        )
        VALUES (
          ${this.connectionId}, ${symbol}, ${indication.indication_type}, ${strategySignal.side},
          ${strategySignal.entry_price}, ${strategySignal.entry_price}, 1.0, 0.1,
          ${strategySignal.takeprofit_factor}, ${strategySignal.stoploss_ratio},
          ${strategySignal.profit_factor}, ${strategySignal.trailing_enabled},
          ${timestamp ? timestamp.toISOString() : "CURRENT_TIMESTAMP"}
        )
      `

      console.log(`[v0] Created pseudo position for ${symbol}`)
    } catch (error) {
      console.error(`[v0] Failed to create pseudo position for ${symbol}:`, error)
    }
  }

  /**
   * Get active indications
   */
  private async getActiveIndications(symbol: string): Promise<any[]> {
    try {
      // Use indexed query path for maximum performance
      const indications = await sql`
        SELECT * FROM indications
        WHERE connection_id = ${this.connectionId}
          AND symbol = ${symbol}
          AND calculated_at > NOW() - INTERVAL '1 hour'
          AND profit_factor >= 0.5
        ORDER BY calculated_at DESC, profit_factor DESC
        LIMIT 10
      `
      return indications
    } catch (error) {
      console.error(`[v0] Failed to get active indications for ${symbol}:`, error)
      return []
    }
  }

  /**
   * Get historical indications
   */
  private async getHistoricalIndications(symbol: string, start: Date, end: Date): Promise<any[]> {
    try {
      const indications = await sql`
        SELECT * FROM indications
        WHERE connection_id = ${this.connectionId}
          AND symbol = ${symbol}
          AND calculated_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
        ORDER BY calculated_at ASC
      `
      return indications
    } catch (error) {
      console.error(`[v0] Failed to get historical indications for ${symbol}:`, error)
      return []
    }
  }

  /**
   * Get strategy settings
   */
  private async getStrategySettings(): Promise<any> {
    try {
      const settings = await sql`
        SELECT key, value FROM system_settings
        WHERE category = 'strategy'
      `

      return {
        minProfitFactor: Number.parseFloat(
          settings.find((s: any) => s.key === "strategyMinProfitFactor")?.value || "0.5",
        ),
        trailingEnabled: settings.find((s: any) => s.key === "trailingEnabled")?.value === "true",
        dcaEnabled: settings.find((s: any) => s.key === "dcaEnabled")?.value === "true",
        blockEnabled: settings.find((s: any) => s.key === "blockEnabled")?.value === "true",
      }
    } catch (error) {
      console.error("[v0] Failed to get strategy settings:", error)
      return { minProfitFactor: 0.5, trailingEnabled: true, dcaEnabled: true, blockEnabled: true }
    }
  }
}
