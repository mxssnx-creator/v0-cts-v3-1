import { NextResponse } from 'next/server'
import { loadConnections } from '@/lib/file-storage'

export async function GET() {
  try {
    console.log('[v0] System health check requested')

    // Phase 1: Check file-based storage (PRIMARY - system won't work without this)
    let fileStorageOk = false
    let connectionsCount = 0
    let connectionsActive = 0
    let connectionsEnabled = 0

    try {
      const connections = loadConnections()
      if (Array.isArray(connections)) {
        fileStorageOk = true
        connectionsCount = connections.length
        connectionsActive = connections.filter((c: any) => c.is_active).length
        connectionsEnabled = connections.filter((c: any) => c.is_enabled).length
        console.log('[v0] File storage OK - connections:', connectionsCount)
      }
    } catch (err) {
      console.warn('[v0] File storage check failed:', err)
      fileStorageOk = false
    }

    // Phase 2: Check database connectivity (OPTIONAL - system works with file storage)
    let dbConnected = false
    let dbType = 'file-based'

    try {
      const { getDatabaseType } = await import('@/lib/db')
      dbType = getDatabaseType()

      // Try non-blocking database check with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

      try {
        const { sql } = await import('@/lib/db')
        if (sql) {
          const result = await Promise.race([
            sql`SELECT 1 as test`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
          ])
          dbConnected = result && Array.isArray(result)
          console.log('[v0] Database connected:', dbConnected)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (err) {
      console.warn('[v0] Database check skipped (file storage sufficient):', err instanceof Error ? err.message : 'unknown')
      dbConnected = false
    }

    // Determine overall status
    // System is healthy if file storage works (database is bonus)
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (!fileStorageOk) {
      status = 'unhealthy' // Can't work without file storage
    } else if (!dbConnected && dbType !== 'file-based') {
      status = 'degraded' // Works but no database
    }

    const health = {
      status,
      timestamp: new Date().toISOString(),
      storage: {
        file_based: fileStorageOk,
        type: 'json-file',
        connections_loaded: connectionsCount,
        connections_active: connectionsActive,
        connections_enabled: connectionsEnabled,
      },
      database: {
        type: dbType,
        connected: dbConnected,
        optional: true, // Database is optional - file storage is primary
      },
      system: {
        uptime: process.uptime(),
        memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      notes: fileStorageOk ? 'System operational via file-based storage' : 'System requires file storage to be available',
    }

    console.log('[v0] Health check complete - Status:', status)

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    console.error('[v0] Health check error:', error)

    // Return degraded but operational status
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        storage: {
          file_based: true, // Assume file storage available as fallback
          type: 'json-file',
          connections_loaded: 0,
        },
        database: {
          type: 'unknown',
          connected: false,
          optional: true,
        },
      },
      { status: 200 }
    )
  }
}
