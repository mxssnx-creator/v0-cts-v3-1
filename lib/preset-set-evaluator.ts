import { sql } from "@/lib/db"

interface SetEvaluationMetrics {
  setId: string
  symbolStats: Map<
    string,
    {
      totalPositions: number
      lastNPositions: number
      avgProfitFactor: number
      recentAvgProfitFactor: number
      shouldDisable: boolean
    }
  >
  overallProfitFactor: number
  shouldDisableSet: boolean
}

export class PresetSetEvaluator {
  private evaluationInterval: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Start hourly re-evaluation of all active Sets
   */
  start() {
    if (this.isRunning) {
      console.log("[v0] Set evaluator already running")
      return
    }

    console.log("[v0] Starting hourly Set re-evaluation")
    this.isRunning = true

    // Run immediately on start
    this.evaluateAllSets()

    // Then run every hour
    this.evaluationInterval = setInterval(
      () => {
        this.evaluateAllSets()
      },
      60 * 60 * 1000,
    ) // 1 hour
  }

  /**
   * Stop the re-evaluation system
   */
  stop() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval)
      this.evaluationInterval = null
    }
    this.isRunning = false
    console.log("[v0] Stopped Set re-evaluation")
  }

  /**
   * Evaluate all active Sets and disable underperforming ones
   */
  private async evaluateAllSets() {
    try {
      console.log("[v0] Starting hourly Set evaluation...")

      // Get all active Sets
      const sets = await sql`
        SELECT * FROM preset_configuration_sets
        WHERE is_active = true
      `

      for (const set of sets) {
        await this.evaluateSet(set)
      }

      console.log(`[v0] Completed evaluation of ${sets.length} Sets`)
    } catch (error) {
      console.error("[v0] Error during Set evaluation:", error)
    }
  }

  /**
   * Evaluate a single Set and auto-disable if needed
   */
  private async evaluateSet(set: any): Promise<SetEvaluationMetrics> {
    const setId = set.id
    const evaluationCount = set.evaluation_positions_count1 || 25
    const minProfitFactor = set.profit_factor_min || 0.5

    // Get all positions for this Set
    const positions = await sql`
      SELECT 
        symbol,
        profit_factor,
        created_at,
        status
      FROM pseudo_positions
      WHERE 
        connection_id IN (
          SELECT connection_id FROM preset_type_sets WHERE set_id = ${setId}
        )
        AND indication_type = ${set.indication_type}
      ORDER BY created_at DESC
    `

    // Analyze by symbol
    const symbolStats = new Map()
    const symbolPositions = new Map<string, any[]>()

    // Group positions by symbol
    for (const pos of positions) {
      if (!symbolPositions.has(pos.symbol)) {
        symbolPositions.set(pos.symbol, [])
      }
      symbolPositions.get(pos.symbol)!.push(pos)
    }

    let shouldDisableSet = false

    // Analyze each symbol
    for (const [symbol, symPositions] of symbolPositions.entries()) {
      const totalPositions = symPositions.length
      const lastNPositions = symPositions.slice(0, evaluationCount)

      if (lastNPositions.length < evaluationCount) {
        // Not enough data yet
        symbolStats.set(symbol, {
          totalPositions,
          lastNPositions: lastNPositions.length,
          avgProfitFactor: 0,
          recentAvgProfitFactor: 0,
          shouldDisable: false,
        })
        continue
      }

      // Calculate average profit factors
      const allProfitFactors = symPositions.map((p) => p.profit_factor)
      const recentProfitFactors = lastNPositions.map((p) => p.profit_factor)

      const avgProfitFactor = allProfitFactors.reduce((a, b) => a + b, 0) / allProfitFactors.length
      const recentAvgProfitFactor = recentProfitFactors.reduce((a, b) => a + b, 0) / recentProfitFactors.length

      const shouldDisable = recentAvgProfitFactor < minProfitFactor

      symbolStats.set(symbol, {
        totalPositions,
        lastNPositions: lastNPositions.length,
        avgProfitFactor,
        recentAvgProfitFactor,
        shouldDisable,
      })

      if (shouldDisable) {
        shouldDisableSet = true
        console.log(
          `[v0] Symbol ${symbol} in Set ${set.name} underperforming: ` +
            `recent PF ${recentAvgProfitFactor.toFixed(3)} < min ${minProfitFactor}`,
        )
      }
    }

    // Calculate overall metrics
    const allProfitFactors = positions.map((p) => p.profit_factor)
    const overallProfitFactor =
      allProfitFactors.length > 0 ? allProfitFactors.reduce((a, b) => a + b, 0) / allProfitFactors.length : 0

    // Auto-disable Set if needed
    if (shouldDisableSet) {
      console.log(`[v0] Auto-disabling Set ${set.name} due to underperformance`)

      await sql`
        UPDATE preset_configuration_sets
        SET 
          is_active = false,
          last_evaluation_at = CURRENT_TIMESTAMP,
          auto_disabled_at = CURRENT_TIMESTAMP,
          auto_disabled_reason = 'Profit factor below threshold for one or more symbols'
        WHERE id = ${setId}
      `
    } else {
      // Update last evaluation timestamp
      await sql`
        UPDATE preset_configuration_sets
        SET last_evaluation_at = CURRENT_TIMESTAMP
        WHERE id = ${setId}
      `
    }

    return {
      setId,
      symbolStats,
      overallProfitFactor,
      shouldDisableSet,
    }
  }

  /**
   * Manually evaluate a specific Set (can be called via API)
   */
  async evaluateSetById(setId: string): Promise<SetEvaluationMetrics | null> {
    try {
      const [set] = await sql`
        SELECT * FROM preset_configuration_sets
        WHERE id = ${setId}
      `

      if (!set) {
        return null
      }

      return await this.evaluateSet(set)
    } catch (error) {
      console.error(`[v0] Error evaluating Set ${setId}:`, error)
      return null
    }
  }
}

// Singleton instance
let evaluatorInstance: PresetSetEvaluator | null = null

export function getSetEvaluator(): PresetSetEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new PresetSetEvaluator()
  }
  return evaluatorInstance
}
