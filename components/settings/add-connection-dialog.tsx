"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Lock, ExternalLink, Check, Eye, EyeOff, Zap } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import type { Connection } from "@/lib/file-storage"
import { 
  CONNECTION_PREDEFINITIONS, 
  type ConnectionPredefinition,
  EXCHANGE_API_TYPES,
  EXCHANGE_LIBRARY_PACKAGES
} from "@/lib/connection-predefinitions"

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionAdded: () => Promise<void>
}

const ALL_EXCHANGES = [
  { id: "bybit", name: "Bybit" },
  { id: "bingx", name: "BingX" },
  { id: "binance", name: "Binance" },
  { id: "okx", name: "OKX" },
  { id: "gateio", name: "Gate.io" },
  { id: "kucoin", name: "KuCoin" },
  { id: "mexc", name: "MEXC" },
  { id: "bitget", name: "Bitget" },
  { id: "pionex", name: "Pionex" },
  { id: "orangex", name: "OrangeX" },
  { id: "huobi", name: "Huobi" },
  { id: "kraken", name: "Kraken" },
  { id: "coinbase", name: "Coinbase" },
]

export function AddConnectionDialog({ open, onOpenChange, onConnectionAdded }: AddConnectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testLog, setTestLog] = useState<string[]>([])
  const [showTestLog, setShowTestLog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ConnectionPredefinition | null>(null)
  const [existingConnections, setExistingConnections] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [showSecrets, setShowSecrets] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    exchange: "bybit",
    api_type: "perpetual_futures",
    connection_method: "rest",
    connection_library: "native",
    api_key: "",
    api_secret: "",
    api_passphrase: "",
    margin_type: "cross",
    position_mode: "hedge",
    is_testnet: false,
  })

  useEffect(() => {
    if (open) {
      loadExistingConnections()
      setActiveTab("basic")
      resetForm()
      setTestLog([])
      setShowTestLog(false)
    }
  }, [open])

  useEffect(() => {
    // Update API type based on exchange
    const exchange = formData.exchange
    const apiTypes = EXCHANGE_API_TYPES[exchange] || []
    if (apiTypes.length > 0 && !apiTypes.includes(formData.api_type)) {
      setFormData({ ...formData, api_type: apiTypes[0] })
    }
  }, [formData.exchange])

  const loadExistingConnections = async () => {
    try {
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        const connections = Array.isArray(data) ? data : (data?.connections || [])
        const names = connections.map((c: Connection) => `${c.exchange}-${c.name}`)
        setExistingConnections(names)
      }
    } catch (error) {
      console.error("[v0] Error loading existing connections:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      exchange: "bybit",
      api_type: "perpetual_futures",
      connection_method: "rest",
      connection_library: "native",
      api_key: "",
      api_secret: "",
      api_passphrase: "",
      margin_type: "cross",
      position_mode: "hedge",
      is_testnet: false,
    })
    setSelectedTemplate(null)
  }

  const handleSelectTemplate = (template: ConnectionPredefinition) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.displayName,
      exchange: template.exchange,
      api_type: template.apiType,
      connection_method: "rest",
      connection_library: "native",
      api_key: template.apiKey || "",
      api_secret: template.apiSecret || "",
      api_passphrase: "",
      margin_type: template.marginType,
      position_mode: template.positionMode,
      is_testnet: template.testnetSupported ? false : false,
    })
  }

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
          exchange: formData.exchange,
          api_type: formData.api_type,
          connection_method: formData.connection_method,
          connection_library: formData.connection_library,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          api_passphrase: formData.api_passphrase || "",
          is_testnet: formData.is_testnet,
        }),
      })

      const data = await response.json()
      setTestLog(data.log || ["Test completed"])

      if (response.ok) {
        toast.success("Connection test passed!")
      } else {
        toast.error(data.message || "Connection test failed")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Test connection error"
      setTestLog([`Error: ${errorMsg}`])
      toast.error(errorMsg)
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.api_key || !formData.api_secret) {
      toast.error("Please fill in all required fields")
      return
    }

    const connectionKey = `${formData.exchange}-${formData.name}`
    if (existingConnections.includes(connectionKey)) {
      toast.error("Connection with this name already exists for this exchange")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          exchange: formData.exchange,
          api_type: formData.api_type,
          connection_method: formData.connection_method,
          connection_library: formData.connection_library,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          api_passphrase: formData.api_passphrase || "",
          margin_type: formData.margin_type,
          position_mode: formData.position_mode,
          is_testnet: formData.is_testnet,
          is_enabled: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add connection")
      }

      toast.success("Connection added successfully")
      await onConnectionAdded()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add connection")
    } finally {
      setLoading(false)
    }
  }

  const selectedExchange = ALL_EXCHANGES.find((e) => e.id === formData.exchange)
  const availableApiTypes = EXCHANGE_API_TYPES[formData.exchange] || []
  const libraryPackage = EXCHANGE_LIBRARY_PACKAGES[formData.exchange] || "unknown"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Exchange Connection</DialogTitle>
          <DialogDescription>
            Configure and test a new exchange API connection. Select a template or enter custom details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <Card className="border border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Quick Setup - Select Predefined Template
              </CardTitle>
              <CardDescription>Optional: Choose a template to auto-fill settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate?.id || ""} onValueChange={(templateId) => {
                const template = CONNECTION_PREDEFINITIONS.find(t => t.id === templateId)
                if (template) handleSelectTemplate(template)
              }}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select a predefined template..." />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTION_PREDEFINITIONS.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.displayName}</span>
                        <Badge variant="secondary" className="text-xs">{template.maxLeverage}x</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tabs for Configuration */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="api">API Credentials</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">Connection Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Bybit Main Account"
                    disabled={loading}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier for this connection</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exchange" className="font-medium">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                    <SelectTrigger id="exchange" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_EXCHANGES.map((exchange) => (
                        <SelectItem key={exchange.id} value={exchange.id}>
                          {exchange.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-type" className="font-medium">API Type</Label>
                  <Select value={formData.api_type} onValueChange={(value) => setFormData({ ...formData, api_type: value })}>
                    <SelectTrigger id="api-type" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApiTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="capitalize">{type.replace(/_/g, " ")}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Available for {selectedExchange?.name}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection-method" className="font-medium">Connection Method</Label>
                  <Select value={formData.connection_method} onValueChange={(value) => setFormData({ ...formData, connection_method: value })}>
                    <SelectTrigger id="connection-method" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rest">REST API</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Library: <span className="font-mono font-semibold">{libraryPackage}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margin-type" className="font-medium">Margin Type</Label>
                  <Select value={formData.margin_type} onValueChange={(value) => setFormData({ ...formData, margin_type: value })}>
                    <SelectTrigger id="margin-type" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cross">Cross Margin</SelectItem>
                      <SelectItem value="isolated">Isolated Margin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position-mode" className="font-medium">Position Mode</Label>
                  <Select value={formData.position_mode} onValueChange={(value) => setFormData({ ...formData, position_mode: value })}>
                    <SelectTrigger id="position-mode" disabled={loading} className="bg-white">
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
                  <Label htmlFor="testnet" className="font-medium">Use Testnet</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.is_testnet ? "Testnet enabled - Paper trading mode" : "Live trading mode"}
                  </p>
                </div>
                <Switch
                  id="testnet"
                  checked={formData.is_testnet}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_testnet: checked })}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            {/* API Credentials Tab */}
            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-900 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Secure Your Credentials</p>
                  <p className="text-xs">Your API credentials are encrypted and never shared. Never paste credentials in untrusted environments.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
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
                  <Label htmlFor="api-secret" className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Secret
                  </Label>
                  <Input
                    id="api-secret"
                    type={showSecrets ? "text" : "password"}
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Enter your API Secret"
                    disabled={loading}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-passphrase" className="font-medium">API Passphrase (Optional)</Label>
                  <Input
                    id="api-passphrase"
                    type={showSecrets ? "text" : "password"}
                    value={formData.api_passphrase}
                    onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
                    placeholder="Leave blank if not required"
                    disabled={loading}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">Required only for some exchanges (e.g., OKX, Coinbase)</p>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="connection-library" className="font-medium">Connection Library</Label>
                <Select value={formData.connection_library} onValueChange={(value) => setFormData({ ...formData, connection_library: value })}>
                  <SelectTrigger id="connection-library" disabled={loading} className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Native SDK (Recommended)</SelectItem>
                    <SelectItem value="ccxt">CCXT Universal Library</SelectItem>
                    <SelectItem value="library">Built-in Library</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.connection_library === "native" && "Official exchange SDK - Best performance and feature support"}
                  {formData.connection_library === "ccxt" && "Universal library supporting 100+ exchanges"}
                  {formData.connection_library === "library" && "Built-in optimized connector"}
                </p>
              </div>

              {/* Test Connection Section */}
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Test Connection</CardTitle>
                  <CardDescription>Verify your credentials before saving</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!showTestLog && (
                    <Button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing || !formData.api_key || !formData.api_secret || loading}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
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
                      <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs space-y-1 max-h-48 overflow-y-auto border border-slate-700">
                        {testLog.map((log, idx) => (
                          <div key={idx} className="text-slate-300">
                            {log}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || loading}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {testing ? "Testing..." : "Test Again"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || testing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || testing}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Add Connection
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
