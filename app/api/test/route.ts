import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[v0] Test endpoint called')
    
    // Test file storage
    const { loadConnections } = await import('@/lib/file-storage')
    const connections = loadConnections()
    
    return NextResponse.json({
      status: 'ok',
      message: 'System working',
      connections_loaded: Array.isArray(connections) ? connections.length : 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Test error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
