import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { loadConnections, loadSettings } from "@/lib/file-storage"
import DatabaseManager from "@/lib/database"
import { SystemLogger } from "@/lib/system-logger"

/**
 * Comprehensive Monitoring Endpoint
 * Consolidates all system monitoring data into a single response
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log("[v0] [Monitoring] Fetching comprehensive system metrics")

    // 1. Get all connections
    const connections = loadConnections()
    const activeConnections = connections.filter((c) => c.is_enabled)
    const liveTradeConnections = connections.filter((c) => c.is_live_trade)

    // 2. Get trade engine states
    const engineStates = await sql`
      SELECT 
        tes.*,
        ec.name as connection_name,
        ec.exchange
      FROM trade_engine_state tes
      LEFT JOIN exchange_connections ec ON tes.connection_id = ec.id
    `

    const runningEngines = engineStates.filter((s: any) => s.state === 'running')

    // 3. Get position data
    let pseudoPositions = []
    let realPositions = []
    
    try {
      const db = DatabaseManager.getInstance()
      pseudoPositions = await db.getPseudoPositions(undefined, 100)
      realPositions = await db.getRealPositions()
    } catch (dbError) {
      console.warn("[v0] [Monitoring] Could not fetch positions:", dbError)
    }

    // 4. Get recent activity
    const recentTradesCount = await sql`
      SELECT COUNT(*) as count 
      FROM trades 
      WHERE executed_at > NOW() - INTERVAL '1 hour'
    `

    const recentOrdersCount = await sql`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `

    // 5. Get error/log data
    let recentErrors = []
    try {
      const db = DatabaseManager.getInstance()
      recentErrors = await db.getErrors(10, false)
    } catch (logError) {
      console.warn("[v0] [Monitoring] Could not fetch errors:", logError)
    }

    // 6. Get system settings
    const settings = loadSettings()

    // 7. Calculate health scores
    const connectionHealth = activeConnections.length > 0 ? 'healthy' : 'warning'
    const engineHealth = runningEngines.length > 0 ? 'healthy' : 'idle'
    const errorHealth = recentErrors.length > 5 ? 'warning' : recentErrors.length > 10 ? 'critical' : 'healthy'

    // 8. Aggregate component health
    const componentHealthScores = engineStates.map((state: any) => ({
      connectionId: state.connection_id,
      connectionName: state.connection_name,
      overall: state.manager_health_status || 'unknown',
      indications: state.indications_health || 'unknown',
      strategies: state.strategies_health || 'unknown',
      realtime: state.realtime_health || 'unknown',
      lastCheck: state.last_manager_health_check
    }))

    // 9. Calculate overall system health
    const overallHealth = calculateOverallHealth({
      connectionHealth,
      engineHealth,
      errorHealth,
      componentHealthScores
    })

    // 10. Build comprehensive response
    const response = {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      system: {
        status: overallHealth,
        uptime: process.uptime(),
        version: '3.1.0',
        environment: process.env.NODE_ENV || 'production'
      },
      connections: {
        total: connections.length,
        active: activeConnections.length,
        liveTrade: liveTradeConnections.length,
        byExchange: aggregateByExchange(connections),
        health: connectionHealth,
        details: connections.map(c => ({
          id: c.id,
          name: c.name,
          exchange: c.exchange,
          isEnabled: c.is_enabled,
          isLiveTrading: c.is_live_trade,
          lastTestStatus: c.last_test_status,
          lastTestAt: c.last_test_at
        }))
      },
      tradeEngines: {
        total: engineStates.length,
        running: runningEngines.length,
        stopped: engineStates.filter((s: any) => s.state === 'stopped').length,
        error: engineStates.filter((s: any) => s.state === 'error').length,
        health: engineHealth,
        componentHealth: componentHealthScores,
        details: engineStates.map((state: any) => ({
          connectionId: state.connection_id,
          connectionName: state.connection_name,
          exchange: state.exchange,
          state: state.state,
          lastIndicationRun: state.last_indication_run,
          lastStrategyRun: state.last_strategy_run,
          lastRealtimeRun: state.last_realtime_run,
          indicationCycles: state.indication_cycle_count,
          strategyCycles: state.strategy_cycle_count,
          realtimeCycles: state.realtime_cycle_count
        }))
      },
      trading: {
        pseudoPositions: {
          total: pseudoPositions.length,
          open: pseudoPositions.filter((p: any) => p.status === 'open').length,
          pending: pseudoPositions.filter((p: any) => p.status === 'pending').length
        },
        realPositions: {
          total: realPositions.length,
          open: realPositions.filter((p: any) => p.status === 'open').length
        },
        activity: {
          tradesLastHour: (recentTradesCount[0] as any)?.count || 0,
          ordersLastHour: (recentOrdersCount[0] as any)?.count || 0
        },
        health: realPositions.length > 0 ? 'active' : 'idle'
      },
      errors: {
        count: recentErrors.length,
        health: errorHealth,
        recent: recentErrors.slice(0, 5).map((e: any) => ({
          level: e.level,
          message: e.message,
          timestamp: e.timestamp,
          component: e.component
        }))
      },
      settings: {
        mainEngineInterval: settings.mainEngineIntervalMs || 1000,
        strategyUpdateInterval: settings.strategyUpdateIntervalMs || 300,
        minimumConnectInterval: settings.minimumConnectInterval || 200
      }
    }

    console.log(`[v0] [Monitoring] Comprehensive metrics retrieved in ${response.responseTime}ms`)
    
    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] [Monitoring] Failed to fetch comprehensive metrics:", errorMessage)
    
    await SystemLogger.logError(error, "monitoring", "GET /api/monitoring/comprehensive")

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        system: {
          status: 'error',
          error: errorMessage
        }
      },
      { status: 500 }
    )
  }
}

function calculateOverallHealth(metrics: any): 'healthy' | 'degraded' | 'critical' | 'error' {
  const healthScores = {
    healthy: 3,
    warning: 2,
    idle: 2,
    degraded: 1,
    critical: 0,
    error: 0
  }

  const scores = [
    healthScores[metrics.connectionHealth as keyof typeof healthScores] || 0,
    healthScores[metrics.engineHealth as keyof typeof healthScores] || 0,
    healthScores[metrics.errorHealth as keyof typeof healthScores] || 0
  ]

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

  if (avgScore >= 2.5) return 'healthy'
  if (avgScore >= 1.5) return 'degraded'
  if (avgScore >= 0.5) return 'critical'
  return 'error'
}

function aggregateByExchange(connections: any[]): Record<string, number> {
  return connections.reduce((acc, conn) => {
    acc[conn.exchange] = (acc[conn.exchange] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
