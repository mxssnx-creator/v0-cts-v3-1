'use client'

import { useEffect, useState } from 'react'

function createTimeoutAbortSignal(ms: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

export function AppStartup() {
  const [initialized, setInitialized] = useState(false)
  const [initStatus, setInitStatus] = useState('Initializing system...')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[v0] App startup initialization...')

        // Phase 1: Load connections from file storage (most important)
        setInitStatus('Loading trading connections...')
        try {
          const connectionsResponse = await fetch('/api/settings/connections', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutAbortSignal(5000),
          })

          if (connectionsResponse?.ok) {
            const connections = await connectionsResponse.json()
            console.log('[v0] Loaded connections:', Array.isArray(connections) ? connections.length : 0)
          } else {
            console.warn('[v0] Connections API returned non-OK status:', connectionsResponse?.status)
          }
        } catch (err) {
          console.warn('[v0] Connections load failed (using file storage fallback):', err instanceof Error ? err.message : err)
        }

        // Phase 2: Check system health (optional, non-blocking)
        setInitStatus('Checking system status...')
        try {
          const healthResponse = await fetch('/api/system/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutAbortSignal(3000),
          })

          if (healthResponse?.ok) {
            const health = await healthResponse.json()
            console.log('[v0] System health:', health.status)
          } else {
            console.warn('[v0] Health check returned non-OK status')
          }
        } catch (err) {
          console.warn('[v0] Health check failed (non-blocking):', err instanceof Error ? err.message : err)
        }

        // Phase 3: Attempt database initialization (optional, non-blocking)
        setInitStatus('Preparing database...')
        try {
          const dbInitResponse = await fetch('/api/db/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutAbortSignal(5000),
          })

          if (dbInitResponse?.ok) {
            const dbResult = await dbInitResponse.json()
            console.log('[v0] Database ready:', dbResult.message)
          } else {
            console.warn('[v0] Database initialization not available, using file storage')
          }
        } catch (err) {
          console.warn('[v0] Database initialization skipped (using file storage):', err instanceof Error ? err.message : err)
        }

        // System is ready
        setInitStatus('System ready')
        console.log('[v0] App startup complete - ready to trade')
        setInitialized(true)
      } catch (error) {
        console.error('[v0] Unexpected startup error:', error)
        setInitialized(true)
      }
    }

    const timeout = setTimeout(initializeApp, 100)
    return () => clearTimeout(timeout)
  }, [])

  if (!initialized) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card border rounded-lg p-8 shadow-lg max-w-sm w-full mx-4">
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-center text-sm text-muted-foreground">{initStatus}</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
