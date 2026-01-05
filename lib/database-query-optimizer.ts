/**
 * Database Query Optimizer
 * Provides query optimization and performance monitoring
 */

import { dbRouter, type IndicationType, type StrategyType } from "./high-performance-database-router"

export interface QueryOptions {
  indicationType?: IndicationType
  strategyType?: StrategyType
  useUnion?: boolean
  enablePerformanceTracking?: boolean
}

export class DatabaseQueryOptimizer {
  private static instance: DatabaseQueryOptimizer

  private constructor() {}

  public static getInstance(): DatabaseQueryOptimizer {
    if (!DatabaseQueryOptimizer.instance) {
      DatabaseQueryOptimizer.instance = new DatabaseQueryOptimizer()
    }
    return DatabaseQueryOptimizer.instance
  }

  /**
   * Execute optimized query with automatic table routing
   */
  public async executeOptimizedQuery(
    entityType: string,
    operation: "select" | "insert" | "update" | "delete",
    data?: any,
    options?: QueryOptions,
  ): Promise<any> {
    const startTime = performance.now()

    try {
      let result

      // Route to specific table based on indication/strategy type
      if (options?.indicationType || options?.strategyType) {
        const tableName = dbRouter.routeEntityToTable(entityType, {
          indicationType: options.indicationType,
          strategyType: options.strategyType,
        })

        result = await this.executeOnTable(tableName, operation, data)
      }
      // Execute UNION query across all tables
      else if (options?.useUnion) {
        result = await this.executeUnionQuery(entityType, operation, data)
      }
      // Default single table query
      else {
        const tableName = dbRouter.routeEntityToTable(entityType, {})
        result = await this.executeOnTable(tableName, operation, data)
      }

      // Log performance metrics
      if (options?.enablePerformanceTracking) {
        const executionTime = performance.now() - startTime
        await dbRouter.logPerformanceMetrics(
          entityType,
          operation,
          executionTime,
          Array.isArray(result) ? result.length : 1,
        )
      }

      return result
    } catch (error) {
      console.error("[DatabaseQueryOptimizer] Query execution failed:", error)
      throw error
    }
  }

  /**
   * Execute query on specific table
   */
  private async executeOnTable(tableName: string, operation: string, data?: any): Promise<any> {
    const { getClient, getDatabaseType } = await import("./db")
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    switch (operation) {
      case "select":
        if (isPostgres) {
          const result = await (client as any).query(`SELECT * FROM ${tableName}`)
          return result.rows
        } else {
          return (client as any).prepare(`SELECT * FROM ${tableName}`).all()
        }

      case "insert":
        const columns = Object.keys(data).join(", ")
        const placeholders = Object.keys(data)
          .map((_, i) => (isPostgres ? `$${i + 1}` : "?"))
          .join(", ")

        if (isPostgres) {
          return await (client as any).query(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
            Object.values(data),
          )
        } else {
          return (client as any)
            .prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`)
            .run(...Object.values(data))
        }

      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  }

  /**
   * Execute UNION query across multiple tables
   */
  private async executeUnionQuery(entityType: string, operation: string, data?: any): Promise<any> {
    if (operation !== "select") {
      throw new Error("UNION queries only supported for SELECT operations")
    }

    const unionQuery = dbRouter.generateUnionQuery(entityType)

    const { getClient, getDatabaseType } = await import("./db")
    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    if (isPostgres) {
      const result = await (client as any).query(unionQuery)
      return result.rows
    } else {
      return (client as any).prepare(unionQuery).all()
    }
  }

  /**
   * Get query performance statistics
   */
  public async getPerformanceStats(tableName?: string): Promise<any[]> {
    const { getClient, getDatabaseType } = await import("./db")
    const { dbConfig } = await import("./config/database-config")

    const client = getClient()
    const dbType = getDatabaseType()
    const isPostgres = dbType === "postgresql" || dbType === "remote"

    const perfTable = `${dbConfig.getPrefix()}_performance_stats`

    let query = `SELECT * FROM ${perfTable}`
    if (tableName) {
      query += ` WHERE table_name = ${isPostgres ? "$1" : "?"}`
    }
    query += " ORDER BY timestamp DESC LIMIT 100"

    if (isPostgres) {
      const result = await (client as any).query(query, tableName ? [tableName] : [])
      return result.rows
    } else {
      const stmt = (client as any).prepare(query)
      return tableName ? stmt.all(tableName) : stmt.all()
    }
  }
}

export const queryOptimizer = DatabaseQueryOptimizer.getInstance()
