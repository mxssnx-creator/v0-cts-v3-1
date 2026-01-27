/**
 * ConnectionManager v2 - Modern Connection Management with Type Safety
 * Handles all connection CRUD operations, validation, and lifecycle management
 */

import { loadConnections, saveConnections, loadSettings } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"

// Modern Connection Types with v2 Schema
export interface ConnectionV2 {
  id: string
  name: string
  exchange: string
  api_type: "spot" | "perpetual_futures" | "inverse_futures"
  connection_method: "rest" | "websocket" | "hybrid"
  connection_library: "rest" | "ws" | "library"
  authentication_type: "api_key_secret" | "oauth2" | "webhook"
  api_key: string
  api_secret: string
  api_passphrase?: string
  margin_type: "isolated" | "cross"
  position_mode: "one_way" | "hedge"
  is_testnet: boolean
  is_enabled: boolean
  is_active: boolean
  is_live_trade: boolean
  is_predefined: boolean
  volume_factor: number
  last_test_status?: "success" | "failed" | "warning"
  last_test_balance?: number
  last_test_log?: string[]
  last_test_at?: string
  api_capabilities?: string
  created_at: string
  updated_at: string
}

export interface ConnectionCreateInput {
  name: string
  exchange: string
  api_type: "spot" | "perpetual_futures" | "inverse_futures"
  connection_method: "rest" | "websocket" | "hybrid"
  api_key: string
  api_secret: string
  api_passphrase?: string
  margin_type: "isolated" | "cross"
  position_mode: "one_way" | "hedge"
  is_testnet: boolean
  volume_factor?: number
}

export interface ConnectionUpdateInput {
  name?: string
  api_key?: string
  api_secret?: string
  api_passphrase?: string
  margin_type?: "isolated" | "cross"
  position_mode?: "one_way" | "hedge"
  is_testnet?: boolean
  volume_factor?: number
}

export interface ConnectionValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * ConnectionManager v2 - Singleton pattern for connection management
 */
class ConnectionManagerV2 {
  private static instance: ConnectionManagerV2

  private constructor() {}

  static getInstance(): ConnectionManagerV2 {
    if (!ConnectionManagerV2.instance) {
      ConnectionManagerV2.instance = new ConnectionManagerV2()
    }
    return ConnectionManagerV2.instance
  }

  /**
   * Get all connections
   */
  getAllConnections(): ConnectionV2[] {
    try {
      const connections = loadConnections()
      return Array.isArray(connections) ? connections : []
    } catch (error) {
      console.error("[v0] [ConnectionManager] Failed to load connections:", error)
      return []
    }
  }

  /**
   * Get connection by ID
   */
  getConnectionById(id: string): ConnectionV2 | null {
    const connections = this.getAllConnections()
    return connections.find((c) => c.id === id) || null
  }

  /**
   * Get active connections
   */
  getActiveConnections(): ConnectionV2[] {
    const connections = this.getAllConnections()
    return connections.filter((c) => c.is_active && c.is_enabled)
  }

  /**
   * Get enabled connections
   */
  getEnabledConnections(): ConnectionV2[] {
    const connections = this.getAllConnections()
    return connections.filter((c) => c.is_enabled)
  }

  /**
   * Create new connection
   */
  async createConnection(input: ConnectionCreateInput): Promise<ConnectionV2> {
    // Validate input
    const validation = this.validateConnection(input)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    const connections = this.getAllConnections()
    const newConnection: ConnectionV2 = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      is_enabled: true,
      is_active: true,
      is_live_trade: false,
      is_predefined: false,
      connection_library: input.connection_method === "rest" ? "rest" : "library",
      authentication_type: "api_key_secret",
      volume_factor: input.volume_factor || 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    connections.push(newConnection)
    saveConnections(connections)

    await SystemLogger.logConnection(`Connection created: ${newConnection.name}`, newConnection.id, "info", {
      exchange: newConnection.exchange,
    })

    return newConnection
  }

  /**
   * Update connection
   */
  async updateConnection(id: string, input: ConnectionUpdateInput): Promise<ConnectionV2> {
    const connections = this.getAllConnections()
    const index = connections.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error(`Connection not found: ${id}`)
    }

    const current = connections[index]

    // Validate update input
    const validation = this.validateConnection({ ...current, ...input })
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    const updated: ConnectionV2 = {
      ...current,
      ...input,
      id: current.id,
      created_at: current.created_at,
      updated_at: new Date().toISOString(),
    }

    connections[index] = updated
    saveConnections(connections)

    await SystemLogger.logConnection(`Connection updated: ${updated.name}`, id, "info")

    return updated
  }

  /**
   * Delete connection (mark as inactive)
   */
  async deleteConnection(id: string): Promise<void> {
    const connections = this.getAllConnections()
    const index = connections.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error(`Connection not found: ${id}`)
    }

    connections[index].is_active = false
    connections[index].updated_at = new Date().toISOString()

    saveConnections(connections)

    await SystemLogger.logConnection(`Connection deleted: ${connections[index].name}`, id, "info")
  }

  /**
   * Toggle connection enabled status
   */
  async toggleConnection(id: string): Promise<ConnectionV2> {
    const connection = this.getConnectionById(id)

    if (!connection) {
      throw new Error(`Connection not found: ${id}`)
    }

    return this.updateConnection(id, {
      is_enabled: !connection.is_enabled,
    })
  }

  /**
   * Activate connection for live trading
   */
  async activateConnection(id: string): Promise<ConnectionV2> {
    const connection = this.getConnectionById(id)

    if (!connection) {
      throw new Error(`Connection not found: ${id}`)
    }

    if (!connection.is_enabled) {
      throw new Error(`Cannot activate disabled connection: ${id}`)
    }

    return this.updateConnection(id, {
      is_active: true,
    })
  }

  /**
   * Deactivate connection
   */
  async deactivateConnection(id: string): Promise<ConnectionV2> {
    const connection = this.getConnectionById(id)

    if (!connection) {
      throw new Error(`Connection not found: ${id}`)
    }

    return this.updateConnection(id, {
      is_active: false,
    })
  }

  /**
   * Update connection test status
   */
  async updateTestStatus(
    id: string,
    status: "success" | "failed" | "warning",
    log: string[],
    balance?: number
  ): Promise<ConnectionV2> {
    const connections = this.getAllConnections()
    const index = connections.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error(`Connection not found: ${id}`)
    }

    connections[index].last_test_status = status
    connections[index].last_test_log = log
    connections[index].last_test_at = new Date().toISOString()
    if (balance !== undefined) {
      connections[index].last_test_balance = balance
    }
    connections[index].updated_at = new Date().toISOString()

    saveConnections(connections)

    return connections[index]
  }

  /**
   * Validate connection data
   */
  private validateConnection(data: any): ConnectionValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!data.name?.trim()) errors.push("Name is required")
    if (!data.exchange?.trim()) errors.push("Exchange is required")
    if (!data.api_key?.trim()) errors.push("API Key is required")
    if (!data.api_secret?.trim()) errors.push("API Secret is required")

    // Field validation
    if (data.name && data.name.length < 2) errors.push("Name must be at least 2 characters")
    if (data.name && data.name.length > 100) errors.push("Name must be less than 100 characters")

    if (!["spot", "perpetual_futures", "inverse_futures"].includes(data.api_type)) {
      errors.push("Invalid API type")
    }

    if (!["rest", "websocket", "hybrid"].includes(data.connection_method)) {
      errors.push("Invalid connection method")
    }

    if (!["isolated", "cross"].includes(data.margin_type)) {
      errors.push("Invalid margin type")
    }

    if (!["one_way", "hedge"].includes(data.position_mode)) {
      errors.push("Invalid position mode")
    }

    if (typeof data.volume_factor !== "number" || data.volume_factor <= 0) {
      errors.push("Volume factor must be a positive number")
    }

    // Placeholder warnings
    if (data.api_key?.includes("PLACEHOLDER")) {
      warnings.push("API key appears to be a placeholder")
    }

    if (data.api_secret?.includes("PLACEHOLDER")) {
      warnings.push("API secret appears to be a placeholder")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get connection statistics
   */
  getStatistics() {
    const connections = this.getAllConnections()
    return {
      total: connections.length,
      enabled: connections.filter((c) => c.is_enabled).length,
      active: connections.filter((c) => c.is_active).length,
      testnet: connections.filter((c) => c.is_testnet).length,
      byExchange: this.groupByExchange(connections),
    }
  }

  /**
   * Group connections by exchange
   */
  private groupByExchange(connections: ConnectionV2[]) {
    const grouped: Record<string, number> = {}
    connections.forEach((c) => {
      grouped[c.exchange] = (grouped[c.exchange] || 0) + 1
    })
    return grouped
  }
}

export const connectionManager = ConnectionManagerV2.getInstance()
export default ConnectionManagerV2
