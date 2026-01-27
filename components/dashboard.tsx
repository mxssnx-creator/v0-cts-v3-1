'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const { data: connections = [], error: connError } = useSWR('/api/settings/connections', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  const { data: health, error: healthError } = useSWR('/api/system/health', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Trading Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your trading system</p>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Health Status</p>
            <p className="text-2xl font-bold text-green-600">
              {healthError ? '⚠' : health?.status === 'healthy' ? '✓' : '?'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active Connections</p>
            <p className="text-2xl font-bold">{connections.length || 0}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">API Status</p>
            <p className="text-2xl font-bold text-blue-600">Ready</p>
          </div>
        </div>
      </Card>

      {/* Connections */}
      {connections.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Connected Exchanges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn: any) => (
              <div key={conn.id} className="border rounded-lg p-4">
                <p className="font-semibold">{conn.name}</p>
                <p className="text-sm text-muted-foreground">{conn.exchange}</p>
                <p className="text-xs text-muted-foreground mt-2">ID: {conn.id}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Start Trading</Button>
          <Button variant="outline">View Positions</Button>
          <Button variant="outline">Settings</Button>
          <Button variant="outline">View Logs</Button>
        </div>
      </Card>
    </div>
  )
}
