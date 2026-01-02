import { sql, query as dbQuery } from "@/lib/db"
import { VolumeCalculator } from "./volume-calculator"

export interface ExchangePositionCreateParams {
  connectionId: string
  realPseudoPositionId: string
  mainPseudoPositionId?: string
  basePseudoPositionId?: string
  exchangeId: string
  exchangeOrderId?: string
  symbol: string
  side: "long" | "short"
  entryPrice: number
  quantity: number
  volumeUsd: number
  leverage?: number
  takeprofit?: number
  stoploss?: number
  trailingEnabled?: boolean
  trailStart?: number
  trailStop?: number
  tradeMode: "preset" | "main"
  indicationType?: string
}

export interface ExchangePositionUpdateParams {
  currentPrice: number
  unrealizedPnl: number
  realizedPnl?: number
  feesPaid?: number
  fundingFees?: number
  trailActivated?: boolean
  trailHighPrice?: number
}

export interface ExchangePositionCloseParams {
  closedPrice: number
  realizedPnl: number
  feesPaid: number
  closeReason: "take_profit" | "stop_loss" | "manual" | "liquidated" | "trailing_stop"
}

/**
 * Exchange Position Manager
 *
 * SYSTEM INTERNAL - FOR REAL STRATEGY MIRRORING ONLY
 *
 * Purpose: Log actual exchange live positions for history and statistics.
 * This data is used to:
 * - Compare differences between Real mirroring pseudo positions and actual exchange positions
 * - Generate statistics of live trades independent from exchange history retrieval
 * - Track performance metrics per connection (connection_id)
 * - Monitor position coordination events and sync status
 *
 * NOTE: This is NOT displayed in Settings/Strategy - it's purely system internal logging.
 * Each active connection operates independently with its own exchange position data.
 */
export class ExchangePositionManager {
  private connectionId: string

  constructor(connectionId: string) {
    this.connectionId = connectionId
  }

  /**
   * Mirror a Real Pseudo Position to Active Exchange Position
   * Called when position is validated and ready for exchange
   */
  async mirrorToExchange(params: ExchangePositionCreateParams): Promise<string> {
    const positionId = `aex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const volumeResult = await VolumeCalculator.calculateVolumeForConnection(
        params.connectionId,
        params.symbol,
        params.entryPrice,
      )

      // Use calculated volume and leverage from volume calculator
      const finalQuantity = volumeResult.volume
      const finalVolumeUsd = volumeResult.volumeUsd
      const finalLeverage = volumeResult.leverage

      await sql`
        INSERT INTO active_exchange_positions (
          id, connection_id, real_pseudo_position_id, main_pseudo_position_id,
          base_pseudo_position_id, exchange_id, exchange_order_id, symbol, side,
          entry_price, current_price, quantity, volume_usd, leverage,
          takeprofit, stoploss, trailing_enabled, trail_start, trail_stop,
          trade_mode, indication_type, status, sync_status
        )
        VALUES (
          ${positionId}, ${params.connectionId}, ${params.realPseudoPositionId},
          ${params.mainPseudoPositionId || null}, ${params.basePseudoPositionId || null},
          ${params.exchangeId}, ${params.exchangeOrderId || null}, ${params.symbol},
          ${params.side}, ${params.entryPrice}, ${params.entryPrice}, ${finalQuantity},
          ${finalVolumeUsd}, ${finalLeverage}, ${params.takeprofit || null},
          ${params.stoploss || null}, ${params.trailingEnabled ? 1 : 0},
          ${params.trailStart || null}, ${params.trailStop || null}, ${params.tradeMode},
          ${params.indicationType || null}, 'open', 'synced'
        )
      `

      // Log coordination event
      await this.logCoordinationEvent({
        connectionId: params.connectionId,
        exchangePositionId: positionId,
        exchangeId: params.exchangeId,
        eventType: "position_opened",
        eventData: JSON.stringify({
          ...params,
          calculatedVolume: finalQuantity,
          calculatedVolumeUsd: finalVolumeUsd,
          calculatedLeverage: finalLeverage,
        }),
        triggeredBy: "system",
      })

      console.log(
        `[v0] Mirrored position to exchange: ${positionId} (Volume: ${finalQuantity}, USD: ${finalVolumeUsd}, Leverage: ${finalLeverage}x)`,
      )

      return positionId
    } catch (error) {
      console.error("[v0] Failed to mirror position to exchange:", error)
      throw error
    }
  }

  /**
   * Update exchange position with current market data
   * Called periodically to sync position state
   */
  async updatePosition(exchangeId: string, updates: ExchangePositionUpdateParams): Promise<void> {
    const startTime = Date.now()

    try {
      // Get current position state
      const [position] = await sql<any>`
        SELECT * FROM active_exchange_positions
        WHERE exchange_id = ${exchangeId} AND status = 'open'
      `

      if (!position) {
        console.warn(`[v0] Position not found for exchange ID: ${exchangeId}`)
        return
      }

      // Calculate statistics
      const pnlChange = updates.unrealizedPnl - (position.unrealized_pnl || 0)
      const maxProfit = Math.max(position.max_profit || 0, updates.unrealizedPnl)
      const maxLoss = Math.min(position.max_loss || 0, updates.unrealizedPnl)
      const priceHigh = Math.max(position.price_high || position.entry_price, updates.currentPrice)
      const priceLow = Math.min(position.price_low || position.entry_price, updates.currentPrice)

      // Calculate drawdown from peak
      const currentDrawdown = maxProfit > 0 ? ((maxProfit - updates.unrealizedPnl) / maxProfit) * 100 : 0
      const maxDrawdown = Math.max(position.max_drawdown || 0, currentDrawdown)

      // Check trailing stop
      let trailActivated = position.trail_activated
      let trailHighPrice = position.trail_high_price

      if (position.trailing_enabled && !trailActivated) {
        const profitPercent = ((updates.currentPrice - position.entry_price) / position.entry_price) * 100
        if (profitPercent >= (position.trail_start || 0)) {
          trailActivated = true
          trailHighPrice = updates.currentPrice
        }
      }

      if (trailActivated && updates.currentPrice > (trailHighPrice || 0)) {
        trailHighPrice = updates.currentPrice
      }

      // Update position
      await sql`
        UPDATE active_exchange_positions
        SET
          current_price = ${updates.currentPrice},
          unrealized_pnl = ${updates.unrealizedPnl},
          realized_pnl = ${updates.realizedPnl || position.realized_pnl},
          fees_paid = ${updates.feesPaid || position.fees_paid},
          funding_fees = ${updates.fundingFees || position.funding_fees},
          max_profit = ${maxProfit},
          max_loss = ${maxLoss},
          max_drawdown = ${maxDrawdown},
          price_high = ${priceHigh},
          price_low = ${priceLow},
          trail_activated = ${trailActivated ? 1 : 0},
          trail_high_price = ${trailHighPrice},
          last_updated_at = CURRENT_TIMESTAMP,
          last_sync_at = CURRENT_TIMESTAMP,
          sync_status = 'synced'
        WHERE exchange_id = ${exchangeId}
      `

      // Log price update
      await this.logCoordinationEvent({
        connectionId: position.connection_id,
        exchangePositionId: position.id,
        exchangeId,
        eventType: "price_updated",
        eventData: JSON.stringify({
          price: updates.currentPrice,
          pnl: updates.unrealizedPnl,
          pnlChange,
        }),
        processingDurationMs: Date.now() - startTime,
        triggeredBy: "system",
      })
    } catch (error) {
      console.error(`[v0] Failed to update position ${exchangeId}:`, error)

      // Mark sync error
      await sql`
        UPDATE active_exchange_positions
        SET
          sync_status = 'error',
          sync_error_message = ${error instanceof Error ? error.message : "Unknown error"},
          sync_retry_count = sync_retry_count + 1
        WHERE exchange_id = ${exchangeId}
      `

      throw error
    }
  }

  /**
   * Close exchange position
   * Called when position hits TP/SL or manually closed
   */
  async closePosition(exchangeId: string, closeParams: ExchangePositionCloseParams): Promise<void> {
    try {
      const [position] = await sql<any>`
        SELECT * FROM active_exchange_positions
        WHERE exchange_id = ${exchangeId} AND status = 'open'
      `

      if (!position) {
        console.warn(`[v0] Position not found for closing: ${exchangeId}`)
        return
      }

      const holdDuration = Math.floor((Date.now() - new Date(position.opened_at).getTime()) / 1000)

      await sql`
        UPDATE active_exchange_positions
        SET
          current_price = ${closeParams.closedPrice},
          realized_pnl = ${closeParams.realizedPnl},
          fees_paid = ${closeParams.feesPaid},
          status = 'closed',
          closed_at = CURRENT_TIMESTAMP,
          hold_duration_seconds = ${holdDuration},
          last_updated_at = CURRENT_TIMESTAMP
        WHERE exchange_id = ${exchangeId}
      `

      // Update statistics
      await this.updateStatistics(
        position.connection_id,
        position.symbol,
        position.indication_type,
        position.trade_mode,
      )

      // Log coordination event
      await this.logCoordinationEvent({
        connectionId: position.connection_id,
        exchangePositionId: position.id,
        exchangeId,
        eventType: closeParams.closeReason.includes("profit")
          ? "take_profit_hit"
          : closeParams.closeReason.includes("loss")
            ? "stop_loss_hit"
            : "manual_close",
        eventData: JSON.stringify(closeParams),
        triggeredBy: closeParams.closeReason === "manual" ? "manual" : "system",
      })

      console.log(
        `[v0] Closed position ${exchangeId} (Reason: ${closeParams.closeReason}, PnL: ${closeParams.realizedPnl})`,
      )
    } catch (error) {
      console.error(`[v0] Failed to close position ${exchangeId}:`, error)
      throw error
    }
  }

  /**
   * Update statistics for a symbol/indication type combination
   */
  private async updateStatistics(
    connectionId: string,
    symbol: string,
    indicationType: string | null,
    tradeMode: "preset" | "main",
  ): Promise<void> {
    try {
      // Calculate statistics for last 24 hours
      const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const periodEnd = new Date()

      const positions = await sql<any>`
        SELECT
          id, side, entry_price, current_price, quantity, realized_pnl,
          fees_paid, max_profit, max_loss, max_drawdown, hold_duration_seconds,
          status, opened_at, closed_at
        FROM active_exchange_positions
        WHERE connection_id = ${connectionId}
          AND symbol = ${symbol}
          AND indication_type IS ${indicationType}
          AND trade_mode = ${tradeMode}
          AND opened_at >= ${periodStart.toISOString()}
        ORDER BY opened_at DESC
      `

      if (positions.length === 0) return

      // Calculate metrics
      const totalPositions = positions.length
      const winningPositions = positions.filter((p: any) => p.realized_pnl > 0).length
      const losingPositions = positions.filter((p: any) => p.realized_pnl < 0).length
      const closedPositions = positions.filter((p: any) => p.status === "closed")

      const totalPnl = closedPositions.reduce((sum: number, p: any) => sum + p.realized_pnl, 0)
      const totalFees = closedPositions.reduce((sum: number, p: any) => sum + p.fees_paid, 0)
      const netPnl = totalPnl - totalFees

      const winRate =
        losingPositions + winningPositions > 0 ? winningPositions / (winningPositions + losingPositions) : 0

      const totalWins = closedPositions
        .filter((p: any) => p.realized_pnl > 0)
        .reduce((sum: number, p: any) => sum + p.realized_pnl, 0)
      const totalLosses = Math.abs(
        closedPositions.filter((p: any) => p.realized_pnl < 0).reduce((sum: number, p: any) => sum + p.realized_pnl, 0),
      )
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

      const avgWinningPnl =
        winningPositions > 0
          ? closedPositions
              .filter((p: any) => p.realized_pnl > 0)
              .reduce((sum: number, p: any) => sum + p.realized_pnl, 0) / winningPositions
          : 0

      const avgLosingPnl =
        losingPositions > 0
          ? closedPositions
              .filter((p: any) => p.realized_pnl < 0)
              .reduce((sum: number, p: any) => sum + p.realized_pnl, 0) / losingPositions
          : 0

      const avgHoldDuration =
        closedPositions.length > 0
          ? closedPositions.reduce((sum: number, p: any) => sum + (p.hold_duration_seconds || 0), 0) /
            closedPositions.length
          : 0

      const bestTrade = Math.max(...closedPositions.map((p: any) => p.realized_pnl || 0))
      const worstTrade = Math.min(...closedPositions.map((p: any) => p.realized_pnl || 0))
      const maxDrawdown = Math.max(...positions.map((p: any) => p.max_drawdown || 0))

      const totalVolume = positions.reduce((sum: number, p: any) => sum + p.entry_price * p.quantity, 0)
      const avgPositionSize = totalPositions > 0 ? totalVolume / totalPositions : 0

      // Upsert statistics
      const statsId = `stats_${connectionId}_${symbol}_${indicationType || "preset"}_${tradeMode}_${periodStart.getTime()}`

      await sql`
        INSERT INTO exchange_position_statistics (
          id, connection_id, symbol, indication_type, trade_mode,
          period_start, period_end, period_hours,
          total_positions, winning_positions, losing_positions,
          total_pnl, total_fees, net_pnl, win_rate, profit_factor,
          avg_winning_pnl, avg_losing_pnl, avg_hold_duration_seconds,
          best_trade_pnl, worst_trade_pnl, max_drawdown,
          total_volume_usd, avg_position_size_usd,
          last_calculated_at, position_count_at_calc
        )
        VALUES (
          ${statsId}, ${connectionId}, ${symbol}, ${indicationType}, ${tradeMode},
          ${periodStart.toISOString()}, ${periodEnd.toISOString()}, 24,
          ${totalPositions}, ${winningPositions}, ${losingPositions},
          ${totalPnl}, ${totalFees}, ${netPnl}, ${winRate}, ${profitFactor},
          ${avgWinningPnl}, ${avgLosingPnl}, ${Math.floor(avgHoldDuration)},
          ${bestTrade}, ${worstTrade}, ${maxDrawdown},
          ${totalVolume}, ${avgPositionSize},
          CURRENT_TIMESTAMP, ${totalPositions}
        )
        ON CONFLICT (connection_id, symbol, indication_type, trade_mode, period_start)
        DO UPDATE SET
          total_positions = ${totalPositions},
          winning_positions = ${winningPositions},
          losing_positions = ${losingPositions},
          total_pnl = ${totalPnl},
          total_fees = ${totalFees},
          net_pnl = ${netPnl},
          win_rate = ${winRate},
          profit_factor = ${profitFactor},
          avg_winning_pnl = ${avgWinningPnl},
          avg_losing_pnl = ${avgLosingPnl},
          avg_hold_duration_seconds = ${Math.floor(avgHoldDuration)},
          best_trade_pnl = ${bestTrade},
          worst_trade_pnl = ${worstTrade},
          max_drawdown = ${maxDrawdown},
          total_volume_usd = ${totalVolume},
          avg_position_size_usd = ${avgPositionSize},
          last_calculated_at = CURRENT_TIMESTAMP,
          position_count_at_calc = ${totalPositions}
      `

      console.log(
        `[v0] Updated statistics for ${symbol} (${indicationType || "preset"}/${tradeMode}): ${totalPositions} positions, ${winRate.toFixed(2)} win rate`,
      )
    } catch (error) {
      console.error("[v0] Failed to update statistics:", error)
    }
  }

  /**
   * Log coordination event
   */
  private async logCoordinationEvent(params: {
    connectionId: string
    exchangePositionId?: string
    exchangeId: string
    eventType: string
    eventData?: string
    oldState?: string
    newState?: string
    success?: boolean
    errorMessage?: string
    processingDurationMs?: number
    triggeredBy: string
  }): Promise<void> {
    try {
      await sql`
        INSERT INTO exchange_position_coordination_log (
          connection_id, exchange_position_id, exchange_id, event_type,
          event_data, old_state, new_state, success, error_message,
          processing_duration_ms, triggered_by
        )
        VALUES (
          ${params.connectionId}, ${params.exchangePositionId || null},
          ${params.exchangeId}, ${params.eventType}, ${params.eventData || null},
          ${params.oldState || null}, ${params.newState || null},
          ${params.success !== false ? 1 : 0}, ${params.errorMessage || null},
          ${params.processingDurationMs || null}, ${params.triggeredBy}
        )
      `
    } catch (error) {
      console.error("[v0] Failed to log coordination event:", error)
    }
  }

  /**
   * Get active positions for a connection
   */
  async getActivePositions(filters?: {
    symbol?: string
    side?: "long" | "short"
    tradeMode?: "preset" | "main"
    indicationType?: string
  }): Promise<any[]> {
    let query = `
      SELECT * FROM v_active_exchange_positions_monitoring
      WHERE connection_id = $1
    `
    const params: any[] = [this.connectionId]
    let paramIndex = 2

    if (filters?.symbol) {
      query += ` AND symbol = $${paramIndex++}`
      params.push(filters.symbol)
    }

    if (filters?.side) {
      query += ` AND side = $${paramIndex++}`
      params.push(filters.side)
    }

    if (filters?.tradeMode) {
      query += ` AND trade_mode = $${paramIndex++}`
      params.push(filters.tradeMode)
    }

    if (filters?.indicationType) {
      query += ` AND indication_type = $${paramIndex++}`
      params.push(filters.indicationType)
    }

    query += ` ORDER BY opened_at DESC`

    const positions = await dbQuery(query, params)
    return positions as any[]
  }

  /**
   * Get statistics for a symbol
   */
  async getStatistics(symbol: string, indicationType?: string, hours = 24): Promise<any> {
    const periodStart = new Date(Date.now() - hours * 60 * 60 * 1000)

    const [stats] = await sql<any>`
      SELECT * FROM exchange_position_statistics
      WHERE connection_id = ${this.connectionId}
        AND symbol = ${symbol}
        AND indication_type IS ${indicationType || null}
        AND period_start >= ${periodStart.toISOString()}
      ORDER BY period_start DESC
      LIMIT 1
    `

    return stats || null
  }

  /**
   * Get coordination logs for debugging
   */
  async getCoordinationLogs(exchangeId?: string, limit = 100): Promise<any[]> {
    if (exchangeId) {
      return await sql<any>`
        SELECT * FROM exchange_position_coordination_log
        WHERE connection_id = ${this.connectionId}
          AND exchange_id = ${exchangeId}
        ORDER BY event_timestamp DESC
        LIMIT ${limit}
      `
    }

    return await sql<any>`
      SELECT * FROM exchange_position_coordination_log
      WHERE connection_id = ${this.connectionId}
      ORDER BY event_timestamp DESC
      LIMIT ${limit}
    `
  }
}
