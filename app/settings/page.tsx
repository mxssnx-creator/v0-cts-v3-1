"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Activity, TrendingUp, BarChart3, Save, Server, Zap, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { toast } from "@/lib/simple-toast"

const ExchangeConnectionManager = dynamic(() => import("@/components/settings/exchange-connection-manager"), {
  ssr: false,
})
const InstallManager = dynamic(() => import("@/components/settings/install-manager"), { ssr: false })
const ThresholdManagement = dynamic(
  () => import("@/components/settings/threshold-management").then((mod) => ({ default: mod.ThresholdManagement })),
  { ssr: false },
)
const AutoRecoveryControl = dynamic(
  () => import("@/components/settings/auto-recovery-control").then((mod) => ({ default: mod.AutoRecoveryControl })),
  { ssr: false },
)
const PresetConnectionManager = dynamic(
  () =>
    import("@/components/settings/preset-connection-manager").then((mod) => ({ default: mod.PresetConnectionManager })),
  { ssr: false },
)
const LogsViewer = dynamic(
  () => import("@/components/settings/logs-viewer").then((mod) => ({ default: mod.LogsViewer })),
  { ssr: false },
)
const AutoIndicationSettings = dynamic(
  () =>
    import("@/components/settings/auto-indication-settings").then((mod) => ({ default: mod.AutoIndicationSettings })),
  { ssr: false },
)
const ActiveAdvancedIndicationSettings = dynamic(
  () =>
    import("@/components/settings/active-advanced-indication-settings").then((mod) => ({
      default: mod.ActiveAdvancedIndicationSettings,
    })),
  { ssr: false },
)
const StatisticsOverview = dynamic(
  () => import("@/components/settings/statistics-overview").then((mod) => ({ default: mod.StatisticsOverview })),
  { ssr: false },
)

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("overall")
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [systemStats, setSystemStats] = useState({
    connections: 0,
    activeConnections: 0,
    indications: 0,
    strategies: 0,
    activePositions: 0,
  })
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
    loadSystemStats()
  }, [])

  const loadSettings = async () => {
    try {
      console.log("[v0] Loading settings...")
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {})
        setLoadError(null)
      } else {
        console.error("[v0] Failed to load settings:", response.status)
        setLoadError(`Failed to load settings: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
      setLoadError(String(error))
    }
  }

  const loadSystemStats = async () => {
    try {
      console.log("[v0] Loading system stats...")
      const [connectionsRes, indicationsRes, strategiesRes, positionsRes] = await Promise.all([
        fetch("/api/settings/connections").catch(() => null),
        fetch("/api/indications").catch(() => null),
        fetch("/api/strategies").catch(() => null),
        fetch("/api/positions").catch(() => null),
      ])

      const connections = connectionsRes && connectionsRes.ok ? await connectionsRes.json() : { connections: [] }
      const indications = indicationsRes && indicationsRes.ok ? await indicationsRes.json() : { indications: [] }
      const strategies = strategiesRes && strategiesRes.ok ? await strategiesRes.json() : { strategies: [] }
      const positions = positionsRes && positionsRes.ok ? await positionsRes.json() : { positions: [] }

      setSystemStats({
        connections: connections.connections?.length || 0,
        activeConnections: connections.connections?.filter((c: any) => c.is_enabled).length || 0,
        indications: indications.indications?.length || 0,
        strategies: strategies.strategies?.length || 0,
        activePositions: positions.positions?.filter((p: any) => p.status === "open").length || 0,
      })
      console.log("[v0] System stats loaded successfully")
    } catch (error) {
      console.error("[v0] Failed to load system stats:", error)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved successfully!")
        await loadSettings()
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      console.error("[v0] Failed to save settings:", error)
      toast.error("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {loadError && (
        <Card className="border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <div className="font-semibold">Error Loading Settings</div>
                <div className="text-sm">{loadError}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Configure system, connections, and trading parameters</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{systemStats.connections}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{systemStats.activeConnections}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{systemStats.indications}</div>
                <div className="text-xs text-muted-foreground">Indications</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{systemStats.strategies}</div>
                <div className="text-xs text-muted-foreground">Strategies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{systemStats.activePositions}</div>
                <div className="text-xs text-muted-foreground">Positions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overall">
            <Settings className="h-4 w-4 mr-2" />
            Overall
          </TabsTrigger>
          <TabsTrigger value="indications">
            <TrendingUp className="h-4 w-4 mr-2" />
            Indications
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Overall Tab - Connection and Preset Management */}
        <TabsContent value="overall" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Connections</CardTitle>
              <CardDescription>
                Manage API connections to exchanges. Configure credentials, test connections, and enable/disable
                trading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeConnectionManager onConnectionsChange={loadSystemStats} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Connection & Presets</CardTitle>
              <CardDescription>
                Select the active trading connection and configure presets for automated trading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PresetConnectionManager />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database & System Operations</CardTitle>
              <CardDescription>
                Initialize database, run migrations, create backups, and manage system configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstallManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indications Tab - Indication Configuration */}
        <TabsContent value="indications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Indication Settings</CardTitle>
              <CardDescription>
                Configure direction, move, and active indication types with market activity gating and per-second
                calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutoIndicationSettings />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Advanced Indications</CardTitle>
              <CardDescription>
                Configure advanced active indications with optimal market change calculations for short-term trades
                (1-40 min).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveAdvancedIndicationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab - Logs, Thresholds, and Recovery */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Threshold Management</CardTitle>
              <CardDescription>
                Automatic database cleanup and position limit management with configurable thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThresholdManagement />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Recovery System</CardTitle>
              <CardDescription>
                Automatic service monitoring, health checks, and recovery for critical system components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutoRecoveryControl />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View system logs, errors, and debugging information.</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsViewer />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>Configure database type and connection settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Database Type</span>
                    <Badge variant="outline">
                      {process.env.DATABASE_URL?.includes("postgres") ? "PostgreSQL" : "SQLite"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {process.env.DATABASE_URL?.includes("postgres")
                      ? "Connected to PostgreSQL database"
                      : "Using local SQLite database"}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Database configuration is managed through environment variables. Use the Install Manager to perform
                    database operations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab - Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced System Configuration</CardTitle>
              <CardDescription>Configure advanced engine parameters and system behavior.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium mb-2">⚠️ Caution Required</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    These settings directly affect trading engine behavior. Only modify if you understand the
                    implications.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-medium mb-2">Trade Engine Intervals</div>
                    <p className="text-sm text-muted-foreground">
                      Configure check intervals for different indication types (Direction, Move, Active).
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-medium mb-2">Position Thresholds</div>
                    <p className="text-sm text-muted-foreground">
                      Set maximum positions, cleanup intervals, and position cost limits.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-medium mb-2">Database Limits</div>
                    <p className="text-sm text-muted-foreground">
                      Configure row limits for pseudo positions, real positions, and auto-cleanup thresholds.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab - System Statistics */}
        <TabsContent value="statistics" className="space-y-6">
          <StatisticsOverview settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
