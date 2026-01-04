"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface ConnectionSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  connectionName: string
}

interface IndicationSettings {
  indication_type: string
  indication_name: string
  is_enabled: boolean
  range?: number
  timeout?: number
  interval?: number
}

interface StrategySettings {
  strategy_type: string
  is_enabled: boolean
  min_profit_factor?: number
  max_positions?: number
}

export function ConnectionSettingsDialog({
  open,
  onOpenChange,
  connectionId,
  connectionName,
}: ConnectionSettingsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [indications, setIndications] = useState<IndicationSettings[]>([])
  const [strategies, setStrategies] = useState<StrategySettings[]>([])

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open, connectionId])

  const loadSettings = async () => {
    try {
      setLoading(true)

      // Load active indications for this connection
      const indicationsRes = await fetch(`/api/settings/connections/${connectionId}/active-indications`)
      if (indicationsRes.ok) {
        const indicationsData = await indicationsRes.json()
        setIndications(indicationsData.indications || [])
      }

      // Load connection settings including strategies
      const settingsRes = await fetch(`/api/settings/connections/${connectionId}/settings`)
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setStrategies(
          settingsData.strategies || [
            { strategy_type: "base", is_enabled: true, min_profit_factor: 1.1, max_positions: 250 },
            { strategy_type: "main", is_enabled: true, min_profit_factor: 1.15, max_positions: 250 },
            { strategy_type: "real", is_enabled: true, min_profit_factor: 1.2, max_positions: 250 },
            { strategy_type: "preset", is_enabled: false, min_profit_factor: 1.1, max_positions: 250 },
          ],
        )
      }
    } catch (error) {
      console.error("[v0] Failed to load connection settings:", error)
      toast.error("Error loading settings", {
        description: error instanceof Error ? error.message : "Failed to load settings",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleIndication = (index: number, enabled: boolean) => {
    setIndications((prev) => prev.map((ind, i) => (i === index ? { ...ind, is_enabled: enabled } : ind)))
  }

  const toggleStrategy = (index: number, enabled: boolean) => {
    setStrategies((prev) => prev.map((strat, i) => (i === index ? { ...strat, is_enabled: enabled } : strat)))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Save indication settings
      await fetch(`/api/settings/connections/${connectionId}/active-indications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indications }),
      })

      // Save strategy settings
      await fetch(`/api/settings/connections/${connectionId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategies }),
      })

      toast.success("Settings saved", {
        description: "Connection settings have been updated successfully",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save settings:", error)
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Failed to save settings",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connection Settings - {connectionName}</DialogTitle>
          <DialogDescription>Configure strategies and indications for this connection</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Strategies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Strategies</h3>
              <div className="space-y-3">
                {strategies.map((strategy, index) => (
                  <div key={strategy.strategy_type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="capitalize">
                        {strategy.strategy_type}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Min PF: {strategy.min_profit_factor} | Max: {strategy.max_positions}
                      </div>
                    </div>
                    <Switch
                      checked={strategy.is_enabled}
                      onCheckedChange={(checked) => toggleStrategy(index, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Indications Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Indications</h3>
              {indications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No indications configured</p>
              ) : (
                <div className="space-y-3">
                  {indications.map((indication, index) => (
                    <div
                      key={`${indication.indication_type}-${indication.indication_name}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="capitalize">
                          {indication.indication_type}
                        </Badge>
                        <div className="text-sm">
                          <div className="font-medium">{indication.indication_name}</div>
                          <div className="text-muted-foreground text-xs">
                            Range: {indication.range || "N/A"} | Timeout: {indication.timeout || "N/A"}ms
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={indication.is_enabled}
                        onCheckedChange={(checked) => toggleIndication(index, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
