"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  PlayCircle,
  Trash2,
  RotateCcw,
  WrenchIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { SystemDiagnostic, DiagnosticAction } from "@/lib/system-diagnostics"

export function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostic[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDiagnostics()

    const interval = setInterval(loadDiagnostics, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDiagnostics = async () => {
    try {
      const response = await fetch("/api/diagnostics")
      if (!response.ok) return

      const data = await response.json()
      if (data.success) {
        setDiagnostics(data.diagnostics || [])
      }
    } catch (error) {
      console.error("Failed to load diagnostics:", error)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch("/api/diagnostics/logs?limit=50")
      if (!response.ok) return

      const data = await response.json()
      if (data.success) {
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    }
  }

  const executeAction = async (diagnosticId: string, actionId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticId, actionId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        await loadDiagnostics()
      } else {
        toast.error(data.message || "Action failed")
      }
    } catch (error) {
      console.error("Failed to execute action:", error)
      toast.error("Failed to execute action")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "warning":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "info":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "fix":
        return <WrenchIcon className="h-3 w-3" />
      case "dismiss":
        return <Trash2 className="h-3 w-3" />
      case "view":
        return <Eye className="h-3 w-3" />
      case "retry":
        return <RotateCcw className="h-3 w-3" />
      case "restart":
        return <PlayCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const unresolvedCount = diagnostics.filter((d) => !d.resolved).length
  const criticalCount = diagnostics.filter((d) => d.severity === "critical" && !d.resolved).length
  const warningCount = diagnostics.filter((d) => d.severity === "warning" && !d.resolved).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">System Diagnostics</CardTitle>
            <Badge variant="outline" className="text-xs">
              {unresolvedCount} Active
            </Badge>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                {warningCount} Warning
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLogs(!showLogs)
                if (!showLogs) loadLogs()
              }}
            >
              {showLogs ? "Hide" : "View"} Logs
            </Button>
            <Button variant="ghost" size="sm" onClick={loadDiagnostics}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {showLogs ? (
          <ScrollArea className="h-[300px] border-t">
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Diagnostic Action Logs</h4>
                <Button variant="ghost" size="sm" onClick={loadLogs}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No logs available</p>
              ) : (
                logs.map((log, index) => (
                  <pre key={index} className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                    {log}
                  </pre>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[300px] border-t">
            <div className="p-4 space-y-2">
              {diagnostics.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active issues</p>
                  <p className="text-xs text-muted-foreground mt-1">System is running smoothly</p>
                </div>
              ) : (
                diagnostics.map((diagnostic) => (
                  <Card
                    key={diagnostic.id}
                    className={`border ${getSeverityColor(diagnostic.severity)} ${
                      diagnostic.resolved ? "opacity-50" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(diagnostic.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold">{diagnostic.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{diagnostic.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {diagnostic.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(diagnostic.timestamp).toLocaleString()}
                                </span>
                                {diagnostic.resolved && (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(expandedId === diagnostic.id ? null : diagnostic.id)}
                            >
                              {expandedId === diagnostic.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {expandedId === diagnostic.id && (
                            <div className="mt-3 space-y-2">
                              <div className="bg-muted/50 rounded p-2">
                                <p className="text-xs font-semibold mb-1">Details:</p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {diagnostic.details}
                                </p>
                              </div>

                              {diagnostic.stackTrace && (
                                <div className="bg-muted/50 rounded p-2">
                                  <p className="text-xs font-semibold mb-1">Stack Trace:</p>
                                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                                    {diagnostic.stackTrace}
                                  </pre>
                                </div>
                              )}

                              {diagnostic.metadata && Object.keys(diagnostic.metadata).length > 0 && (
                                <div className="bg-muted/50 rounded p-2">
                                  <p className="text-xs font-semibold mb-1">Metadata:</p>
                                  <pre className="text-xs text-muted-foreground">
                                    {JSON.stringify(diagnostic.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {diagnostic.actions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {diagnostic.actions.map((action: DiagnosticAction) => (
                                    <Button
                                      key={action.id}
                                      variant={action.executed ? "outline" : "default"}
                                      size="sm"
                                      disabled={loading || action.executed || diagnostic.resolved}
                                      onClick={() => executeAction(diagnostic.id, action.id)}
                                      className="text-xs"
                                    >
                                      {getActionIcon(action.type)}
                                      <span className="ml-1">{action.label}</span>
                                      {action.executed && <CheckCircle2 className="h-3 w-3 ml-1" />}
                                    </Button>
                                  ))}
                                </div>
                              )}

                              {diagnostic.resolvedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Resolved at {new Date(diagnostic.resolvedAt).toLocaleString()}
                                  {diagnostic.resolvedBy && ` by ${diagnostic.resolvedBy}`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
