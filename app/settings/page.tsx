"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Globe, Settings2, TrendingUp, Activity, FileText, Shield, Network, RefreshCw } from "lucide-react"
import { ExchangeConnectionManager } from "@/components/settings/exchange-connection-manager"
import { InstallManager } from "@/components/settings/install-manager"
import { StatisticsOverview } from "@/components/settings/statistics-overview"
import Link from "next/link"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("overall")
  const [systemStats, setSystemStats] = useState({
    connections: 0,
    activeStrategies: 0,
    health: "Good",
    status: "Online",
  })

  useEffect(() => {
    loadSystemStats()
  }, [])

  const loadSystemStats = async () => {
    try {
      const response = await fetch("/api/monitoring/system")
      if (response.ok) {
        const data = await response.json()
        setSystemStats({
          connections: data.states?.connections?.active || 0,
          activeStrategies: data.states?.trading?.realPositions || 0,
          health: data.states?.errors?.status === "healthy" ? "Good" : "Warning",
          status: data.states?.database?.status === "connected" ? "Online" : "Offline",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to load system stats:", error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system settings, exchange connections, and trading parameters
          </p>
        </div>
        <Button onClick={loadSystemStats} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Status</CardDescription>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  systemStats.status === "Online" ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <CardTitle className="text-xl">{systemStats.status}</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Connections</CardDescription>
            <CardTitle className="text-3xl">{systemStats.connections}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Running Strategies</CardDescription>
            <CardTitle className="text-3xl">{systemStats.activeStrategies}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Health</CardDescription>
            <CardTitle className={`text-xl ${systemStats.health === "Good" ? "text-green-600" : "text-yellow-600"}`}>
              {systemStats.health}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="indications">Indications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overall Tab */}
        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Exchange Connections</CardTitle>
                  <CardDescription>
                    Manage API connections to exchanges and configure trading parameters
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExchangeConnectionManager />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Configuration
                </CardTitle>
                <CardDescription>Configure network and API settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/settings/network">Open Network Settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage authentication and security</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/settings/security">Open Security Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Indications Tab */}
        <TabsContent value="indications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/settings/indications/main">
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge variant="secondary">Core</Badge>
                  </div>
                  <CardTitle className="mt-4">Main Indications</CardTitle>
                  <CardDescription>Configure primary indication types and parameters</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings/indications/common">
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <Settings2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="mt-4">Common Indications</CardTitle>
                  <CardDescription>Shared indication settings across strategies</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings/indications/auto">
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                    <Badge variant="secondary">Advanced</Badge>
                  </div>
                  <CardTitle className="mt-4">Auto Indications</CardTitle>
                  <CardDescription>Automated indication generation and management</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings/indications/optimal">
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-pink-50">
                      <Activity className="h-6 w-6 text-pink-600" />
                    </div>
                    <Badge variant="secondary">Pro</Badge>
                  </div>
                  <CardTitle className="mt-4">Optimal Settings</CardTitle>
                  <CardDescription>Optimized parameters for maximum performance</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Database & System Management</CardTitle>
                  <CardDescription>
                    Configure database, run migrations, manage backups, and system diagnostics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InstallManager />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Monitoring
              </CardTitle>
              <CardDescription>View system logs and monitoring information</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/monitoring">Open Monitoring Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Fine-tune system behavior and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Advanced settings can significantly impact system performance. Modify with caution.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button asChild variant="outline">
                  <Link href="/api/system/integrity-check" target="_blank">
                    Run System Integrity Check
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings/database">Database Optimization</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/api/monitoring/export" target="_blank">
                    Export System Logs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <StatisticsOverview settings={{}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
