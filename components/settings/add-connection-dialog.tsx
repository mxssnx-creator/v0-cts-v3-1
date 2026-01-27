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
import { Loader2, AlertCircle, Lock, ExternalLink, ChevronDown } from "lucide-react"
import { toast } from "@/lib/simple-toast"
import type { Connection } from "@/lib/file-storage"
import { CONNECTION_PREDEFINITIONS, type ConnectionPredefinition } from "@/lib/connection-predefinitions"

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

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionAdded: () => Promise<void>
}

export function AddConnectionDialog({ open, onOpenChange, onConnectionAdded }: AddConnectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [enabledExchanges, setEnabledExchanges] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ConnectionPredefinition | null>(null)
  const [showForm, setShowForm] = useState(false)
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

  // Load enabled exchanges and filter predefinitions on mount and when dialog opens
  useEffect(() => {
    if (open) {
      loadEnabledExchanges()
      setShowForm(false)
      setSelectedTemplate(null)
      setActiveTab("basic")
    }
  }, [open])

  const loadEnabledExchanges = async () => {
    try {
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        const connections = Array.isArray(data) ? data : (data?.connections || [])
        const enabled = connections
          .filter((c: Connection) => c.is_enabled)
          .map((c: Connection) => c.exchange)
          .filter((e: string, i: number, a: string[]) => a.indexOf(e) === i)
        
        setEnabledExchanges(enabled.length > 0 ? enabled : ["bybit", "bingx"])
      }
    } catch (error) {
      console.error("[v0] Error loading enabled exchanges:", error)
      setEnabledExchanges(["bybit", "bingx"])
    }
  }

  // Get filtered predefinitions for enabled exchanges only
  const filteredPredefinitions = CONNECTION_PREDEFINITIONS.filter((pred) => {
    const exchange = pred.id.split("-")[0]
    return enabledExchanges.includes(exchange)
  })

  const handleSelectTemplate = (template: ConnectionPredefinition) => {
    setSelectedTemplate(template)
    const exchange = template.id.split("-")[0]
    
    // Populate form with template values
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

  const handleUseTemplate = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template")
      return
    }
    setShowForm(true)
  }

  const handleBackToTemplate = () => {
    setShowForm(false)
    setActiveTab("basic")
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>Configure a new exchange API connection</DialogDescription>
        </DialogHeader>

        {!showForm ? (
          // Template Selection View
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Quick Setup - Use Predefined Template</h3>
              
              <div className="space-y-2">
                <Label htmlFor="template-select">Select Predefined Connection</Label>
                <Select 
                  value={selectedTemplate?.id || ""} 
                  onValueChange={(id) => {
                    const template = filteredPredefinitions.find(t => t.id === id)
                    if (template) handleSelectTemplate(template)
                  }}
                >
                  <SelectTrigger id="template-select" className="h-12">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPredefinitions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                    ) : (
                      filteredPredefinitions.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.displayName}</span>
                            <Badge variant="secondary" className="text-xs">{template.maxLeverage}x</Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template Preview Card */}
            {selectedTemplate && (
              <Card className="border-2 border-blue-500 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{selectedTemplate.displayName}</CardTitle>
                      <CardDescription className="text-sm mt-1">{selectedTemplate.description}</CardDescription>
                    </div>
                    <Badge className="bg-blue-600">{selectedTemplate.maxLeverage}x Leverage</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Contract Type</p>
                      <p className="font-semibold text-sm">{selectedTemplate.contractType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Position Mode</p>
                      <p className="font-semibold text-sm capitalize">{selectedTemplate.positionMode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margin Type</p>
                      <p className="font-semibold text-sm capitalize">{selectedTemplate.marginType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Connection Method</p>
                      <p className="font-semibold text-sm uppercase">{selectedTemplate.connectionMethod}</p>
                    </div>
                  </div>

                  {/* Default Settings */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Default Settings</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Live Volume Factor: <span className="font-semibold">1</span></p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preset Volume Factor: <span className="font-semibold">1</span></p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trailing: <span className="font-semibold">Enabled</span></p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Block: <span className="font-semibold">Enabled</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 flex-1"
                    >
                      View Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      onClick={handleUseTemplate}
                      size="sm"
                      className="flex-1"
                      disabled={loading}
                    >
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Form View with Tabs
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="api">API Configuration</TabsTrigger>
                <TabsTrigger value="trading">Trading Settings</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Trading Account"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testnet">Testnet Mode</Label>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm">Use exchange testnet for testing</p>
                    <Switch
                      id="testnet"
                      checked={formData.is_testnet}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_testnet: checked })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* API Configuration Tab */}
              <TabsContent value="api" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Key
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-secret" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    API Secret
                  </Label>
                  <Input
                    id="api-secret"
                    type="password"
                    placeholder="Enter your API secret"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-passphrase">API Passphrase (Optional)</Label>
                  <Input
                    id="api-passphrase"
                    type="password"
                    placeholder="Enter API passphrase if required"
                    value={formData.api_passphrase}
                    onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 flex gap-2 mt-4">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Security</p>
                    <p className="text-xs">Credentials are encrypted and only used for API communication.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Trading Settings Tab */}
              <TabsContent value="trading" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-type">API Type</Label>
                    <Select value={formData.api_type} onValueChange={(value) => setFormData({ ...formData, api_type: value })}>
                      <SelectTrigger id="api-type" disabled={loading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXCHANGES[formData.exchange as keyof typeof EXCHANGES]?.apiTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connection-method">Connection Method</Label>
                    <Select value={formData.connection_method} onValueChange={(value) => setFormData({ ...formData, connection_method: value })}>
                      <SelectTrigger id="connection-method" disabled={loading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="library">Library</SelectItem>
                        <SelectItem value="rest">REST API</SelectItem>
                        <SelectItem value="websocket">WebSocket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="margin-type">Margin Type</Label>
                    <Select value={formData.margin_type} onValueChange={(value) => setFormData({ ...formData, margin_type: value })}>
                      <SelectTrigger id="margin-type" disabled={loading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cross">Cross Margin</SelectItem>
                        <SelectItem value="isolated">Isolated Margin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position-mode">Position Mode</Label>
                    <Select value={formData.position_mode} onValueChange={(value) => setFormData({ ...formData, position_mode: value })}>
                      <SelectTrigger id="position-mode" disabled={loading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hedge">Hedge Mode</SelectItem>
                        <SelectItem value="one-way">One-Way Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToTemplate}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Connection"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
