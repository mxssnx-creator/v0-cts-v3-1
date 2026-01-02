import { type NextRequest, NextResponse } from "next/server"
import { PresetTradeEngine } from "@/lib/preset-trade-engine"
import { sql } from "@/lib/db"
import type { Preset, ExchangeConnection } from "@/lib/types"

// Store active engines
const activeEngines = new Map<string, PresetTradeEngine>()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string; presetId: string }> },
) {
  try {
    const { connectionId, presetId } = await params
    const engineKey = `${connectionId}-${presetId}`

    // Check if already running
    if (activeEngines.has(engineKey)) {
      return NextResponse.json({ error: "Engine already running" }, { status: 400 })
    }

    // Get preset configuration
    const presetResult = await sql`
      SELECT * FROM presets WHERE id = ${presetId}
    `
    const preset = presetResult[0] as Preset | undefined

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 })
    }

    // Get connection
    const connectionResult = await sql`
      SELECT * FROM exchange_connections WHERE id = ${connectionId}
    `
    const connection = connectionResult[0] as ExchangeConnection | undefined

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const forcedSymbolsResult = await sql`
      SELECT value FROM system_settings WHERE key = 'forcedSymbols'
    `

    const forcedSymbolsRow = forcedSymbolsResult[0] as { value: string } | undefined
    const forcedSymbols = forcedSymbolsRow?.value
      ? JSON.parse(forcedSymbolsRow.value)
      : []

    let symbols: string[] = [...forcedSymbols] // Always include forced symbols

    const useMainSymbolsResult = await sql`
      SELECT value FROM system_settings WHERE key = 'useMainSymbols'
    `

    const useMainSymbolsRow = useMainSymbolsResult[0] as { value: string } | undefined
    const useMainSymbolsValue = useMainSymbolsRow?.value || 'false'

    if (useMainSymbolsValue === 'true') {
      const mainSymbolsResult = await sql`
        SELECT value FROM system_settings WHERE key = 'mainSymbols'
      `
      const mainSymbolsRow = mainSymbolsResult[0] as { value: string } | undefined
      const mainSymbolsList = mainSymbolsRow?.value
        ? JSON.parse(mainSymbolsRow.value)
        : []
      symbols = [...new Set([...forcedSymbols, ...mainSymbolsList])] // Merge and deduplicate
    } else {
      // Default symbols merged with forced
      const defaultSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
      symbols = [...new Set([...forcedSymbols, ...defaultSymbols])]
    }

    // Create and start engine
    const engine = new PresetTradeEngine(connectionId, presetId)

    await engine.start({
      connectionId,
      presetId,
      symbols,
      mode: preset.preset_type || "automatic",
      minProfitFactor: preset.min_profit_factor || 0.6,
      maxDrawdownHours: preset.max_drawdown_hours || 12,
      useTopSymbols: false,
      topSymbolsCount: 25,
    })

    // Store engine instance
    activeEngines.set(engineKey, engine)

    return NextResponse.json({
      success: true,
      message: "Preset trade engine started",
      symbols: symbols.length,
      forcedSymbols: forcedSymbols.length,
    })
  } catch (error) {
    console.error("[v0] Failed to start preset trade engine:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start engine" },
      { status: 500 },
    )
  }
}
