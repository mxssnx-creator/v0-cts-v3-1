"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function MainSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    prehistoricDataSizeQuote: 1000,
    prehistoricDataSizeBase: 100,
    tradeInterval: "15m",
    timeFrameLowerBound: "1m",
    timeFrameUpperBound: "1w",
    symbols: [] as string[],
    symbolInput: "",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/overall")
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
      const response = await fetch("/api/settings/overall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Main configuration has been saved successfully.",
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

  const handleAddSymbol = () => {
    if (settings.symbolInput && !settings.symbols.includes(settings.symbolInput)) {
      setSettings((prev) => ({
        ...prev,
        symbols: [...prev.symbols, prev.symbolInput],
        symbolInput: "",
      }))
    }
  }

  const handleRemoveSymbol = (symbol: string) => {
    setSettings((prev) => ({
      ...prev,
      symbols: prev.symbols.filter((s) => s !== symbol),
    }))
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
                <h1 className="text-lg font-semibold">Main Configuration</h1>
                <p className="text-xs text-muted-foreground">Core trading parameters and symbol selection</p>
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
              <CardTitle>Data & Timeframe Configuration</CardTitle>
              <CardDescription>Configure historical data size and timeframes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prehistoricDataSizeQuote">Prehistoric Data Size (Quote)</Label>
                  <Input
                    id="prehistoricDataSizeQuote"
                    type="number"
                    value={settings.prehistoricDataSizeQuote}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, prehistoricDataSizeQuote: Number(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of candles for quote currency historical data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prehistoricDataSizeBase">Prehistoric Data Size (Base)</Label>
                  <Input
                    id="prehistoricDataSizeBase"
                    type="number"
                    value={settings.prehistoricDataSizeBase}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, prehistoricDataSizeBase: Number(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of candles for base currency historical data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeInterval">Trade Interval</Label>
                  <Select
                    value={settings.tradeInterval}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, tradeInterval: value }))}
                  >
                    <SelectTrigger id="tradeInterval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="30m">30 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Primary trading interval for strategy execution</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFrameLowerBound">Timeframe Lower Bound</Label>
                  <Select
                    value={settings.timeFrameLowerBound}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, timeFrameLowerBound: value }))}
                  >
                    <SelectTrigger id="timeFrameLowerBound">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="30m">30 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFrameUpperBound">Timeframe Upper Bound</Label>
                  <Select
                    value={settings.timeFrameUpperBound}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, timeFrameUpperBound: value }))}
                  >
                    <SelectTrigger id="timeFrameUpperBound">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Symbol Configuration</CardTitle>
              <CardDescription>Manage trading symbols for your strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., BTC/USDT"
                  value={settings.symbolInput}
                  onChange={(e) => setSettings((prev) => ({ ...prev, symbolInput: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSymbol()
                    }
                  }}
                />
                <Button onClick={handleAddSymbol} type="button">
                  Add
                </Button>
              </div>
              {settings.symbols.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.symbols.map((symbol) => (
                    <div
                      key={symbol}
                      className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1 text-sm"
                    >
                      <span>{symbol}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSymbol(symbol)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No symbols configured. Add symbols above.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
