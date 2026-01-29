"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Trash2, Info, Settings, Eye, EyeOff } from 'lucide-react'
import { toast } from "@/lib/simple-toast"
import type { Connection } from "@/lib/file-storage"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Lock, Zap } from "lucide-react"

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

// Edit Connection Dialog Component
function EditConnectionDialog({ connection, onSave, exchangeName }: { connection: Connection; onSave: () => Promise<void>; exchangeName: string }) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testLog, setTestLog] = useState<string[]>([])
  const [showTestLog, setShowTestLog] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [formData, setFormData] = useState({
    api_type: connection.api_type || "perpetual_futures",
    api_subtype: connection.api_subtype || "perpetual",
    connection_method: connection.connection_method || "rest",
    connection_library: connection.connection_library || "native",
    api_key: connection.api_key || "",
    api_secret: connection.api_secret || "",
    api_passphrase: connection.api_passphrase || "",
    margin_type: connection.margin_type || "cross",
    position_mode: connection.position_mode || "hedge",
    is_testnet: connection.is_testnet || false,
  })

  const apiSubtypes: Record<string, string[]> = {
    spot: ["spot"],
    perpetual_futures: ["perpetual", "futures"],
    derivatives: ["derivatives"],
    margin: ["margin"],
  }

  const connectionMethods = ["rest", "websocket", "hybrid"]
  const connectionLibraries = ["native", "ccxt", "custom"]

  const handleTestConnection = async () => {
    if (!formData.api_key || !formData.api_secret) {
      toast.error("Please enter API Key and API Secret")
      return
    }

    setTesting(true)
    setTestLog([])
    setShowTestLog(true)

    try {
      const response = await fetch("/api/settings/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange: connection.exchange,
          api_type: formData.api_type,
          api_subtype: formData.api_subtype,
          connection_method: formData.connection_method,
          connection_library: formData.connection_library,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          api_passphrase: formData.api_passphrase || "",
          is_testnet: formData.is_testnet,
        }),
      })

      let logs = [`[${new Date().toLocaleTimeString()}] Starting connection test...\n`]
      
      logs.push(`Exchange: ${connection.exchange.toUpperCase()}\n`)
      logs.push(`API Type: ${formData.api_type} | Subtype: ${formData.api_subtype}\n`)
      logs.push(`Connection: ${formData.connection_method.toUpperCase()} | Library: ${formData.connection_library}\n`)
      logs.push(`Mode: ${formData.is_testnet ? "Testnet" : "Live"}\n`)
      logs.push(`---\n`)

      const data = await response.json()
      let responseLogs = data.log || []
      if (!Array.isArray(responseLogs)) responseLogs = [responseLogs.toString()]
      logs.push(...responseLogs)

      if (data.balance !== undefined) {
        const balanceUSD = parseFloat(data.balance).toFixed(2)
        logs.push(`\n✓ Account Balance: $${balanceUSD}`)
      }

      try {
        const priceResponse = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot")
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          const btcPrice = priceData.data?.amount || "N/A"
          logs.push(`✓ BTC Price: $${btcPrice}`)
        }
      } catch (e) {
        console.log("[v0] Could not fetch BTC price")
      }

      if (response.ok) {
        logs.push(`\n✓ Connection test PASSED - Ready to trade!`)
        toast.success("Connection test passed!")
      } else {
        logs.push(`\n✗ Connection test FAILED: ${data.error || "Unknown error"}`)
        toast.error(data.error || "Connection test failed")
      }
      
      setTestLog(logs)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Test connection error"
      setTestLog([`✗ Error: ${errorMsg}`])
      toast.error(errorMsg)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/settings/connections/${connection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_type: formData.api_type,
          api_subtype: formData.api_subtype,
          connection_method: formData.connection_method,
          connection_library: formData.connection_library,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          api_passphrase: formData.api_passphrase,
          margin_type: formData.margin_type,
          position_mode: formData.position_mode,
          is_testnet: formData.is_testnet,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")
      toast.success("Connection updated")
      await onSave()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="credentials" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="credentials">API Credentials</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="test">Test & Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="credentials" className="space-y-4 mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-900 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Update API Credentials</p>
            <p className="text-xs">Change your API keys here if needed</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            API Key
          </Label>
          <div className="relative">
            <Input
              type={showSecrets ? "text" : "password"}
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter your API Key"
              disabled={loading}
              className="pr-10 bg-white"
            />
            <button
              type="button"
              onClick={() => setShowSecrets(!showSecrets)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            API Secret
          </Label>
          <Input
            type={showSecrets ? "text" : "password"}
            value={formData.api_secret}
            onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
            placeholder="Enter your API Secret"
            disabled={loading}
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-medium">API Passphrase (Optional)</Label>
          <Input
            type={showSecrets ? "text" : "password"}
            value={formData.api_passphrase}
            onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
            placeholder="Leave blank if not required"
            disabled={loading}
            className="bg-white"
          />
        </div>
      </TabsContent>

      <TabsContent value="config" className="space-y-4 mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
          <Info className="h-4 w-4 shrink-0 text-blue-900 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Connection Configuration</p>
            <p className="text-xs">Configure API type, connection method, and library settings</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-medium">API Type</Label>
            <Select value={formData.api_type} onValueChange={(value) => setFormData({ ...formData, api_type: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="perpetual_futures">Perpetual/Futures</SelectItem>
                <SelectItem value="derivatives">Derivatives</SelectItem>
                <SelectItem value="margin">Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">API Subtype</Label>
            <Select value={formData.api_subtype} onValueChange={(value) => setFormData({ ...formData, api_subtype: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {apiSubtypes[formData.api_type]?.map((subtype) => (
                  <SelectItem key={subtype} value={subtype}>
                    {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                  </SelectItem>
                )) || <SelectItem value={formData.api_subtype}>{formData.api_subtype}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-medium">Connection Method</Label>
            <Select value={formData.connection_method} onValueChange={(value) => setFormData({ ...formData, connection_method: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connectionMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Connection Library</Label>
            <Select value={formData.connection_library} onValueChange={(value) => setFormData({ ...formData, connection_library: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connectionLibraries.map((lib) => (
                  <SelectItem key={lib} value={lib}>
                    {lib.charAt(0).toUpperCase() + lib.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-medium">Margin Type</Label>
            <Select value={formData.margin_type} onValueChange={(value) => setFormData({ ...formData, margin_type: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cross">Cross Margin</SelectItem>
                <SelectItem value="isolated">Isolated Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Position Mode</Label>
            <Select value={formData.position_mode} onValueChange={(value) => setFormData({ ...formData, position_mode: value })}>
              <SelectTrigger disabled={loading} className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hedge">Hedge Mode</SelectItem>
                <SelectItem value="one-way">One-way Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <Label className="font-medium">Use Testnet</Label>
            <p className="text-xs text-muted-foreground mt-1">{formData.is_testnet ? "Testnet" : "Live"}</p>
          </div>
          <Switch checked={formData.is_testnet} onCheckedChange={(checked) => setFormData({ ...formData, is_testnet: checked })} disabled={loading} />
        </div>
      </TabsContent>

      <TabsContent value="test" className="space-y-4 mt-4">
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <h4 className="font-semibold text-sm">Test Connection</h4>
          </div>

          {!showTestLog && (
            <Button onClick={handleTestConnection} disabled={testing || !formData.api_key || !formData.api_secret || loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          )}

          {showTestLog && testLog.length > 0 && (
            <div className="space-y-2">
              <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs space-y-1 max-h-64 overflow-y-auto border border-slate-700">
                {testLog.map((log, idx) => (
                  <div key={idx} className="text-slate-300 whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
              <Button type="button" onClick={handleTestConnection} disabled={testing || loading} variant="outline" size="sm" className="w-full">
                {testing ? "Testing..." : "Test Again"}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      <div className="flex gap-2 justify-end pt-4 mt-4 border-t">
        <Button variant="outline" disabled={loading} onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </Tabs>
  )
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

    // Optimistically remove from UI immediately
    setConnections((prev) => prev.filter((c) => c.id !== id))

    try {
      const response = await fetch(`/api/settings/connections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        // Reload on failure to restore the card
        console.error("[v0] Delete failed, reloading connections")
        await loadConnections()
        throw new Error("Failed to delete")
      }

      toast.success("Connection deleted")
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{conn.name}</CardTitle>
                          <Badge variant="outline">{exchangeName}</Badge>
                          {conn.is_testnet && <Badge variant="outline">Testnet</Badge>}
                          {conn.last_test_status === "success" && <Badge className="bg-green-500 text-white">✓ Tested</Badge>}
                          {conn.last_test_status === "failed" && <Badge variant="destructive">✗ Failed</Badge>}
                        </div>
                        <CardDescription className="flex flex-wrap gap-4 text-xs">
                          <span>API Type: <span className="font-medium">{conn.api_type}</span></span>
                          <span>Margin: <span className="font-medium capitalize">{conn.margin_type}</span></span>
                          <span>Position: <span className="font-medium capitalize">{conn.position_mode}</span></span>
                          <span>Library: <span className="font-mono text-xs font-semibold">{conn.connection_library}</span></span>
                        </CardDescription>
                      </div>
                      
                      {/* Right Side Action Buttons - Stacked Vertically */}
                      <div className="flex flex-col gap-2 items-stretch flex-shrink-0 min-w-24">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Edit Settings"
                              className="justify-center"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Connection - {conn.name}</DialogTitle>
                              <DialogDescription>{exchangeName} - {conn.api_type}</DialogDescription>
                            </DialogHeader>
                            <EditConnectionDialog connection={conn} onSave={loadConnections} exchangeName={exchangeName} />
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant={conn.is_enabled ? "default" : "outline"}
                          size="sm"
                          title={conn.is_enabled ? "Disable" : "Enable"}
                          onClick={() => toggleEnabled(conn.id, !conn.is_enabled)}
                          className="justify-center"
                        >
                          {conn.is_enabled ? "Enabled" : "Disabled"}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          title="Delete Connection"
                          className="justify-center"
                          onClick={() => deleteConnection(conn.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
