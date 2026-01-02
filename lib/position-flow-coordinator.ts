/**
 * Position Flow Coordinator
 * Manages the complete flow: Base Pseudo → Main Pseudo → Real Pseudo → Exchange Positions
 * Handles performance tracking, validation, and mirroring to exchange
 */

import { sql } from "@/lib/db"
import { BasePseudoPositionManager } from "./base-pseudo-position-manager"
import { ExchangePositionManager } from "./exchange-position-manager"

export class PositionFlowCoordinator {
  private connectionId: string
  private basePseudoManager: BasePseudoPositionManager
  private exchangePositionManager: ExchangePositionManager

  constructor(connectionId: string) {
    this.connectionId = connectionId
    this.basePseudoManager = new BasePseudoPositionManager(connectionId)
    this.exchangePositionManager = new ExchangePositionManager(connectionId)
  }

  /**
   * Handle pseudo position close event
   * Updates base position performance and checks for graduation
   */
  async onPseudoPositionClose(pseudoPositionId: string): Promise<void> {
    try {
      // Get closed position details
      const [position] = await sql`
        SELECT 
          p.*,
          (p.current_price - p.entry_price) / p.entry_price AS price_change,
          CASE 
            WHEN p.direction = 'long' THEN p.current_price >= p.entry_price * (1 + p.takeprofit_factor / 100)
            WHEN p.direction = 'short' THEN p.current_price <= p.entry_price * (1 - p.takeprofit_factor / 100)
          END AS is_win
        FROM pseudo_positions p
        WHERE p.id = ${pseudoPositionId}
      `

      if (!position) {
        console.log(`[v0] Position ${pseudoPositionId} not found`)
        return
      }

      const profitLoss = this.calculateProfitLoss(position)
      const isWin = position.is_win
      const drawdown = this.calculateDrawdown(position)

      if (position.position_level === "base" && position.base_position_id) {
        await this.basePseudoManager.updatePerformance(position.base_position_id, profitLoss, isWin, drawdown)

        // Check if should graduate to MAIN PSEUDO
        await this.evaluateForMainPseudoGraduation(position.base_position_id, position.symbol)
      }

      if (position.position_level === "main") {
        await this.evaluateForRealPseudoGraduation(position)
      }

      console.log(
        `[v0] Processed ${position.position_level} position close ${pseudoPositionId}: ${isWin ? "WIN" : "LOSS"} ${profitLoss.toFixed(2)}%`,
      )
    } catch (error) {
      console.error(`[v0] Error handling pseudo position close:`, error)
    }
  }

  /**
   * Process validation for Real Pseudo Positions
   * Checks if Main Pseudo positions meet criteria for Real Pseudo
   */
  async processRealPseudoValidation(symbol: string): Promise<void> {
    try {
      // Get candidate Main Pseudo positions
      const mainPositions = await sql`
        SELECT 
          p.*,
          EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 AS hours_since_creation
        FROM pseudo_positions p
        WHERE p.connection_id = ${this.connectionId}
          AND p.symbol = ${symbol}
          AND p.status = 'active'
          AND p.profit_factor >= 0.6
          AND NOT EXISTS (
            SELECT 1 FROM real_pseudo_positions rpp
            WHERE rpp.main_config_id = p.id
          )
      `

      for (const mainPos of mainPositions) {
        if (await this.isValidForRealPseudo(mainPos)) {
          await this.createRealPseudoPosition(mainPos)
        }
      }
    } catch (error) {
      console.error(`[v0] Error processing real pseudo validation for ${symbol}:`, error)
    }
  }

  /**
   * Check if Main Pseudo position qualifies for Real Pseudo
   */
  private async isValidForRealPseudo(mainPosition: any): Promise<boolean> {
    // Check profit factor
    if (mainPosition.profit_factor < 0.6) return false

    // Check drawdown time
    if (mainPosition.hours_since_creation > 12) return false

    // Check if base position (if exists) is in good standing
    if (mainPosition.base_position_id) {
      const [basePos] = await sql`
        SELECT status, win_rate FROM base_pseudo_positions
        WHERE id = ${mainPosition.base_position_id}
      `

      if (basePos && (basePos.status === "failed" || basePos.win_rate < 0.4)) {
        return false
      }
    }

    return true
  }

  /**
   * Create Real Pseudo Position from validated Main Pseudo
   */
  private async createRealPseudoPosition(mainPosition: any): Promise<void> {
    try {
      await sql`
        INSERT INTO real_pseudo_positions (
          connection_id, main_config_id, base_config_id,
          symbol, side, entry_price, quantity, 
          takeprofit, stoploss, trailing_enabled,
          trail_start, trail_stop,
          status, validated_at
        )
        VALUES (
          ${this.connectionId},
          ${mainPosition.id},
          ${mainPosition.base_position_id},
          ${mainPosition.symbol},
          ${mainPosition.direction},
          ${mainPosition.entry_price},
          ${mainPosition.quantity || 1},
          ${mainPosition.entry_price * (1 + mainPosition.takeprofit_factor / 100)},
          ${mainPosition.entry_price * (1 - mainPosition.stoploss_ratio / 100)},
          ${mainPosition.trailing_enabled},
          ${mainPosition.trail_start},
          ${mainPosition.trail_stop},
          'validated',
          CURRENT_TIMESTAMP
        )
      `

      console.log(`[v0] Created Real Pseudo position for ${mainPosition.symbol} from Main position ${mainPosition.id}`)
    } catch (error) {
      console.error(`[v0] Error creating Real Pseudo position:`, error)
    }
  }

  /**
   * Process mirroring of Real Pseudo positions to exchange
   */
  async processExchangeMirroring(): Promise<void> {
    try {
      // Get validated Real Pseudo positions not yet mirrored
      const realPseudoPositions = await sql`
        SELECT rpp.*
        FROM real_pseudo_positions rpp
        WHERE rpp.connection_id = ${this.connectionId}
          AND rpp.status = 'validated'
          AND NOT EXISTS (
            SELECT 1 FROM active_exchange_positions aep
            WHERE aep.real_pseudo_position_id = rpp.id
          )
        LIMIT 10
      `

      for (const realPos of realPseudoPositions) {
        const lastXProfitFactor = await this.getLastXPositionsProfitFactor(realPos.base_config_id, 30)

        if (lastXProfitFactor < 0.6) {
          console.log(
            `[v0] Last 30 positions profit factor ${lastXProfitFactor.toFixed(2)} < 0.6, skipping exchange mirror`,
          )
          continue
        }

        await this.exchangePositionManager.mirrorToExchange(realPos)

        console.log(
          `[v0] Mirrored REAL PSEUDO ${realPos.id} to EXCHANGE (validated PF: ${lastXProfitFactor.toFixed(2)})`,
        )
      }
    } catch (error) {
      console.error(`[v0] Error processing exchange mirroring:`, error)
    }
  }

  /**
   * Calculate profit/loss percentage for a position
   */
  private calculateProfitLoss(position: any): number {
    const priceChange = (position.current_price - position.entry_price) / position.entry_price
    const multiplier = position.direction === "long" ? 1 : -1
    return priceChange * multiplier * 100
  }

  /**
   * Calculate drawdown for a position
   */
  private calculateDrawdown(position: any): number {
    // Simplified drawdown calculation
    // In production, track price_high and price_low throughout position lifetime
    const profitLoss = this.calculateProfitLoss(position)
    return profitLoss < 0 ? Math.abs(profitLoss) : 0
  }

  /**
   * Evaluate if base position should create next batch of positions
   * This makes the flow continuous and asynchronous
   */
  private async evaluateBasePositionForNextPositions(basePositionId: string, symbol: string): Promise<void> {
    // Check if base position can create more positions
    if (await this.basePseudoManager.canCreatePosition(basePositionId)) {
      // Get base position details
      const [basePos] = await sql`
        SELECT * FROM base_pseudo_positions WHERE id = ${basePositionId}
      `

      if (!basePos) return

      // This continues the evaluation flow automatically
      console.log(`[v0] Base position ${basePositionId} ready for next evaluation batch`)

      // The position will be created on next indication detection
      // We don't create here to avoid race conditions
    }
  }

  /**
   * Consider if Main Pseudo should graduate to Real Pseudo
   */
  private async considerGraduationToRealPseudo(position: any): Promise<void> {
    // Check if position meets Real Pseudo criteria
    const profitFactor = await this.calculatePositionProfitFactor(position.id)

    if (profitFactor >= 0.6) {
      // Check if already a Real Pseudo
      const [existing] = await sql`
        SELECT id FROM real_pseudo_positions
        WHERE main_config_id = ${position.id}
      `

      if (!existing) {
        await this.createRealPseudoPosition(position)
      }
    }
  }

  /**
   * Calculate profit factor for a position
   */
  private async calculatePositionProfitFactor(positionId: string): Promise<number> {
    // Simplified calculation - in production, use full historical performance
    const [stats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'closed' AND profit_loss > 0) as wins,
        COUNT(*) FILTER (WHERE status = 'closed' AND profit_loss < 0) as losses,
        AVG(profit_loss) FILTER (WHERE status = 'closed' AND profit_loss > 0) as avg_win,
        AVG(ABS(profit_loss)) FILTER (WHERE status = 'closed' AND profit_loss < 0) as avg_loss
      FROM pseudo_positions
      WHERE id = ${positionId}
    `

    if (!stats || stats.losses === 0) return 0

    const winRate = stats.wins / (stats.wins + stats.losses)
    const profitFactor = (stats.avg_win * winRate) / (stats.avg_loss * (1 - winRate))

    return profitFactor
  }

  /**
   * MAIN PSEUDO: Evaluate base positions with profit factor
   * Creates MAIN PSEUDO positions that evaluate FROM base pseudo positions
   */
  private async evaluateForMainPseudoGraduation(basePositionId: string, symbol: string): Promise<void> {
    try {
      // Get base position statistics
      const [basePos] = await sql`
        SELECT * FROM base_pseudo_positions
        WHERE id = ${basePositionId}
      `

      if (!basePos) return

      // MAIN PSEUDO requirement: profit factor evaluation from base
      const profitFactor =
        basePos.winning_positions > 0 && basePos.losing_positions > 0
          ? (basePos.avg_profit * basePos.win_rate) / (basePos.avg_loss * (1 - basePos.win_rate))
          : 0

      // Must have profit factor >= 0.5 to create MAIN PSEUDO
      if (profitFactor < 0.5) {
        console.log(
          `[v0] Base position ${basePositionId} profit factor ${profitFactor.toFixed(2)} < 0.5, not ready for MAIN`,
        )
        return
      }

      // Must have at least 10 evaluated positions
      if (basePos.total_positions < 10) {
        console.log(`[v0] Base position ${basePositionId} only has ${basePos.total_positions} positions, need 10`)
        return
      }

      // Check if MAIN PSEUDO already created for this base
      const [existing] = await sql`
        SELECT id FROM pseudo_positions
        WHERE base_position_id = ${basePositionId}
          AND position_level = 'main'
          AND status = 'main_active'
      `

      if (existing) {
        console.log(`[v0] MAIN PSEUDO already exists for base ${basePositionId}`)
        return
      }

      await sql`
        INSERT INTO pseudo_positions (
          connection_id, symbol, indication_type, indication_range,
          takeprofit_factor, stoploss_ratio, trailing_enabled,
          trail_start, trail_stop, entry_price, current_price,
          direction, status, base_position_id, position_level,
          profit_factor, created_at
        )
        SELECT 
          connection_id, symbol, indication_type, indication_range,
          takeprofit_factor, stoploss_ratio, trailing_enabled,
          trail_start, trail_stop, entry_price, entry_price,
          direction, 'main_active', id, 'main',
          ${profitFactor}, CURRENT_TIMESTAMP
        FROM base_pseudo_positions
        WHERE id = ${basePositionId}
      `

      console.log(
        `[v0] Created MAIN PSEUDO position for base ${basePositionId} with profit factor ${profitFactor.toFixed(2)}`,
      )
    } catch (error) {
      console.error(`[v0] Error evaluating for main pseudo graduation:`, error)
    }
  }

  /**
   * REAL PSEUDO: Validate MAIN positions with drawdown time from last X positions
   * Creates REAL PSEUDO positions that REPRESENT main pseudo after validation
   */
  private async evaluateForRealPseudoGraduation(mainPosition: any): Promise<void> {
    try {
      const lastXPositions = await sql`
        SELECT *
        FROM pseudo_positions
        WHERE base_position_id = ${mainPosition.base_position_id}
          AND position_level = 'main'
          AND status IN ('main_closed', 'main_active')
        ORDER BY created_at DESC
        LIMIT 20
      `

      if (lastXPositions.length < 10) {
        console.log(`[v0] MAIN position needs at least 10 historical positions for REAL PSEUDO validation`)
        return
      }

      // Calculate average drawdown time from last X positions
      const avgDrawdownTime = this.calculateAverageDrawdownTime(lastXPositions)

      // Calculate profit factor from last X positions
      const recentProfitFactor = this.calculateProfitFactorFromPositions(lastXPositions)

      if (recentProfitFactor < 0.6) {
        console.log(`[v0] Recent profit factor ${recentProfitFactor.toFixed(2)} < 0.6, not ready for REAL PSEUDO`)
        return
      }

      if (avgDrawdownTime > 12) {
        // 12 hours max drawdown time
        console.log(`[v0] Average drawdown time ${avgDrawdownTime.toFixed(1)}h > 12h, not ready for REAL PSEUDO`)
        return
      }

      // Check if REAL PSEUDO already exists
      const [existing] = await sql`
        SELECT id FROM real_pseudo_positions
        WHERE main_config_id = ${mainPosition.id}
      `

      if (existing) {
        console.log(`[v0] REAL PSEUDO already exists for main ${mainPosition.id}`)
        return
      }

      await sql`
        INSERT INTO real_pseudo_positions (
          connection_id, main_config_id, base_config_id,
          symbol, side, entry_price, quantity, 
          takeprofit, stoploss, trailing_enabled,
          trail_start, trail_stop,
          status, validated_at, profit_factor, avg_drawdown_time
        )
        VALUES (
          ${this.connectionId},
          ${mainPosition.id},
          ${mainPosition.base_position_id},
          ${mainPosition.symbol},
          ${mainPosition.direction},
          ${mainPosition.entry_price},
          ${mainPosition.quantity || 1},
          ${mainPosition.entry_price * (1 + mainPosition.takeprofit_factor / 100)},
          ${mainPosition.entry_price * (1 - mainPosition.stoploss_ratio / 100)},
          ${mainPosition.trailing_enabled},
          ${mainPosition.trail_start},
          ${mainPosition.trail_stop},
          'validated',
          CURRENT_TIMESTAMP,
          ${recentProfitFactor},
          ${avgDrawdownTime}
        )
      `

      console.log(
        `[v0] Created REAL PSEUDO position representing MAIN ${mainPosition.id} (PF: ${recentProfitFactor.toFixed(2)}, DD: ${avgDrawdownTime.toFixed(1)}h)`,
      )
    } catch (error) {
      console.error(`[v0] Error evaluating for real pseudo graduation:`, error)
    }
  }

  /**
   * Calculate average drawdown time from positions
   */
  private calculateAverageDrawdownTime(positions: any[]): number {
    if (positions.length === 0) return 0

    const totalDrawdownHours = positions.reduce((sum, pos) => {
      const hoursOpen = pos.closed_at
        ? (new Date(pos.closed_at).getTime() - new Date(pos.created_at).getTime()) / (1000 * 60 * 60)
        : 0
      return sum + hoursOpen
    }, 0)

    return totalDrawdownHours / positions.length
  }

  /**
   * Calculate profit factor from a set of positions
   */
  private calculateProfitFactorFromPositions(positions: any[]): number {
    const wins = positions.filter((p) => (p.profit_loss || 0) > 0)
    const losses = positions.filter((p) => (p.profit_loss || 0) < 0)

    if (losses.length === 0) return wins.length > 0 ? 999 : 0

    const avgWin = wins.reduce((sum, p) => sum + (p.profit_loss || 0), 0) / (wins.length || 1)
    const avgLoss = Math.abs(losses.reduce((sum, p) => sum + (p.profit_loss || 0), 0) / losses.length)

    const winRate = wins.length / positions.length

    return (avgWin * winRate) / (avgLoss * (1 - winRate))
  }

  /**
   * Get profit factor from last X positions of a base configuration
   */
  private async getLastXPositionsProfitFactor(baseConfigId: string, count: number): Promise<number> {
    const positions = await sql`
      SELECT profit_loss
      FROM pseudo_positions
      WHERE base_position_id = ${baseConfigId}
        AND status LIKE '%closed%'
      ORDER BY created_at DESC
      LIMIT ${count}
    `

    return this.calculateProfitFactorFromPositions(positions)
  }
}
