"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function ExchangeSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    defaultExchange: "binance",
    sandboxMode: true,
    rateLimitEnabled: true,
    rateLimitPerMinute: 1200,
    orderBookDepth: 20,
    wsEnabled: true,
    wsReconnectDelay: 5000,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/exchange")
      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Exchange settings have been saved successfully.",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Exchange Settings</h1>
                <p className="text-xs text-muted-foreground">Configure exchange connection parameters</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Configuration</CardTitle>
              <CardDescription>Configure default exchange and connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultExchange">Default Exchange</Label>
                  <Select
                    value={settings.defaultExchange}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, defaultExchange: value }))}
                  >
                    <SelectTrigger id="defaultExchange">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="coinbase">Coinbase</SelectItem>
                      <SelectItem value="kraken">Kraken</SelectItem>
                      <SelectItem value="bybit">Bybit</SelectItem>
                      <SelectItem value="okx">OKX</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Primary exchange for trading operations</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sandbox Mode</Label>
                    <p className="text-xs text-muted-foreground">Use testnet/sandbox environment</p>
                  </div>
                  <Switch
                    checked={settings.sandboxMode}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, sandboxMode: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
              <CardDescription>Configure API rate limit settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting Enabled</Label>
                  <p className="text-xs text-muted-foreground">Enable automatic rate limit management</p>
                </div>
                <Switch
                  checked={settings.rateLimitEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, rateLimitEnabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimitPerMinute">Requests Per Minute</Label>
                <Input
                  id="rateLimitPerMinute"
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) => setSettings((prev) => ({ ...prev, rateLimitPerMinute: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Maximum API requests per minute</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Data</CardTitle>
              <CardDescription>Configure market data retrieval settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orderBookDepth">Order Book Depth</Label>
                <Select
                  value={String(settings.orderBookDepth)}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, orderBookDepth: Number(value) }))}
                >
                  <SelectTrigger id="orderBookDepth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Levels</SelectItem>
                    <SelectItem value="10">10 Levels</SelectItem>
                    <SelectItem value="20">20 Levels</SelectItem>
                    <SelectItem value="50">50 Levels</SelectItem>
                    <SelectItem value="100">100 Levels</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Number of order book levels to retrieve</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WebSocket Settings</CardTitle>
              <CardDescription>Configure real-time data streaming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WebSocket Enabled</Label>
                  <p className="text-xs text-muted-foreground">Enable real-time market data streaming</p>
                </div>
                <Switch
                  checked={settings.wsEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, wsEnabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wsReconnectDelay">Reconnect Delay (ms)</Label>
                <Input
                  id="wsReconnectDelay"
                  type="number"
                  value={settings.wsReconnectDelay}
                  onChange={(e) => setSettings((prev) => ({ ...prev, wsReconnectDelay: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Delay before reconnecting WebSocket</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
