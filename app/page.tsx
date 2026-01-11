"use client"

import { useState, useEffect, useCallback } from "react"
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
import { toast } from "sonner"
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
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, { status: string; progress: number; message: string }>
  >({})
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

  const loadConnections = useCallback(async () => {
    try {
      console.log("[v0] Loading connections...")
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Loaded connections:", data.length)

        // Filter for active connections (is_active = true means it shows in dashboard)
        const active = data.filter((c: ExchangeConnection) => c.is_active === true)

        // Available connections are those not in active list
        const available = data.filter((c: ExchangeConnection) => !c.is_active)

        setActiveConnections(active)
        setAvailableConnections(available)
        setHasRealConnections(active.some((c: ExchangeConnection) => c.api_key && c.api_key !== ""))

        // Set first connection as selected if none selected
        if (!selectedConnection && active.length > 0) {
          const enabledConn = active.find((c: ExchangeConnection) => c.is_enabled) || active[0]
          setSelectedConnection(enabledConn.id)
          localStorage.setItem("selectedExchange", enabledConn.id)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
    }
  }, [selectedConnection])

  const loadSystemStats = useCallback(async () => {
    try {
      const response = await fetch("/api/structure/metrics")
      if (response.ok) {
        const data = await response.json()
        setSystemStats({
          activeConnections: data.activeConnections || 0,
          totalPositions: data.totalPositions || 0,
          dailyPnL: data.dailyPnL || 0,
          totalBalance: data.totalBalance || 0,
          indicationsActive: data.indicationsActive || 0,
          indicationsTotal: data.indicationsTotal || 0,
          strategiesActive: data.strategiesActive || 0,
          systemLoad: data.systemLoad || 0,
          databaseSize: data.databaseSize || 0,
          activeSymbols: data.activeSymbols || 0,
          livePositions: data.livePositions || 0,
          pseudoPositions: data.pseudoPositions || 0,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to load system stats:", error)
    }
  }, [])

  const loadStrategies = useCallback(async () => {
    try {
      const response = await fetch("/api/strategies/overview")
      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load strategies:", error)
    }
  }, [])

  const updateConnectionStatuses = useCallback(async () => {
    if (activeConnections.length === 0) return

    try {
      const response = await fetch("/api/connections/status")
      if (response.ok) {
        const statuses = await response.json()
        const statusMap: Record<string, { status: string; progress: number; message: string }> = {}

        statuses.forEach((s: any) => {
          statusMap[s.id] = {
            status: s.status || "idle",
            progress: s.progress || 0,
            message: s.message || "",
          }
        })

        setConnectionStatuses(statusMap)
      }
    } catch (error) {
      console.error("[v0] Failed to update connection statuses:", error)
    }
  }, [activeConnections])

  useEffect(() => {
    const initialize = async () => {
      console.log("[v0] Dashboard initializing...")
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

    const interval = setInterval(() => {
      loadConnections()
      loadSystemStats()
      loadStrategies()
    }, 10000)

    return () => clearInterval(interval)
  }, [loadConnections, loadSystemStats, loadStrategies])

  useEffect(() => {
    if (activeConnections.length === 0) return

    updateConnectionStatuses()
    const interval = setInterval(updateConnectionStatuses, 3000)

    return () => clearInterval(interval)
  }, [activeConnections, updateConnectionStatuses])

  const handleToggleEnable = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/settings/connections/${connectionId}/toggle`, {
        method: "POST",
      })
      if (response.ok) {
        toast.success("Connection toggled successfully")
        await loadConnections()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to toggle connection")
      }
    } catch (error) {
      toast.error("Failed to toggle connection")
    }
  }

  const handleToggleLiveTrade = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/settings/connections/${connectionId}/live-trade`, {
        method: "POST",
      })
      if (response.ok) {
        toast.success("Live trade toggled successfully")
        await loadConnections()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to toggle live trade")
      }
    } catch (error) {
      toast.error("Failed to toggle live trade")
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/settings/connections/${connectionId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Connection removed")
        await loadConnections()
      } else {
        toast.error("Failed to remove connection")
      }
    } catch (error) {
      toast.error("Failed to remove connection")
    }
  }

  const handleExchangeChange = (value: string) => {
    setSelectedConnection(value)
    localStorage.setItem("selectedExchange", value)
  }

  const handleAddConnection = async () => {
    if (!selectedToAdd) return

    try {
      const connectionToAdd = availableConnections.find((c) => c.id === selectedToAdd)
      if (!connectionToAdd) return

      const response = await fetch(`/api/settings/connections/${selectedToAdd}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      })

      if (response.ok) {
        toast.success(`Added ${connectionToAdd.name} to active connections`)
        setShowAddDialog(false)
        setSelectedToAdd("")
        await loadConnections()
      } else {
        toast.error("Failed to add connection")
      }
    } catch (error) {
      toast.error("Failed to add connection")
    }
  }

  return (
    <AuthGuard>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedConnection} onValueChange={handleExchangeChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select Exchange" />
                </SelectTrigger>
                <SelectContent>
                  {activeConnections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${conn.is_enabled ? "bg-green-500" : "bg-gray-400"}`} />
                        {conn.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  loadConnections()
                  loadSystemStats()
                  loadStrategies()
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* System Overview and Strategies - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SystemOverview stats={systemStats} />
            <StrategiesOverview strategies={strategies} />
          </div>

          {/* Trade Engine Controls */}
          <GlobalTradeEngineControls />

          {/* Active Connections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Connections</CardTitle>
                  <CardDescription>Manage your exchange connections</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active connections. Add a connection to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeConnections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      status={
                        connectionStatuses[connection.id]?.status || (connection.is_enabled ? "connected" : "disabled")
                      }
                      progress={connectionStatuses[connection.id]?.progress || 0}
                      onToggleEnable={() => handleToggleEnable(connection.id)}
                      onToggleLiveTrade={() => handleToggleLiveTrade(connection.id)}
                      onDelete={() => handleDeleteConnection(connection.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Connection Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Connection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {availableConnections.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No available connections. Create new connections in Settings.
                  </p>
                ) : (
                  <>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddConnection} disabled={!selectedToAdd}>
                        Add Connection
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
