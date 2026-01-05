/**
 * Volume Calculator
 * Calculates position volume based on base volume factor, leverage, and risk management
 * Calculates position volume ONLY at Exchange level when actual orders are executed
 * This calculator is ONLY used by ExchangePositionManager
 * Base/Main/Real pseudo positions do NOT use volume - they use counts and ratios
 */

import { sql } from "@/lib/db"

interface VolumeCalculationParams {
  baseVolumeFactor?: number // 1-10, where 1 = lowest volume, 10 = highest volume
  positionsAverage?: number // Target number of running positions
  riskPercentage?: number // Market movement % that triggers loss at factor 1
  maxLeverage?: number // Maximum leverage allowed
  positionCost?: number // Position cost as ratio (e.g., 0.001 = 0.1%)
  accountBalance: number // Account balance for calculation
  currentPrice: number // Current market price
  leverage?: number // Leverage to apply
  exchangeMinVolume?: number // Exchange minimum volume requirement
}

interface VolumeCalculationResult {
  calculatedVolume?: number
  finalVolume?: number
  leverage: number
  positionSize?: number
  volume?: number // Final volume (quantity) to trade
  volumeUsd?: number // Volume in USD
  volumeAdjusted: boolean
  adjustmentReason?: string
  riskAmount?: number
}

export class VolumeCalculator {
  /**
   * Calculate position volume with risk management
   * Simplified to use position cost ratio directly
   * Base/Main/Real levels pass through ratios/factors, not volumes
   */
  static calculatePositionVolume(params: VolumeCalculationParams): VolumeCalculationResult {
    const {
      baseVolumeFactor,
      positionsAverage,
      riskPercentage,
      maxLeverage,
      positionCost,
      accountBalance,
      currentPrice,
      leverage = 1,
      exchangeMinVolume = 0,
    } = params

    let finalVolume: number
    let volumeAdjusted = false
    let adjustmentReason: string | undefined

    if (positionCost) {
      // Calculate position size in USD based on position cost ratio
      // positionCost is a ratio (e.g., 0.001 = 0.1% of account balance)
      const positionSizeUsd = accountBalance * positionCost

      // Calculate volume (quantity) with leverage
      // Volume = Position Size USD / Current Price (leverage is applied to reduce margin requirement)
      const calculatedVolume = positionSizeUsd / currentPrice

      // Check if volume meets exchange minimum
      finalVolume = calculatedVolume

      if (exchangeMinVolume > 0 && calculatedVolume < exchangeMinVolume) {
        finalVolume = exchangeMinVolume
        volumeAdjusted = true
        adjustmentReason = "Adjusted to meet exchange minimum volume requirement"
      }

      return {
        volume: finalVolume,
        volumeUsd: finalVolume * currentPrice,
        leverage,
        volumeAdjusted,
        adjustmentReason,
      }
    } else {
      if (!riskPercentage || !positionsAverage) {
        throw new Error("riskPercentage and positionsAverage are required when positionCost is not provided")
      }

      const calculatedLeverage = maxLeverage || leverage

      // Calculate risk per position
      // At factor 1 with positionsAverage positions, can lose if market goes riskPercentage% negative
      const totalRiskAmount = accountBalance * (riskPercentage / 100)
      const riskPerPosition = totalRiskAmount / positionsAverage

      const adjustedRisk = riskPerPosition * (baseVolumeFactor || 1)

      // Calculate position size in USD
      // Position size = risk amount / (risk percentage per position)
      const positionSize = adjustedRisk / (riskPercentage / 100)

      // Calculate volume (quantity) with leverage
      // Volume = Position Size / (Current Price * Leverage)
      finalVolume = positionSize / (currentPrice * calculatedLeverage)

      // Check if volume meets exchange minimum
      if (exchangeMinVolume > 0 && finalVolume < exchangeMinVolume) {
        finalVolume = exchangeMinVolume
        volumeAdjusted = true
        adjustmentReason = "Adjusted to meet exchange minimum volume requirement"
      }

      return {
        calculatedVolume: finalVolume,
        finalVolume,
        leverage: calculatedLeverage,
        positionSize,
        volumeAdjusted,
        adjustmentReason,
        riskAmount: adjustedRisk,
      }
    }
  }

  /**
   * Calculate volume for a specific connection and symbol
   * Called ONLY by ExchangePositionManager when mirroring Real positions to exchange
   */
  static async calculateVolumeForConnection(
    connectionId: string,
    symbol: string,
    currentPrice: number,
  ): Promise<VolumeCalculationResult> {
    try {
      // Get position cost and leverage from system settings
      const systemSettings = await sql<{ key: string; value: string }>`
        SELECT key, value FROM system_settings
        WHERE key IN ('exchangePositionCost', 'positionCost', 'max_leverage', 'leveragePercentage', 'useMaximalLeverage')
      `
      const settingsMap = new Map(systemSettings.map((s) => [s.key, s.value]))

      // Position cost as percentage (e.g., 0.1 means 0.1%)
      const positionCostPercent = Number.parseFloat(
        String(settingsMap.get("exchangePositionCost") || settingsMap.get("positionCost") || "0.1"),
      )
      // Convert percentage to ratio
      const positionCost = positionCostPercent / 100

      // Calculate effective leverage
      const leveragePercentage = Number.parseFloat(String(settingsMap.get("leveragePercentage") || "100"))
      const useMaxLeverage = settingsMap.get("useMaximalLeverage") === "true"
      const maxLeverage = useMaxLeverage ? 125 : Math.round(125 * (leveragePercentage / 100))

      const [tradingPair] = await sql<{ min_order_size: string }>`
        SELECT min_order_size FROM trading_pairs
        WHERE symbol = ${symbol}
        LIMIT 1
      `

      const exchangeMinVolume = tradingPair?.min_order_size ? Number.parseFloat(tradingPair.min_order_size) : undefined

      let accountBalance = 10000 // Default fallback

      try {
        // Try to get balance from connection's stored balance
        const [connectionBalance] = await sql<{ balance: number }>`
          SELECT balance FROM connection_balances
          WHERE connection_id = ${connectionId}
          ORDER BY updated_at DESC
          LIMIT 1
        `

        if (connectionBalance?.balance) {
          accountBalance = connectionBalance.balance
        } else {
          // Try to fetch from exchange via connector
          const [connection] = await sql<any>`
            SELECT * FROM connections WHERE id = ${connectionId}
          `

          if (connection?.api_key && connection?.api_secret) {
            const { createExchangeConnector } = await import("@/lib/exchange-connectors")
            const connector = createExchangeConnector(connection.exchange, {
              apiKey: connection.api_key,
              apiSecret: connection.api_secret,
              isTestnet: connection.is_testnet,
            })

            const balanceResult = await connector.getBalance()
            if (balanceResult?.totalBalance) {
              accountBalance = balanceResult.totalBalance

              // Cache the balance
              await sql`
                INSERT INTO connection_balances (connection_id, balance, updated_at)
                VALUES (${connectionId}, ${accountBalance}, CURRENT_TIMESTAMP)
                ON CONFLICT (connection_id) DO UPDATE SET
                  balance = EXCLUDED.balance,
                  updated_at = CURRENT_TIMESTAMP
              `
            }
          }
        }
      } catch (balanceError) {
        console.warn("[v0] Failed to fetch account balance, using default:", balanceError)
      }

      // Calculate volume
      const result = this.calculatePositionVolume({
        positionCost,
        accountBalance,
        currentPrice,
        leverage: maxLeverage,
        exchangeMinVolume,
      })

      console.log(`[v0] Exchange volume calculated for ${symbol}: ${result.volume} (${result.volumeUsd} USD)`)

      return result
    } catch (error) {
      console.error("[v0] Failed to calculate volume for connection:", error)
      throw error
    }
  }

  /**
   * Log volume calculation to database
   */
  static async logVolumeCalculation(
    connectionId: string,
    symbol: string,
    calculation: VolumeCalculationResult,
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO position_volume_calculations (
          connection_id, symbol, base_volume_factor, leverage,
          calculated_volume, final_volume,
          volume_adjusted, adjustment_reason
        )
        VALUES (
          ${connectionId}, ${symbol}, ${calculation.positionSize ? calculation.positionSize / 1000 : 0}, ${calculation.leverage},
          ${calculation.calculatedVolume}, ${calculation.finalVolume},
          ${calculation.volumeAdjusted}, ${calculation.adjustmentReason || null}
        )
      `
    } catch (error) {
      console.error("[v0] Failed to log volume calculation:", error)
    }
  }

  /**
   * Get volume calculation history
   */
  static async getVolumeHistory(connectionId: string, symbol?: string, limit = 100) {
    try {
      let query = sql`
        SELECT * FROM position_volume_calculations
        WHERE connection_id = ${connectionId}
      `

      if (symbol) {
        query = sql`
          SELECT * FROM position_volume_calculations
          WHERE connection_id = ${connectionId} AND symbol = ${symbol}
        `
      }

      const history = await sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `

      return history
    } catch (error) {
      console.error("[v0] Failed to get volume history:", error)
      return []
    }
  }

  /**
   * Calculate risk metrics for a position
   */
  static calculateRiskMetrics(params: {
    entryPrice: number
    currentPrice: number
    volume: number
    leverage: number
    side: "long" | "short"
    stopLossPrice?: number
    takeProfitPrice?: number
  }) {
    const { entryPrice, currentPrice, volume, leverage, side, stopLossPrice, takeProfitPrice } = params

    // Calculate position value
    const positionValue = volume * currentPrice

    // Calculate unrealized PnL
    let unrealizedPnL = 0
    if (side === "long") {
      unrealizedPnL = (currentPrice - entryPrice) * volume * leverage
    } else {
      unrealizedPnL = (entryPrice - currentPrice) * volume * leverage
    }

    // Calculate unrealized PnL percentage
    const unrealizedPnLPercent = (unrealizedPnL / (entryPrice * volume)) * 100

    // Calculate potential loss if stop loss hit
    let potentialLoss = 0
    if (stopLossPrice) {
      if (side === "long") {
        potentialLoss = (stopLossPrice - entryPrice) * volume * leverage
      } else {
        potentialLoss = (entryPrice - stopLossPrice) * volume * leverage
      }
    }

    // Calculate potential profit if take profit hit
    let potentialProfit = 0
    if (takeProfitPrice) {
      if (side === "long") {
        potentialProfit = (takeProfitPrice - entryPrice) * volume * leverage
      } else {
        potentialProfit = (entryPrice - takeProfitPrice) * volume * leverage
      }
    }

    // Calculate risk/reward ratio
    let riskRewardRatio = 0
    if (potentialLoss !== 0) {
      riskRewardRatio = Math.abs(potentialProfit / potentialLoss)
    }

    return {
      positionValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      potentialLoss,
      potentialProfit,
      riskRewardRatio,
    }
  }
}
