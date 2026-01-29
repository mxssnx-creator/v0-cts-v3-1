"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConnectionCard } from "@/components/dashboard/connection-card"
import { SystemOverview } from "@/components/dashboard/system-overview"
import { GlobalTradeEngineControls } from "@/components/dashboard/global-trade-engine-controls"
import { StrategiesOverview } from "@/components/dashboard/strategies-overview"
import type { ExchangeConnection } from "@/lib/types"
import { RefreshCw, Plus } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/components/auth-provider"
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
  const [strategies, setStrategies] = useState<any[]>([])

  useEffect(() => {
    const initialize = async () => {
      await loadConnections()
      await loadSystemStats()
      await loadStrategies()

      const savedSelection = localStorage.getItem("selectedExchange")
      if (savedSelection) {
        setSelectedConnection(savedSelection)
      }
    }

    initialize().catch((error) => {
      console.error("[v0] Dashboard initialization error:", error)
    })
  }, [])

  useEffect(() => {
    if (activeConnections.length === 0) return

    const updateConnectionStatuses = async () => {
      try {
        const response = await fetch("/api/connections/status")
        if (response.ok) {
          const statuses = await response.json()
          // Update connection states with real data
          statuses.forEach((statusData: any) => {
            const conn = activeConnections.find((c) => c.id === statusData.id)
            if (conn) {
              // Real-time progress and status updates
              console.log(`[v0] Connection ${conn.name}: ${statusData.status} - ${statusData.progress}%`)
            }
          })
        }
      } catch (error) {
        console.error("[v0] Failed to update connection statuses:", error)
      }
    }

    const interval = setInterval(updateConnectionStatuses, 5000) // Update every 5 seconds
    updateConnectionStatuses() // Initial call

    return () => clearInterval(interval)
  }, [activeConnections])

  const loadConnections = async () => {
    try {
      console.log("[v0] Loading connections from API")
      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        console.log("[v0] Connections API returned error, no connections available")
        setActiveConnections([])
        setAvailableConnections([])
        return
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.log("[v0] No connections from API")
        setActiveConnections([])
        setAvailableConnections([])
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

  const loadStrategies = async () => {
    try {
      const response = await fetch("/api/strategies/overview")
      if (response.ok) {
        const data = await response.json()
        setStrategies(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load strategies:", error)
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
    loadStrategies()
  }

  const getConnectionStatus = (connection: ExchangeConnection): "connected" | "connecting" | "error" | "disabled" => {
    if (!connection.is_enabled) return "disabled"
    if (connection.last_test_status === "failed") return "error"
    if (connection.is_enabled && !connection.is_live_trade) return "connecting"
    return "connected"
  }

  const getConnectionProgress = (connection: ExchangeConnection): number => {
    // In a real implementation, this would query the trade engine coordinator
    // For now, return based on connection state
    if (!connection.is_enabled) return 0
    if (connection.is_live_trade) return 100
    // Simulate loading progress based on time since enabled
    return 45 // This would come from real trade engine status
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-lg font-semibold">Dashboard</h1>
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
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <SystemOverview stats={systemStats} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StrategiesOverview strategies={strategies} />
            </div>
            <div>
              <GlobalTradeEngineControls />
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Manage your exchange connections</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {activeConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No active connections. Add a connection to get started.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeConnections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      status={getConnectionStatus(connection)}
                      progress={getConnectionProgress(connection)}
                      onToggleEnable={handleToggleEnable}
                      onToggleLiveTrade={handleToggleLiveTrade}
                      onDelete={handleRemoveFromActive}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Connection to Active</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {availableConnections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.exchange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleAddAsActive} disabled={!selectedToAdd}>
                Add to Active
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}

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
  const [strategies, setStrategies] = useState<any[]>([])

  useEffect(() => {
    const initialize = async () => {
      await loadConnections()
      await loadSystemStats()
      await loadStrategies()

      const savedSelection = localStorage.getItem("selectedExchange")
      if (savedSelection) {
        setSelectedConnection(savedSelection)
      }
    }

    initialize().catch((error) => {
      console.error("[v0] Dashboard initialization error:", error)
    })
  }, [])

  useEffect(() => {
    if (activeConnections.length === 0) return

    const updateConnectionStatuses = async () => {
      try {
        const response = await fetch("/api/connections/status")
        if (response.ok) {
          const statuses = await response.json()
          // Update connection states with real data
          statuses.forEach((statusData: any) => {
            const conn = activeConnections.find((c) => c.id === statusData.id)
            if (conn) {
              // Real-time progress and status updates
              console.log(`[v0] Connection ${conn.name}: ${statusData.status} - ${statusData.progress}%`)
            }
          })
        }
      } catch (error) {
        console.error("[v0] Failed to update connection statuses:", error)
      }
    }

    const interval = setInterval(updateConnectionStatuses, 5000) // Update every 5 seconds
    updateConnectionStatuses() // Initial call

    return () => clearInterval(interval)
  }, [activeConnections])

  const loadConnections = async () => {
    try {
      console.log("[v0] Loading connections from API")
      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        console.log("[v0] Connections API returned error, no connections available")
        setActiveConnections([])
        setAvailableConnections([])
        return
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        console.log("[v0] No connections from API")
        setActiveConnections([])
        setAvailableConnections([])
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

  const loadStrategies = async () => {
    try {
      const response = await fetch("/api/strategies/overview")
      if (response.ok) {
        const data = await response.json()
        setStrategies(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load strategies:", error)
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
    loadStrategies()
  }

  const getConnectionStatus = (connection: ExchangeConnection): "connected" | "connecting" | "error" | "disabled" => {
    if (!connection.is_enabled) return "disabled"
    if (connection.last_test_status === "failed") return "error"
    if (connection.is_enabled && !connection.is_live_trade) return "connecting"
    return "connected"
  }

  const getConnectionProgress = (connection: ExchangeConnection): number => {
    // In a real implementation, this would query the trade engine coordinator
    // For now, return based on connection state
    if (!connection.is_enabled) return 0
    if (connection.is_live_trade) return 100
    // Simulate loading progress based on time since enabled
    return 45 // This would come from real trade engine status
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-lg font-semibold">Dashboard</h1>
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
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <SystemOverview stats={systemStats} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StrategiesOverview strategies={strategies} />
            </div>
            <div>
              <GlobalTradeEngineControls />
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Manage your exchange connections</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {activeConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No active connections. Add a connection to get started.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeConnections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      status={getConnectionStatus(connection)}
                      progress={getConnectionProgress(connection)}
                      onToggleEnable={handleToggleEnable}
                      onToggleLiveTrade={handleToggleLiveTrade}
                      onDelete={handleRemoveFromActive}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Connection to Active</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {availableConnections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.exchange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleAddAsActive} disabled={!selectedToAdd}>
                Add to Active
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
