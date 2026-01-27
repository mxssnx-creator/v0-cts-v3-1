"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, Lock } from "lucide-react"
import { toast } from "@/lib/simple-toast"

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
  onAdd: (connection: any) => Promise<void>
}

export function AddConnectionDialog({ open, onOpenChange, onAdd }: AddConnectionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    exchange: "bybit",
    api_type: "perpetual_futures",
    connection_method: "library",
    connection_library: "native",
    api_key: "",
    api_secret: "",
    api_passphrase: "",
    margin_type: "cross",
    position_mode: "hedge",
    is_testnet: false,
  })

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
      await onAdd(formData)
      setFormData({
        name: "",
        exchange: "bybit",
        api_type: "perpetual_futures",
        connection_method: "library",
        connection_library: "native",
        api_key: "",
        api_secret: "",
        api_passphrase: "",
        margin_type: "cross",
        position_mode: "hedge",
        is_testnet: false,
      })
      onOpenChange(false)
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
            Configure a new exchange API connection. Only API credentials are needed now - trading settings can be configured later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Connection Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Bybit Account"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
                  <SelectTrigger id="exchange" disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXCHANGES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* API Credentials Section */}
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

          {/* Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="connection-method">Connection Method</Label>
                <Select value={formData.connection_method} onValueChange={(value) => setFormData({ ...formData, connection_method: value })}>
                  <SelectTrigger id="connection-method" disabled={loading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="library">Library (Default)</SelectItem>
                    <SelectItem value="rest">REST API</SelectItem>
                    <SelectItem value="websocket">WebSocket</SelectItem>
                    <SelectItem value="typescript">TypeScript SDK</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  )
}
