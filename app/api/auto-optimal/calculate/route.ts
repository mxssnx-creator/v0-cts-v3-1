import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import DatabaseManager from "@/lib/database"
import { EntityTypes, ConfigSubTypes } from "@/lib/core/entity-types"
import { sql } from "slonik"

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

    console.log(`[v0] Starting auto-optimal calculation for config: ${configId}`)

    // Fetch historical positions for analysis
    const historicalPositions = await sql`
      SELECT * FROM pseudo_positions
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${config.calculation_days} days'
      AND status = 'closed'
      ORDER BY closed_at DESC
    `

    console.log(`[v0] Analyzing ${historicalPositions.length} historical positions`)

    // Generate parameter combinations to test
    const testCombinations = generateParameterCombinations(config)

    // Run simulations for each combination
    const simulationResults = []
    for (const combination of testCombinations) {
      const result = await simulateConfiguration(combination, historicalPositions)

      // Filter based on criteria
      if (
        result.profitFactor >= config.min_profit_factor &&
        result.totalPositions >= config.min_profit_factor_positions &&
        result.drawdownTimeHours <= config.max_drawdown_time_hours
      ) {
        simulationResults.push(result)
      }
    }

    // Sort by profit factor and win rate
    simulationResults.sort((a, b) => {
      if (b.profitFactor !== a.profitFactor) {
        return b.profitFactor - a.profitFactor
      }
      return b.winRate - a.winRate
    })

    // Store top results
    for (const result of simulationResults.slice(0, 100)) {
      await dbManager.insert(EntityTypes.CONFIG, ConfigSubTypes.AUTO_OPTIMAL_RESULT, {
        id: uuidv4(),
        config_id: configId,
        ...result,
        created_at: new Date().toISOString(),
      })
    }

    console.log(`[v0] Auto-optimal calculation complete: ${simulationResults.length} results`)

    return NextResponse.json({ success: true, configId, results: simulationResults.slice(0, 20) })
  } catch (error) {
    console.error("[v0] Auto optimal calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate optimal configurations" }, { status: 500 })
  }
}

function generateParameterCombinations(config: any): any[] {
  const combinations = []

  // Generate TP/SL combinations
  const tpStep = (config.takeprofit_max - config.takeprofit_min) / 5
  const slStep = (config.stoploss_max - config.stoploss_min) / 5

  for (let tp = config.takeprofit_min; tp <= config.takeprofit_max; tp += tpStep) {
    for (let sl = config.stoploss_min; sl <= config.stoploss_max; sl += slStep) {
      combinations.push({
        takeprofit: tp,
        stoploss: sl,
        trailing_enabled: config.trailing_enabled,
        use_block: config.use_block,
        use_dca: config.use_dca,
      })
    }
  }

  return combinations
}

async function simulateConfiguration(combination: any, positions: any[]): Promise<any> {
  // Simulate how positions would have performed with this configuration
  let totalPnL = 0
  let winningTrades = 0
  let losingTrades = 0
  let totalProfit = 0
  let totalLoss = 0

  for (const position of positions) {
    const simulatedPnL = calculateSimulatedPnL(position, combination)
    totalPnL += simulatedPnL

    if (simulatedPnL > 0) {
      winningTrades++
      totalProfit += simulatedPnL
    } else {
      losingTrades++
      totalLoss += Math.abs(simulatedPnL)
    }
  }

  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0
  const winRate = positions.length > 0 ? winningTrades / positions.length : 0

  return {
    ...combination,
    profitFactor,
    winRate,
    totalPnL,
    totalPositions: positions.length,
    winningTrades,
    losingTrades,
    drawdownTimeHours: 0, // Simplified for now
  }
}

function calculateSimulatedPnL(position: any, config: any): number {
  // Simplified simulation - in reality would need more complex logic
  const entryPrice = Number.parseFloat(position.entry_price || "0")
  const maxPrice = Number.parseFloat(position.max_price || entryPrice.toString())
  const minPrice = Number.parseFloat(position.min_price || entryPrice.toString())

  const tpHit =
    position.side === "buy"
      ? maxPrice >= entryPrice * (1 + config.takeprofit / 100)
      : minPrice <= entryPrice * (1 - config.takeprofit / 100)

  const slHit =
    position.side === "buy"
      ? minPrice <= entryPrice * (1 - config.stoploss / 100)
      : maxPrice >= entryPrice * (1 + config.stoploss / 100)

  if (tpHit) {
    return (entryPrice * config.takeprofit) / 100
  } else if (slHit) {
    return (-entryPrice * config.stoploss) / 100
  }

  return Number.parseFloat(position.pnl || "0")
}
