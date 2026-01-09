"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import { Activity, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Info, RefreshCw, Settings } from "lucide-react"
import type { ExchangeConnection } from "@/lib/types"
import { PrehistoricDataLoader } from "./prehistoric-data-loader"

interface ActiveConnectionsProps {
  onConnectionsChange?: () => void
}

export function ActiveConnections({ onConnectionsChange }: ActiveConnectionsProps) {
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set())
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadConnections()
    const interval = setInterval(loadConnections, 5000) // Refresh every 5 seconds to show real-time data
    return () => clearInterval(interval)
  }, [])

  const loadConnections = async () => {
    try {
      const response = await fetch("/api/active-connections")
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load active connections:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleConnection = (id: string) => {
    setExpandedConnections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleLiveTrade = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/settings/connections/${id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live_trade: enabled }),
      })

      if (!response.ok) throw new Error("Failed to toggle live trade")

      toast.success(enabled ? "Live trading enabled" : "Live trading disabled")
      await loadConnections()
      onConnectionsChange?.()
    } catch (error) {
      console.error("[v0] Failed to toggle live trade:", error)
      toast.error("Failed to toggle live trade")
    }
  }

  const handleTogglePresetTrade = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/settings/connections/${id}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_preset_trade: enabled }),
      })

      if (!response.ok) throw new Error("Failed to toggle preset trade")

      toast.success(enabled ? "Preset trading enabled" : "Preset trading disabled")
      await loadConnections()
      onConnectionsChange?.()
    } catch (error) {
      console.error("[v0] Failed to toggle preset trade:", error)
      toast.error("Failed to toggle preset trade")
    }
  }

  const handleVolumeFactorChange = async (id: string, factor: number) => {
    try {
      const response = await fetch("/api/active-connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: id,
          settings: { volumeFactor: factor },
        }),
      })

      if (!response.ok) throw new Error("Failed to update volume factor")

      await loadConnections()
    } catch (error) {
      console.error("[v0] Failed to update volume factor:", error)
      toast.error("Failed to update volume factor")
    }
  }

  const handleTestConnection = async (id: string, exchange: string) => {
    setTestingConnections((prev) => new Set(prev).add(id))

    try {
      const response = await fetch(`/api/settings/connections/${id}/test`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.details || errorData.error || "Connection test failed")
      }

      const data = await response.json()

      if (data.success || data.balance !== undefined) {
        toast.success(`Connection successful! Balance: $${data.balance.toFixed(2)}`)
        await loadConnections()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      console.error("[v0] Connection test error:", error)
      const errorMessage = error instanceof Error ? error.message : "Connection test failed"
      toast.error(errorMessage)
    } finally {
      setTestingConnections((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const getStatusIcon = (connection: ExchangeConnection) => {
    if (!connection.is_enabled) {
      return <div className="h-3 w-3 rounded-full bg-gray-300" />
    }

    if (connection.last_test_status === "success") {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    if (connection.last_test_status === "failed") {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }

    return <Activity className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (connection: ExchangeConnection) => {
    if (!connection.is_enabled) {
      return (
        <Badge variant="outline" className="text-xs">
          Disabled
        </Badge>
      )
    }

    if (connection.is_live_trade) {
      return <Badge className="text-xs bg-green-500">Live Trading</Badge>
    }

    if (connection.is_preset_trade) {
      return <Badge className="text-xs bg-blue-500">Preset Trading</Badge>
    }

    return (
      <Badge variant="outline" className="text-xs">
        Enabled (No Trading)
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>Loading active trading connections...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>No active connections found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Enable connections in Settings → Connections to start trading</p>
            <p className="text-sm mt-2">
              Active connections are enabled base connections ready for live or preset trading
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Connections</CardTitle>
        <CardDescription>
          {connections.length} active trading connection(s) - Trade settings and controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.map((connection) => (
          <Collapsible
            key={connection.id}
            open={expandedConnections.has(connection.id)}
            onOpenChange={() => toggleConnection(connection.id)}
          >
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {expandedConnections.has(connection.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    {getStatusIcon(connection)}
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {connection.name} ({connection.exchange})
                      </CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {connection.api_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">{getStatusBadge(connection)}</div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Trade Settings - Volume Factor and Trade Types */}
                  <div className="border rounded-md p-4 bg-muted/30 space-y-4">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Trade Settings
                    </Label>

                    {/* Live Trade Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`live-trade-${connection.id}`} className="text-sm">
                        Live Trading
                      </Label>
                      <Switch
                        id={`live-trade-${connection.id}`}
                        checked={connection.is_live_trade || false}
                        onCheckedChange={(checked) => handleToggleLiveTrade(connection.id, checked)}
                      />
                    </div>

                    {/* Preset Trade Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`preset-trade-${connection.id}`} className="text-sm">
                        Preset Trading
                      </Label>
                      <Switch
                        id={`preset-trade-${connection.id}`}
                        checked={connection.is_preset_trade || false}
                        onCheckedChange={(checked) => handleTogglePresetTrade(connection.id, checked)}
                      />
                    </div>

                    {/* Volume Factor Slider */}
                    <div className="space-y-2">
                      <Label className="text-sm">Volume Factor: {(connection.volume_factor || 1.0).toFixed(2)}x</Label>
                      <Slider
                        value={[connection.volume_factor || 1.0]}
                        onValueChange={([value]) => handleVolumeFactorChange(connection.id, value)}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        Adjust trading volume multiplier (0.1x to 5.0x)
                      </div>
                    </div>
                  </div>

                  {/* Connection Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Test</Label>
                      <div className="font-medium">
                        {connection.last_test_timestamp
                          ? new Date(connection.last_test_timestamp).toLocaleString()
                          : "Never tested"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Balance (USDT)</Label>
                      <div className="font-medium">
                        {connection.last_test_balance ? `$${connection.last_test_balance.toFixed(2)}` : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Prehistoric Data Loader */}
                  <PrehistoricDataLoader
                    connectionId={connection.id}
                    symbol="BTCUSDT"
                    onComplete={() => {
                      toast.success("Historical data loaded successfully")
                      loadConnections()
                    }}
                  />

                  {/* Connection Logs */}
                  {connection.last_test_log && connection.last_test_log.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Connection Log
                      </Label>
                      <div className="bg-muted rounded-md p-3 max-h-40 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {Array.isArray(connection.last_test_log)
                            ? connection.last_test_log.join("\n")
                            : connection.last_test_log}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
