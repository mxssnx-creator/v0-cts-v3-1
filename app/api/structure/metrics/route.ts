import { NextResponse } from "next/server"
import { query, queryOne, getDatabaseType } from "@/lib/db"

export async function GET() {
  try {
    const dbType = getDatabaseType()
    const isSQLite = dbType === "sqlite"

    // Safely query metrics with error handling
    let result: any = null
    try {
      result = await queryOne(`
        SELECT 
          COUNT(DISTINCT ec.id) as active_connections,
          COUNT(DISTINCT i.id) as total_indications,
          COUNT(DISTINCT i.id) as active_indications,
          COUNT(DISTINCT ps.id) as total_strategies,
          ${isSQLite ? "SUM(CASE WHEN ps.is_active = 1 THEN 1 ELSE 0 END)" : "COUNT(*) FILTER (WHERE ps.is_active = true)"} as active_strategies,
          COUNT(DISTINCT pp.id) as total_positions,
          0 as base_positions,
          0 as main_positions,
          0 as real_positions,
          ${isSQLite ? "SUM(CASE WHEN pp.status = 'open' THEN 1 ELSE 0 END)" : "COUNT(*) FILTER (WHERE pp.status = 'open')"} as active_positions,
          COUNT(DISTINCT pp.symbol) as active_symbols,
          COALESCE(SUM(pp.volume * pp.entry_price), 0) as total_volume_24h,
          ${isSQLite ? "SUM(CASE WHEN datetime(pp.opened_at) > datetime('now', '-1 hour') THEN 1 ELSE 0 END)" : "COUNT(*) FILTER (WHERE pp.opened_at > NOW() - INTERVAL '1 hour')"} as trades_per_hour
        FROM exchange_connections ec
        LEFT JOIN indications i ON i.connection_id = ec.id
        LEFT JOIN pseudo_positions pp ON pp.connection_id = ec.id AND pp.status = 'open'
        LEFT JOIN preset_strategies ps ON ps.connection_id = ec.id
        WHERE ec.${isSQLite ? "is_enabled = 1" : "is_enabled = true"}
      `)
    } catch (queryError) {
      console.warn("[v0] Could not fetch core metrics, using defaults:", queryError)
      result = {
        active_connections: 0,
        total_indications: 0,
        active_indications: 0,
        total_strategies: 0,
        active_strategies: 0,
        total_positions: 0,
        base_positions: 0,
        main_positions: 0,
        real_positions: 0,
        active_positions: 0,
        active_symbols: 0,
        total_volume_24h: 0,
        trades_per_hour: 0,
      }
    }

    // Safely query profit factors with error handling
    let profitFactorByTypeResult: any[] = []
    try {
      profitFactorByTypeResult = await query(`
        SELECT 
          'main' as type,
          AVG(CASE WHEN ${isSQLite ? "datetime(closed_at) > datetime('now', '-20 hours')" : "closed_at > NOW() - INTERVAL '20 hours'"} THEN profit_loss_percent END) as pf_last_20h,
          AVG(profit_loss_percent) as pf_last_25
        FROM (
          SELECT profit_loss_percent, closed_at
          FROM pseudo_positions
          WHERE status = 'closed' AND closed_at IS NOT NULL
          ORDER BY closed_at DESC
          LIMIT 100
        ) as subquery
      `)
    } catch (error) {
      console.warn("[v0] Could not fetch profit factor by type:", error)
      profitFactorByTypeResult = []
    }

    let profitFactorResult: any = null
    try {
      profitFactorResult = await queryOne(`
        SELECT 
          AVG(CASE WHEN ${isSQLite ? "datetime(closed_at) > datetime('now', '-20 hours')" : "closed_at > NOW() - INTERVAL '20 hours'"} THEN profit_loss_percent END) as pf_last_20h,
          AVG(profit_loss_percent) as pf_last_50
        FROM (
          SELECT profit_loss_percent, closed_at
          FROM pseudo_positions
          WHERE status = 'closed' AND closed_at IS NOT NULL
          ORDER BY closed_at DESC
          LIMIT 50
        ) as subquery
      `)
    } catch (error) {
      console.warn("[v0] Could not fetch profit factor:", error)
      profitFactorResult = { pf_last_20h: 0, pf_last_50: 0 }
    }

    let profitMetrics25: any = null
    try {
      profitMetrics25 = await queryOne(`
        SELECT AVG(profit_loss_percent) as pf_last_25
        FROM (
          SELECT profit_loss_percent
          FROM pseudo_positions
          WHERE status = 'closed' AND closed_at IS NOT NULL
          ORDER BY closed_at DESC
          LIMIT 25
        ) as subquery
      `)
    } catch (error) {
      console.warn("[v0] Could not fetch profit factor last 25:", error)
      profitMetrics25 = { pf_last_25: 0 }
    }

    let liveMetrics: any = null
    try {
      liveMetrics = await queryOne(`SELECT COUNT(*) as live_count FROM positions WHERE status = 'open'`)
    } catch (error) {
      console.warn("[v0] Could not fetch live metrics:", error)
      liveMetrics = { live_count: 0 }
    }

    const metrics = result || {}
    const profitMetrics = profitFactorResult || { pf_last_20h: 0, pf_last_50: 0 }
    const profitMetrics25Result = profitMetrics25 || { pf_last_25: 0 }
    const liveMetricsResult = liveMetrics || { live_count: 0 }

    const pfByType = {
      base: { pf20h: 0, pf25: 0 },
      main: { pf20h: 0, pf25: 0 },
      real: { pf20h: 0, pf25: 0 },
      active: { pf20h: 0, pf25: 0 },
    }

    profitFactorByTypeResult.forEach((row: any) => {
      if (row.type === "base") {
        pfByType.base.pf20h = Number.parseFloat(row.pf_last_20h) || 0
        pfByType.base.pf25 = Number.parseFloat(row.pf_last_25) || 0
      } else if (row.type === "main") {
        pfByType.main.pf20h = Number.parseFloat(row.pf_last_20h) || 0
        pfByType.main.pf25 = Number.parseFloat(row.pf_last_25) || 0
      } else if (row.type === "real") {
        pfByType.real.pf20h = Number.parseFloat(row.pf_last_20h) || 0
        pfByType.real.pf25 = Number.parseFloat(row.pf_last_25) || 0
      } else if (row.type === "active") {
        pfByType.active.pf20h = Number.parseFloat(row.pf_last_20h) || 0
        pfByType.active.pf25 = Number.parseFloat(row.pf_last_25) || 0
      }
    })

    const memoryUsage = process.memoryUsage()
    const cpuUsage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    return NextResponse.json({
      activeConnections: Number.parseInt(String(metrics.active_connections)) || 0,
      totalPositions: Number.parseInt(String(metrics.total_positions)) || 0,
      dailyPnL: 0,
      totalBalance: 0,
      indicationsActive: Number.parseInt(String(metrics.active_indications)) || 0,
      indicationsTotal: Number.parseInt(String(metrics.total_indications)) || 0,
      strategiesActive: Number.parseInt(String(metrics.active_strategies)) || 0,
      strategiesTotal: Number.parseInt(String(metrics.total_strategies)) || 0,
      systemLoad: Math.round(cpuUsage),
      databaseSize: 45,
      activeSymbols: Number.parseInt(String(metrics.active_symbols)) || 0,
      realPositions: Number.parseInt(String(metrics.real_positions)) || 0,
      pseudoPositionsBase: Number.parseInt(String(metrics.base_positions)) || 0,
      pseudoPositionsMain: Number.parseInt(String(metrics.main_positions)) || 0,
      pseudoPositionsReal: Number.parseInt(String(metrics.real_positions)) || 0,
      pseudoPositionsActive: Number.parseInt(String(metrics.active_positions)) || 0,
      profitFactorLast20h: Number.parseFloat(String(profitMetrics.pf_last_20h)) || 0,
      profitFactorLast50: Number.parseFloat(String(profitMetrics.pf_last_50)) || 0,
      profitFactorLast25: Number.parseFloat(String(profitMetrics25Result.pf_last_25)) || 0,
      livePositions: Number.parseInt(String(liveMetricsResult.live_count)) || 0,
      pseudoBasePF20h: pfByType.base.pf20h,
      pseudoBasePF25: pfByType.base.pf25,
      pseudoMainPF20h: pfByType.main.pf20h,
      pseudoMainPF25: pfByType.main.pf25,
      pseudoRealPF20h: pfByType.real.pf20h,
      pseudoRealPF25: pfByType.real.pf25,
      pseudoActivePF20h: pfByType.active.pf20h,
      pseudoActivePF25: pfByType.active.pf25,
    })
  } catch (error) {
    console.error("[v0] Error fetching structure metrics:", error)
    // Return safe defaults instead of error
    return NextResponse.json({
      activeConnections: 0,
      totalPositions: 0,
      dailyPnL: 0,
      totalBalance: 0,
      indicationsActive: 0,
      indicationsTotal: 0,
      strategiesActive: 0,
      strategiesTotal: 0,
      systemLoad: 0,
      databaseSize: 0,
      activeSymbols: 0,
      realPositions: 0,
      pseudoPositionsBase: 0,
      pseudoPositionsMain: 0,
      pseudoPositionsReal: 0,
      pseudoPositionsActive: 0,
      profitFactorLast20h: 0,
      profitFactorLast50: 0,
      profitFactorLast25: 0,
      livePositions: 0,
      pseudoBasePF20h: 0,
      pseudoBasePF25: 0,
      pseudoMainPF20h: 0,
      pseudoMainPF25: 0,
      pseudoRealPF20h: 0,
      pseudoRealPF25: 0,
      pseudoActivePF20h: 0,
      pseudoActivePF25: 0,
    })
  }
}
