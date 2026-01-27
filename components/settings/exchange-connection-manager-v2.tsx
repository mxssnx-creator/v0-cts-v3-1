"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Trash2, Rocket, Info, ExternalLink, User, CheckCircle2 } from 'lucide-react'
import { toast } from "@/lib/simple-toast"
import { CONNECTION_PREDEFINITIONS } from "@/lib/connection-predefinitions"
import { USER_CONNECTIONS } from "@/lib/user-connections-config"
import type { ExchangeConnection } from "@/lib/types"
import { AddConnectionDialog } from "@/components/settings/add-connection-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

const EXCHANGES = {
  bybit: { name: "Bybit", apiTypes: ["unified", "perpetual_futures", "spot"] },
  bingx: { name: "BingX", apiTypes: ["perpetual_futures", "spot"] },
  pionex: { name: "Pionex", apiTypes: ["spot", "perpetual_futures"] },
  orangex: { name: "OrangeX", apiTypes: ["spot", "perpetual_futures"] },
  binance: { name: "Binance", apiTypes: ["perpetual_futures", "spot", "margin"] },
  okx: { name: "OKX", apiTypes: ["perpetual_futures", "spot", "margin"] },
  gateio: { name: "Gate.io", apiTypes: ["perpetual_futures", "spot", "margin"] },
  mexc: { name: "MEXC", apiTypes: ["perpetual_futures", "spot"] },
  bitget: { name: "Bitget", apiTypes: ["perpetual_futures", "spot"] },
  kucoin: { name: "KuCoin", apiTypes: ["perpetual_futures", "spot"] },
  huobi: { name: "Huobi", apiTypes: ["perpetual_futures", "spot"] },
}

export default function ExchangeConnectionManagerV2() {
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showPredefined, setShowPredefined] = useState(false)
  const [initializingPredefined, setInitializingPredefined] = useState(false)
  const [selectedPredefined, setSelectedPredefined] = useState<string>("")
  const [showUserConnections, setShowUserConnections] = useState(false)
  const [importingUser, setImportingUser] = useState(false)
  const [userConnectionsStatus, setUserConnectionsStatus] = useState<any[]>([])

  useEffect(() => {
    loadConnections()
    loadUserConnectionsStatus()
    
    // Auto-refresh every 10 seconds to show status updates
    const interval = setInterval(() => {
      loadConnections()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const loadUserConnectionsStatus = async () => {
    try {
      const response = await fetch("/api/settings/connections/import-user")
      if (response.ok) {
        const data = await response.json()
        setUserConnectionsStatus(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load user connections status:", error)
    }
  }

  const importUserConnections = async () => {
    setImportingUser(true)
    try {
      const response = await fetch("/api/settings/connections/import-user", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to import user connections")
      }

      const data = await response.json()
      toast.success(`${data.data.imported} connections imported, ${data.data.skipped} skipped`)
      await loadConnections()
      await loadUserConnectionsStatus()
    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import")
    } finally {
      setImportingUser(false)
    }
  }

  const loadConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        console.warn("Failed to load connections:", response.status)
        setConnections([])
        setError("Failed to load connections")
        return
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.warn("Invalid data format:", typeof data)
        setConnections([])
        setError("Invalid data format received")
        return
      }

      const validConnections = data
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
          volume_factor: typeof c.volume_factor === "number" ? c.volume_factor : 1,
          margin_type: c.margin_type || "cross",
          position_mode: c.position_mode || "hedge",
          api_type: c.api_type || "perpetual_futures",
          last_test_status: c.last_test_status || null,
          last_test_balance: typeof c.last_test_balance === "number" ? c.last_test_balance : undefined,
        }))

      const enabledCount = validConnections.filter((c: any) => c.is_enabled).length
      const activeCount = validConnections.filter((c: any) => c.is_enabled && c.is_active).length
      
      console.log(`[v0] Loaded ${validConnections.length} connections (${enabledCount} enabled, ${activeCount} active)`)
      if (enabledCount > 0) {
        console.log("[v0] Enabled connections:", validConnections.filter((c: any) => c.is_enabled).map((c: any) => c.name).join(", "))
      }
      
      setConnections(validConnections)
    } catch (error) {
      console.error("Load connections error:", error)
      setConnections([])
      setError(error instanceof Error ? error.message : "Failed to load connections")
    } finally {
      setLoading(false)
    }
  }

  const addConnection = async (connectionData: any) => {
    try {
      const response = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to add connection" }))
        throw new Error(error.error || "Failed to add connection")
      }

      toast.success("Connection added successfully")
      await loadConnections()
    } catch (error) {
      console.error("Add connection error:", error)
      throw error
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
      await loadConnections()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete connection")
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

      toast.success(`Connection successful! Balance: $${data.balance?.toFixed(2) || "0.00"}`)
      await loadConnections()
    } catch (error) {
      console.error("Test error:", error)
      toast.error(error instanceof Error ? error.message : "Test failed")
    } finally {
      setTestingId(null)
    }
  }

  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/settings/connections/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled, is_live_trade: false, is_preset_trade: false }),
      })

      if (!response.ok) throw new Error("Failed to toggle")

      toast.success(`Connection ${enabled ? "enabled" : "disabled"}`)
      await loadConnections()
    } catch (error) {
      console.error("Toggle error:", error)
      toast.error("Failed to toggle connection")
    }
  }

  const initializePredefinedConnections = async () => {
    setInitializingPredefined(true)
    try {
      const response = await fetch("/api/settings/connections/init-predefined", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to initialize predefined connections")
      }

      const data = await response.json()
      toast.success(`${data.count} predefined connections initialized`)
      await loadConnections()
      setShowPredefined(false)
    } catch (error) {
      console.error("Initialize error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to initialize")
    } finally {
      setInitializingPredefined(false)
    }
  }

  const addPredefinedConnection = async (predefinedId: string) => {
    try {
      const predefined = CONNECTION_PREDEFINITIONS.find((p) => p.id === predefinedId)
      if (!predefined) {
        toast.error("Predefined connection not found")
        return
      }

      const response = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: predefined.name,
          exchange: predefined.id.split("-")[0],
          api_type: predefined.apiType,
          connection_method: predefined.connectionMethod,
          connection_library: "native",
          api_key: predefined.apiKey || "",
          api_secret: predefined.apiSecret || "",
          margin_type: predefined.marginType,
          position_mode: predefined.positionMode,
          is_testnet: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to add connection" }))
        throw new Error(error.error || "Failed to add connection")
      }

      toast.success(`${predefined.displayName} added successfully`)
      setSelectedPredefined("")
      await loadConnections()
    } catch (error) {
      console.error("Add predefined error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add connection")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exchange Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exchange Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadConnections}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Connections</CardTitle>
              <CardDescription>Manage your exchange API connections</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showUserConnections} onOpenChange={setShowUserConnections}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <User className="h-4 w-4 mr-2" />
                    My Connections ({USER_CONNECTIONS.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Your Pre-Configured Connections</DialogTitle>
                    <DialogDescription>
                      Import your personal exchange connections with API credentials already configured.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={importUserConnections} disabled={importingUser} className="w-full">
                        {importingUser ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Import All {USER_CONNECTIONS.length} Connections
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {userConnectionsStatus.map((conn) => (
                        <Card key={conn.id} className={conn.imported ? "border-green-500/50" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">{conn.displayName}</CardTitle>
                                  {conn.imported && (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Imported
                                    </Badge>
                                  )}
                                  {conn.enabled && (
                                    <Badge variant="default" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="text-xs mt-1">
                                  {conn.exchange.toUpperCase()} • {conn.connectionType} • {conn.name}
                                </CardDescription>
                              </div>
                              {conn.maxLeverage && (
                                <Badge variant="outline" className="ml-2">
                                  {conn.maxLeverage}x
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">API Type</p>
                                <p className="font-medium capitalize">{conn.apiType.replace(/_/g, " ")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Exchange</p>
                                <p className="font-medium capitalize">{conn.exchange}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-medium">{conn.imported ? "Ready" : "Not Imported"}</p>
                              </div>
                            </div>

                            {conn.documentation && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {conn.documentation.official && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 bg-transparent"
                                    onClick={() => window.open(conn.documentation.official, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Official Docs
                                  </Button>
                                )}
                                {conn.documentation.npm && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 bg-transparent"
                                    onClick={() => window.open(conn.documentation.npm, "_blank")}
                                  >
                                    NPM
                                  </Button>
                                )}
                                {conn.documentation.pip && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 bg-transparent"
                                    onClick={() => window.open(conn.documentation.pip, "_blank")}
                                  >
                                    Python
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showPredefined} onOpenChange={setShowPredefined}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Rocket className="h-4 w-4 mr-2" />
                    Predefined
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Predefined Exchange Connections</DialogTitle>
                    <DialogDescription>
                      Quick setup with pre-configured exchange connections. Select from popular exchanges with
                      optimized settings.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={initializePredefinedConnections} disabled={initializingPredefined}>
                        {initializingPredefined ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Initialize All Predefined
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CONNECTION_PREDEFINITIONS.map((predefined) => (
                        <Card key={predefined.id} className="hover:border-primary transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{predefined.displayName}</CardTitle>
                                <CardDescription className="text-xs mt-1">{predefined.description}</CardDescription>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {predefined.maxLeverage}x
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">API Type</p>
                                <p className="font-medium capitalize">{predefined.apiType.replace(/_/g, " ")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Margin</p>
                                <p className="font-medium capitalize">{predefined.marginType}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Position Mode</p>
                                <p className="font-medium capitalize">{predefined.positionMode}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Contract</p>
                                <p className="font-medium">{predefined.contractType}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                              <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">
                                Default settings: PF {predefined.defaultSettings.profitFactorMinBase}, Trailing{" "}
                                {predefined.defaultSettings.trailingWithTrailing ? "On" : "Off"}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => addPredefinedConnection(predefined.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                              {predefined.documentationUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(predefined.documentationUrl, "_blank")}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddConnectionDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAdd={addConnection}
          />

          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No connections configured yet.</p>
              <p className="text-sm mt-2">Click "Add Connection" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => {
                const exchangeConfig = EXCHANGES[conn.exchange as keyof typeof EXCHANGES]
                const exchangeName = exchangeConfig?.name || conn.exchange || "Unknown"
                const apiType = conn.api_type || "N/A"
                const marginType = conn.margin_type || "cross"
                const positionMode = conn.position_mode || "hedge"

                return (
                  <Card key={conn.id} className={conn.is_enabled ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{conn.name}</CardTitle>
                            {conn.is_enabled && <Badge>Active</Badge>}
                            {conn.is_testnet && <Badge variant="outline">Testnet</Badge>}
                            {conn.last_test_status === "success" && <Badge className="bg-green-500">✓ Tested</Badge>}
                          </div>
                          <CardDescription>
                            {exchangeName} • {apiType}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={conn.is_enabled || false}
                            onCheckedChange={(checked: boolean) => toggleEnabled(conn.id, checked)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => deleteConnection(conn.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Margin</p>
                          <p className="font-medium capitalize">{marginType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Position Mode</p>
                          <p className="font-medium capitalize">{positionMode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Connection Method</p>
                          <p className="font-medium capitalize">{conn.connection_method || "rest"}</p>
                        </div>
                        {typeof conn.last_test_balance === "number" && (
                          <div>
                            <p className="text-muted-foreground">Balance</p>
                            <p className="font-medium">${conn.last_test_balance.toFixed(2)}</p>
                          </div>
                        )}
                      </div>

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
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
