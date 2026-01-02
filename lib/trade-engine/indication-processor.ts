/**
 * Indication Processor
 * Processes indications asynchronously for symbols
 */

import { sql } from "@/lib/db"
import { DataSyncManager } from "@/lib/data-sync-manager"

export class IndicationProcessor {
  private connectionId: string

  constructor(connectionId: string) {
    this.connectionId = connectionId
  }

  /**
   * Process indication for a symbol in real-time
   */
  async processIndication(symbol: string): Promise<void> {
    try {
      console.log(`[v0] Processing indication for ${symbol}`)

      // Get latest market data
      const marketData = await this.getLatestMarketData(symbol)
      if (!marketData) {
        console.log(`[v0] No market data available for ${symbol}`)
        return
      }

      // Get indication settings
      const settings = await this.getIndicationSettings()

      // Calculate indication
      const indication = await this.calculateIndication(symbol, marketData, settings)

      if (indication && indication.profit_factor >= settings.minProfitFactor) {
        // Store indication
        await sql`
          INSERT INTO indications (
            connection_id, symbol, indication_type, timeframe,
            value, profit_factor, confidence, metadata
          )
          VALUES (
            ${this.connectionId}, ${symbol}, ${indication.type}, ${indication.timeframe},
            ${indication.value}, ${indication.profit_factor}, ${indication.confidence},
            ${JSON.stringify(indication.metadata)}
          )
        `

        console.log(`[v0] Indication stored for ${symbol}: ${indication.type}`)
      }
    } catch (error) {
      console.error(`[v0] Failed to process indication for ${symbol}:`, error)
    }
  }

  /**
   * Process historical indications for prehistoric data
   */
  async processHistoricalIndications(symbol: string, start: Date, end: Date): Promise<void> {
    try {
      console.log(`[v0] Processing historical indications for ${symbol}`)

      // Check if already processed
      const syncStatus = await DataSyncManager.checkSyncStatus(this.connectionId, symbol, "indication", start, end)

      if (!syncStatus.needsSync) {
        console.log(`[v0] Historical indications already processed for ${symbol}`)
        return
      }

      // Get historical market data
      const historicalData = await this.getHistoricalMarketData(symbol, start, end)

      // Get indication settings
      const settings = await this.getIndicationSettings()

      let recordsProcessed = 0

      // Process each data point
      for (const dataPoint of historicalData) {
        const indication = await this.calculateIndication(symbol, dataPoint, settings)

        if (indication && indication.profit_factor >= settings.minProfitFactor) {
          await sql`
            INSERT INTO indications (
              connection_id, symbol, indication_type, timeframe,
              value, profit_factor, confidence, metadata, calculated_at
            )
            VALUES (
              ${this.connectionId}, ${symbol}, ${indication.type}, ${indication.timeframe},
              ${indication.value}, ${indication.profit_factor}, ${indication.confidence},
              ${JSON.stringify(indication.metadata)}, ${dataPoint.timestamp}
            )
          `
          recordsProcessed++
        }
      }

      // Log sync
      await DataSyncManager.logSync(this.connectionId, symbol, "indication", start, end, recordsProcessed, "success")

      console.log(`[v0] Processed ${recordsProcessed} historical indications for ${symbol}`)
    } catch (error) {
      console.error(`[v0] Failed to process historical indications for ${symbol}:`, error)
      await DataSyncManager.logSync(
        this.connectionId,
        symbol,
        "indication",
        start,
        end,
        0,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      )
    }
  }

  /**
   * Calculate indication based on market data
   */
  private async calculateIndication(symbol: string, marketData: any, settings: any): Promise<any> {
    const price = marketData.price || marketData.close || 0
    const open = marketData.open || price
    const high = marketData.high || price
    const low = marketData.low || price
    const volume = marketData.volume || 0

    // Get historical prices for technical analysis
    const historicalPrices = await this.getRecentPrices(symbol, 30)

    if (historicalPrices.length < 10) {
      return null // Not enough data
    }

    // Calculate Direction indication (trend analysis)
    const directionIndication = this.calculateDirectionIndication(historicalPrices, price)

    // Calculate Move indication (momentum)
    const moveIndication = this.calculateMoveIndication(historicalPrices, price)

    // Calculate Active indication (market activity)
    const activeIndication = this.calculateActiveIndication(historicalPrices, volume)

    // Calculate Optimal indication (combined scoring)
    const optimalIndication = this.calculateOptimalIndication(directionIndication, moveIndication, activeIndication)

    // Return the strongest indication
    const indications = [directionIndication, moveIndication, activeIndication, optimalIndication]
      .filter((i) => i !== null)
      .sort((a, b) => b.profit_factor - a.profit_factor)

    return indications[0] || null
  }

  private calculateDirectionIndication(prices: number[], currentPrice: number): any {
    // Calculate trend direction using simple moving averages
    const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length)

    const trendStrength = (Math.abs(sma10 - sma20) / sma20) * 100
    const isUptrend = sma10 > sma20

    return {
      type: "direction",
      timeframe: "1h",
      value: trendStrength,
      profit_factor: Math.min(trendStrength / 2, 2),
      confidence: Math.min(trendStrength * 10, 100),
      metadata: {
        direction: isUptrend ? "long" : "short",
        sma10,
        sma20,
        price: currentPrice,
        timestamp: new Date().toISOString(),
      },
    }
  }

  private calculateMoveIndication(prices: number[], currentPrice: number): any {
    // Calculate momentum using price rate of change
    const oldPrice = prices[0]
    const roc = ((currentPrice - oldPrice) / oldPrice) * 100

    const momentum = Math.abs(roc)

    return {
      type: "move",
      timeframe: "1h",
      value: momentum,
      profit_factor: Math.min(momentum / 3, 2),
      confidence: Math.min(momentum * 5, 100),
      metadata: {
        direction: roc > 0 ? "long" : "short",
        rateOfChange: roc,
        price: currentPrice,
        timestamp: new Date().toISOString(),
      },
    }
  }

  private calculateActiveIndication(prices: number[], volume: number): any {
    // Calculate market activity based on price volatility and volume
    const priceChanges = []
    for (let i = 1; i < prices.length; i++) {
      priceChanges.push((Math.abs(prices[i] - prices[i - 1]) / prices[i - 1]) * 100)
    }

    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
    const activity = avgChange * (volume > 0 ? Math.log10(volume) : 1)

    return {
      type: "active",
      timeframe: "1h",
      value: activity,
      profit_factor: Math.min(activity / 2, 2),
      confidence: Math.min(activity * 20, 100),
      metadata: {
        avgPriceChange: avgChange,
        volume,
        timestamp: new Date().toISOString(),
      },
    }
  }

  private calculateOptimalIndication(direction: any, move: any, active: any): any {
    // Combine all indications for optimal scoring
    const combinedProfitFactor = (direction.profit_factor + move.profit_factor + active.profit_factor) / 3
    const combinedConfidence = (direction.confidence + move.confidence + active.confidence) / 3

    // Determine optimal direction based on strongest signals
    const directionVote = direction.metadata.direction
    const moveVote = move.metadata.direction
    const optimalDirection = directionVote === moveVote ? directionVote : "neutral"

    return {
      type: "optimal",
      timeframe: "1h",
      value: combinedProfitFactor * 100,
      profit_factor: combinedProfitFactor,
      confidence: combinedConfidence,
      metadata: {
        direction: optimalDirection,
        components: { direction, move, active },
        timestamp: new Date().toISOString(),
      },
    }
  }

  private async getRecentPrices(symbol: string, count: number): Promise<number[]> {
    try {
      const data = await sql<{ close: number }>`
        SELECT close FROM market_data
        WHERE connection_id = ${this.connectionId}
          AND symbol = ${symbol}
        ORDER BY timestamp DESC
        LIMIT ${count}
      `
      return data.map((d) => d.close).reverse()
    } catch {
      return []
    }
  }

  /**
   * Get latest market data for a symbol
   */
  private async getLatestMarketData(symbol: string): Promise<any> {
    try {
      const [data] = await sql`
        SELECT * FROM market_data
        WHERE trading_pair_id IN (
          SELECT id FROM trading_pairs WHERE symbol = ${symbol}
        )
        ORDER BY timestamp DESC
        LIMIT 1
      `
      return data
    } catch (error) {
      console.error(`[v0] Failed to get market data for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Get historical market data
   */
  private async getHistoricalMarketData(symbol: string, start: Date, end: Date): Promise<any[]> {
    try {
      const data = await sql`
        SELECT * FROM market_data
        WHERE trading_pair_id IN (
          SELECT id FROM trading_pairs WHERE symbol = ${symbol}
        )
        AND timestamp BETWEEN ${start.toISOString()} AND ${end.toISOString()}
        ORDER BY timestamp ASC
      `
      return data
    } catch (error) {
      console.error(`[v0] Failed to get historical market data for ${symbol}:`, error)
      return []
    }
  }

  /**
   * Get indication settings
   */
  private async getIndicationSettings(): Promise<any> {
    try {
      const settings = await sql`
        SELECT key, value FROM system_settings
        WHERE category = 'indication'
      `

      return {
        minProfitFactor: Number.parseFloat(
          settings.find((s: any) => s.key === "indicationMinProfitFactor")?.value || "0.7",
        ),
        rangeMin: Number.parseInt(settings.find((s: any) => s.key === "indicationRangeMin")?.value || "3"),
        rangeMax: Number.parseInt(settings.find((s: any) => s.key === "indicationRangeMax")?.value || "30"),
      }
    } catch (error) {
      console.error("[v0] Failed to get indication settings:", error)
      return { minProfitFactor: 0.7, rangeMin: 3, rangeMax: 30 }
    }
  }
}
