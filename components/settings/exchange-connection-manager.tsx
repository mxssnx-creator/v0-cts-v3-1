"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Trash2, Info, Settings } from 'lucide-react'
import { toast } from "@/lib/simple-toast"
import type { Connection } from "@/lib/file-storage"
import { AddConnectionDialog } from "@/components/settings/add-connection-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

const EXCHANGES: Record<string, { name: string }> = {
  bybit: { name: "Bybit" },
  bingx: { name: "BingX" },
  pionex: { name: "Pionex" },
  orangex: { name: "OrangeX" },
  binance: { name: "Binance" },
  okx: { name: "OKX" },
  gateio: { name: "Gate.io" },
  mexc: { name: "MEXC" },
  bitget: { name: "Bitget" },
  kucoin: { name: "KuCoin" },
  huobi: { name: "Huobi" },
}

export default function ExchangeConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/settings/connections")
      if (!response.ok) throw new Error("Failed to load connections")

      const data = await response.json()

      // Handle both array and object response formats
      let connectionsArray = Array.isArray(data) ? data : (data?.connections || [])

      if (!Array.isArray(connectionsArray)) {
        console.warn("Invalid connections format:", typeof connectionsArray)
        setConnections([])
        return
      }

      // Validate and normalize connections
      const validConnections = connectionsArray
        .filter((c: any) => {
          if (!c || typeof c !== "object") return false
          if (typeof c.id !== "string" || !c.id) return false
          if (typeof c.name !== "string" || !c.name) return false
          if (typeof c.exchange !== "string" || !c.exchange) return false
          return true
        })
        .map((c: any) => ({
          ...c,
          is_enabled: Boolean(c.is_enabled),
          is_testnet: Boolean(c.is_testnet),
          is_live_trade: Boolean(c.is_live_trade),
          is_preset_trade: Boolean(c.is_preset_trade),
          is_active: Boolean(c.is_active),
          is_predefined: Boolean(c.is_predefined),
          volume_factor: typeof c.volume_factor === "number" ? c.volume_factor : 1,
          margin_type: c.margin_type || "cross",
          position_mode: c.position_mode || "hedge",
          api_type: c.api_type || "perpetual_futures",
          connection_method: c.connection_method || "rest",
          connection_library: c.connection_library || "library",
        } as Connection))

      setConnections(validConnections)
    } catch (err) {
      console.error("[v0] Error loading connections:", err)
      setError(err instanceof Error ? err.message : "Failed to load connections")
      setConnections([])
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (id: string) => {
    setTestingId(id)
    try {
      const response = await fetch(`/api/settings/connections/${id}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Test failed")
      }

      // Update connection with test results
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                last_test_status: data.success ? "success" : "failed",
                last_test_balance: data.balance,
                last_test_log: data.logs || [],
              }
            : c
        )
      )

      toast.success(`Connection test successful! Balance: $${data.balance?.toFixed(2) || "0.00"}`)
    } catch (error) {
      console.error("[v0] Test error:", error)
      toast.error(error instanceof Error ? error.message : "Test failed")
    } finally {
      setTestingId(null)
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm("Delete this connection?")) return

    try {
      const response = await fetch(`/api/settings/connections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast.success("Connection deleted")
      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast.error("Failed to delete connection")
    }
  }

  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/settings/connections/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (!response.ok) throw new Error("Failed to toggle")

      // Update local state immediately
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_enabled: enabled } : c))
      )

      toast.success(`Connection ${enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      console.error("[v0] Toggle error:", error)
      toast.error("Failed to toggle connection")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Base Exchange Connections</h3>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading connections...</span>
          </CardContent>
        </Card>
        <AddConnectionDialog open={showAddDialog} onOpenChange={setShowAddDialog} onConnectionAdded={loadConnections} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Base Exchange Connections</h3>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
            <Button variant="outline" onClick={loadConnections} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
        <AddConnectionDialog open={showAddDialog} onOpenChange={setShowAddDialog} onConnectionAdded={loadConnections} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Base Exchange Connections</h3>
            <p className="text-sm text-muted-foreground">
              Configure API credentials and connection settings - These are base configurations independent of active trading connections
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        {connections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No connections configured yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => {
              const exchangeConfig = EXCHANGES[conn.exchange as keyof typeof EXCHANGES]
              const exchangeName = exchangeConfig?.name || conn.exchange || "Unknown"

              return (
                <Card key={conn.id} className={conn.is_enabled ? "border-blue-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{conn.name}</CardTitle>
                          <Badge variant={exchangeName}>{exchangeName}</Badge>
                          <Badge variant={conn.is_enabled ? "default" : "secondary"}>
                            {conn.is_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          {conn.is_testnet && <Badge variant="outline">Testnet</Badge>}
                          {conn.last_test_status === "success" && <Badge className="bg-green-500">✓ Tested</Badge>}
                          {conn.last_test_status === "failed" && <Badge variant="destructive">✗ Failed</Badge>}
                        </div>
                        <CardDescription className="flex flex-wrap gap-4">
                          <span>API Type: <span className="font-medium">{conn.api_type}</span></span>
                          <span>Method: <span className="font-medium capitalize">{conn.connection_method || "rest"}</span></span>
                          <span>Margin: <span className="font-medium capitalize">{conn.margin_type}</span></span>
                          <span>Position: <span className="font-medium capitalize">{conn.position_mode}</span></span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteConnection(conn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Exchange</p>
                        <p className="font-medium">{exchangeName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-medium capitalize">{conn.connection_method || "rest"}</p>
                      </div>
                      {typeof conn.last_test_balance === "number" && (
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-medium">${conn.last_test_balance.toFixed(2)}</p>
                        </div>
                      )}
                      {conn.last_test_timestamp && (
                        <div>
                          <p className="text-muted-foreground">Last Test</p>
                          <p className="font-medium text-xs">
                            {new Date(conn.last_test_timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(conn.id)}
                          disabled={testingId === conn.id}
                        >
                          {testingId === conn.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            "Test Connection"
                          )}
                        </Button>
                        {conn.last_test_log && conn.last_test_log.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Info className="h-4 w-4 mr-2" />
                                Connection Log
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{conn.name} - Connection Test Log</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-auto max-h-96 border border-slate-700">
                                {conn.last_test_log.map((log, idx) => (
                                  <div key={idx} className="text-slate-300">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AddConnectionDialog open={showAddDialog} onOpenChange={setShowAddDialog} onConnectionAdded={loadConnections} />
    </div>
  )
}
