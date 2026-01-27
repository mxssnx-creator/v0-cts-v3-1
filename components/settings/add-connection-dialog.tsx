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
import { Loader2, AlertCircle, Lock, ExternalLink } from "lucide-react"
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
  const [showForm, setShowForm] = useState(false)
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
      setShowForm(false)
      setSelectedTemplate(null)
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
      is_testnet: false,
    })
    
    setShowForm(true)
  }

  const handleBackToTemplates = () => {
    setShowForm(false)
    setSelectedTemplate(null)
    resetForm()
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

  if (!showForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Connection</DialogTitle>
            <DialogDescription>Configure a new exchange API connection</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Quick Setup - Use Predefined Template</h3>
              <p className="text-xs text-muted-foreground mb-3">Select Predefined Connection</p>
              
              <Select onValueChange={(templateId) => {
                const template = CONNECTION_PREDEFINITIONS.find(t => t.id === templateId)
                if (template) handleSelectTemplate(template)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTION_PREDEFINITIONS.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.displayName}</span>
                        <Badge variant="secondary">{template.maxLeverage}x</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{selectedTemplate.displayName}</CardTitle>
                      <CardDescription className="text-xs mt-1">{selectedTemplate.description}</CardDescription>
                    </div>
                    <Badge className="bg-blue-600">{selectedTemplate.maxLeverage}x Leverage</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Contract Type</p>
                      <p className="font-medium text-sm">{selectedTemplate.contractType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Position Mode</p>
                      <p className="font-medium text-sm capitalize">{selectedTemplate.positionMode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Margin Type</p>
                      <p className="font-medium text-sm capitalize">{selectedTemplate.marginType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Connection Method</p>
                      <p className="font-medium text-sm uppercase">{selectedTemplate.connectionMethod}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3 space-y-2">
                    <p className="text-xs font-medium">Default Settings</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-muted-foreground">
                        <p>Live Volume Factor: <span className="font-semibold text-foreground">1</span></p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>Preset Volume Factor: <span className="font-semibold text-foreground">1</span></p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>Trailing: <span className="font-semibold text-foreground">Enabled</span></p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>Block: <span className="font-semibold text-foreground">Enabled</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <a
                      href={selectedTemplate.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                      View Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
          <DialogDescription>Configure a new exchange API connection</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="trading">Trading Settings</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Trading Account"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">A unique identifier for this connection</p>
              </div>

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
            </TabsContent>

            {/* API Configuration Tab */}
            <TabsContent value="api" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 flex gap-2">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Security Note</p>
                  <p className="text-xs">Your credentials are encrypted and only used for API communication. Never share your API keys.</p>
                </div>
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
            </TabsContent>

            {/* Trading Settings Tab */}
            <TabsContent value="trading" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-type">API Type</Label>
                  <Select value={formData.api_type} onValueChange={(value) => setFormData({ ...formData, api_type: value })}>
                    <SelectTrigger id="api-type" disabled={loading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perpetual_futures">Perpetual Futures</SelectItem>
                      <SelectItem value="spot">Spot</SelectItem>
                      <SelectItem value="unified">Unified</SelectItem>
                      <SelectItem value="margin">Margin</SelectItem>
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
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
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
