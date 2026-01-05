/**
 * High-Performance Database Router
 * Routes queries to the correct indication/strategy-specific tables
 * Provides automatic table selection based on indication and strategy types
 */

import { dbConfig } from "./config/database-config"
import { EntityTypes } from "./core/entity-types"

export type IndicationType = "active" | "direction" | "move"
export type StrategyType = "simple" | "advanced" | "step"

export class HighPerformanceDatabaseRouter {
  private static instance: HighPerformanceDatabaseRouter

  private constructor() {}

  public static getInstance(): HighPerformanceDatabaseRouter {
    if (!HighPerformanceDatabaseRouter.instance) {
      HighPerformanceDatabaseRouter.instance = new HighPerformanceDatabaseRouter()
    }
    return HighPerformanceDatabaseRouter.instance
  }

  /**
   * Get the table name for pseudo positions based on indication type
   */
  public getPseudoPositionTable(indicationType: IndicationType): string {
    const prefix = dbConfig.getPrefix()
    switch (indicationType) {
      case "active":
        return `${prefix}_active_pseudo_positions`
      case "direction":
        return `${prefix}_direction_pseudo_positions`
      case "move":
        return `${prefix}_move_pseudo_positions`
      default:
        throw new Error(`Unknown indication type: ${indicationType}`)
    }
  }

  /**
   * Get the table name for real positions based on strategy type
   */
  public getRealPositionTable(strategyType: StrategyType): string {
    const prefix = dbConfig.getPrefix()
    switch (strategyType) {
      case "simple":
        return `${prefix}_simple_real_positions`
      case "advanced":
        return `${prefix}_advanced_real_positions`
      case "step":
        return `${prefix}_step_real_positions`
      default:
        throw new Error(`Unknown strategy type: ${strategyType}`)
    }
  }

  /**
   * Get all pseudo position tables (for queries across all indication types)
   */
  public getAllPseudoPositionTables(): string[] {
    const prefix = dbConfig.getPrefix()
    return [
      `${prefix}_active_pseudo_positions`,
      `${prefix}_direction_pseudo_positions`,
      `${prefix}_move_pseudo_positions`,
    ]
  }

  /**
   * Get all real position tables (for queries across all strategy types)
   */
  public getAllRealPositionTables(): string[] {
    const prefix = dbConfig.getPrefix()
    return [`${prefix}_simple_real_positions`, `${prefix}_advanced_real_positions`, `${prefix}_step_real_positions`]
  }

  /**
   * Route entity type to correct table based on metadata
   */
  public routeEntityToTable(
    entityType: string,
    metadata?: { indicationType?: IndicationType; strategyType?: StrategyType },
  ): string {
    // Handle pseudo positions with indication type routing
    if (entityType === EntityTypes.PSEUDO_POSITION && metadata?.indicationType) {
      return this.getPseudoPositionTable(metadata.indicationType)
    }

    // Handle real positions with strategy type routing
    if (entityType === EntityTypes.REAL_POSITION && metadata?.strategyType) {
      return this.getRealPositionTable(metadata.strategyType)
    }

    // Fallback to default table name with prefix
    return dbConfig.getTableName(this.getBaseTableName(entityType))
  }

  /**
   * Get base table name for entity type
   */
  private getBaseTableName(entityType: string): string {
    switch (entityType) {
      case EntityTypes.PSEUDO_POSITION:
        return "pseudo_positions"
      case EntityTypes.REAL_POSITION:
        return "real_positions"
      case EntityTypes.CONNECTION:
        return "exchange_connections"
      case EntityTypes.MARKET_DATA:
        return "market_data"
      case EntityTypes.SETTING:
        return "system_settings"
      case EntityTypes.LOG:
        return "logs"
      case EntityTypes.ERROR:
        return "errors"
      case EntityTypes.CONFIG:
        return "auto_optimal_configurations"
      default:
        return entityType
    }
  }

  /**
   * Generate UNION query to query all tables of a type
   */
  public generateUnionQuery(
    entityType: string,
    selectColumns = "*",
    whereClause = "",
    orderBy = "",
    limit?: number,
  ): string {
    let tables: string[] = []

    if (entityType === EntityTypes.PSEUDO_POSITION) {
      tables = this.getAllPseudoPositionTables()
    } else if (entityType === EntityTypes.REAL_POSITION) {
      tables = this.getAllRealPositionTables()
    } else {
      throw new Error(`UNION queries not supported for entity type: ${entityType}`)
    }

    const queries = tables.map((table) => {
      let query = `SELECT ${selectColumns} FROM ${table}`
      if (whereClause) {
        query += ` WHERE ${whereClause}`
      }
      return query
    })

    let unionQuery = queries.join(" UNION ALL ")

    if (orderBy) {
      unionQuery += ` ORDER BY ${orderBy}`
    }

    if (limit) {
      unionQuery += ` LIMIT ${limit}`
    }

    return unionQuery
  }

  /**
   * Log performance metrics for query optimization
   */
  public async logPerformanceMetrics(
    tableName: string,
    queryType: string,
    executionTimeMs: number,
    rowsAffected?: number,
  ): Promise<void> {
    const perfTable = `${dbConfig.getPrefix()}_performance_stats`

    try {
      const { getClient, getDatabaseType } = await import("./db")
      const client = getClient()
      const dbType = getDatabaseType()

      if (dbType === "postgresql" || dbType === "remote") {
        await (client as any).query(
          `INSERT INTO ${perfTable} (table_name, query_type, execution_time_ms, rows_affected) VALUES ($1, $2, $3, $4)`,
          [tableName, queryType, executionTimeMs, rowsAffected || 0],
        )
      } else {
        ;(client as any)
          .prepare(
            `INSERT INTO ${perfTable} (table_name, query_type, execution_time_ms, rows_affected) VALUES (?, ?, ?, ?)`,
          )
          .run(tableName, queryType, executionTimeMs, rowsAffected || 0)
      }
    } catch (error) {
      console.error("[HighPerformanceDatabaseRouter] Failed to log performance metrics:", error)
    }
  }

  /**
   * Get aggregated statistics across all indication/strategy tables
   */
  public async getAggregatedStats(params: {
    connectionId?: string
    indicationType?: string
    strategyType?: string
    timeRange?: string
  }): Promise<any> {
    const { getClient, getDatabaseType } = await import("./db")
    const client = getClient()
    const dbType = getDatabaseType()

    const stats = {
      totalPseudoPositions: 0,
      totalRealPositions: 0,
      byIndication: {} as Record<string, number>,
      byStrategy: {} as Record<string, number>,
    }

    try {
      // Query all pseudo position tables
      const pseudoTables = this.getAllPseudoPositionTables()
      for (const table of pseudoTables) {
        const indicationType = table.includes("active") ? "active" : table.includes("direction") ? "direction" : "move"

        let query = `SELECT COUNT(*) as count FROM ${table}`
        const conditions: string[] = []
        const values: any[] = []

        if (params.connectionId) {
          conditions.push(dbType === "postgresql" ? `connection_id = $${values.length + 1}` : `connection_id = ?`)
          values.push(params.connectionId)
        }

        if (params.indicationType && params.indicationType !== indicationType) {
          continue // Skip non-matching indication types
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`
        }

        const result =
          dbType === "postgresql"
            ? await (client as any).query(query, values)
            : (client as any).prepare(query).get(...values)

        const count = dbType === "postgresql" ? result.rows[0].count : (result as any).count
        stats.totalPseudoPositions += Number.parseInt(count || "0")
        stats.byIndication[indicationType] = (stats.byIndication[indicationType] || 0) + Number.parseInt(count || "0")
      }

      // Query all real position tables
      const realTables = this.getAllRealPositionTables()
      for (const table of realTables) {
        const strategyType = table.includes("simple") ? "simple" : table.includes("advanced") ? "advanced" : "step"

        let query = `SELECT COUNT(*) as count FROM ${table}`
        const conditions: string[] = []
        const values: any[] = []

        if (params.connectionId) {
          conditions.push(dbType === "postgresql" ? `connection_id = $${values.length + 1}` : `connection_id = ?`)
          values.push(params.connectionId)
        }

        if (params.strategyType && params.strategyType !== strategyType) {
          continue // Skip non-matching strategy types
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`
        }

        const result =
          dbType === "postgresql"
            ? await (client as any).query(query, values)
            : (client as any).prepare(query).get(...values)

        const count = dbType === "postgresql" ? result.rows[0].count : (result as any).count
        stats.totalRealPositions += Number.parseInt(count || "0")
        stats.byStrategy[strategyType] = (stats.byStrategy[strategyType] || 0) + Number.parseInt(count || "0")
      }
    } catch (error) {
      console.error("[HighPerformanceDatabaseRouter] Error getting aggregated stats:", error)
    }

    return stats
  }

  /**
   * Get position statistics for a specific connection
   */
  public async getPositionStats(connectionId: string): Promise<any> {
    return this.getAggregatedStats({ connectionId })
  }
}

export const dbRouter = HighPerformanceDatabaseRouter.getInstance()
