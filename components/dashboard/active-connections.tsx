"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import { Activity, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Info, RefreshCw } from "lucide-react"
import type { ExchangeConnection } from "@/lib/types"

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
    const interval = setInterval(loadConnections, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadConnections = async () => {
    try {
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        // Filter only enabled connections for "Active Connections"
        const activeConnections = data.filter((c: ExchangeConnection) => c.is_enabled)
        setConnections(activeConnections)
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
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

    return (
      <Badge variant="outline" className="text-xs">
        Enabled
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
          <CardDescription>Loading active exchange connections...</CardDescription>
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
            <p>Enable connections in Settings to start trading</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Connections</CardTitle>
        <CardDescription>{connections.length} active connection(s)</CardDescription>
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
                        <Badge variant="outline" className="text-xs">
                          {connection.connection_method}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(connection)}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`live-trade-${connection.id}`} className="text-sm">
                        Live Trade
                      </Label>
                      <Switch
                        id={`live-trade-${connection.id}`}
                        checked={connection.is_live_trade || false}
                        onCheckedChange={(checked) => handleToggleLiveTrade(connection.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Connection Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Test</Label>
                      <div className="font-medium">
                        {connection.last_test_at ? new Date(connection.last_test_at).toLocaleString() : "Never tested"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Balance (USDT)</Label>
                      <div className="font-medium">
                        {connection.last_test_balance ? `$${connection.last_test_balance.toFixed(2)}` : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(connection.id, connection.exchange)}
                      disabled={testingConnections.has(connection.id)}
                      className="flex-1"
                    >
                      {testingConnections.has(connection.id) ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>

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

                  {/* BTC Price Info (if available) */}
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground">
                      Capabilities: {connection.api_capabilities || "Not tested"}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
