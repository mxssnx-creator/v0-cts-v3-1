"use client"

import { useState, useEffect } from "react"
import MarketDataMonitor from "@/components/realtime/market-data-monitor"
import PositionMonitor from "@/components/realtime/position-monitor"

export default function RealtimePage() {
  const [connectionId, setConnectionId] = useState<string>("default-connection")

  useEffect(() => {
    const savedConnectionId = sessionStorage.getItem("last_active_connection")
    if (savedConnectionId) {
      setConnectionId(savedConnectionId)
    } else {
      fetch("/api/connections/active")
        .then((res) => res.json())
        .then((data) => {
          if (data.connections && data.connections.length > 0) {
            setConnectionId(data.connections[0].id)
            sessionStorage.setItem("last_active_connection", data.connections[0].id)
          }
        })
        .catch((err) => console.error("Failed to fetch connections:", err))
    }
  }, [])

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
