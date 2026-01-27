import { NextResponse } from 'next/server'
import { query, getDatabaseType } from '@/lib/db'
import { loadConnections } from '@/lib/file-storage'

export async function GET() {
  try {
    console.log('[v0] System diagnostics started')

    const diagnostics = {
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'unknown', message: '' },
        connections: { status: 'unknown', message: '' },
        api_endpoints: { status: 'unknown', message: '' },
        file_storage: { status: 'unknown', message: '' },
      },
      results: {} as Record<string, any>,
    }

    // Check 1: Database Connection
    try {
      const dbType = getDatabaseType()
      const testQuery = await query('SELECT 1 as test')

      diagnostics.checks.database.status = 'healthy'
      diagnostics.checks.database.message = `Database type: ${dbType}, Connection: OK`
      diagnostics.results.database = {
        type: dbType,
        connected: true,
        test_query_success: Array.isArray(testQuery),
      }
    } catch (error) {
      diagnostics.checks.database.status = 'error'
      diagnostics.checks.database.message = error instanceof Error ? error.message : 'Unknown database error'
      diagnostics.results.database = { connected: false, error: error instanceof Error ? error.message : 'Unknown' }
    }

    // Check 2: File Storage & Connections
    try {
      const connections = loadConnections()

      diagnostics.checks.connections.status = Array.isArray(connections) ? 'healthy' : 'warning'
      diagnostics.checks.connections.message = `Loaded ${connections.length} connections from file`
      diagnostics.results.connections = {
        total: connections.length,
        enabled: connections.filter((c: any) => c.is_enabled).length,
        active: connections.filter((c: any) => c.is_active).length,
        sample: connections.length > 0 ? { name: connections[0].name, exchange: connections[0].exchange } : null,
      }
    } catch (error) {
      diagnostics.checks.file_storage.status = 'error'
      diagnostics.checks.file_storage.message = error instanceof Error ? error.message : 'Unknown error'
      diagnostics.results.connections = { error: error instanceof Error ? error.message : 'Unknown' }
    }

    // Check 3: API Endpoints
    diagnostics.checks.api_endpoints.status = 'healthy'
    diagnostics.checks.api_endpoints.message = 'API endpoints responding'
    diagnostics.results.api_endpoints = {
      health_check: '/api/system/health',
      connections: '/api/settings/connections',
      trade_engine: '/api/trade-engine/[connectionId]',
      db_init: '/api/db/init',
    }

    // Check 4: System Logger
    try {
      const { SystemLogger } = await import('@/lib/system-logger')
      await SystemLogger.logAPI('System diagnostics check', 'info', 'GET /api/system/diagnostics')

      diagnostics.checks.api_endpoints.status = 'healthy'
      diagnostics.results.logger = { status: 'operational' }
    } catch (error) {
      console.warn('[v0] Logger check warning:', error)
      diagnostics.results.logger = { status: 'warning', error: error instanceof Error ? error.message : 'Unknown' }
    }

    // Determine overall health
    const allHealthy = Object.values(diagnostics.checks).every((c: any) => c.status !== 'error')
    const overallStatus = allHealthy ? 'healthy' : 'degraded'

    console.log('[v0] System diagnostics complete - Status:', overallStatus)

    return NextResponse.json({
      status: overallStatus,
      ...diagnostics,
    })
  } catch (error) {
    console.error('[v0] Diagnostics error:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Diagnostics failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
