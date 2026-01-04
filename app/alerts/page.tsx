"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react"
import { CreateAlertDialog } from "@/components/alerts/create-alert-dialog"
import { AlertHistoryTable } from "@/components/alerts/alert-history-table"
import { NotificationSettings } from "@/components/alerts/notification-settings"
import type { PriceAlert, PositionAlert, SystemAlert, AlertHistory } from "@/lib/types"

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("price")
  const [isLoading, setIsLoading] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [positionAlerts, setPositionAlerts] = useState<PositionAlert[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const [priceRes, positionRes, systemRes, historyRes] = await Promise.all([
          fetch("/api/alerts/price"),
          fetch("/api/alerts/position"),
          fetch("/api/alerts/system"),
          fetch("/api/alerts/history"),
        ])

        if (priceRes.ok) {
          const priceData = await priceRes.json()
          setPriceAlerts(priceData.alerts || [])
        }

        if (positionRes.ok) {
          const positionData = await positionRes.json()
          setPositionAlerts(positionData.alerts || [])
        }

        if (systemRes.ok) {
          const systemData = await systemRes.json()
          setSystemAlerts(systemData.alerts || [])
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setAlertHistory(historyData.history || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load alerts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlerts()
  }, [])

  const handleTogglePriceAlert = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/alerts/price/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (response.ok) {
        setPriceAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, is_enabled: enabled } : alert)))
      }
    } catch (error) {
      console.error("[v0] Failed to toggle price alert:", error)
    }
  }

  const handleDeletePriceAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/price/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPriceAlerts((prev) => prev.filter((alert) => alert.id !== id))
      }
    } catch (error) {
      console.error("[v0] Failed to delete price alert:", error)
    }
  }

  const handleTogglePositionAlert = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/alerts/position/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      })

      if (response.ok) {
        setPositionAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, is_enabled: enabled } : alert)))
      }
    } catch (error) {
      console.error("[v0] Failed to toggle position alert:", error)
    }
  }

  const handleDeletePositionAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/position/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPositionAlerts((prev) => prev.filter((alert) => alert.id !== id))
      }
    } catch (error) {
      console.error("[v0] Failed to delete position alert:", error)
    }
  }

  const handleResolveSystemAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/system/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_resolved: true }),
      })

      if (response.ok) {
        setSystemAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() } : alert,
          ),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to resolve system alert:", error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const activeAlertsCount =
    priceAlerts.filter((a) => a.is_enabled).length +
    positionAlerts.filter((a) => a.is_enabled).length +
    systemAlerts.filter((a) => !a.is_resolved).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading alerts...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Alert Management
            </h1>
            <p className="text-muted-foreground mt-1">Monitor price movements, positions, and system events</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Bell className="h-4 w-4 mr-2" />
              {activeAlertsCount} Active
            </Badge>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{priceAlerts.filter((a) => a.is_enabled).length}</div>
                  <div className="text-sm text-muted-foreground">Price Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{positionAlerts.filter((a) => a.is_enabled).length}</div>
                  <div className="text-sm text-muted-foreground">Position Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{systemAlerts.filter((a) => !a.is_resolved).length}</div>
                  <div className="text-sm text-muted-foreground">System Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{alertHistory.length}</div>
                  <div className="text-sm text-muted-foreground">Total Triggered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="price">Price Alerts</TabsTrigger>
            <TabsTrigger value="position">Position Alerts</TabsTrigger>
            <TabsTrigger value="system">System Alerts</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {priceAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No price alerts configured</p>
                    </div>
                  ) : (
                    priceAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                {alert.condition === "above" ? (
                                  <TrendingUp className="h-5 w-5 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                  <div className="font-semibold">{alert.symbol}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Alert when price goes {alert.condition} {formatPrice(alert.price)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 ml-auto">
                                <div>
                                  <div className="text-xs text-muted-foreground">Current Price</div>
                                  <div className="font-medium">{formatPrice(alert.current_price)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Distance</div>
                                  <div className="font-medium">
                                    {(((alert.price - alert.current_price) / alert.current_price) * 100).toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-6">
                              <Switch
                                checked={alert.is_enabled}
                                onCheckedChange={(checked) => handleTogglePriceAlert(alert.id, checked)}
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this price alert for {alert.symbol}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePriceAlert(alert.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Position Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {positionAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No position alerts configured</p>
                    </div>
                  ) : (
                    positionAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div>
                                <div className="font-semibold">{alert.symbol}</div>
                                <div className="text-sm text-muted-foreground">
                                  {alert.alert_type === "profit_target" && `Profit Target: ${alert.threshold}%`}
                                  {alert.alert_type === "stop_loss" && `Stop Loss: ${alert.threshold}%`}
                                  {alert.alert_type === "time_limit" && `Time Limit: ${alert.threshold}h`}
                                </div>
                              </div>

                              <div className="flex items-center gap-6 ml-auto">
                                <div>
                                  <div className="text-xs text-muted-foreground">Current</div>
                                  <div className="font-medium">
                                    {alert.alert_type === "time_limit"
                                      ? `${alert.current_value}h`
                                      : `${alert.current_value}%`}
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    alert.alert_type === "profit_target"
                                      ? "default"
                                      : alert.alert_type === "stop_loss"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {alert.alert_type.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-6">
                              <Switch
                                checked={alert.is_enabled}
                                onCheckedChange={(checked) => handleTogglePositionAlert(alert.id, checked)}
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this position alert?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePositionAlert(alert.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>No system alerts - all systems operational</p>
                    </div>
                  ) : (
                    systemAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`h-3 w-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                              <div>
                                <div className="font-semibold">
                                  {alert.exchange} - {alert.connection_id}
                                </div>
                                <div className="text-sm text-muted-foreground">{alert.message}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(alert.created_at).toLocaleString()}
                                </div>
                              </div>

                              <div className="ml-auto">
                                {alert.is_resolved ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">Active</Badge>
                                )}
                              </div>
                            </div>

                            {!alert.is_resolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveSystemAlert(alert.id)}
                                className="ml-6"
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <AlertHistoryTable history={alertHistory} />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationSettings />
          </TabsContent>
        </Tabs>

        <CreateAlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </div>
  )
}
