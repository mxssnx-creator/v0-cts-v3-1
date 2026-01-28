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
import { Loader2, AlertCircle, Lock, ExternalLink, Check } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import type { Connection } from "@/lib/file-storage"
import { CONNECTION_PREDEFINITIONS, type ConnectionPredefinition } from "@/lib/connection-predefinitions"

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionAdded: () => Promise<void>
}

export function AddConnectionDialog({ open, onOpenChange, onConnectionAdded }: AddConnectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ConnectionPredefinition | null>(null)
  const [existingConnections, setExistingConnections] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  
  const [formData, setFormData] = useState({
    name: "",
    exchange: "bybit",
    api_type: "perpetual_futures",
    connection_method: "library",
    connection_library: "library",
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
    }
  }, [open])

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
      connection_method: "library",
      connection_library: "library",
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
    const exchange = template.id.split("-")[0]
    
    setFormData({
      name: template.displayName,
      exchange: exchange,
      api_type: template.apiType,
      connection_method: template.connectionMethod,
      connection_library: template.connectionMethod,
      api_key: template.apiKey || "",
      api_secret: template.apiSecret || "",
      api_passphrase: "",
      margin_type: template.marginType,
      position_mode: template.positionMode,
      is_testnet: template.testnetSupported ? false : false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Validation Error", { description: "Connection name is required" })
      return
    }

    if (!formData.api_key.trim() || !formData.api_secret.trim()) {
      toast.error("Validation Error", { description: "API key and secret are required" })
      return
    }

    const connectionId = `${formData.exchange}-${formData.name}`
    if (existingConnections.includes(connectionId)) {
      toast.error("Duplicate Connection", { description: `A connection named "${formData.name}" already exists for ${formData.exchange}` })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/settings/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to add connection")
      }

      toast.success("Connection added successfully")
      resetForm()
      await onConnectionAdded()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error adding connection:", error)
      toast.error("Failed to add connection", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>Configure a new exchange API connection. Select a predefined template or configure manually.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Modern 2-Line Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Select Exchange Template</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a predefined configuration to get started quickly</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {CONNECTION_PREDEFINITIONS.map((template) => {
                const isSelected = selectedTemplate?.id === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`
                      text-left p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        {/* Line 1: Exchange Name and Leverage Badge */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{template.displayName}</span>
                          <Badge className="bg-blue-600 text-white text-xs">{template.maxLeverage}x Leverage</Badge>
                          {isSelected && <Check className="h-4 w-4 text-blue-600 ml-auto" />}
                        </div>
                        
                        {/* Line 2: Details with Library and Types */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">{template.contractType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">•</span>
                            <span>Library: <span className="font-medium text-foreground uppercase">{template.connectionMethod}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">•</span>
                            <span>Type: <span className="font-medium text-foreground capitalize">{template.apiType}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Template Details Card */}
            {selectedTemplate && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{selectedTemplate.displayName}</CardTitle>
                      <CardDescription className="text-xs mt-1">{selectedTemplate.description}</CardDescription>
                    </div>
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 whitespace-nowrap"
                    >
                      <span className="text-xs font-medium">Docs</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Contract Type</p>
                      <p className="text-sm font-semibold">{selectedTemplate.contractType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Position Mode</p>
                      <p className="text-sm font-semibold capitalize">{selectedTemplate.positionMode}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Margin Type</p>
                      <p className="text-sm font-semibold capitalize">{selectedTemplate.marginType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Connection Method</p>
                      <p className="text-sm font-semibold uppercase">{selectedTemplate.connectionMethod}</p>
                    </div>
                  </div>

                  {/* Default Settings Section */}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">Default Settings</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Live Volume: {selectedTemplate.defaultSettings.profitFactorMinBase}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Preset Volume: {selectedTemplate.defaultSettings.profitFactorMinMain}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {selectedTemplate.defaultSettings.trailingWithTrailing ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <span className="h-3 w-3" />
                        )}
                        <span>Trailing Enabled</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {selectedTemplate.defaultSettings.blockEnabled ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <span className="h-3 w-3" />
                        )}
                        <span>Block Enabled</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Configuration Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic Info</TabsTrigger>
              <TabsTrigger value="api" className="text-xs sm:text-sm">API Credentials</TabsTrigger>
              <TabsTrigger value="trading" className="text-xs sm:text-sm">Trading Settings</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Trading Account"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">A unique identifier for this connection</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-medium text-sm">Testnet Mode</Label>
                  <p className="text-xs text-muted-foreground mt-1">Use exchange testnet for testing trades</p>
                </div>
                <Switch
                  checked={formData.is_testnet}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_testnet: checked })}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            {/* API Credentials Tab */}
            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 flex gap-2">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Security Notice</p>
                  <p className="text-xs">Your credentials are encrypted and never exposed. API keys are only used for authorized requests to the exchange.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="font-medium">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    disabled={loading}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-secret" className="font-medium">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    placeholder="Enter your API secret"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    disabled={loading}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="api-passphrase" className="font-medium">API Passphrase (Optional)</Label>
                  <Input
                    id="api-passphrase"
                    type="password"
                    placeholder="Enter API passphrase if required"
                    value={formData.api_passphrase}
                    onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
                    disabled={loading}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">Required by some exchanges (e.g., OKX, Bybit)</p>
                </div>
              </div>
            </TabsContent>

            {/* Trading Settings Tab */}
            <TabsContent value="trading" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Connection Library Info</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>Built-in Library:</strong> Native, optimized connector for direct exchange API</li>
                    <li><strong>CCXT:</strong> Universal library supporting 100+ exchanges globally</li>
                    <li><strong>Native SDK:</strong> Official exchange SDK (fastest, most features)</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange" className="font-medium">Exchange</Label>
                  <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                    <SelectTrigger id="exchange" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bybit">Bybit</SelectItem>
                      <SelectItem value="bingx">BingX</SelectItem>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="okx">OKX</SelectItem>
                      <SelectItem value="gateio">Gate.io</SelectItem>
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
                      <SelectItem value="perpetual_futures">Perpetual Futures</SelectItem>
                      <SelectItem value="spot">Spot Trading</SelectItem>
                      <SelectItem value="unified">Unified Account</SelectItem>
                      <SelectItem value="margin">Margin Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="hedge">Hedge Mode (Both Long & Short)</SelectItem>
                      <SelectItem value="one-way">One-Way Mode (Long or Short)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection-method" className="font-medium">Connection Method</Label>
                  <Select value={formData.connection_method} onValueChange={(value) => setFormData({ ...formData, connection_method: value })}>
                    <SelectTrigger id="connection-method" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="library">Library (Default)</SelectItem>
                      <SelectItem value="rest">REST API</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection-library" className="font-medium">Connection Library</Label>
                  <Select value={formData.connection_library} onValueChange={(value) => setFormData({ ...formData, connection_library: value })}>
                    <SelectTrigger id="connection-library" disabled={loading} className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">
                        <div className="flex items-center gap-2">
                          <span>Native SDK</span>
                          <Badge variant="secondary" className="text-xs">Fast</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="ccxt">
                        <div className="flex items-center gap-2">
                          <span>CCXT Universal</span>
                          <Badge variant="secondary" className="text-xs">100+ Exchanges</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="library">
                        <div className="flex items-center gap-2">
                          <span>Built-in Library</span>
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.connection_library === "ccxt" && "CCXT supports 100+ cryptocurrency exchanges with a unified interface"}
                    {formData.connection_library === "native" && "Uses the official exchange SDK for best performance and features"}
                    {formData.connection_library === "library" && "Built-in optimized connector for direct API integration"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Connection...
                </>
              ) : (
                "Add Connection"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
