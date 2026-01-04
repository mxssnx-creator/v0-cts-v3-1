"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Activity } from "lucide-react"
import { toast } from "sonner"

interface SystemHealthCheck {
  id: string
  name: string
  category: string
  status: "healthy" | "warning" | "critical" | "unknown"
  message: string
  lastCheck: Date
  details: Record<string, any>
  actions: HealthAction[]
}

interface HealthAction {
  id: string
  label: string
  type: "fix" | "restart" | "reconnect" | "clear" | "view"
  endpoint?: string
  dangerous?: boolean
}

interface SystemHealthLog {
  timestamp: Date
  checkId: string
  status: string
  message: string
  details: Record<string, any>
}

export function SystemHealthPanel() {
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([])
  const [overallStatus, setOverallStatus] = useState<"healthy" | "warning" | "critical">("unknown")
  const [loading, setLoading] = useState(false)
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<Map<string, SystemHealthLog[]>>(new Map())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadHealthStatus()

    if (autoRefresh) {
      const interval = setInterval(loadHealthStatus, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadHealthStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health")
      const data = await response.json()

      if (data.success) {
        setHealthChecks(data.checks)
        setOverallStatus(data.status)
      }
    } catch (error) {
      console.error("Failed to load health status:", error)
      toast.error("Failed to load system health")
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (checkId: string) => {
    try {
      const response = await fetch(`/api/health/logs?checkId=${checkId}&limit=50`)
      const data = await response.json()

      if (data.success) {
        setLogs((prev) => new Map(prev).set(checkId, data.logs))
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    }
  }

  const executeAction = async (checkId: string, action: HealthAction) => {
    if (action.dangerous) {
      if (!confirm(`Are you sure you want to execute "${action.label}"? This action cannot be undone.`)) {
        return
      }
    }

    try {
      if (action.type === "view") {
        // Toggle logs view
        if (expandedChecks.has(checkId)) {
          loadLogs(checkId)
        }
        return
      }

      if (action.endpoint) {
        const response = await fetch("/api/health/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkId, actionId: action.id }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success(data.message || "Action completed")
          loadHealthStatus()
        } else {
          toast.error(data.message || "Action failed")
        }
      }
    } catch (error) {
      console.error("Failed to execute action:", error)
      toast.error("Failed to execute action")
    }
  }

  const toggleExpand = (checkId: string) => {
    const newExpanded = new Set(expandedChecks)
    if (newExpanded.has(checkId)) {
      newExpanded.delete(checkId)
    } else {
      newExpanded.add(checkId)
      if (!logs.has(checkId)) {
        loadLogs(checkId)
      }
    }
    setExpandedChecks(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      healthy: "default",
      warning: "secondary",
      critical: "destructive",
      unknown: "outline",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="ml-2">
        {status}
      </Badge>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      connection: "text-blue-600",
      engine: "text-purple-600",
      database: "text-green-600",
      api: "text-orange-600",
      integration: "text-cyan-600",
    }
    return colors[category] || "text-gray-600"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <div>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>Real-time monitoring of all critical systems</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadHealthStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Overall Status:</span>
          {getStatusBadge(overallStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {healthChecks.map((check) => (
          <Collapsible key={check.id} open={expandedChecks.has(check.id)} onOpenChange={() => toggleExpand(check.id)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{check.name}</span>
                        {getStatusBadge(check.status)}
                        <span className={`text-xs ${getCategoryColor(check.category)}`}>{check.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                    </div>
                  </div>
                  {expandedChecks.has(check.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t p-4 space-y-4">
                  {/* Details Section */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Details</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs overflow-auto">{JSON.stringify(check.details, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Actions Section */}
                  {check.actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {check.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant={action.dangerous ? "destructive" : "outline"}
                            onClick={() => executeAction(check.id, action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logs Section */}
                  {logs.has(check.id) && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Recent Logs (Last 50)</h4>
                      <div className="bg-muted p-3 rounded-md max-h-60 overflow-auto">
                        {logs.get(check.id)?.map((log, idx) => (
                          <div key={idx} className="text-xs mb-2 border-b border-border/50 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.status}
                              </Badge>
                            </div>
                            <p className="mt-1">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(check.lastCheck).toLocaleString()}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {healthChecks.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No health checks available</p>
            <Button variant="outline" size="sm" onClick={loadHealthStatus} className="mt-2 bg-transparent">
              Load Health Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
