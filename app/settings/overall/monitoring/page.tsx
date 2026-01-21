"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function MonitoringSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    logLevel: "info",
    performanceMonitoring: true,
    errorTracking: true,
    alertsEnabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/overall")
      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings/overall", {
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
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Monitoring Settings</h1>
                <p className="text-xs text-muted-foreground">Configure logging and monitoring features</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Enable or disable various monitoring features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance Monitoring</Label>
                    <p className="text-xs text-muted-foreground">Track system performance metrics</p>
                  </div>
                  <Switch
                    checked={settings.performanceMonitoring}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, performanceMonitoring: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Error Tracking</Label>
                    <p className="text-xs text-muted-foreground">Monitor and log system errors</p>
                  </div>
                  <Switch
                    checked={settings.errorTracking}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, errorTracking: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alerts Enabled</Label>
                    <p className="text-xs text-muted-foreground">Enable system alerts and notifications</p>
                  </div>
                  <Switch
                    checked={settings.alertsEnabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, alertsEnabled: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logging Configuration</CardTitle>
              <CardDescription>Configure system logging behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                  value={settings.logLevel}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, logLevel: value }))}
                >
                  <SelectTrigger id="logLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Minimum level of messages to log
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
