'use client'

import { useEffect, useState } from 'react'

export function AppStartup() {
  const [initialized, setInitialized] = useState(false)
  const [initStatus, setInitStatus] = useState('Initializing system...')

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[v0] App startup initialization...')
        setInitStatus('Checking database...')

        // Initialize database
        const dbInitResponse = await fetch('/api/db/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[v0] Database initialization failed:', err)
          return null
        })

        if (dbInitResponse?.ok) {
          const dbResult = await dbInitResponse.json()
          console.log('[v0] Database initialized:', dbResult)
        } else {
          console.warn('[v0] Database initialization returned non-OK status')
        }

        // Check system health
        setInitStatus('Checking system health...')
        const healthResponse = await fetch('/api/system/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[v0] Health check failed:', err)
          return null
        })

        if (healthResponse?.ok) {
          const health = await healthResponse.json()
          console.log('[v0] System health:', health.status)
        }

        // Load connections
        setInitStatus('Loading connections...')
        const connectionsResponse = await fetch('/api/settings/connections', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[v0] Connections load failed:', err)
          return null
        })

        if (connectionsResponse?.ok) {
          const connections = await connectionsResponse.json()
          console.log('[v0] Loaded connections:', Array.isArray(connections) ? connections.length : 0)
        }

        setInitStatus('System ready')
        console.log('[v0] App startup complete')
        setInitialized(true)
      } catch (error) {
        console.error('[v0] Startup error:', error)
        // Continue anyway - don't block the app
        setInitialized(true)
      }
    }

    // Small delay to ensure DOM is ready
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
