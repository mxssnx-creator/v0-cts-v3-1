"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Save } from "lucide-react"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">System configuration and management</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="indications">Indications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Connections</CardTitle>
              <CardDescription>Manage exchange API connections and credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeConnectionManager />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Installation & Database</CardTitle>
              <CardDescription>System setup and database management</CardDescription>
            </CardHeader>
            <CardContent>
              <InstallManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Indication Settings</CardTitle>
              <CardDescription>Configure trading indications and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <AutoIndicationSettings />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Indication Settings</CardTitle>
              <CardDescription>Advanced indication configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveAdvancedIndicationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Thresholds</CardTitle>
              <CardDescription>Manage position limits and automatic cleanup</CardDescription>
            </CardHeader>
            <CardContent>
              <ThresholdManagement />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Recovery</CardTitle>
              <CardDescription>Automatic service monitoring and recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <AutoRecoveryControl />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View system logs and debugging information</CardDescription>
            </CardHeader>
            <CardContent>
              <LogsViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Advanced system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Advanced configuration options for system behavior and performance tuning.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
