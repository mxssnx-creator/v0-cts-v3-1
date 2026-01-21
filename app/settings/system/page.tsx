"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, RefreshCw, AlertTriangle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    // System Configuration
    systemMode: "production",
    debugMode: false,
    verboseLogging: false,
    maxMemoryUsage: 2048,
    maxCpuUsage: 80,
    
    // Database Settings
    dbPoolSize: 20,
    dbTimeout: 30000,
    dbRetryAttempts: 3,
    
    // Cache Settings
    cacheEnabled: true,
    cacheSize: 512,
    cacheTTL: 3600,
    
    // Security Settings
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    twoFactorEnabled: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/system")
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
      const response = await fetch("/api/settings/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved", {
          description: "System settings have been saved successfully. Some changes may require a restart.",
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
                <h1 className="text-lg font-semibold">System Settings</h1>
                <p className="text-xs text-muted-foreground">Configure system-level parameters and security</p>
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Changes to system settings may require a restart to take effect. Exercise caution when modifying these
              values.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Core system operation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="systemMode">System Mode</Label>
                <Select
                  value={settings.systemMode}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, systemMode: value }))}
                >
                  <SelectTrigger id="systemMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Current operating mode of the system</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-xs text-muted-foreground">Enable detailed debugging output</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, debugMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verbose Logging</Label>
                  <p className="text-xs text-muted-foreground">Enable verbose system logging</p>
                </div>
                <Switch
                  checked={settings.verboseLogging}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, verboseLogging: checked }))}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxMemoryUsage">Max Memory Usage (MB)</Label>
                  <Input
                    id="maxMemoryUsage"
                    type="number"
                    value={settings.maxMemoryUsage}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxMemoryUsage: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum memory allocation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxCpuUsage">Max CPU Usage (%)</Label>
                  <Input
                    id="maxCpuUsage"
                    type="number"
                    value={settings.maxCpuUsage}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxCpuUsage: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum CPU utilization threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Database connection and pool configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dbPoolSize">Connection Pool Size</Label>
                  <Input
                    id="dbPoolSize"
                    type="number"
                    value={settings.dbPoolSize}
                    onChange={(e) => setSettings((prev) => ({ ...prev, dbPoolSize: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum database connections in pool</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbTimeout">Connection Timeout (ms)</Label>
                  <Input
                    id="dbTimeout"
                    type="number"
                    value={settings.dbTimeout}
                    onChange={(e) => setSettings((prev) => ({ ...prev, dbTimeout: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Database query timeout</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbRetryAttempts">Retry Attempts</Label>
                  <Input
                    id="dbRetryAttempts"
                    type="number"
                    value={settings.dbRetryAttempts}
                    onChange={(e) => setSettings((prev) => ({ ...prev, dbRetryAttempts: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Number of retry attempts for failed queries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cache Settings</CardTitle>
              <CardDescription>Configure application caching behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Enabled</Label>
                  <p className="text-xs text-muted-foreground">Enable application-level caching</p>
                </div>
                <Switch
                  checked={settings.cacheEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, cacheEnabled: checked }))}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cacheSize">Cache Size (MB)</Label>
                  <Input
                    id="cacheSize"
                    type="number"
                    value={settings.cacheSize}
                    onChange={(e) => setSettings((prev) => ({ ...prev, cacheSize: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum cache memory allocation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                  <Input
                    id="cacheTTL"
                    type="number"
                    value={settings.cacheTTL}
                    onChange={(e) => setSettings((prev) => ({ ...prev, cacheTTL: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Default cache entry lifetime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings((prev) => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">User session expiration time</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Failed login attempts before lockout</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Strong Password</Label>
                  <p className="text-xs text-muted-foreground">Enforce strong password requirements</p>
                </div>
                <Switch
                  checked={settings.requireStrongPassword}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, requireStrongPassword: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Enable 2FA for all accounts</p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, twoFactorEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
