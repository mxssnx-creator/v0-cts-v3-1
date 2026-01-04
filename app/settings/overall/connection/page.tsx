"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Check, Loader2, Plus, Settings, TestTube, Trash2, Info, FileText } from "lucide-react"
import { toast } from "sonner"
import { ExchangeConnectionDialog } from "@/components/settings/exchange-connection-dialog"
import { ConnectionSettingsDialog } from "@/components/settings/connection-settings-dialog"
import { ConnectionInfoDialog } from "@/components/settings/connection-info-dialog"
import { ConnectionLogDialog } from "@/components/settings/connection-log-dialog"
import type { ExchangeConnection } from "@/lib/types"

export default function ConnectionSettingsPage() {
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [initializingPredefined, setInitializingPredefined] = useState(false)

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingConnection, setEditingConnection] = useState<ExchangeConnection | null>(null)
  const [settingsConnection, setSettingsConnection] = useState<ExchangeConnection | null>(null)
  const [infoConnection, setInfoConnection] = useState<ExchangeConnection | null>(null)
  const [logConnection, setLogConnection] = useState<ExchangeConnection | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      } else {
        toast.error("Failed to load connections")
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
      toast.error("Failed to load connections")
    } finally {
      setLoading(false)
    }
  }

  const handleInitializePredefined = async () => {
    try {
      setInitializingPredefined(true)
      const response = await fetch("/api/settings/connections/init-predefined", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Predefined connections initialized")
        await loadConnections()
      } else {
        toast.error(data.error || "Failed to initialize predefined connections")
      }
    } catch (error) {
      console.error("[v0] Failed to initialize predefined connections:", error)
      toast.error("Failed to initialize predefined connections")
    } finally {
      setInitializingPredefined(false)
    }
  }

  const handleTestConnection = async (connection: ExchangeConnection) => {
    try {
      setTesting(connection.id)
      const response = await fetch(`/api/settings/connections/${connection.id}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Connection successful! Balance: $${data.balance?.toFixed(2) || "0.00"}`)
        await loadConnections()
      } else {
        toast.error(data.error || "Connection test failed")
      }
    } catch (error) {
      console.error("[v0] Connection test failed:", error)
      toast.error("Connection test failed")
    } finally {
      setTesting(null)
    }
  }

  const handleToggleEnabled = async (connection: ExchangeConnection) => {
    try {
      const response = await fetch(`/api/settings/connections/${connection.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !connection.is_enabled }),
      })

      if (response.ok) {
        toast.success(`Connection ${!connection.is_enabled ? "enabled" : "disabled"}`)
        await loadConnections()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to toggle connection")
      }
    } catch (error) {
      console.error("[v0] Failed to toggle connection:", error)
      toast.error("Failed to toggle connection")
    }
  }

  const handleDeleteConnection = async (connection: ExchangeConnection) => {
    if (!confirm(`Are you sure you want to delete "${connection.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/connections/${connection.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Connection deleted successfully")
        await loadConnections()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete connection")
      }
    } catch (error) {
      console.error("[v0] Failed to delete connection:", error)
      toast.error("Failed to delete connection")
    }
  }

  const predefinedCount = connections.filter((c) => c.is_predefined).length
  const customCount = connections.filter((c) => !c.is_predefined).length
  const enabledCount = connections.filter((c) => c.is_enabled).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exchange Connections</h1>
        <p className="text-muted-foreground mt-2">
          Manage exchange API connections. Configure credentials, test connectivity, and manage connection settings.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Connections</CardDescription>
            <CardTitle className="text-3xl">{connections.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Predefined</CardDescription>
            <CardTitle className="text-3xl">{predefinedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custom</CardDescription>
            <CardTitle className="text-3xl">{customCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Enabled</CardDescription>
            <CardTitle className="text-3xl text-green-600">{enabledCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Initialize predefined connections or add custom connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleInitializePredefined} disabled={initializingPredefined}>
              {initializingPredefined ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Initialize All Predefined
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Connection
            </Button>
            <Button variant="outline" onClick={loadConnections}>
              Refresh List
            </Button>
          </div>
          <div className="p-3 bg-muted/50 rounded-md border text-sm">
            <p className="font-medium mb-1">About Connection Settings:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>This page manages API credentials and connection configuration only</li>
              <li>Trading settings (volume factors, strategies) are configured in Settings → Exchange</li>
              <li>Active connection selection for live trading is done in the Dashboard or Settings → Exchange</li>
              <li>Test connections before enabling to ensure proper API access</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Connections List */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Connections Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Initialize predefined connections or add a custom connection to get started
            </p>
            <Button onClick={handleInitializePredefined}>
              <Plus className="mr-2 h-4 w-4" />
              Initialize Predefined Connections
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connections.map((connection) => (
            <Card key={connection.id} className={connection.is_enabled ? "border-green-500/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      {connection.is_predefined && (
                        <Badge variant="secondary" className="text-xs">
                          Predefined
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {connection.exchange} • {connection.api_type}
                      {connection.is_testnet && " • Testnet"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.last_test_status === "success" && (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        Tested
                      </Badge>
                    )}
                    {connection.last_test_status === "error" && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                    <Switch checked={connection.is_enabled} onCheckedChange={() => handleToggleEnabled(connection)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connection Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Method</Label>
                    <p className="font-medium uppercase">{connection.connection_method}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Library</Label>
                    <p className="font-medium">{connection.connection_library || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Margin</Label>
                    <p className="font-medium capitalize">{connection.margin_type || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Position Mode</Label>
                    <p className="font-medium capitalize">{connection.position_mode || "N/A"}</p>
                  </div>
                </div>

                {connection.last_test_balance !== null && connection.last_test_balance !== undefined && (
                  <div className="p-2 bg-muted/50 rounded-md">
                    <Label className="text-xs text-muted-foreground">Last Test Balance</Label>
                    <p className="text-lg font-bold text-green-600">${connection.last_test_balance.toFixed(2)}</p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingConnection(connection)}>
                    <Settings className="mr-1 h-3 w-3" />
                    API Settings
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(connection)}
                    disabled={testing === connection.id || !connection.is_enabled}
                  >
                    {testing === connection.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube className="mr-1 h-3 w-3" />
                    )}
                    Test
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSettingsConnection(connection)}>
                    <Settings className="mr-1 h-3 w-3" />
                    Settings
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setInfoConnection(connection)}>
                    <Info className="mr-1 h-3 w-3" />
                    Info
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLogConnection(connection)}>
                    <FileText className="mr-1 h-3 w-3" />
                    Logs
                  </Button>
                  {!connection.is_predefined && (
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteConnection(connection)}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ExchangeConnectionDialog
        open={showAddDialog || !!editingConnection}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setEditingConnection(null)
          }
        }}
        connection={editingConnection}
        onSuccess={() => {
          loadConnections()
          setShowAddDialog(false)
          setEditingConnection(null)
        }}
      />

      {settingsConnection && (
        <ConnectionSettingsDialog
          open={true}
          onOpenChange={(open) => !open && setSettingsConnection(null)}
          connectionId={settingsConnection.id}
          connectionName={settingsConnection.name}
        />
      )}

      {infoConnection && (
        <ConnectionInfoDialog
          open={true}
          onOpenChange={(open) => !open && setInfoConnection(null)}
          connection={infoConnection}
        />
      )}

      {logConnection && (
        <ConnectionLogDialog
          open={true}
          onOpenChange={(open) => !open && setLogConnection(null)}
          connectionId={logConnection.id}
          connectionName={logConnection.name}
        />
      )}
    </div>
  )
}
