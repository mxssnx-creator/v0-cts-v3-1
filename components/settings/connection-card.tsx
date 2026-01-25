"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Power, Trash2, Settings, Info, FileText, ChevronDown } from "lucide-react"
import { useState } from "react"

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
}

export function ConnectionCard({
  connection,
  onToggle,
  onActivate,
  onDelete,
  onEdit,
  onShowDetails,
  onShowLogs,
}: ConnectionCardProps) {
  const [logsExpanded, setLogsExpanded] = useState(false)

  return (
    <Card className="p-4 space-y-3">
      {/* Header with name and badges */}
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{connection.name}</h4>
            {connection.is_active && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
            {connection.is_predefined && (
              <Badge variant="secondary" className="text-xs">
                Predefined
              </Badge>
            )}
            {connection.is_testnet && (
              <Badge variant="outline" className="text-xs">
                Testnet
              </Badge>
            )}
            {connection.last_test_status === "success" && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                ✓ Tested
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{connection.exchange.toUpperCase()} • {connection.api_type}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 bg-transparent">
            <Settings className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        {onShowDetails && (
          <Button size="sm" variant="outline" onClick={onShowDetails} className="flex-1 bg-transparent">
            <Info className="h-3 w-3 mr-1" />
            Details
          </Button>
        )}
        {onShowLogs && (
          <Button size="sm" variant="outline" onClick={onShowLogs} className="flex-1 bg-transparent">
            <FileText className="h-3 w-3 mr-1" />
            Logs
          </Button>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onToggle}
            className="text-xs"
          >
            <Power className="h-3 w-3 mr-1" />
            {connection.is_enabled ? "Disable" : "Enable"}
          </Button>
        </div>
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
