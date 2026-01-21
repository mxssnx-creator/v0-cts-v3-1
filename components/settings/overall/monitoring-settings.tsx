"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"

export function MonitoringSettings() {
  const [settings, setSettings] = useState({
    enableLogging: true,
    logLevel: "info",
    logRetentionDays: "30",
    enableMetrics: true,
    metricsInterval: "60",
    enableAlerts: true,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/overall/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved", {
          description: "Monitoring settings have been saved successfully.",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Configuration</CardTitle>
          <CardDescription>Configure logging, metrics, and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enableLogging">Enable Logging</Label>
              <p className="text-sm text-muted-foreground">Log system events and activities</p>
            </div>
            <Switch
              id="enableLogging"
              checked={settings.enableLogging}
              onCheckedChange={(checked) => setSettings({ ...settings, enableLogging: checked })}
            />
          </div>

          {settings.enableLogging && (
            <>
              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select value={settings.logLevel} onValueChange={(value) => setSettings({ ...settings, logLevel: value })}>
                  <SelectTrigger id="logLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                <Input
                  id="logRetentionDays"
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) => setSettings({ ...settings, logRetentionDays: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enableMetrics">Enable Metrics</Label>
              <p className="text-sm text-muted-foreground">Collect performance metrics</p>
            </div>
            <Switch
              id="enableMetrics"
              checked={settings.enableMetrics}
              onCheckedChange={(checked) => setSettings({ ...settings, enableMetrics: checked })}
            />
          </div>

          {settings.enableMetrics && (
            <div className="space-y-2">
              <Label htmlFor="metricsInterval">Metrics Interval (seconds)</Label>
              <Input
                id="metricsInterval"
                type="number"
                value={settings.metricsInterval}
                onChange={(e) => setSettings({ ...settings, metricsInterval: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enableAlerts">Enable Alerts</Label>
              <p className="text-sm text-muted-foreground">Send notifications for important events</p>
            </div>
            <Switch
              id="enableAlerts"
              checked={settings.enableAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, enableAlerts: checked })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
