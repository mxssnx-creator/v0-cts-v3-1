import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { DatabaseInitializer } from "@/lib/db-initializer"
import { CONNECTION_PREDEFINITIONS } from "@/lib/connection-predefinitions"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Initializing all predefined connections")

    const dbReady = await DatabaseInitializer.initialize(5, 60000)
    if (!dbReady) {
      console.error("[v0] Database initialization failed after retries")
      return NextResponse.json(
        { error: "Database not ready", details: "Failed to initialize database" },
        { status: 503 },
      )
    }

    const existing = await sql`
      SELECT id FROM exchange_connections 
      WHERE is_predefined = true
    `

    if (existing.length >= CONNECTION_PREDEFINITIONS.length) {
      console.log("[v0] All predefined connections already exist:", existing.length)
      return NextResponse.json({
        success: true,
        message: "All predefined connections already initialized",
        count: existing.length,
      })
    }

    const exchangeNames = [...new Set(CONNECTION_PREDEFINITIONS.map(p => p.id.split('-')[0]))]
    
    for (const exchangeName of exchangeNames) {
      await sql`
        INSERT INTO exchanges (name, display_name, supports_spot, supports_futures, supports_margin, is_active, api_endpoint, websocket_endpoint)
        VALUES 
          (${exchangeName}, ${exchangeName.charAt(0).toUpperCase() + exchangeName.slice(1)}, true, true, false, true, '', '')
        ON CONFLICT (name) DO UPDATE SET 
          is_active = EXCLUDED.is_active,
          display_name = EXCLUDED.display_name
      `
    }

    // Get exchange IDs
    const exchanges = await sql`
      SELECT id, name FROM exchanges 
      WHERE name = ANY(${exchangeNames})
    `

    const exchangeMap = Object.fromEntries(exchanges.map((e: any) => [e.name, e.id]))

    console.log("[v0] Creating all predefined connections as inactive by default")

    const createdConnections = []
    
    for (const pred of CONNECTION_PREDEFINITIONS) {
      const exchangeName = pred.id.split('-')[0]
      const exchangeId = exchangeMap[exchangeName]
      
      if (!exchangeId) {
        console.warn(`[v0] Exchange ${exchangeName} not found, skipping ${pred.id}`)
        continue
      }

      await sql`
        INSERT INTO exchange_connections (
          id, user_id, name, exchange_id, exchange, api_type, connection_method,
          connection_library, api_key, api_secret, margin_type, position_mode, 
          is_testnet, is_enabled, is_predefined, is_active,
          api_capabilities, rate_limits
        )
        VALUES (
          ${pred.id},
          1,
          ${pred.name},
          ${exchangeId},
          ${exchangeName},
          ${pred.apiType},
          ${pred.connectionMethod},
          ${exchangeName === 'bybit' ? 'bybit-api' : exchangeName === 'bingx' ? 'bingx-api' : 'ccxt'},
          ${pred.apiKey || '00998877009988770099887700998877'},
          ${pred.apiSecret || '00998877009988770099887700998877'},
          ${pred.marginType},
          ${pred.positionMode},
          false,
          false,
          true,
          true,
          '[]'::jsonb,
          '{}'::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          is_predefined = true,
          is_active = true,
          is_enabled = false
      `

      // Initialize volume configuration
      await sql`
        INSERT INTO volume_configuration (connection_id, base_volume_factor)
        VALUES (${pred.id}, 1.0)
        ON CONFLICT (connection_id) DO UPDATE SET base_volume_factor = 1.0
      `

      // Initialize trade engine state
      await sql`
        INSERT INTO trade_engine_state (connection_id, status)
        VALUES (${pred.id}, 'stopped')
        ON CONFLICT (connection_id) DO NOTHING
      `
      
      createdConnections.push(pred.name)
    }

    console.log("[v0] All predefined connections initialized successfully:", createdConnections.length)
    return NextResponse.json({
      success: true,
      message: `All ${createdConnections.length} predefined connections initialized - active in Settings but disabled on Dashboard`,
      connections: createdConnections,
      count: createdConnections.length,
    })
  } catch (error) {
    console.error("[v0] Failed to initialize predefined connections:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      {
        error: "Failed to initialize predefined connections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
