/**
 * Base Pseudo Position Manager
 * Manages UNLIMITED configuration sets, each with up to 250 database entries
 * Each unique config (TP/SL/Trailing) creates its own independent set
 * Volume calculations removed - Base level uses COUNT and RATIOS only
 * Volume is calculated exclusively at Exchange level
 */

import { sql } from "@/lib/db"
import type { PerformanceThresholds } from "./types"

export class BasePseudoPositionManager {
  private connectionId: string
  private thresholds: PerformanceThresholds
  private databaseSizeLimit = 250

  constructor(connectionId: string, databaseSizeLimit?: number) {
    this.connectionId = connectionId
    this.databaseSizeLimit = databaseSizeLimit || 250
    this.thresholds = {
      initial_min_win_rate: 0.4,
      expanded_min_win_rate: 0.45,
      expanded_min_profit_ratio: 1.2,
      production_min_win_rate: 0.42,
      production_max_drawdown: 0.3,
      pause_threshold_win_rate: 0.38,
      resume_threshold_win_rate: 0.43,
    }
  }

  /**
   * Set database size limit from settings
   * Each configuration set has its OWN independent limit
   */
  setDatabaseSizeLimit(limit: number): void {
    this.databaseSizeLimit = limit
    console.log(`[v0] Base position database size limit set to ${limit}`)
  }

  /**
   * Get or create base position for a SPECIFIC configuration
   * Each unique config gets its own base position (unlimited)
   * Each base position can have up to 250 entries in pseudo_positions table
   */
  async getOrCreateBasePosition(
    symbol: string,
    indicationType: "direction" | "move" | "active" | "optimal" | "active_advanced",
    range: number,
    direction: "long" | "short",
    tpFactor: number,
    slRatio: number,
    trailingEnabled: boolean,
    trailStart: number | null,
    trailStop: number | null,
    drawdownRatio?: number,
    marketChangeRange?: number,
    lastPartRatio?: number,
  ): Promise<string | null> {
    // Try to get existing base position for this EXACT configuration
    const existing = await sql`
      SELECT id, status, total_positions FROM base_pseudo_positions
      WHERE connection_id = ${this.connectionId}
        AND symbol = ${symbol}
        AND indication_type = ${indicationType}
        AND indication_range = ${range}
        AND direction = ${direction}
        AND takeprofit_factor = ${tpFactor}
        AND stoploss_ratio = ${slRatio}
        AND trailing_enabled = ${trailingEnabled}
        AND trail_start ${trailStart === null ? sql`IS NULL` : sql`= ${trailStart}`}
        AND trail_stop ${trailStop === null ? sql`IS NULL` : sql`= ${trailStop}`}
        ${drawdownRatio !== undefined ? sql`AND drawdown_ratio = ${drawdownRatio}` : sql``}
        ${marketChangeRange !== undefined ? sql`AND market_change_range = ${marketChangeRange}` : sql``}
        ${lastPartRatio !== undefined ? sql`AND last_part_ratio = ${lastPartRatio}` : sql``}
    `

    if (existing.length > 0) {
      const base = existing[0]

      if (base.total_positions >= this.databaseSizeLimit) {
        console.log(`[v0] Base position ${base.id} reached ${this.databaseSizeLimit} database entry limit`)
        return null
      }

      // Check status
      if (base.status === "failed") {
        console.log(`[v0] Base position ${base.id} has failed status`)
        return null
      }

      return base.id
    }

    // Create new base position for this configuration
    return await this.createBasePosition(
      symbol,
      indicationType,
      range,
      direction,
      tpFactor,
      slRatio,
      trailingEnabled,
      trailStart,
      trailStop,
      drawdownRatio,
      marketChangeRange,
      lastPartRatio,
    )
  }

  /**
   * Create a new base pseudo position entry
   */
  private async createBasePosition(
    symbol: string,
    indicationType: "direction" | "move" | "active" | "optimal" | "active_advanced",
    range: number,
    direction: "long" | "short",
    tpFactor: number,
    slRatio: number,
    trailingEnabled: boolean,
    trailStart: number | null,
    trailStop: number | null,
    drawdownRatio?: number,
    marketChangeRange?: number,
    lastPartRatio?: number,
  ): Promise<string | null> {
    try {
      const result = await sql`
        INSERT INTO base_pseudo_positions (
          connection_id, symbol, indication_type, indication_range, direction,
          takeprofit_factor, stoploss_ratio, trailing_enabled, trail_start, trail_stop,
          drawdown_ratio, market_change_range, last_part_ratio,
          status, evaluation_count, total_positions, winning_positions, losing_positions,
          total_profit_loss, max_drawdown, win_rate, avg_profit, avg_loss,
          created_at, updated_at
        )
        VALUES (
          ${this.connectionId}, ${symbol}, ${indicationType}, ${range}, ${direction},
          ${tpFactor}, ${slRatio}, ${trailingEnabled}, ${trailStart}, ${trailStop},
          ${drawdownRatio || null}, ${marketChangeRange || null}, ${lastPartRatio || null},
          'evaluating', 0, 0, 0, 0, 0, 0, 0, 0, 0,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `

      console.log(
        `[v0] Created base position ${result[0].id} for ${symbol} ${indicationType} ${direction} TP=${tpFactor} SL=${slRatio} Trailing=${trailingEnabled}`,
      )
      return result[0].id
    } catch (error) {
      console.error("[v0] Error creating base position:", error)
      return null
    }
  }

  /**
   * Check if base position can create more test positions
   */
  async canCreatePosition(basePositionId: string): Promise<boolean> {
    const [basePos] = await sql`
      SELECT status, evaluation_count, total_positions, win_rate
      FROM base_pseudo_positions
      WHERE id = ${basePositionId}
    `

    if (!basePos) return false

    // Failed status - no more positions
    if (basePos.status === "failed") return false

    // Paused status - needs recovery
    if (basePos.status === "paused") {
      // Check if recovered enough to resume
      return basePos.win_rate >= this.thresholds.resume_threshold_win_rate
    }

    // Evaluating - check phase limits
    if (basePos.status === "evaluating") {
      // Phase 1: up to 10 positions
      if (basePos.total_positions < 10) return true
      // Phase 2: up to 50 positions if passed Phase 1
      if (basePos.total_positions < 50 && basePos.win_rate >= this.thresholds.initial_min_win_rate) {
        return true
      }
      return false
    }

    // Active - passed all tests, create production positions
    return basePos.status === "active"
  }

  /**
   * Update base position performance after a pseudo position closes
   */
  async updatePerformance(
    basePositionId: string,
    profitLoss: number,
    isWin: boolean,
    currentDrawdown: number,
  ): Promise<void> {
    try {
      // Get current stats
      const [basePos] = await sql`
        SELECT * FROM base_pseudo_positions WHERE id = ${basePositionId}
      `

      if (!basePos) return

      // Update metrics
      const totalPositions = basePos.total_positions + 1
      const winningPositions = basePos.winning_positions + (isWin ? 1 : 0)
      const losingPositions = basePos.losing_positions + (isWin ? 0 : 1)
      const totalProfitLoss = basePos.total_profit_loss + profitLoss
      const winRate = totalPositions > 0 ? winningPositions / totalPositions : 0
      const maxDrawdown = Math.max(basePos.max_drawdown, currentDrawdown)

      // Calculate averages
      const avgProfit =
        winningPositions > 0 ? (totalProfitLoss + Math.abs(basePos.total_profit_loss)) / (2 * winningPositions) : 0
      const avgLoss = losingPositions > 0 ? Math.abs(totalProfitLoss - basePos.total_profit_loss) / losingPositions : 0

      // Update database
      await sql`
        UPDATE base_pseudo_positions
        SET 
          total_positions = ${totalPositions},
          winning_positions = ${winningPositions},
          losing_positions = ${losingPositions},
          total_profit_loss = ${totalProfitLoss},
          max_drawdown = ${maxDrawdown},
          win_rate = ${winRate},
          avg_profit = ${avgProfit},
          avg_loss = ${avgLoss},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${basePositionId}
      `

      // Check thresholds and update status
      await this.checkThresholdsAndUpdateStatus(basePositionId, {
        totalPositions,
        winRate,
        avgProfit,
        avgLoss,
        maxDrawdown,
      })

      console.log(
        `[v0] Updated base position ${basePositionId}: ${totalPositions} positions, ${(winRate * 100).toFixed(1)}% win rate`,
      )
    } catch (error) {
      console.error("[v0] Error updating base position performance:", error)
    }
  }

  /**
   * Check performance thresholds and transition status
   */
  private async checkThresholdsAndUpdateStatus(
    basePositionId: string,
    metrics: {
      totalPositions: number
      winRate: number
      avgProfit: number
      avgLoss: number
      maxDrawdown: number
    },
  ): Promise<void> {
    let newStatus: "evaluating" | "active" | "paused" | "failed" | null = null

    // Phase 1 check (after 10 positions)
    if (metrics.totalPositions === 10) {
      if (metrics.winRate < this.thresholds.initial_min_win_rate) {
        newStatus = "failed"
        console.log(`[v0] Base position ${basePositionId} FAILED Phase 1: ${(metrics.winRate * 100).toFixed(1)}% < 40%`)
      } else {
        console.log(`[v0] Base position ${basePositionId} passed Phase 1: ${(metrics.winRate * 100).toFixed(1)}%`)
      }
    }

    // Phase 2 check (after 50 positions)
    if (metrics.totalPositions === 50 && newStatus !== "failed") {
      const profitRatio = metrics.avgLoss > 0 ? metrics.avgProfit / metrics.avgLoss : 0

      if (
        metrics.winRate >= this.thresholds.expanded_min_win_rate &&
        profitRatio >= this.thresholds.expanded_min_profit_ratio
      ) {
        newStatus = "active"
        console.log(
          `[v0] Base position ${basePositionId} PASSED Phase 2: ${(metrics.winRate * 100).toFixed(1)}%, profit ratio ${profitRatio.toFixed(2)}`,
        )
      } else {
        newStatus = "paused"
        console.log(
          `[v0] Base position ${basePositionId} PAUSED Phase 2: ${(metrics.winRate * 100).toFixed(1)}%, profit ratio ${profitRatio.toFixed(2)}`,
        )
      }
    }

    // Production monitoring (after Phase 2)
    if (metrics.totalPositions > 50 && newStatus === null) {
      // Check for degradation
      if (metrics.winRate < this.thresholds.pause_threshold_win_rate) {
        newStatus = "paused"
        console.log(`[v0] Base position ${basePositionId} performance degraded, PAUSING`)
      }

      // Check drawdown limit
      if (metrics.maxDrawdown > this.thresholds.production_max_drawdown) {
        newStatus = "paused"
        console.log(`[v0] Base position ${basePositionId} exceeded drawdown limit, PAUSING`)
      }
    }

    // Update status if changed
    if (newStatus) {
      await sql`
        UPDATE base_pseudo_positions
        SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${basePositionId}
      `
    }
  }
}
