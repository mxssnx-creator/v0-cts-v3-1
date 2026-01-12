"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"
import { Save } from "lucide-react"
import ExchangeConnectionManager from "@/components/settings/exchange-connection-manager"
import InstallManager from "@/components/settings/install-manager"
import { LogsViewer } from "@/components/settings/logs-viewer"
import { OverallSettings } from "@/components/settings/overall-settings"
import { StrategySettings } from "@/components/settings/strategy-settings"
import { DatabaseSettings } from "@/components/settings/database-settings"
import type { ExchangeConnection } from "@/lib/types"

const EXCHANGE_MAX_POSITIONS: Record<string, number> = {
  bybit: 500,
  binance: 500,
  okx: 150,
  kucoin: 150,
  gateio: 150,
  bitget: 150,
  mexc: 100,
  bingx: 100,
  coinex: 75,
  lbank: 50,
  bitmart: 50,
}

interface SystemSettings {
  database_type: string
  trade_interval?: number
  engine_speed?: number
  monitoring_interval?: number
  tradeMode?: string
  marketTimeframe?: number
  prehistoricDataDays?: number
  positionCost?: number
  useMaximalLeverage?: boolean
  leveragePercentage?: number
  mainSymbols?: string[]
  forcedSymbols?: string[]
  symbolsCount?: number
  maxPositionsPerExchange?: Record<string, number>
  stepRelationMinRatio?: number
  stepRelationMaxRatio?: number
  minimumConnectInterval?: number
  symbolsExchangeCount?: number
  defaultMarginType?: string
  defaultPositionMode?: string
  rateLimitDelay?: number
  maxConcurrentConnections?: number
  testnetEnabled?: boolean
  monitoringEnabled?: boolean
  metricsRetention?: number
  strategyMinProfitFactor?: number
  indicationMinProfitFactor?: number
  profitFactorMultiplier?: number
  baseVolumeFactor?: number
  strategyTrailingEnabled?: boolean
  strategyBlockEnabled?: boolean
  strategyDcaEnabled?: boolean
  blockAutoDisableEnabled?: boolean
  blockAdjustmentRatio?: number
  blockAutoDisableMinBlocks?: number
  blockAutoDisableComparisonWindow?: number
  minWinRate?: number
  maxDrawdownHours?: number
  adjustStrategyDrawdownPositions?: number
  positionsAverage?: number
  volumeRangePercentage?: number
  rateLimitPerSecond?: number
  connectionTimeout?: number
  arrangementType?: string
  arrangementCount?: number
  baseVolumeFactorLive?: number
  profitFactorMinMain?: number
  drawdownTimeMain?: number
  trailingEnabled?: boolean
  trailingOnly?: boolean
  blockEnabled?: boolean
  blockOnly?: boolean
  dcaEnabled?: boolean
  presetTrailingEnabled?: boolean
  presetTrailingOnly?: boolean
  presetBlockEnabled?: boolean
  presetBlockOnly?: boolean
  presetDcaEnabled?: boolean
  baseVolumeFactorPreset?: number
  profitFactorMinPreset?: number
  drawdownTimePreset?: number
  mainTradeInterval?: number
  presetTradeInterval?: number
  maxPseudoPositions?: number
  marketDataRetention?: number
  [key: string]: any
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    database_type: "sqlite",
    positionCost: 0.1,
    symbolsExchangeCount: 30,
    positionsAverage: 50,
    baseVolumeFactor: 1.0,
    mainSymbols: ["bch", "xrp", "eth", "link", "doge", "h"],
    forcedSymbols: ["xrp", "bch"],
    prehistoricDataDays: 5,
    marketTimeframe: 1,
    maxPositionsPerExchange: {
      bybit: 200,
      binance: 200,
      okx: 150,
      kucoin: 150,
      gateio: 150,
      bitget: 150,
      mexc: 100,
      bingx: 100,
      lbank: 50,
      bitmart: 50,
    },
    trade_interval: 5,
    engine_speed: 1,
    monitoring_interval: 30,
    tradeMode: "both",
    stepRelationMinRatio: 0.5,
    stepRelationMaxRatio: 2.0,
    minimumConnectInterval: 200,
    defaultMarginType: "isolated",
    defaultPositionMode: "one-way",
    rateLimitDelay: 1000,
    maxConcurrentConnections: 5,
    testnetEnabled: false,
    monitoringEnabled: true,
    metricsRetention: 30,
    strategyMinProfitFactor: 0.5,
    indicationMinProfitFactor: 0.7,
    profitFactorMultiplier: 1.0,
    strategyTrailingEnabled: true,
    strategyBlockEnabled: true,
    strategyDcaEnabled: false,
    blockAutoDisableEnabled: true,
    blockAdjustmentRatio: 1.0,
    blockAutoDisableMinBlocks: 2,
    blockAutoDisableComparisonWindow: 50,
    minWinRate: 45,
    maxDrawdownHours: 24,
    adjustStrategyDrawdownPositions: 80,
    volumeRangePercentage: 20,
    rateLimitPerSecond: 10,
    connectionTimeout: 30,
    arrangementType: "market_cap",
    baseVolumeFactorLive: 1.0,
    profitFactorMinMain: 0.6,
    drawdownTimeMain: 300,
    trailingEnabled: false,
    trailingOnly: false,
    blockEnabled: false,
    blockOnly: false,
    dcaEnabled: false,
    presetTrailingEnabled: false,
    presetTrailingOnly: false,
    presetBlockEnabled: false,
    presetBlockOnly: false,
    presetDcaEnabled: false,
    baseVolumeFactorPreset: 1.0,
    profitFactorMinPreset: 0.6,
    drawdownTimePreset: 300,
    mainTradeInterval: 1,
    presetTradeInterval: 2,
    maxPseudoPositions: 250,
    marketDataRetention: 24,
  })

  const [activeTab, setActiveTab] = useState("overall")
  const [overallSubTab, setOverallSubTab] = useState("main")
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
    loadConnections()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadConnections = async () => {
    try {
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
      }
    } catch (error) {
      console.error("Failed to load connections:", error)
    }
  }

  const handleSettingsChange = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save settings")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure your trading system preferences</p>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start h-auto flex-wrap">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="exchange">Exchange</TabsTrigger>
              <TabsTrigger value="indication">Indication</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="install">Install</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-6">
              <Tabs value={overallSubTab} onValueChange={setOverallSubTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="main">Main</TabsTrigger>
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>

                <TabsContent value="main">
                  <OverallSettings settings={settings} onSettingsChange={handleSettingsChange} />
                </TabsContent>

                <TabsContent value="connection" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Connection Settings</CardTitle>
                      <CardDescription>Configure connection parameters and rate limiting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="minimumConnectInterval">Minimum Connect Interval (ms)</Label>
                        <Input
                          id="minimumConnectInterval"
                          type="number"
                          value={settings.minimumConnectInterval || 200}
                          onChange={(e) =>
                            handleSettingsChange({ minimumConnectInterval: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stepRelationMinRatio">Step Relation Min Ratio</Label>
                        <Input
                          id="stepRelationMinRatio"
                          type="number"
                          step="0.1"
                          value={settings.stepRelationMinRatio || 0.5}
                          onChange={(e) =>
                            handleSettingsChange({ stepRelationMinRatio: Number.parseFloat(e.target.value) })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stepRelationMaxRatio">Step Relation Max Ratio</Label>
                        <Input
                          id="stepRelationMaxRatio"
                          type="number"
                          step="0.1"
                          value={settings.stepRelationMaxRatio || 2.0}
                          onChange={(e) =>
                            handleSettingsChange({ stepRelationMaxRatio: Number.parseFloat(e.target.value) })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monitoring Configuration</CardTitle>
                      <CardDescription>Configure system monitoring and metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="monitoringEnabled">Enable Monitoring</Label>
                        <Switch
                          id="monitoringEnabled"
                          checked={settings.monitoringEnabled || false}
                          onCheckedChange={(checked) => handleSettingsChange({ monitoringEnabled: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monitoring_interval">Monitoring Interval (seconds)</Label>
                        <Input
                          id="monitoring_interval"
                          type="number"
                          value={settings.monitoring_interval || 30}
                          onChange={(e) =>
                            handleSettingsChange({ monitoring_interval: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metricsRetention">Metrics Retention (days)</Label>
                        <Input
                          id="metricsRetention"
                          type="number"
                          value={settings.metricsRetention || 30}
                          onChange={(e) => handleSettingsChange({ metricsRetention: Number.parseInt(e.target.value) })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="install">
                  <InstallManager />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="exchange">
              <ExchangeConnectionManager connections={connections} onUpdate={loadConnections} />
            </TabsContent>

            <TabsContent value="indication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indication Settings</CardTitle>
                  <CardDescription>Configure trading indication parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="indicationMinProfitFactor">Min Profit Factor</Label>
                    <Input
                      id="indicationMinProfitFactor"
                      type="number"
                      step="0.01"
                      value={settings.indicationMinProfitFactor || 0.7}
                      onChange={(e) =>
                        handleSettingsChange({ indicationMinProfitFactor: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Additional indication settings can be configured per connection in the Exchange tab
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy">
              <StrategySettings settings={settings} onSettingsChange={handleSettingsChange} />
            </TabsContent>

            <TabsContent value="system">
              <DatabaseSettings settings={settings} onSettingsChange={handleSettingsChange} />
            </TabsContent>

            <TabsContent value="logs">
              <LogsViewer />
            </TabsContent>

            <TabsContent value="install">
              <InstallManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
