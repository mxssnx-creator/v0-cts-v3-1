"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function ConnectionSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    maxConnections: 10,
    connectionTimeout: 30000,
    retryAttempts: 3,
    retryDelay: 5000,
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
                <h1 className="text-lg font-semibold">Connection Settings</h1>
                <p className="text-xs text-muted-foreground">Configure API connection parameters</p>
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
              <CardTitle>API Connection Parameters</CardTitle>
              <CardDescription>Configure how your system connects to exchange APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={settings.maxConnections}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxConnections: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum concurrent exchange connections</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                  <Input
                    id="connectionTimeout"
                    type="number"
                    value={settings.connectionTimeout}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, connectionTimeout: Number(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Timeout for API requests</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => setSettings((prev) => ({ ...prev, retryAttempts: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Number of retry attempts for failed requests</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={settings.retryDelay}
                    onChange={(e) => setSettings((prev) => ({ ...prev, retryDelay: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Delay between retry attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Health</CardTitle>
              <CardDescription>Monitor and test your connection configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Test your connection settings to ensure proper communication with exchange APIs.
                </p>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
