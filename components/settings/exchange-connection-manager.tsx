"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Loader2,
  TestTube,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import { getExchangeConfig } from "@/lib/config"
import { ExchangeConnectionDialog } from "./exchange-connection-dialog"
import { ConnectionInfoDialog } from "./connection-info-dialog"
import { ConnectionLogDialog } from "./connection-log-dialog"

interface BaseConnection {
  id: string
  name: string
  exchange: string
  exchange_id?: number
  api_type: string
  connection_method: string
  connection_library: string
  margin_type: string
  position_mode: string
  is_testnet: boolean
  is_enabled: boolean
  volume_factor?: number
  connection_settings?: string
  last_test_status?: string
  last_test_balance?: number
  last_test_log?: string[]
  created_at: string
  updated_at?: string
}

interface ConnectionSettings {
  baseVolumeFactor?: number
  baseVolumeFactorLive?: number
  baseVolumeFactorPreset?: number
  volumeRangePercentage?: number
  targetPositions?: number
}

interface ExchangeConnectionManagerProps {
  onConnectionsChange?: () => void
}

export { ExchangeConnectionManager }

export default function ExchangeConnectionManager({ onConnectionsChange }: ExchangeConnectionManagerProps = {}) {
  const [connections, setConnections] = useState<BaseConnection[]>([])
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [expandedVolumeFactors, setExpandedVolumeFactors] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedConnectionForEdit, setSelectedConnectionForEdit] = useState<BaseConnection | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoDialogConnection, setInfoDialogConnection] = useState<BaseConnection | null>(null)
  const [logDialogConnection, setLogDialogConnection] = useState<BaseConnection | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Loading base connections...")

      const response = await fetch("/api/settings/connections")

      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({ error: "Server error" }))
          throw new Error(errorData.details || errorData.error || "Server error loading connections")
        }
        console.warn("[v0] API returned non-OK status:", response.status)
        setConnections([])
        return
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error("[v0] Invalid data format:", typeof data)
        setConnections([])
        if (!isInitialLoad) {
          setError("Invalid data format received from server")
        }
        return
      }

      const userConnections = data.filter((c: any) => !c.is_predefined)

      console.log("[v0] Loaded", userConnections.length, "base connections")
      setConnections(userConnections)

      // Notify parent of changes
      if (onConnectionsChange) {
        onConnectionsChange()
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
      setConnections([])
      const errorMessage = error instanceof Error ? error.message : "Failed to load connections"
      setError(errorMessage)
      if (!isInitialLoad) {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return

    try {
      const response = await fetch(`/api/settings/connections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete" }))
        throw new Error(errorData.details || errorData.error || "Failed to delete connection")
      }

      toast.success("Connection deleted successfully")
      await loadConnections()
    } catch (error) {
      console.error("[v0] Failed to delete connection:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete connection")
    }
  }

  const testConnection = async (id: string) => {
    setTestingConnection(id)
    try {
      console.log("[v0] Testing connection:", id)

      const response = await fetch(`/api/settings/connections/${id}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.log) {
          setConnections((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    last_test_status: "failed",
                    last_test_log: data.log,
                  }
                : c,
            ),
          )
        }
        throw new Error(data.details || data.error || "Connection test failed")
      }

      setConnections((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                last_test_status: "success",
                last_test_balance: data.balance,
                last_test_log: data.log,
              }
            : c,
        ),
      )

      setExpandedLogs((prev) => ({ ...prev, [id]: true }))

      toast.success(`Connection successful! Balance: $${data.balance.toFixed(2)}`)
    } catch (error) {
      console.error("[v0] Connection test failed:", error)
      toast.error(error instanceof Error ? error.message : "Connection test failed")
      setExpandedLogs((prev) => ({ ...prev, [id]: true }))
    } finally {
      setTestingConnection(null)
    }
  }

  const toggleConnectionEnabled = async (id: string, enabled: boolean) => {
    try {
      console.log("[v0] Toggling connection:", id, "enabled:", enabled)

      const response = await fetch(`/api/settings/connections/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: enabled,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to toggle" }))
        throw new Error(errorData.details || errorData.error || "Failed to toggle connection")
      }

      setConnections((prev) => prev.map((conn) => (conn.id === id ? { ...conn, is_enabled: enabled } : conn)))
      toast.success(`Connection ${enabled ? "enabled" : "disabled"}`)

      await loadConnections()
    } catch (error) {
      console.error("[v0] Failed to toggle connection:", error)
      toast.error(error instanceof Error ? error.message : "Failed to toggle connection")
      await loadConnections()
    }
  }

  const getExchangeStatus = (exchange: string) => {
    const config = getExchangeConfig(exchange)
    return config?.status || "active"
  }

  const openEditDialog = (connection: BaseConnection) => {
    setSelectedConnectionForEdit(connection)
    setEditDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exchange Connections</CardTitle>
          <CardDescription>Loading connections...</CardDescription>
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
          <CardDescription>Error loading connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">{error}</p>
            <Button onClick={loadConnections} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
              <CardTitle>Base Exchange Connections</CardTitle>
              <CardDescription>
                Configure API credentials and connection settings - Base configurations for API/Connection only
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No connections configured yet</p>
              <p className="text-sm mt-2">Click "Add Connection" to create your first exchange connection</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const exchangeConfig = getExchangeConfig(connection.exchange)
                const exchangeName = exchangeConfig?.displayName || connection.exchange || "Unknown"
                const exchangeStatus = getExchangeStatus(connection.exchange)
                const isExpanded = expandedLogs[connection.id]

                return (
                  <Card
                    key={connection.id}
                    className={`${connection.is_enabled ? "border-primary" : "border-muted"} transition-all`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Center: Connection Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base truncate">{connection.name}</h3>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {exchangeName}
                            </Badge>
                            {connection.is_testnet && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Testnet
                              </Badge>
                            )}
                            {exchangeStatus === "failing" && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Failing
                              </Badge>
                            )}
                            {connection.last_test_status === "success" && (
                              <Badge variant="default" className="text-xs bg-green-500 shrink-0">
                                ✓ Tested
                              </Badge>
                            )}
                            {connection.last_test_status === "failed" && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                ✗ Failed
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">API Type:</span> {connection.api_type || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Method:</span> {connection.connection_method || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Margin:</span>{" "}
                              <span className="capitalize">{connection.margin_type || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium">Position:</span>{" "}
                              <span className="capitalize">{connection.position_mode || "N/A"}</span>
                            </div>
                            {connection.last_test_balance !== undefined && connection.last_test_balance !== null && (
                              <div className="col-span-2">
                                <span className="font-medium">Balance:</span>{" "}
                                <span className="font-semibold text-foreground">
                                  ${connection.last_test_balance.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: API Settings + Enable/Disable + Delete */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(connection)}
                            className="h-9"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            API Settings
                          </Button>

                          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                            <Label htmlFor={`enable-${connection.id}`} className="text-xs font-medium cursor-pointer">
                              {connection.is_enabled ? "Enabled" : "Disabled"}
                            </Label>
                            <Switch
                              id={`enable-${connection.id}`}
                              checked={connection.is_enabled}
                              onCheckedChange={(checked) => toggleConnectionEnabled(connection.id, checked)}
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteConnection(connection.id)}
                            className="text-destructive hover:text-destructive h-9"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(connection.id)}
                          disabled={testingConnection === connection.id}
                          className="h-9"
                        >
                          {testingConnection === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          Test Connection
                        </Button>

                        {connection.last_test_log && connection.last_test_log.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedLogs((prev) => ({ ...prev, [connection.id]: !prev[connection.id] }))
                            }
                            className="h-9"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Log
                            {expandedLogs[connection.id] ? (
                              <ChevronUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => setLogDialogConnection(connection)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connection Log
                        </Button>
                      </div>

                      {/* Expandable Log Section */}
                      {expandedLogs[connection.id] && connection.last_test_log && (
                        <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto border border-border">
                          {connection.last_test_log.map((line, i) => (
                            <div key={i} className="whitespace-nowrap pb-1 last:pb-0">
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ExchangeConnectionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={loadConnections} />

      {selectedConnectionForEdit && (
        <ExchangeConnectionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          connection={selectedConnectionForEdit}
          onSuccess={loadConnections}
          existingConnections={connections}
        />
      )}

      {infoDialogConnection && (
        <ConnectionInfoDialog
          open={!!infoDialogConnection}
          onOpenChange={(open) => !open && setInfoDialogConnection(null)}
          connectionId={infoDialogConnection.id}
          connectionName={infoDialogConnection.name}
        />
      )}

      {logDialogConnection && (
        <ConnectionLogDialog
          open={!!logDialogConnection}
          onOpenChange={(open) => !open && setLogDialogConnection(null)}
          connectionId={logDialogConnection.id}
          connectionName={logDialogConnection.name}
        />
      )}
    </div>
  )
}
