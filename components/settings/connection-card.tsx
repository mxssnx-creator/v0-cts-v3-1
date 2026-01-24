"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Power, Trash2 } from "lucide-react"

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
}

interface ConnectionCardProps {
  connection: ExchangeConnection
  onToggle: () => void
  onActivate: () => void
  onDelete: () => void
}

export function ConnectionCard({
  connection,
  onToggle,
  onActivate,
  onDelete,
}: ConnectionCardProps) {
  return (
    <Card className="p-4">
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
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>Exchange: {connection.exchange}</div>
            <div>Type: {connection.api_type}</div>
            <div>
              Margin: {connection.margin_type} | Position: {connection.position_mode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`enabled-${connection.id}`} className="text-xs">
              Enabled
            </Label>
            <Switch
              id={`enabled-${connection.id}`}
              checked={connection.is_enabled}
              onCheckedChange={onToggle}
            />
          </div>
          
          <Button
            size="sm"
            variant={connection.is_active ? "default" : "outline"}
            onClick={onActivate}
            disabled={!connection.is_enabled}
          >
            <Power className="h-3 w-3 mr-1" />
            {connection.is_active ? "Active" : "Activate"}
          </Button>

          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
