'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .catch((err) => {
      console.error('[v0] Fetch error:', err)
      return null
    })

export function Dashboard() {
  const [mounted, setMounted] = useState(false)

  const { data: health, isLoading: healthLoading } = useSWR('/api/system/health', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  })

  const { data: connections = [], isLoading: connectionsLoading } = useSWR(
    '/api/settings/connections',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy'
      case 'degraded':
        return 'Degraded'
      case 'unhealthy':
        return 'Unhealthy'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Trading System Dashboard</h1>
          <p className="text-muted-foreground">Manage crypto trading connections and strategies</p>
        </div>

        {/* System Health Card */}
        {health && (
          <Card className="mb-6 p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">System Status</h2>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="font-medium">{getStatusText(health.status)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Database: <span className="font-medium">{health.database.connected ? 'Connected' : 'Disconnected'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type: <span className="font-medium">{health.database.type}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`w-8 h-8 rounded-full ${getHealthColor(health.status)}`} />
                <p className="text-xs text-muted-foreground mt-2">{getStatusText(health.status)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Connections Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Exchange Connections</h2>
            <Button size="sm" variant="default">
              + Add Connection
            </Button>
          </div>

          {connectionsLoading ? (
            <Card className="p-8 border">
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-muted-foreground">Loading connections...</span>
              </div>
            </Card>
          ) : Array.isArray(connections) && connections.length === 0 ? (
            <Card className="p-8 border text-center">
              <p className="text-muted-foreground mb-4">No connections configured yet</p>
              <Button variant="outline">Create Your First Connection</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(connections) &&
                connections.map((conn: any) => (
                  <Card key={conn.id} className="p-4 border hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{conn.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{conn.exchange}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full mt-1 ${conn.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{conn.is_enabled ? '✓ Enabled' : '○ Disabled'}</p>
                        <p>{conn.is_live_trade ? '● Live Trading' : '● Paper Trading'}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Settings
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          Test
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Total Connections</div>
            <div className="text-3xl font-bold text-foreground mt-2">
              {Array.isArray(connections) ? connections.length : 0}
            </div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Active</div>
            <div className="text-3xl font-bold text-foreground mt-2">
              {Array.isArray(connections) ? connections.filter((c: any) => c.is_active).length : 0}
            </div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Enabled</div>
            <div className="text-3xl font-bold text-foreground mt-2">
              {Array.isArray(connections) ? connections.filter((c: any) => c.is_enabled).length : 0}
            </div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Live Trading</div>
            <div className="text-3xl font-bold text-foreground mt-2">
              {Array.isArray(connections) ? connections.filter((c: any) => c.is_live_trade).length : 0}
            </div>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <Card className="p-6 border">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">Start Trading</Button>
              <Button variant="outline">View Positions</Button>
              <Button variant="outline">View Strategies</Button>
              <Button variant="outline">System Settings</Button>
              <Button variant="outline">View Logs</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
