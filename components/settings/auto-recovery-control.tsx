"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface ServiceState {
  name: string
  status: "running" | "stopped" | "error" | "recovering"
  lastHeartbeat: string
  errorCount: number
  restartCount: number
}

interface RecoveryAction {
  id: string
  type: string
  timestamp: string
  status: string
  error?: string
  retryCount: number
}

export function AutoRecoveryControl() {
  const [services, setServices] = useState<ServiceState[]>([])
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryAction[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/system/auto-recovery-status")
      const data = await response.json()
      setServices(data.services)
      setRecoveryHistory(data.history)
      setIsMonitoring(data.isMonitoring)
    } catch (error) {
      console.error("Failed to load recovery status:", error)
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 15000) // Update every 15s
    return () => clearInterval(interval)
  }, [])

  const toggleMonitoring = async () => {
    setLoading(true)
    try {
      await fetch("/api/system/auto-recovery-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isMonitoring ? "stop" : "start" }),
      })
      await loadStatus()
    } catch (error) {
      console.error("Failed to toggle monitoring:", error)
    } finally {
      setLoading(false)
    }
  }

  const restartService = async (serviceName: string) => {
    setLoading(true)
    try {
      await fetch("/api/system/auto-recovery-restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceName }),
      })
      await loadStatus()
    } catch (error) {
      console.error("Failed to restart service:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-600">Running</Badge>
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "recovering":
        return <Badge className="bg-yellow-600">Recovering</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "recovering":
        return <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Auto-Recovery System
              </CardTitle>
              <CardDescription>
                Automatic service monitoring and recovery with health checks every 30 seconds
              </CardDescription>
            </div>
            <Badge variant={isMonitoring ? "default" : "secondary"}>{isMonitoring ? "Active" : "Inactive"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={toggleMonitoring} disabled={loading}>
            {isMonitoring ? "Disable Auto-Recovery" : "Enable Auto-Recovery"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>Real-time status of critical system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Errors: {service.errorCount} | Restarts: {service.restartCount}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(service.status)}
                  <Button size="sm" variant="outline" onClick={() => restartService(service.name)} disabled={loading}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Restart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recovery History</CardTitle>
          <CardDescription>Recent automatic recovery actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recoveryHistory.slice(0, 10).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 border rounded text-sm">
                <div>
                  <div className="font-medium">{action.type.replace(/_/g, " ").toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(action.timestamp).toLocaleString()}</div>
                </div>
                <Badge variant={action.status === "success" ? "default" : "destructive"}>{action.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
