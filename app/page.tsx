"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConnectionCard } from "@/components/dashboard/connection-card"
import { SystemOverview } from "@/components/dashboard/system-overview"
import { RealTimeTicker } from "@/components/dashboard/real-time-ticker"
import { GlobalTradeEngineControls } from "@/components/dashboard/global-trade-engine-controls"
import { SystemDiagnostics } from "@/components/dashboard/system-diagnostics"
import { SystemHealthPanel } from "@/components/dashboard/system-health-panel"
import type { ExchangeConnection } from "@/lib/types"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"

export default function Dashboard() {
  const { user } = useAuth()
  const [activeConnections, setActiveConnections] = useState<ExchangeConnection[]>([])
  const [availableConnections, setAvailableConnections] = useState<ExchangeConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [hasRealConnections, setHasRealConnections] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<string>("")

  const [systemStats, setSystemStats] = useState({
    activeConnections: 0,
    totalPositions: 0,
    dailyPnL: 0,
    totalBalance: 0,
    indicationsActive: 0,
    strategiesActive: 0,
    systemLoad: 0,
    databaseSize: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    databaseLoad: 0,
  })

  useEffect(() => {
    const initialize = async () => {
      console.log("[v0] Dashboard initializing...")

      setActiveConnections([])

      await loadConnections()
      await loadSystemStats()

      const savedSelection = localStorage.getItem("selectedExchange")
      if (savedSelection) {
        setSelectedConnection(savedSelection)
      }
    }

    initialize().catch((error) => {
      console.error("[v0] Dashboard initialization error:", error)
    })

    const interval = setInterval(() => {
      loadConnections()
      loadSystemStats()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const loadConnections = async () => {
    try {
      console.log("[v0] Loading connections from API")
      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        console.log("[v0] Connections API returned error")
        return
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.log("[v0] No connections from API")
        return
      }

      console.log("[v0] Loaded connections:", data.length)

      const enabledConnections = data.filter((c: ExchangeConnection) => c?.is_enabled === true)

      const activeConns = enabledConnections.filter((c: ExchangeConnection) => c?.is_active === true)

      const notActive = enabledConnections.filter((c: ExchangeConnection) => c?.is_active !== true)

      console.log("[v0] Enabled connections:", enabledConnections.length)
      console.log("[v0] Active connections:", activeConns.length)
      console.log("[v0] Available to add:", notActive.length)

      setActiveConnections(activeConns)
      setAvailableConnections(notActive)

      const realConnections = activeConns.filter((c: ExchangeConnection) => !c?.is_predefined)
      setHasRealConnections(realConnections.length > 0)

      if (activeConns.length > 0 && !selectedConnection) {
        const savedSelection = localStorage.getItem("selectedExchange")
        setSelectedConnection(savedSelection || activeConns[0]?.id || "")
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
    }
  }

  const loadSystemStats = async () => {
    try {
      console.log("[v0] Loading system stats from API")

      const metricsResponse = await fetch("/api/structure/metrics")
      if (!metricsResponse.ok) {
        console.log("[v0] System stats not available yet")
        return
      }

      const metricsData = await metricsResponse.json()

      let dailyPnL = 0
      try {
        const posStatsResponse = await fetch("/api/positions/stats")
        if (posStatsResponse.ok) {
          const posStats = await posStatsResponse.json()
          dailyPnL = posStats.stats?.total_pnl || 0
        }
      } catch (error) {
        console.error("[v0] Failed to load position stats:", error)
      }

      let totalBalance = 0
      try {
        for (const conn of activeConnections) {
          if (conn.last_test_balance) {
            totalBalance += conn.last_test_balance
          }
        }
      } catch (error) {
        console.error("[v0] Failed to calculate total balance:", error)
      }

      let strategiesActive = 0
      try {
        const strategiesResponse = await fetch("/api/strategies")
        if (strategiesResponse.ok) {
          const strategiesData = await strategiesResponse.json()
          if (strategiesData.success && Array.isArray(strategiesData.data)) {
            strategiesActive = strategiesData.data.filter((s: any) => s.is_active).length
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load strategies:", error)
      }

      console.log("[v0] Loaded system stats")

      const memoryUsage =
        metricsData.memoryUsage ||
        (process.memoryUsage ? (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100 : 50)
      const cpuUsage = metricsData.cpuUsage || systemStats.systemLoad
      const databaseLoad = metricsData.databaseLoad || (systemStats.databaseSize / 10000) * 100 // Assuming 10GB max

      setSystemStats({
        activeConnections: metricsData.activeConnections || activeConnections.length,
        totalPositions: (metricsData.livePositions || 0) + (metricsData.pseudoPositions || 0),
        dailyPnL,
        totalBalance,
        indicationsActive: metricsData.indicationsActive || 0,
        strategiesActive,
        systemLoad: metricsData.cpuUsage || 0,
        databaseSize: metricsData.diskUsage || 0,
        memoryUsage: Math.min(100, Math.max(0, memoryUsage)),
        cpuUsage: Math.min(100, Math.max(0, cpuUsage)),
        databaseLoad: Math.min(100, Math.max(0, databaseLoad)),
      })
    } catch (error) {
      console.error("[v0] Failed to load system stats:", error)
    }
  }

  const handleToggleEnable = async (id: string, enabled: boolean) => {
    try {
      console.log("[v0] Toggling connection:", id, "enabled:", enabled)

      const response = await fetch(`/api/settings/connections/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle connection")
      }

      await loadConnections()
      toast.success(enabled ? "Connection enabled" : "Connection disabled")
    } catch (error) {
      console.error("[v0] Failed to toggle connection:", error)
      toast.error("Failed to toggle connection")
    }
  }

  const handleToggleLiveTrade = async (id: string, enabled: boolean) => {
    try {
      console.log("[v0] Toggling live trade:", id, "enabled:", enabled)

      const response = await fetch(`/api/settings/connections/${id}/live-trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live_trade: enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle live trade")
      }

      await loadConnections()
      toast.success(enabled ? "Live trading enabled" : "Live trading disabled")
    } catch (error) {
      console.error("[v0] Failed to toggle live trade:", error)
      toast.error("Failed to toggle live trade")
    }
  }

  const handleRemoveFromActive = async (id: string) => {
    try {
      console.log("[v0] Removing from active:", id)

      const response = await fetch(`/api/settings/connections/${id}/active`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove from active")
      }

      await loadConnections()
      toast.success("Connection removed from active")
    } catch (error) {
      console.error("[v0] Failed to remove from active:", error)
      toast.error("Failed to remove from active")
    }
  }

  const handleAddAsActive = async () => {
    if (!selectedToAdd) return

    try {
      console.log("[v0] Adding as active:", selectedToAdd)

      const response = await fetch(`/api/settings/connections/${selectedToAdd}/active`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to add as active")
      }

      await loadConnections()
      setShowAddDialog(false)
      setSelectedToAdd("")
      toast.success("Connection added to active")
    } catch (error) {
      console.error("[v0] Failed to add as active:", error)
      toast.error("Failed to add as active")
    }
  }

  const getConnectionStatus = (connection: ExchangeConnection) => {
    if (!connection.is_enabled) return "disabled"
    if (connection.is_enabled && !connection.is_live_trade) return "connecting"
    return "connected"
  }

  const getConnectionProgress = (connection: ExchangeConnection) => {
    if (!connection.is_enabled) return 0
    if (connection.is_live_trade) return 100
    return 50
  }

  return (
    <AuthGuard>
      <div className="flex flex-col w-full min-h-screen bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                loadConnections()
                loadSystemStats()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 space-y-4">
          <RealTimeTicker />

          <GlobalTradeEngineControls />

          <Card>
            <CardHeader>
              <CardTitle>Trade Engine</CardTitle>
              <CardDescription>Real-time trading engine status and metrics</CardDescription>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Connections</p>
                  <p className="text-2xl font-bold">{activeConnections.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trading connections</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Positions</p>
                  <p className="text-2xl font-bold">{systemStats.totalPositions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Open trades</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Indications</p>
                  <p className="text-2xl font-bold">{systemStats.indicationsActive}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trading signals</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System Load</p>
                  <p className="text-2xl font-bold">{systemStats.systemLoad}%</p>
                  <p className="text-xs text-muted-foreground mt-1">CPU usage</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{systemStats.memoryUsage}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Heap usage</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Database Load</p>
                  <p className="text-2xl font-bold">{systemStats.databaseLoad}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Disk usage</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Active Connections</h2>
                <p className="text-xs text-muted-foreground mt-1">Only showing connections enabled in Settings</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Connection
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add as Active Connection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Select an enabled connection from Settings to add as active. Only connections with
                        is_enabled=true appear here.
                      </p>
                      <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a connection" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableConnections.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                              No enabled connections available. Enable connections in Settings first.
                            </div>
                          ) : (
                            availableConnections.map((connection) => (
                              <SelectItem key={connection.id} value={connection.id}>
                                {connection.name} ({connection.exchange}) - {connection.api_type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleAddAsActive} disabled={!selectedToAdd}>
                          Add as Active
                        </Button>
                        <Button
                          className="flex-1 bg-transparent"
                          variant="outline"
                          onClick={() => setShowAddDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" onClick={() => (window.location.href = "/settings")}>
                  Manage Connections
                </Button>
              </div>
            </div>

            {activeConnections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-2">No active connections</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {availableConnections.length > 0
                      ? `${availableConnections.length} enabled connection(s) available to add`
                      : "Enable connections in Settings first"}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {availableConnections.length > 0 && (
                      <Button onClick={() => setShowAddDialog(true)}>Add Connection</Button>
                    )}
                    <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
                      Go to Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                {activeConnections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onToggleEnable={handleToggleEnable}
                    onToggleLiveTrade={handleToggleLiveTrade}
                    onDelete={handleRemoveFromActive}
                    balance={connection.last_test_balance || 0}
                    status={getConnectionStatus(connection)}
                    progress={getConnectionProgress(connection)}
                  />
                ))}
              </div>
            )}
          </div>

          <SystemOverview stats={systemStats} />

          <SystemDiagnostics />

          <SystemHealthPanel />
        </div>
      </div>
    </AuthGuard>
  )
}
