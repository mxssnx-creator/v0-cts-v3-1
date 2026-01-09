import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import DatabaseManager from "@/lib/database"
import { EntityTypes, ConfigSubTypes } from "@/lib/core/entity-types"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    const dbManager = DatabaseManager.getInstance()

    // Save configuration
    const configId = uuidv4()

    await dbManager.insert(EntityTypes.CONFIG, ConfigSubTypes.AUTO_OPTIMAL, {
      id: configId,
      name: `Auto Config ${new Date().toISOString()}`,
      symbol_mode: config.symbol_mode,
      exchange_order_by: config.exchange_order_by,
      symbol_limit: config.symbol_limit,
      indication_type: config.indication_type,
      indication_params: JSON.stringify(config.indication_params || {}),
      takeprofit_min: config.takeprofit_min,
      takeprofit_max: config.takeprofit_max,
      stoploss_min: config.stoploss_min,
      stoploss_max: config.stoploss_max,
      trailing_enabled: config.trailing_enabled,
      trailing_only: config.trailing_only,
      min_profit_factor: config.min_profit_factor,
      min_profit_factor_positions: config.min_profit_factor_positions,
      max_drawdown_time_hours: config.max_drawdown_time_hours,
      use_block: config.use_block,
      use_dca: config.use_dca,
      additional_strategies_only: config.additional_strategies_only,
      calculation_days: config.calculation_days,
      max_positions_per_direction: config.max_positions_per_direction,
      max_positions_per_symbol: config.max_positions_per_symbol,
    })

    console.log(`[v0] Auto-optimal config created using dynamic operations: ${configId}`)

    const results = await calculateOptimalConfigurations(config, configId)

    return NextResponse.json({ success: true, configId, results })
  } catch (error) {
    console.error("[v0] Auto optimal calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate optimal configurations" }, { status: 500 })
  }
}

/**
 * Calculate optimal configurations using historical data
 */
async function calculateOptimalConfigurations(config: any, configId: string): Promise<any[]> {
  const dbManager = DatabaseManager.getInstance()
  const results: any[] = []

  try {
    // 1. Fetch historical data for the calculation period
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - config.calculation_days * 24 * 60 * 60 * 1000)

    // 2. Get symbols based on exchange order settings
    const symbols = await getSymbolsForCalculation(config.symbol_mode, config.exchange_order_by, config.symbol_limit)

    // 3. Generate parameter combinations
    const tpRange = generateRange(config.takeprofit_min, config.takeprofit_max, 10)
    const slRange = generateRange(config.stoploss_min, config.stoploss_max, 10)

    // 4. Run simulations for each combination
    for (const tp of tpRange) {
      for (const sl of slRange) {
        const simulationResult = await runSimulation({
          symbol_mode: config.symbol_mode,
          symbols,
          indication_type: config.indication_type,
          indication_params: config.indication_params,
          takeprofit: tp,
          stoploss: sl,
          trailing_enabled: config.trailing_enabled,
          trailing_only: config.trailing_only,
          use_block: config.use_block,
          use_dca: config.use_dca,
          startDate,
          endDate,
        })

        // 5. Filter results based on criteria
        if (
          simulationResult.profit_factor >= config.min_profit_factor &&
          simulationResult.total_trades >= config.min_profit_factor_positions &&
          simulationResult.max_drawdown_hours <= config.max_drawdown_time_hours
        ) {
          // Store result
          await dbManager.insert(EntityTypes.RESULT, "auto_optimal", {
            config_id: configId,
            takeprofit: tp,
            stoploss: sl,
            profit_factor: simulationResult.profit_factor,
            total_trades: simulationResult.total_trades,
            win_rate: simulationResult.win_rate,
            total_pnl: simulationResult.total_pnl,
            max_drawdown: simulationResult.max_drawdown,
            max_drawdown_hours: simulationResult.max_drawdown_hours,
          })

          results.push(simulationResult)
        }
      }
    }

    return results
  } catch (error) {
    console.error("[v0] Calculation failed:", error)
    return []
  }
}

/**
 * Generate range of values for testing
 */
function generateRange(min: number, max: number, steps: number): number[] {
  const range: number[] = []
  const step = (max - min) / (steps - 1)

  for (let i = 0; i < steps; i++) {
    range.push(min + step * i)
  }

  return range
}

/**
 * Get symbols for calculation based on mode
 */
async function getSymbolsForCalculation(mode: string, orderBy: string, limit: number): Promise<string[]> {
  // Implementation depends on exchange API
  // For now, return top symbols by volume
  return ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"].slice(0, limit)
}

/**
 * Run simulation for parameter combination
 */
async function runSimulation(params: any): Promise<any> {
  // This would implement the actual backtesting logic
  // For now, return mock structure that will be implemented
  return {
    profit_factor: 1.5,
    total_trades: 100,
    win_rate: 55,
    total_pnl: 1000,
    max_drawdown: 15,
    max_drawdown_hours: 24,
  }
}
