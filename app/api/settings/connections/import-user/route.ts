import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { USER_CONNECTIONS } from "@/lib/user-connections-config"
import { successResponse, errorResponse } from "@/lib/api-response"

/**
 * Import user-configured connections into the database
 * POST /api/settings/connections/import-user
 */
export async function POST() {
  try {
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const userConn of USER_CONNECTIONS) {
      try {
  // Check if connection already exists
  const existing = await query(
    `SELECT id FROM exchange_connections WHERE name = $1 AND exchange = $2`,
    [userConn.name, userConn.exchange]
  )

        if (existing.length > 0) {
          console.log(`[v0] Skipping ${userConn.displayName} - already exists`)
          skipped++
          continue
        }

  // Insert the connection
  await query(
    `INSERT INTO exchange_connections (
            name,
            exchange,
            api_type,
            connection_method,
            connection_library,
            api_key,
            api_secret,
            margin_type,
            position_mode,
            is_testnet,
            is_enabled,
            is_live_trade,
            is_preset_trade,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
          [
            userConn.name,
            userConn.exchange,
            userConn.apiType,
            "rest",
            "native",
            userConn.apiKey,
            userConn.apiSecret,
            userConn.marginType || "cross",
            userConn.positionMode || "hedge",
            userConn.isTestnet,
            true, // Enabled by default
            false,
            false,
          ]
        )

        console.log(`[v0] ✓ Imported ${userConn.displayName}`)
        imported++
      } catch (error) {
        const errorMsg = `Failed to import ${userConn.displayName}: ${error instanceof Error ? error.message : String(error)}`
        console.error(`[v0] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return successResponse({
      imported,
      skipped,
      total: USER_CONNECTIONS.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Error importing user connections:", error)
    return errorResponse("Failed to import user connections", {
      status: 500,
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * Get list of available user connections
 * GET /api/settings/connections/import-user
 */
export async function GET() {
  try {
    // Get list of user connections with their import status
    const connections = await Promise.all(
      USER_CONNECTIONS.map(async (userConn) => {
        const existing = await query(
          `SELECT id, is_enabled FROM exchange_connections WHERE name = $1 AND exchange = $2`,
          [userConn.name, userConn.exchange]
        )

        return {
          id: userConn.id,
          name: userConn.name,
          exchange: userConn.exchange,
          displayName: userConn.displayName,
          apiType: userConn.apiType,
          connectionType: userConn.connectionType,
          maxLeverage: userConn.maxLeverage,
          documentation: userConn.documentation,
          installCommands: userConn.installCommands,
          imported: existing.length > 0,
          enabled: existing.length > 0 ? existing[0].is_enabled : false,
          dbId: existing.length > 0 ? existing[0].id : null,
        }
      })
    )

    return successResponse(connections)
  } catch (error) {
    console.error("[v0] Error getting user connections:", error)
    return errorResponse("Failed to get user connections", {
      status: 500,
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
