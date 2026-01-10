"use client"

import { useEffect, useState } from "react"
import MarketDataMonitor from "@/components/realtime/market-data-monitor"
import PositionMonitor from "@/components/realtime/position-monitor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function RealtimePage() {
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load active connection from user's active connections
    const loadActiveConnection = async () => {
      try {
        const response = await fetch("/api/settings/connections")
        const connections = await response.json()

        // Find first active connection
        const activeConnection = connections.find((c: any) => c.is_active)

        if (activeConnection) {
          setConnectionId(activeConnection.id)
        }
      } catch (error) {
        console.error("[v0] Failed to load active connection:", error)
      } finally {
        setLoading(false)
      }
    }

    loadActiveConnection()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
          <p className="text-muted-foreground">Loading connection...</p>
        </div>
      </div>
    )
  }

  if (!connectionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
          <p className="text-muted-foreground">Live market data and position tracking</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active connection found. Please enable a connection in Settings → Connections.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
        <p className="text-muted-foreground">Live market data and position tracking</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MarketDataMonitor connectionId={connectionId} />
        <PositionMonitor connectionId={connectionId} />
      </div>
    </div>
  )
}
