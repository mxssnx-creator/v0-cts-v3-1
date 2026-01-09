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
import type { ExchangeConnection } from "@/lib/types"
import { RefreshCw, Plus, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import {
  getPredefinedConnectionsAsStatic,
  getDefaultActiveConnections,
  getDefaultSelectedExchange,
} from "@/lib/connection-predefinitions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Dashboard() {
  const { user } = useAuth()
  const [activeConnections, setActiveConnections] = useState<ExchangeConnection[]>([])
  const [availableConnections, setAvailableConnections] = useState<ExchangeConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [hasRealConnections, setHasRealConnections] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<string>("")
  const [tradeEngineRunning, setTradeEngineRunning] = useState(false)
  const [systemStats, setSystemStats] = useState({
    activeConnections: 0,
    totalPositions: 0,
    dailyPnL: 0,
    totalBalance: 0,
    indicationsActive: 0,
    strategiesActive: 0,
    systemLoad: 0,
    databaseSize: 0,
  })

  useEffect(() => {
    const initialize = async () => {
      console.log("[v0] Dashboard initializing...")

      const defaultActive = getDefaultActiveConnections()
      setActiveConnections(defaultActive)

      const defaultExchange = getDefaultSelectedExchange()
      setSelectedConnection(defaultExchange)

      await loadConnections()
      await loadSystemStats()
      await checkTradeEngineStatus()

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
      checkTradeEngineStatus()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const checkTradeEngineStatus = async () => {
    try {
      const response = await fetch("/api/trade-engine/status")
      if (response.ok) {
        const data = await response.json()
        setTradeEngineRunning(data.status === "running")
      }
    } catch (error) {
      console.error("[v0] Failed to check trade engine status:", error)
    }
  }

  const loadConnections = async () => {
    try {
      console.log("[v0] Loading connections from API")
      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        console.log("[v0] Connections API returned error, using defaults")
        const defaultActive = getDefaultActiveConnections()
        setActiveConnections(defaultActive)

        const predefinedConnections = getPredefinedConnectionsAsStatic()
        const notActive = predefinedConnections.filter((c) => c.id !== "bybit-x03" && c.id !== "bingx-x01")
        setAvailableConnections(notActive)
        return
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.log("[v0] No connections from API, showing defaults with ByBit and BingX")
        const defaultActive = getDefaultActiveConnections()
        setActiveConnections(defaultActive)

        const predefinedConnections = getPredefinedConnectionsAsStatic()
        const notActive = predefinedConnections.filter((c) => c.id !== "bybit-x03" && c.id !== "bingx-x01")
        setAvailableConnections(notActive)
        return
      }

      console.log("[v0] Loaded connections:", data.length)

      const activeConns = data.filter((c: ExchangeConnection) => c?.is_active === true)
      const notActive = data.filter((c: ExchangeConnection) => c && c.is_active !== true)

      if (activeConns.length === 0) {
        const defaultActive = getDefaultActiveConnections()
        setActiveConnections(defaultActive)
      } else {
        setActiveConnections(activeConns)
      }

      setAvailableConnections(notActive)

      const enabledConnections = activeConns.filter((c: ExchangeConnection) => c?.is_enabled && !c?.is_predefined)
      setHasRealConnections(enabledConnections.length > 0)

      if (activeConns.length > 0 && !selectedConnection) {
        const savedSelection = localStorage.getItem("selectedExchange")
        setSelectedConnection(savedSelection || "bybit-x03")
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
      const defaultActive = getDefaultActiveConnections()
      setActiveConnections(defaultActive)
    }
  }

  const loadSystemStats = async () => {
    try {
      console.log("[v0] Loading system stats from API")
      const response = await fetch("/api/structure/metrics")
      if (!response.ok) {
        console.log("[v0] System stats not available yet")
        return
      }

      const data = await response.json()
      console.log("[v0] Loaded system stats")
      setSystemStats({
        activeConnections: data.activeConnections || 0,
        totalPositions: (data.livePositions || 0) + (data.pseudoPositions || 0),
        dailyPnL: data.dailyPnL || 0,
        totalBalance: data.totalBalance || 0,
        indicationsActive: data.indicationsActive || 0,
        strategiesActive: data.strategiesActive || 0,
        systemLoad: data.cpuUsage || 0,
        databaseSize: data.diskUsage || 0,
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

  const handleExchangeSelectionChange = (value: string) => {
    setSelectedConnection(value)
    localStorage.setItem("selectedExchange", value)
    toast.success(`Selected ${value} for overall exchange`)
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
                checkTradeEngineStatus()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 space-y-4">
          <RealTimeTicker />

          <GlobalTradeEngineControls />

          {!tradeEngineRunning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Trade engine is not running. Enable it using the controls above to start trading.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Trade Engine</CardTitle>
              <CardDescription>Real-time trading engine status and metrics</CardDescription>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-4">
              {!tradeEngineRunning && (
                <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  Trade engine is stopped. Metrics will update when engine is running.
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Symbols</p>
                  <p className="text-2xl font-bold">{systemStats.activeConnections || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trading pairs</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indications</p>
                  <p className="text-2xl font-bold">
                    {systemStats.indicationsActive}/{systemStats.strategiesActive}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Active/Total</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Live Positions</p>
                  <p className="text-2xl font-bold">{systemStats.totalPositions || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Open trades</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily PnL</p>
                  <p className={`text-2xl font-bold ${systemStats.dailyPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {systemStats.dailyPnL >= 0 ? "+" : ""}
                    {systemStats.dailyPnL.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Today's performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Selection</CardTitle>
              <CardDescription>Select overall exchange for trading operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select value={selectedConnection} onValueChange={handleExchangeSelectionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeConnections.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          No active connections. Add connections first.
                        </div>
                      ) : (
                        activeConnections.map((connection) => (
                          <SelectItem key={connection.id} value={connection.id}>
                            {connection.name} ({connection.exchange})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{selectedConnection || "None"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Only exchanges from Active Connections are shown. Add connections below to see them here.
              </p>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Active Connections</h2>
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
                        Select a connection from Settings to add as active. Each connection can only be added once.
                      </p>
                      <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a connection" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableConnections.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                              No available connections. Add connections in Settings first.
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

            {!tradeEngineRunning && activeConnections.length > 0 && (
              <Alert className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Trade engine is not running. Enable the trade engine to activate trading on these connections.
                </AlertDescription>
              </Alert>
            )}

            {activeConnections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No active connections</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setShowAddDialog(true)}>Add Connection</Button>
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
        </div>
      </div>
    </AuthGuard>
  )
}
