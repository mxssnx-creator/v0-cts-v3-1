import { NextResponse } from 'next/server'
import { loadConnections } from '@/lib/file-storage'

export async function GET() {
  try {
    console.log('[v0] System health check')

    // Check file-based storage (PRIMARY)
    let fileStorageOk = false
    let connectionsCount = 0

    try {
      const connections = loadConnections()
      if (Array.isArray(connections)) {
        fileStorageOk = true
        connectionsCount = connections.length
        console.log('[v0] File storage OK - connections:', connectionsCount)
      }
    } catch (err) {
      console.warn('[v0] File storage check failed:', err)
      fileStorageOk = false
    }

    const status = fileStorageOk ? 'healthy' : 'degraded'

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        storage: {
          file_based: fileStorageOk,
          type: 'json-file',
          connections_loaded: connectionsCount,
        },
        system: {
          uptime: process.uptime(),
          memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Health check error:', error)
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        storage: {
          file_based: true,
          type: 'json-file',
          connections_loaded: 0,
        },
      },
      { status: 200 }
    )
  }
}
