"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"

interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume: number
  lastUpdate: Date
}

export default function MarketDataMonitor({ connectionId }: { connectionId: string }) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">("connecting")

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      setStatus("connecting")

      try {
        // Connect to WebSocket server
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsUrl = `${protocol}//${window.location.host}/api/ws?connectionId=${connectionId}`

        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log("[v0] WebSocket connected for market data")
          setStatus("connected")

          // Subscribe to market data updates
          ws?.send(
            JSON.stringify({
              type: "subscribe",
              channel: "market_data",
              connectionId,
            }),
          )
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === "market_data" && data.data) {
              const updates = data.data.map((item: any) => ({
                symbol: item.symbol,
                price: Number.parseFloat(item.price),
                change24h: Number.parseFloat(item.change24h || "0"),
                volume: Number.parseFloat(item.volume || "0"),
                lastUpdate: new Date(item.timestamp || Date.now()),
              }))

              setMarketData(updates)
            }
          } catch (error) {
            console.error("[v0] Failed to parse WebSocket message:", error)
          }
        }

        ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          setStatus("disconnected")
        }

        ws.onclose = () => {
          console.log("[v0] WebSocket disconnected, reconnecting in 5s...")
          setStatus("disconnected")

          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000)
        }
      } catch (error) {
        console.error("[v0] Failed to connect WebSocket:", error)
        setStatus("disconnected")
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
  }, [connectionId])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Market Data
            </CardTitle>
            <CardDescription>Live price updates from exchange</CardDescription>
          </div>
          <Badge variant={status === "connected" ? "default" : "secondary"}>
            {status === "connected" && <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {marketData.length > 0 ? (
            marketData.map((data) => (
              <div key={data.symbol} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-semibold">{data.symbol}</div>
                  <div className="text-lg font-bold">${data.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 ${data.change24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">{Math.abs(data.change24h).toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Vol: {(data.volume / 1000).toFixed(0)}K</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {status === "connected" ? "Waiting for market data..." : "Connecting to exchange..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
