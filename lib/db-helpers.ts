/**
 * Database Helper Functions for New Structure
 * Provides utilities for working with separate indication and strategy tables
 */

import { sql, query } from "@/lib/db"
import type { IndicationType, StrategyType } from "@/lib/constants/types"

// =============================================================================
// TABLE NAME MAPPING
// =============================================================================

/**
 * Get the table name for a specific indication type
 */
export function getIndicationTableName(indicationType: IndicationType): string {
  const tableMap: Record<IndicationType, string> = {
    direction: "indications_direction",
    move: "indications_move",
    active: "indications_active",
    optimal: "indications_optimal",
    auto: "indications_auto",
  }
  return tableMap[indicationType]
}

/**
 * Get the table name for a specific strategy type
 */
export function getStrategyTableName(strategyType: StrategyType): string {
  const tableMap: Record<StrategyType, string> = {
    base: "strategies_base",
    main: "strategies_main",
    real: "strategies_real",
    block: "strategies_block",
    dca: "strategies_dca",
    trailing: "strategies_trailing",
  }
  return tableMap[strategyType]
}

// =============================================================================
// INDICATION QUERIES
// =============================================================================

/**
 * Get active indications for a connection and symbol
 */
export async function getActiveIndications(
  connectionId: string,
  symbol: string,
  indicationType?: IndicationType,
) {
  if (indicationType) {
    const tableName = getIndicationTableName(indicationType)
    return await sql`
      SELECT * FROM ${sql(tableName)}
      WHERE connection_id = ${connectionId}
        AND symbol = ${symbol}
        AND status = 'active'
      ORDER BY calculated_at DESC
    `
  }

  // Query all indication types
  const results = await Promise.all([
    sql`SELECT 'direction' as indication_type, * FROM indications_direction 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'move' as indication_type, * FROM indications_move 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'active' as indication_type, * FROM indications_active 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'optimal' as indication_type, * FROM indications_optimal 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'auto' as indication_type, * FROM indications_auto 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
  ])

  return results.flat()
}

/**
 * Get best performing indications for a connection
 */
export async function getBestPerformingIndications(
  connectionId: string,
  indicationType: IndicationType,
  limit: number = 10,
) {
  const tableName = getIndicationTableName(indicationType)
  return await sql`
    SELECT * FROM ${sql(tableName)}
    WHERE connection_id = ${connectionId}
      AND status = 'active'
    ORDER BY profit_factor DESC, confidence DESC
    LIMIT ${limit}
  `
}

/**
 * Get recent indications within time window
 */
export async function getRecentIndications(
  connectionId: string,
  indicationType: IndicationType,
  minutes: number = 60,
) {
  const tableName = getIndicationTableName(indicationType)
  return await sql`
    SELECT * FROM ${sql(tableName)}
    WHERE connection_id = ${connectionId}
      AND calculated_at > NOW() - INTERVAL '${sql.unsafe(minutes.toString())} minutes'
    ORDER BY calculated_at DESC
  `
}

// =============================================================================
// STRATEGY QUERIES
// =============================================================================

/**
 * Get active strategies for a connection and symbol
 */
export async function getActiveStrategies(
  connectionId: string,
  symbol: string,
  strategyType?: StrategyType,
) {
  if (strategyType) {
    const tableName = getStrategyTableName(strategyType)
    return await sql`
      SELECT * FROM ${sql(tableName)}
      WHERE connection_id = ${connectionId}
        AND symbol = ${symbol}
        AND status IN ('active', 'open')
      ORDER BY created_at DESC
    `
  }

  // Query all strategy types
  const results = await Promise.all([
    sql`SELECT 'base' as strategy_type, * FROM strategies_base 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'main' as strategy_type, * FROM strategies_main 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'active'`,
    sql`SELECT 'real' as strategy_type, * FROM strategies_real 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol} AND status = 'open'`,
  ])

  return results.flat()
}

/**
 * Get best performing strategies
 */
export async function getBestPerformingStrategies(
  connectionId: string,
  strategyType: StrategyType,
  limit: number = 10,
) {
  const tableName = getStrategyTableName(strategyType)

  if (strategyType === "real") {
    return await sql`
      SELECT * FROM ${sql(tableName)}
      WHERE connection_id = ${connectionId}
        AND status = 'open'
      ORDER BY profit_loss DESC
      LIMIT ${limit}
    `
  }

  return await sql`
    SELECT * FROM ${sql(tableName)}
    WHERE connection_id = ${connectionId}
      AND status = 'active'
    ORDER BY profit_factor DESC, win_rate DESC
    LIMIT ${limit}
  `
}

/**
 * Get strategy performance statistics
 */
export async function getStrategyStatistics(connectionId: string, strategyType: StrategyType) {
  const tableName = getStrategyTableName(strategyType)

  if (strategyType === "real") {
    return await sql`
      SELECT 
        COUNT(*) as total_positions,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as winning_positions,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as losing_positions,
        SUM(profit_loss) as total_pnl,
        AVG(profit_loss) as avg_pnl,
        MAX(profit_loss) as max_profit,
        MIN(profit_loss) as max_loss,
        CAST(SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) as win_rate
      FROM ${sql(tableName)}
      WHERE connection_id = ${connectionId}
        AND status = 'closed'
    `
  }

  return await sql`
    SELECT 
      COUNT(*) as total_strategies,
      AVG(profit_factor) as avg_profit_factor,
      AVG(win_rate) as avg_win_rate,
      SUM(total_trades) as total_trades,
      SUM(winning_trades) as total_winning_trades,
      SUM(losing_trades) as total_losing_trades
    FROM ${sql(tableName)}
    WHERE connection_id = ${connectionId}
      AND status = 'active'
  `
}

// =============================================================================
// CROSS-TABLE QUERIES
// =============================================================================

/**
 * Get comprehensive performance summary across all indication types
 */
export async function getAllIndicationPerformance(connectionId: string) {
  const results = await sql`
    SELECT * FROM v_indication_performance
    WHERE connection_id = ${connectionId}
    ORDER BY profit_factor DESC, calculated_at DESC
  `
  return results
}

/**
 * Get comprehensive performance summary across all strategy types
 */
export async function getAllStrategyPerformance(connectionId: string) {
  const results = await sql`
    SELECT * FROM v_strategy_performance
    WHERE connection_id = ${connectionId}
    ORDER BY profit_factor DESC
  `
  return results
}

/**
 * Get daily performance summary
 */
export async function getDailyPerformanceSummary(connectionId: string, days: number = 7) {
  const queryText = `
    SELECT * FROM v_daily_performance
    WHERE connection_id = $1
      AND trade_date >= CURRENT_DATE - INTERVAL '$2 days'
    ORDER BY trade_date DESC
  `
  return await query(queryText, [connectionId, days])
}

// =============================================================================
// INSERT/UPDATE HELPERS
// =============================================================================

/**
 * Insert a new indication record
 */
export async function insertIndication(indicationType: IndicationType, data: Record<string, any>) {
  const tableName = getIndicationTableName(indicationType)
  const columns = Object.keys(data)
  const values = Object.values(data)
  
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ")
  const queryText = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES (${placeholders})
    RETURNING *
  `

  const result = await query(queryText, values)
  return result[0]
}

/**
 * Update an indication record
 */
export async function updateIndication(
  indicationType: IndicationType,
  id: string,
  data: Record<string, any>,
) {
  const tableName = getIndicationTableName(indicationType)
  const entries = Object.entries(data)
  const setClause = entries
    .map(([key, _], i) => `${key} = $${i + 1}`)
    .join(", ")
  const values = [...entries.map(([_, val]) => val), id]

  const queryText = `
    UPDATE ${tableName}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *
  `
  
  const result = await query(queryText, values)
  return result[0]
}

/**
 * Insert a new strategy record
 */
export async function insertStrategy(strategyType: StrategyType, data: Record<string, any>) {
  const tableName = getStrategyTableName(strategyType)
  const columns = Object.keys(data)
  const values = Object.values(data)
  
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ")
  const queryText = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES (${placeholders})
    RETURNING *
  `

  const result = await query(queryText, values)
  return result[0]
}

/**
 * Update a strategy record
 */
export async function updateStrategy(strategyType: StrategyType, id: string, data: Record<string, any>) {
  const tableName = getStrategyTableName(strategyType)
  const entries = Object.entries(data)
  const setClause = entries
    .map(([key, _], i) => `${key} = $${i + 1}`)
    .join(", ")
  const values = [...entries.map(([_, val]) => val), id]

  const queryText = `
    UPDATE ${tableName}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *
  `
  
  const result = await query(queryText, values)
  return result[0]
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Get query execution statistics for monitoring
 */
export async function getQueryPerformanceStats() {
  return await sql`
    SELECT 
      schemaname,
      tablename,
      seq_scan,
      seq_tup_read,
      idx_scan,
      idx_tup_fetch,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      n_live_tup,
      n_dead_tup,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'indications_%' OR tablename LIKE 'strategies_%')
    ORDER BY seq_scan DESC, idx_scan DESC
  `
}

/**
 * Get index usage statistics
 */
export async function getIndexUsageStats() {
  return await sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND (tablename LIKE 'indications_%' OR tablename LIKE 'strategies_%')
    ORDER BY idx_scan DESC
  `
}
