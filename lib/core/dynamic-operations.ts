import { type EntityType, EntityMetadataMap, type ConfigSubType } from "./entity-types"
import type { Pool } from "../pg-compat"

export interface QueryFilter {
  field: string
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN"
  value: any
}

export interface QueryOptions {
  filters?: QueryFilter[]
  orderBy?: { field: string; direction: "ASC" | "DESC" }[]
  limit?: number
  offset?: number
  groupBy?: string[]
}

export class DynamicOperationHandler {
  private db: any = null
  private sqlClient: Pool | null = null
  private isPostgreSQL: boolean

  constructor(dbClient: any, isPostgreSQL: boolean) {
    if (isPostgreSQL) {
      this.sqlClient = dbClient as Pool
    } else {
      this.db = dbClient as any
    }
    this.isPostgreSQL = isPostgreSQL
  }

  /**
   * Generic insert operation
   * Usage: insert(EntityTypes.CONFIG, ConfigSubTypes.AUTO_OPTIMAL, data)
   */
  async insert(entityType: EntityType, subType: ConfigSubType | null, data: Record<string, any>): Promise<any> {
    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName

    console.log(`[v0] Dynamic insert: ${entityType}${subType ? ` (${subType})` : ""} into ${tableName}`)

    const fields = Object.keys(data).filter((key) => metadata.fields.includes(key))
    const values = fields.map((field) => data[field])

    if (this.isPostgreSQL) {
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ")
      const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`

      const result = await this.sqlClient!.query(query, values)
      return result.rows[0]
    } else {
      const placeholders = fields.map(() => "?").join(", ")
      const stmt = this.db!.prepare(`INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders})`)

      return stmt.run(...values)
    }
  }

  /**
   * Generic update operation
   * Usage: update(EntityTypes.POSITION, id, { current_price: 100 })
   */
  async update(entityType: EntityType, id: string | number, updates: Record<string, any>): Promise<any> {
    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName
    const primaryKey = metadata.primaryKey

    console.log(`[v0] Dynamic update: ${entityType} (${primaryKey}=${id}) in ${tableName}`)

    const fields = Object.keys(updates).filter((key) => metadata.fields.includes(key))
    const values = fields.map((field) => updates[field])

    if (this.isPostgreSQL) {
      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ")
      const query = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${primaryKey} = $${fields.length + 1} RETURNING *`

      const result = await this.sqlClient!.query(query, [...values, id])
      return result.rows[0]
    } else {
      const setClause = fields.map((field) => `${field} = ?`).join(", ")
      const stmt = this.db!.prepare(
        `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${primaryKey} = ?`,
      )

      return stmt.run(...values, id)
    }
  }

  /**
   * Generic query operation
   * Usage: query(EntityTypes.POSITION, { filters: [{ field: 'connection_id', operator: '=', value: 'xxx' }] })
   */
  async query(entityType: EntityType, options: QueryOptions = {}): Promise<any[]> {
    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName

    console.log(`[v0] Dynamic query: ${entityType} from ${tableName}`)

    let query = `SELECT * FROM ${tableName}`
    const params: any[] = []
    let paramIndex = 1

    // Build WHERE clause
    if (options.filters && options.filters.length > 0) {
      const conditions = options.filters.map((filter) => {
        if (filter.operator === "IN" || filter.operator === "NOT IN") {
          const placeholders = Array.isArray(filter.value)
            ? filter.value.map(() => (this.isPostgreSQL ? `$${paramIndex++}` : "?")).join(", ")
            : this.isPostgreSQL
              ? `$${paramIndex++}`
              : "?"
          params.push(...(Array.isArray(filter.value) ? filter.value : [filter.value]))
          return `${filter.field} ${filter.operator} (${placeholders})`
        } else {
          const placeholder = this.isPostgreSQL ? `$${paramIndex++}` : "?"
          params.push(filter.value)
          return `${filter.field} ${filter.operator} ${placeholder}`
        }
      })

      query += ` WHERE ${conditions.join(" AND ")}`
    }

    // Build GROUP BY clause
    if (options.groupBy && options.groupBy.length > 0) {
      query += ` GROUP BY ${options.groupBy.join(", ")}`
    }

    // Build ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map((order) => `${order.field} ${order.direction}`)
      query += ` ORDER BY ${orderClauses.join(", ")}`
    }

    // Build LIMIT/OFFSET clause
    if (options.limit) {
      query += ` LIMIT ${this.isPostgreSQL ? `$${paramIndex++}` : "?"}`
      params.push(options.limit)
    }

    if (options.offset) {
      query += ` OFFSET ${this.isPostgreSQL ? `$${paramIndex++}` : "?"}`
      params.push(options.offset)
    }

    if (this.isPostgreSQL) {
      const result = await this.sqlClient!.query(query, params)
      return result.rows
    } else {
      const stmt = this.db!.prepare(query)
      return stmt.all(...params)
    }
  }

  /**
   * Generic delete operation
   * Usage: delete(EntityTypes.POSITION, id)
   */
  async delete(entityType: EntityType, id: string | number): Promise<any> {
    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName
    const primaryKey = metadata.primaryKey

    console.log(`[v0] Dynamic delete: ${entityType} (${primaryKey}=${id}) from ${tableName}`)

    if (this.isPostgreSQL) {
      const query = `DELETE FROM ${tableName} WHERE ${primaryKey} = $1 RETURNING *`
      const result = await this.sqlClient!.query(query, [id])
      return result.rows[0]
    } else {
      const stmt = this.db!.prepare(`DELETE FROM ${tableName} WHERE ${primaryKey} = ?`)
      return stmt.run(id)
    }
  }

  /**
   * Generic batch insert operation
   * Usage: batchInsert(EntityTypes.POSITION, [data1, data2, data3])
   */
  async batchInsert(entityType: EntityType, dataArray: Record<string, any>[]): Promise<void> {
    if (dataArray.length === 0) return

    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName

    console.log(`[v0] Dynamic batch insert: ${dataArray.length} records into ${entityType} (${tableName})`)

    const fields = Object.keys(dataArray[0]).filter((key) => metadata.fields.includes(key))

    if (this.isPostgreSQL) {
      const values = dataArray
        .map((_, i) => {
          const offset = i * fields.length
          return `(${fields.map((_, j) => `$${offset + j + 1}`).join(", ")})`
        })
        .join(", ")

      const params = dataArray.flatMap((data) => fields.map((field) => data[field]))
      const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES ${values}`

      await this.sqlClient!.query(query, params)
    } else {
      const placeholders = fields.map(() => "?").join(", ")
      const stmt = this.db!.prepare(`INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders})`)

      const insertMany = this.db!.transaction((dataArray: any[]) => {
        for (const data of dataArray) {
          const values = fields.map((field) => data[field])
          stmt.run(...values)
        }
      })

      insertMany(dataArray)
    }
  }

  /**
   * Generic batch update operation
   * Usage: batchUpdate(EntityTypes.POSITION, [{ id: '1', updates: { price: 100 } }])
   */
  async batchUpdate(
    entityType: EntityType,
    updates: Array<{ id: string | number; data: Record<string, any> }>,
  ): Promise<void> {
    if (updates.length === 0) return

    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName
    const primaryKey = metadata.primaryKey

    console.log(`[v0] Dynamic batch update: ${updates.length} records in ${entityType} (${tableName})`)

    if (this.isPostgreSQL) {
      // Use CASE statements for efficient bulk update
      const fields = Object.keys(updates[0].data).filter((key) => metadata.fields.includes(key))
      const ids = updates.map((u) => u.id)

      const whenClauses = fields.map((field) => {
        const cases = updates
          .map(
            (u, i) =>
              `WHEN ${primaryKey} = $${i + 1} THEN $${ids.length + i * fields.length + fields.indexOf(field) + 1}`,
          )
          .join(" ")
        return `${field} = CASE ${cases} END`
      })

      const params: any[] = [...ids, ...updates.flatMap((u) => fields.map((field) => u.data[field]))]

      const query = `UPDATE ${tableName} SET ${whenClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE ${primaryKey} = ANY($${params.length + 1})`
      await this.sqlClient!.query(query, [...params, ids])
    } else {
      const fields = Object.keys(updates[0].data).filter((key) => metadata.fields.includes(key))
      const setClause = fields.map((field) => `${field} = ?`).join(", ")
      const stmt = this.db!.prepare(
        `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${primaryKey} = ?`,
      )

      const updateMany = this.db!.transaction((updates: any[]) => {
        for (const u of updates) {
          const values = fields.map((field) => u.data[field])
          stmt.run(...values, u.id)
        }
      })

      updateMany(updates)
    }
  }

  /**
   * Generic count operation
   * Usage: count(EntityTypes.POSITION, { filters: [...] })
   */
  async count(entityType: EntityType, options: QueryOptions = {}): Promise<number> {
    const metadata = EntityMetadataMap[entityType]
    const tableName = metadata.tableName

    let query = `SELECT COUNT(*) as count FROM ${tableName}`
    const params: any[] = []
    let paramIndex = 1

    if (options.filters && options.filters.length > 0) {
      const conditions = options.filters.map((filter) => {
        const placeholder = this.isPostgreSQL ? `$${paramIndex++}` : "?"
        params.push(filter.value)
        return `${filter.field} ${filter.operator} ${placeholder}`
      })

      query += ` WHERE ${conditions.join(" AND ")}`
    }

    if (this.isPostgreSQL) {
      const result = await this.sqlClient!.query(query, params)
      return Number.parseInt(result.rows[0].count)
    } else {
      const stmt = this.db!.prepare(query)
      const result = stmt.get(...params) as { count: number }
      return result.count
    }
  }
}
