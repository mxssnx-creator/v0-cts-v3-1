/**
 * Connection Management API - Unified Reference
 * 
 * This module documents all connection management endpoints after consolidation
 */

// ============================================================================
// PRIMARY ENDPOINTS - USE THESE
// ============================================================================

/**
 * GET /api/settings/connections
 * Fetch all connections
 * 
 * Response:
 * {
 *   id: string
 *   name: string
 *   exchange: string
 *   is_enabled: boolean
 *   is_live_trade: boolean
 *   is_active: boolean
 *   is_predefined: boolean
 *   created_at: string
 *   updated_at: string
 *   ...otherFields
 * }[]
 */

/**
 * POST /api/settings/connections
 * Create a new connection
 * 
 * Request body:
 * {
 *   name: string (required)
 *   exchange: string (required) - bybit, binance, okx, gateio, etc.
 *   api_key: string (required)
 *   api_secret: string (required)
 *   api_passphrase?: string (optional, for some exchanges)
 *   is_testnet?: boolean (default: false)
 *   margin_type?: string (default: cross)
 *   position_mode?: string (default: hedge)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   id: string
 *   message: string
 * }
 */

/**
 * PUT /api/settings/connections
 * Update an existing connection (all fields)
 * 
 * Request body:
 * {
 *   id: string (required)
 *   is_enabled?: boolean
 *   is_live_trade?: boolean
 *   is_active?: boolean
 *   ...other fields to update
 * }
 * 
 * Note: If is_enabled=false, is_live_trade automatically set to false
 * Note: If is_live_trade=true, connection must be enabled first
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   connection: Connection
 * }
 */

/**
 * DELETE /api/settings/connections?id=xxx
 * Delete a connection completely
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 * }
 */

/**
 * GET /api/settings/connections/[id]
 * Get a specific connection details
 * 
 * Response: Connection object or 404
 */

/**
 * PUT /api/settings/connections/[id]
 * Update specific connection (same as PUT /api/settings/connections with id in body)
 * 
 * Request body: Fields to update
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   connection: Connection
 * }
 */

/**
 * PATCH /api/settings/connections/[id]
 * Partial update of connection
 * 
 * Request body: Partial fields to update
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   connection: Connection
 * }
 */

/**
 * DELETE /api/settings/connections/[id]
 * Delete specific connection
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 * }
 */

// ============================================================================
// CONNECTION TESTING ENDPOINTS
// ============================================================================

/**
 * POST /api/connections/test
 * Test a connection before creating it
 * 
 * Request body:
 * {
 *   exchange: string (required)
 *   apiKey: string (required)
 *   apiSecret: string (required)
 *   apiPassphrase?: string (optional)
 *   testnet?: boolean
 *   name?: string
 * }
 * 
 * Response:
 * {
 *   connectionId: string
 *   status: "success" | "failed" | "error"
 *   message: string
 *   details: {
 *     exchange: string
 *     accountVerified: boolean
 *     balanceAccessible: boolean
 *     tradingEnabled: boolean
 *     error?: string
 *   }
 *   timestamp: string
 *   testDuration: number
 * }
 */

/**
 * GET /api/connections/test?connectionId=xxx
 * Verify an existing connection can still access the exchange
 * 
 * Response:
 * {
 *   connectionId: string
 *   status: "success" | "failed" | "error"
 *   message: string
 *   details: {
 *     exchange: string
 *     accountVerified: boolean
 *     balanceAccessible: boolean
 *     tradingEnabled: boolean
 *   }
 *   timestamp: string
 *   testDuration: number
 * }
 */

// ============================================================================
// REMOVED LEGACY ENDPOINTS (DO NOT USE)
// ============================================================================

// REMOVED: POST /api/settings/connections/[id]/toggle/route.ts
// USE: PUT /api/settings/connections with { id, is_enabled: boolean }
// OR: PUT /api/settings/connections/[id] with { is_enabled: boolean }

// REMOVED: POST /api/settings/connections/[id]/live-trade/route.ts
// USE: PUT /api/settings/connections with { id, is_live_trade: boolean }
// OR: PUT /api/settings/connections/[id] with { is_live_trade: boolean }

export const API_ENDPOINTS = {
  connections: {
    list: "GET /api/settings/connections",
    create: "POST /api/settings/connections",
    update: "PUT /api/settings/connections",
    delete: "DELETE /api/settings/connections?id=",
    byId: {
      get: "GET /api/settings/connections/[id]",
      update: "PUT /api/settings/connections/[id]",
      patch: "PATCH /api/settings/connections/[id]",
      delete: "DELETE /api/settings/connections/[id]",
    },
    test: {
      test: "POST /api/connections/test",
      verify: "GET /api/connections/test?connectionId=",
    },
  },
}
