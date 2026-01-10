"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConnectionCard } from "@/components/dashboard/connection-card"
import { SystemOverview } from "@/components/dashboard/system-overview"
import { RealTimeTicker } from "@/components/dashboard/real-time-ticker"
import { GlobalTradeEngineControls } from "@/components/dashboard/global-trade-engine-controls"
import type { ExchangeConnection } from "@/lib/types"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { getPredefinedConnectionsAsStatic } from "@/lib/connection-predefinitions"

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
    indicationsTotal: 0,
    strategiesActive: 0,
    systemLoad: 0,
    databaseSize: 0,
    activeSymbols: 0,
    livePositions: 0,
    pseudoPositions: 0,
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
        const predefinedConnections = getPredefinedConnectionsAsStatic()
        setAvailableConnections(predefinedConnections)
        return
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.log("[v0] No connections from API, showing predefined")
        const predefinedConnections = getPredefinedConnectionsAsStatic()
        setAvailableConnections(predefinedConnections)
        return
      }

      console.log("[v0] Loaded connections:", data.length)

      const activeConns = data.filter((c: ExchangeConnection) => c?.is_active === true)
      const notActive = data.filter((c: ExchangeConnection) => c && c.is_active !== true)

      setActiveConnections(activeConns)
      setAvailableConnections(notActive)

      const enabledConnections = activeConns.filter((c: ExchangeConnection) => c?.is_enabled && !c?.is_predefined)
      setHasRealConnections(enabledConnections.length > 0)

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
      const response = await fetch("/api/structure/metrics")
      if (!response.ok) {
        console.log("[v0] System stats not available yet")
        return
      }

      const data = await response.json()
      console.log("[v0] Loaded system stats")
      setSystemStats(data)
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

  const handleExchangeChange = (value: string) => {
    setSelectedConnection(value)
    localStorage.setItem("selectedExchange", value)
  }

  const handleRefresh = () => {
    loadConnections()
    loadSystemStats()
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
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedConnection} onValueChange={handleExchangeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Exchange" />
              </SelectTrigger>
              <SelectContent>
                {activeConnections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name} ({conn.exchange})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <SystemOverview stats={systemStats} />
          <RealTimeTicker />
          <GlobalTradeEngineControls />

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
        </main>
      </div>
    </AuthGuard>
  )
}
