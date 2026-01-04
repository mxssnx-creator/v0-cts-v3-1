"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PositionCard } from "@/components/live-trading/position-card"
import { TradingOverview } from "@/components/live-trading/trading-overview"
import type { TradingPosition, TradingStats, TimeRangeStats } from "@/lib/trading"
import { Activity, RefreshCw, BarChart3, History } from "lucide-react"
import { toast } from "@/lib/simple-toast"

export default function LiveTradingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedConnection, setSelectedConnection] = useState("")
  const [openPositions, setOpenPositions] = useState<TradingPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<TradingPosition[]>([])
  const [tradingStats, setTradingStats] = useState<TradingStats>({
    total_positions: 0,
    open_positions: 0,
    closed_positions: 0,
    total_volume: 0,
    total_pnl: 0,
    win_rate: 0,
    avg_hold_time: 0,
    largest_win: 0,
    largest_loss: 0,
    balance: 0,
    equity: 0,
    margin: 0,
    free_margin: 0,
  })
  const [timeRangeStats, setTimeRangeStats] = useState<{
    "4h": TimeRangeStats
    "12h": TimeRangeStats
    "24h": TimeRangeStats
    "48h": TimeRangeStats
  }>({
    "4h": { positions_count: 0, total_pnl: 0, win_rate: 0, avg_profit: 0, balance_change: 0 },
    "12h": { positions_count: 0, total_pnl: 0, win_rate: 0, avg_profit: 0, balance_change: 0 },
    "24h": { positions_count: 0, total_pnl: 0, win_rate: 0, avg_profit: 0, balance_change: 0 },
    "48h": { positions_count: 0, total_pnl: 0, win_rate: 0, avg_profit: 0, balance_change: 0 },
  })

  const [connections, setConnections] = useState<Array<{ id: string; name: string; exchange: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await fetch("/api/connections/active")
        if (!response.ok) throw new Error("Failed to load connections")

        const data = await response.json()

        setConnections(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            exchange: c.exchange,
          })),
        )

        if (data.length > 0) {
          setSelectedConnection(data[0].id)
        }
      } catch (error) {
        console.error("[v0] Failed to load connections:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnections()
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      refreshData()

      const interval = setInterval(() => {
        refreshData()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [selectedConnection])

  const refreshData = async () => {
    if (!selectedConnection) return

    try {
      const [positionsRes, statsRes, timeStatsRes] = await Promise.all([
        fetch(`/api/positions?connection_id=${selectedConnection}`),
        fetch(`/api/positions/stats?connection_id=${selectedConnection}`),
        fetch(`/api/positions/time-stats?connection_id=${selectedConnection}`),
      ])

      if (positionsRes.ok) {
        const positionsData = await positionsRes.json()
        setOpenPositions(positionsData.open || [])
        setClosedPositions(positionsData.closed || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setTradingStats(statsData.stats || tradingStats)
      }

      if (timeStatsRes.ok) {
        const timeStatsData = await timeStatsRes.json()
        setTimeRangeStats(timeStatsData.timeStats || timeRangeStats)
      }
    } catch (error) {
      console.error("[v0] Failed to refresh trading data:", error)
    }
  }

  const handleClosePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/positions/${positionId}/close`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Position closed with P&L: $${data.profit_loss.toFixed(2)}`)
        refreshData()
      } else {
        toast.error("Failed to close position")
      }
    } catch (error) {
      console.error("[v0] Failed to close position:", error)
      toast.error("Failed to close position")
    }
  }

  const handleCloseProfitablePositions = async () => {
    try {
      const response = await fetch(`/api/positions/close-profitable?connection_id=${selectedConnection}`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Closed ${data.count} profitable positions`)
        refreshData()
      } else {
        toast.error("Failed to close profitable positions")
      }
    } catch (error) {
      console.error("[v0] Failed to close profitable positions:", error)
      toast.error("Failed to close profitable positions")
    }
  }

  const handleCloseAllPositions = async () => {
    try {
      const response = await fetch(`/api/positions/close-all?connection_id=${selectedConnection}`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Closed ${data.count} positions`)
        refreshData()
      } else {
        toast.error("Failed to close all positions")
      }
    } catch (error) {
      console.error("[v0] Failed to close all positions:", error)
      toast.error("Failed to close all positions")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Connections</h3>
          <p className="text-muted-foreground mb-4">
            Add connections to "Active Connections" on Dashboard to see trading data.
          </p>
          <Button onClick={() => (window.location.href = "/")}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Trading</h1>
          <p className="text-muted-foreground">Monitor active positions and trading activity</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedConnection} onValueChange={setSelectedConnection}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.id}>
                  {conn.name} ({conn.exchange})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Open Positions ({openPositions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Position History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TradingOverview
            stats={tradingStats}
            timeRangeStats={timeRangeStats}
            onCloseProfitablePositions={handleCloseProfitablePositions}
            onCloseAllPositions={handleCloseAllPositions}
          />
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Open Positions ({openPositions.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseProfitablePositions}>
                Close Profitable
              </Button>
              <Button variant="destructive" onClick={handleCloseAllPositions}>
                Close All
              </Button>
            </div>
          </div>

          {openPositions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Open Positions</h3>
              <p className="text-muted-foreground">All positions are currently closed or no trading activity.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onClose={handleClosePosition}
                  showCloseButton={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Position History ({closedPositions.length})</h2>
            <p className="text-sm text-muted-foreground">Last 50 closed positions</p>
          </div>

          {closedPositions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trading History</h3>
              <p className="text-muted-foreground">No closed positions found for this connection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedPositions.map((position) => (
                <PositionCard key={position.id} position={position} showCloseButton={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
