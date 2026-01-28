import { sql } from '@vercel/postgres'
import type { Connection, ExchangeConnection } from '@/lib/file-storage'

/**
 * Connection Database Service
 * Handles all database operations for exchange connections
 */

export const connectionDb = {
  /**
   * Get all connections
   */
  async getAll(): Promise<Connection[]> {
    try {
      const result = await sql`
        SELECT * FROM connections 
        ORDER BY created_at DESC
      `
      return result.rows as Connection[]
    } catch (error) {
      console.error('[v0] Error fetching connections:', error)
      return []
    }
  },

  /**
   * Get connection by ID
   */
  async getById(id: string): Promise<Connection | null> {
    try {
      const result = await sql`
        SELECT * FROM connections 
        WHERE id = ${id}
        LIMIT 1
      `
      return result.rows[0] as Connection | undefined || null
    } catch (error) {
      console.error('[v0] Error fetching connection:', error)
      return null
    }
  },

  /**
   * Get connections by exchange
   */
  async getByExchange(exchange: string): Promise<Connection[]> {
    try {
      const result = await sql`
        SELECT * FROM connections 
        WHERE exchange = ${exchange}
        ORDER BY created_at DESC
      `
      return result.rows as Connection[]
    } catch (error) {
      console.error('[v0] Error fetching connections by exchange:', error)
      return []
    }
  },

  /**
   * Create new connection
   */
  async create(connection: Omit<Connection, 'id' | 'created_at' | 'updated_at'>): Promise<Connection | null> {
    try {
      const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      const result = await sql`
        INSERT INTO connections (
          id, name, exchange, api_type, connection_method, 
          connection_library, api_key, api_secret, api_passphrase,
          margin_type, position_mode, is_enabled, is_active, 
          is_testnet, is_predefined, created_at, updated_at
        ) VALUES (
          ${id}, ${connection.name}, ${connection.exchange}, 
          ${connection.api_type}, ${connection.connection_method || 'rest'}, 
          ${connection.connection_library || 'native'}, 
          ${connection.api_key}, ${connection.api_secret}, 
          ${connection.api_passphrase || null},
          ${connection.margin_type || 'cross'}, 
          ${connection.position_mode || 'hedge'},
          ${connection.is_enabled !== false}, 
          ${connection.is_active !== false},
          ${connection.is_testnet || false}, 
          ${connection.is_predefined || false},
          ${now}, ${now}
        )
        RETURNING *
      `

      return result.rows[0] as Connection
    } catch (error) {
      console.error('[v0] Error creating connection:', error)
      return null
    }
  },

  /**
   * Update connection
   */
  async update(id: string, updates: Partial<Connection>): Promise<Connection | null> {
    try {
      const now = new Date().toISOString()
      
      // Build dynamic SET clause
      const setClauses: string[] = []
      const values: any[] = []

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          setClauses.push(`${key} = $${setClauses.length + 1}`)
          values.push(value)
        }
      })

      if (setClauses.length === 0) {
        return await this.getById(id)
      }

      values.push(now)
      values.push(id)

      const query = `
        UPDATE connections 
        SET ${setClauses.join(', ')}, updated_at = $${setClauses.length + 1}
        WHERE id = $${setClauses.length + 2}
        RETURNING *
      `

      const result = await sql.query(query, values)
      return result.rows[0] as Connection
    } catch (error) {
      console.error('[v0] Error updating connection:', error)
      return null
    }
  },

  /**
   * Delete connection
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM connections 
        WHERE id = ${id}
      `
      return result.rowCount > 0
    } catch (error) {
      console.error('[v0] Error deleting connection:', error)
      return false
    }
  },

  /**
   * Toggle connection enabled status
   */
  async toggleEnabled(id: string): Promise<Connection | null> {
    try {
      const connection = await this.getById(id)
      if (!connection) return null

      return await this.update(id, {
        is_enabled: !connection.is_enabled,
      })
    } catch (error) {
      console.error('[v0] Error toggling connection:', error)
      return null
    }
  },

  /**
   * Record test result
   */
  async recordTestResult(
    id: string,
    status: 'success' | 'failed',
    log: string[]
  ): Promise<Connection | null> {
    try {
      const now = new Date().toISOString()
      return await this.update(id, {
        last_test_status: status,
        last_test_timestamp: now,
        last_test_log: JSON.stringify(log),
      })
    } catch (error) {
      console.error('[v0] Error recording test result:', error)
      return null
    }
  },
}

/**
 * Settings Database Service
 */
export const settingsDb = {
  /**
   * Get all settings
   */
  async getAll(userId?: string): Promise<any[]> {
    try {
      if (userId) {
        const result = await sql`
          SELECT * FROM settings 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `
        return result.rows
      }

      const result = await sql`
        SELECT * FROM settings 
        ORDER BY created_at DESC
      `
      return result.rows
    } catch (error) {
      console.error('[v0] Error fetching settings:', error)
      return []
    }
  },

  /**
   * Get setting by key
   */
  async getByKey(key: string, userId?: string): Promise<any | null> {
    try {
      let result
      if (userId) {
        result = await sql`
          SELECT * FROM settings 
          WHERE user_id = ${userId} AND key = ${key}
          LIMIT 1
        `
      } else {
        result = await sql`
          SELECT * FROM settings 
          WHERE key = ${key}
          LIMIT 1
        `
      }

      return result.rows[0] || null
    } catch (error) {
      console.error('[v0] Error fetching setting:', error)
      return null
    }
  },

  /**
   * Set or update setting
   */
  async set(
    key: string,
    value: any,
    options?: { userId?: string; type?: string; description?: string; encrypted?: boolean }
  ): Promise<boolean> {
    try {
      const id = `setting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()

      await sql`
        INSERT INTO settings (
          id, user_id, key, value, setting_type, description, is_encrypted, created_at, updated_at
        ) VALUES (
          ${id}, ${options?.userId || null}, ${key}, 
          ${typeof value === 'string' ? value : JSON.stringify(value)},
          ${options?.type || 'string'}, 
          ${options?.description || null},
          ${options?.encrypted || false},
          ${now}, ${now}
        )
        ON CONFLICT (user_id, key) DO UPDATE SET 
          value = EXCLUDED.value,
          setting_type = EXCLUDED.setting_type,
          updated_at = ${now}
      `

      return true
    } catch (error) {
      console.error('[v0] Error setting setting:', error)
      return false
    }
  },

  /**
   * Delete setting
   */
  async delete(key: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        const result = await sql`
          DELETE FROM settings 
          WHERE user_id = ${userId} AND key = ${key}
        `
        return result.rowCount > 0
      }

      const result = await sql`
        DELETE FROM settings 
        WHERE key = ${key}
      `
      return result.rowCount > 0
    } catch (error) {
      console.error('[v0] Error deleting setting:', error)
      return false
    }
  },
}

/**
 * Connection Logs Database Service
 */
export const connectionLogsDb = {
  /**
   * Add log entry
   */
  async add(connectionId: string, logType: string, status: string, message: string, details?: any): Promise<boolean> {
    try {
      const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await sql`
        INSERT INTO connection_logs (
          id, connection_id, log_type, status, message, details, created_at
        ) VALUES (
          ${id}, ${connectionId}, ${logType}, ${status}, ${message},
          ${details ? JSON.stringify(details) : null},
          CURRENT_TIMESTAMP
        )
      `

      return true
    } catch (error) {
      console.error('[v0] Error adding log:', error)
      return false
    }
  },

  /**
   * Get logs for connection
   */
  async getByConnectionId(connectionId: string, limit = 100): Promise<any[]> {
    try {
      const result = await sql`
        SELECT * FROM connection_logs 
        WHERE connection_id = ${connectionId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      return result.rows
    } catch (error) {
      console.error('[v0] Error fetching logs:', error)
      return []
    }
  },
}
