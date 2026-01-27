"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Power, Trash2, Settings, FileText, Zap, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "@/lib/simple-toast"

export interface ExchangeConnection {
  id: string
  name: string
  exchange: string
  api_type: string
  connection_method: string
  authentication_type: string
  api_key: string
  api_secret: string
  margin_type: string
  position_mode: string
  is_testnet: boolean
  is_enabled: boolean
  is_active: boolean
  is_predefined: boolean
  last_test_status?: string
  last_test_balance?: number
  last_test_log?: string[]
  last_test_at?: string
}

interface ConnectionCardProps {
  connection: ExchangeConnection
  onToggle: () => void
  onActivate: () => void
  onDelete: () => void
  onEdit?: () => void
  onShowDetails?: () => void
  onShowLogs?: () => void
  onTestConnection?: (logs: string[]) => void
}

export function ConnectionCard({
  connection,
  onToggle,
  onActivate,
  onDelete,
  onEdit,
  onShowDetails,
  onShowLogs,
  onTestConnection,
}: ConnectionCardProps) {
  const [testingConnection, setTestingConnection] = useState(false)

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch(`/api/settings/connections/${connection.id}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error("Connection Test Failed", {
          description: data.error || "Failed to test connection",
        })
        onTestConnection?.(data.log || [])
        return
      }

      toast.success("Connection Test Successful", {
        description: `Balance: ${data.balance?.toFixed(2) || 'N/A'} USDT`,
      })
      onTestConnection?.(data.log || [])
    } catch (error) {
      toast.error("Test Connection Error", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <Card className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: connection.is_enabled ? '#3b82f6' : '#e5e7eb' }}>
      {/* Header with name and badges */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{connection.name}</h4>
            <Badge variant="outline" className="text-xs">
              {connection.exchange.toUpperCase()}
            </Badge>
            {connection.is_active && (
              <Badge className="text-xs bg-green-600">Active</Badge>
            )}
            {connection.is_enabled && !connection.is_active && (
              <Badge variant="secondary" className="text-xs">Enabled</Badge>
            )}
            {!connection.is_enabled && (
              <Badge variant="destructive" className="text-xs">Disabled</Badge>
            )}
            {connection.is_testnet && (
              <Badge variant="outline" className="text-xs">Testnet</Badge>
            )}
            {connection.last_test_status === "success" && (
              <Badge className="text-xs bg-green-50 text-green-700 border-green-200">✓ Tested</Badge>
            )}
          </div>
          
          {/* Double-line info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>API Type: <span className="font-medium text-foreground">{connection.api_type}</span> • Method: <span className="font-medium text-foreground">{connection.connection_method}</span></div>
            <div>Margin: <span className="font-medium text-foreground">{connection.margin_type}</span> • Position: <span className="font-medium text-foreground">{connection.position_mode}</span></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleTestConnection}
          disabled={testingConnection || !connection.is_enabled}
          className="text-xs"
        >
          {testingConnection ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-1" />
              Test Connection
            </>
          )}
        </Button>
        
        {onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit} className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        
        {onShowLogs && (
          <Button size="sm" variant="outline" onClick={onShowLogs} className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Logs
          </Button>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 items-center justify-between pt-2 border-t">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onToggle}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Power className="h-3 w-3 mr-1" />
          {connection.is_enabled ? "Disable" : "Enable"}
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDelete}
          className="text-xs text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>

      {/* Test Result Summary */}
      {connection.last_test_status && (
        <div className="p-2 bg-muted rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Last Test:</span>
            <span>{connection.last_test_status === "success" ? "✓ Success" : "✗ Failed"}</span>
          </div>
          {connection.last_test_balance !== undefined && (
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-mono">${connection.last_test_balance.toFixed(2)}</span>
            </div>
          )}
          {connection.last_test_at && (
            <div className="flex justify-between">
              <span>Tested:</span>
              <span>{new Date(connection.last_test_at).toLocaleDateString()} {new Date(connection.last_test_at).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Expandable Logs */}
      {connection.last_test_log && connection.last_test_log.length > 0 && (
        <div className="space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs justify-between"
            onClick={() => setLogsExpanded(!logsExpanded)}
          >
            <span>Test Log</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${logsExpanded ? "rotate-180" : ""}`} />
          </Button>
          {logsExpanded && (
            <div className="bg-muted p-2 rounded text-xs font-mono max-h-48 overflow-y-auto space-y-0.5">
              {(Array.isArray(connection.last_test_log) ? connection.last_test_log : []).map((line, i) => (
                <div key={i} className="text-muted-foreground">{line}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
