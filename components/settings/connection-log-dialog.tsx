"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/lib/simple-toast"

interface ConnectionLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  connectionName: string
}

export function ConnectionLogDialog({ open, onOpenChange, connectionId, connectionName }: ConnectionLogDialogProps) {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    if (open) {
      loadLogs()
    }
  }, [open, connectionId])

  const loadLogs = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/settings/connections/${connectionId}/log`)
      if (!response.ok) throw new Error("Failed to load logs")

      const data = await response.json()
      setLogs(data.logs || [])
      setSummary(data.summary || {})
    } catch (error) {
      console.error("[v0] Failed to load connection logs:", error)
      toast.error("Error loading logs", {
        description: error instanceof Error ? error.message : "Failed to load logs",
      })
    } finally {
      setLoading(false)
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warn":
        return <Badge variant="secondary">Warning</Badge>
      case "info":
        return <Badge variant="outline">Info</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Connection Logs - {connectionName}</DialogTitle>
              <DialogDescription>View recent activity and error logs for this connection</DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.total || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Logs</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-500">{summary.errors || 0}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-500">{summary.warnings || 0}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-500">{summary.info || 0}</div>
                  <div className="text-sm text-muted-foreground">Info</div>
                </div>
              </div>
            )}

            <Separator />

            {/* Logs */}
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No logs available</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-1">
                      <div className="flex items-center gap-2 justify-between">
                        {getLevelBadge(log.level)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.details && (
                        <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
