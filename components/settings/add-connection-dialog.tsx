"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Lock, ExternalLink } from "lucide-react"
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
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)
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
      setShowTemplateSelector(true)
      setSelectedTemplate(null)
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
        
        // Default to first enabled exchange
        if (enabled.length > 0 && !enabled.includes(formData.exchange)) {
          setFormData(prev => ({ ...prev, exchange: enabled[0] }))
        }
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
    
    setShowTemplateSelector(false)
  }

  const handleBackToTemplates = () => {
    setShowTemplateSelector(true)
    setSelectedTemplate(null)
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
          <DialogTitle>Add Exchange Connection</DialogTitle>
          <DialogDescription>
            {showTemplateSelector 
              ? "Select a predefined exchange template to quickly configure your connection"
              : "Fill in your API credentials to complete the setup"}
          </DialogDescription>
        </DialogHeader>

        {showTemplateSelector ? (
          // Template Selector View
          <div className="space-y-4">
            {filteredPredefinitions.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded bg-muted">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">No predefined templates available. Enable exchanges in settings first.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredPredefinitions.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{template.displayName}</CardTitle>
                          <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                        </div>
                        <Badge variant="default">{template.maxLeverage}x</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Contract</p>
                          <p className="font-medium">{template.contractType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Position</p>
                          <p className="font-medium capitalize">{template.positionMode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margin</p>
                          <p className="font-medium capitalize">{template.marginType}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedTemplate.displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
                    </div>
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span className="text-xs">Docs</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection Name */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Connection Details</h3>
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
            </div>

            {/* API Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">API Credentials</h3>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
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
                  <Label htmlFor="api-secret">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    placeholder="Enter your API secret"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="api-passphrase">API Passphrase (Optional)</Label>
                  <Input
                    id="api-passphrase"
                    type="password"
                    placeholder="Enter API passphrase if required by exchange"
                    value={formData.api_passphrase}
                    onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Security Note</p>
                  <p className="text-xs">Your credentials are encrypted and only used for API communication. Never share your API keys.</p>
                </div>
              </div>
            </div>

            {/* Testnet Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div>
                <Label className="font-medium text-sm">Testnet Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Use exchange testnet for testing</p>
              </div>
              <Switch
                checked={formData.is_testnet}
                onCheckedChange={(checked) => setFormData({ ...formData, is_testnet: checked })}
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToTemplates}
                disabled={loading}
              >
                Back to Templates
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
