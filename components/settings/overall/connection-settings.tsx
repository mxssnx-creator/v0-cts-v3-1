"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"

export function ConnectionSettings() {
  const [settings, setSettings] = useState({
    apiTimeout: "30000",
    retryAttempts: "3",
    retryDelay: "1000",
    enableWebSocket: true,
    wsReconnectDelay: "5000",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/overall/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved", {
          description: "Connection settings have been saved successfully.",
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
          <CardTitle>Connection Configuration</CardTitle>
          <CardDescription>Configure API and WebSocket connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiTimeout">API Timeout (ms)</Label>
            <Input
              id="apiTimeout"
              type="number"
              value={settings.apiTimeout}
              onChange={(e) => setSettings({ ...settings, apiTimeout: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Retry Attempts</Label>
              <Input
                id="retryAttempts"
                type="number"
                value={settings.retryAttempts}
                onChange={(e) => setSettings({ ...settings, retryAttempts: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
              <Input
                id="retryDelay"
                type="number"
                value={settings.retryDelay}
                onChange={(e) => setSettings({ ...settings, retryDelay: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enableWebSocket">Enable WebSocket</Label>
              <p className="text-sm text-muted-foreground">Use WebSocket for real-time data updates</p>
            </div>
            <Switch
              id="enableWebSocket"
              checked={settings.enableWebSocket}
              onCheckedChange={(checked) => setSettings({ ...settings, enableWebSocket: checked })}
            />
          </div>

          {settings.enableWebSocket && (
            <div className="space-y-2">
              <Label htmlFor="wsReconnectDelay">WebSocket Reconnect Delay (ms)</Label>
              <Input
                id="wsReconnectDelay"
                type="number"
                value={settings.wsReconnectDelay}
                onChange={(e) => setSettings({ ...settings, wsReconnectDelay: e.target.value })}
              />
            </div>
          )}

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
