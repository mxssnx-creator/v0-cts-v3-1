"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Database, TrendingUp, CheckCircle2, Bot, Layers, Workflow } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { PageHeader } from "@/components/layout/page-header"

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("main")

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <PageHeader
          title="System Logistics"
          description="Complete workflow visualization for Main System, Presets, and Trading Bots"
          icon={Workflow}
        />

        <div className="flex-1 overflow-auto p-6">
          <Separator />

          <Alert className="border-2 border-primary mb-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>System Status:</strong> Database optimized with 50+ indexes, automatic script execution enabled,
              step ratio controls active (0.2-1.0 default).
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="main" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Main System
              </TabsTrigger>
              <TabsTrigger value="preset" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Preset Trade
              </TabsTrigger>
              <TabsTrigger value="bot" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Trading Bots
              </TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-6 mt-6">
              <Alert className="border-2 border-primary">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Main System Trade Mode:</strong> Uses step-based indication calculations generating up to 250
                  pseudo positions per indication with comprehensive validation layers.
                </AlertDescription>
              </Alert>

              {/* Phase 1: Initialization */}
              <Card className="border-2 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    Initialization Phase
                  </CardTitle>
                  <CardDescription>System startup and data loading</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                    <div className="font-medium mb-2">System Settings & Configuration</div>
                    <div className="text-sm text-muted-foreground ml-4">
                      <div>• Trade Engine Interval: 1.0s</div>
                      <div>• Real Positions Interval: 0.3s</div>
                      <div>• Market Data Timeframe: 1 second</div>
                      <div>• Time Range History: 5 days</div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Initialization Complete:</strong> System ready to start Trade Engine intervals
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Phase 2: Trade Interval */}
              <Card className="border-2 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    Trade Interval Loop (1.0s)
                  </CardTitle>
                  <CardDescription>Indications → Strategies → Pseudo Positions → Logging</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Non-Overlapping Execution:</strong> New interval starts ONLY after previous completes.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      Process Indications
                      <Badge className="bg-blue-500">Parallel by Symbol</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground ml-4">
                      <div>• Direction Type (3-30 step ranges)</div>
                      <div>• Move Type (3-30 step ranges)</div>
                      <div>• Active Type (0.5-2.5% thresholds)</div>
                      <div>• Optimal Type (Advanced configurations)</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      Process Strategies
                      <Badge className="bg-purple-500">Parallel by Symbol</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground ml-4">
                      <div>• Momentum Strategy</div>
                      <div>• Mean Reversion Strategy</div>
                      <div>• Breakout Strategy</div>
                      <div>• Trend Following Strategy</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                    <div className="font-medium mb-2">Validate & Create Real Positions</div>
                    <div className="text-sm text-muted-foreground ml-4">
                      <div>• Profit Factor ≥ 0.6</div>
                      <div>• Drawdown Time ≤ 12 hours</div>
                      <div>• Risk Management checks</div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Trade Interval Complete:</strong> All symbols processed, positions created, metrics
                      logged.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Phase 3: Real Positions */}
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    Real Positions Interval (0.3s)
                  </CardTitle>
                  <CardDescription>Exchange position management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                    <div className="font-medium mb-2">Exchange Operations</div>
                    <div className="text-sm text-muted-foreground ml-4">
                      <div>• Fetch positions from exchange</div>
                      <div>• Execute actions (open/close/modify)</div>
                      <div>• Sync data and update metrics</div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Interval Complete:</strong> All exchange positions updated and synced.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Trade Interval (1.0s)</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• Non-overlapping execution</div>
                        <div>• Processes all indications and strategies</div>
                        <div>• Creates validated positions</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Real Positions Interval (0.3s)</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• Independent from Trade Interval</div>
                        <div>• Manages exchange positions</div>
                        <div>• Rate limit compliant</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preset" className="space-y-6 mt-6">
              <Alert className="border-2 border-blue-500/50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preset Trade Mode:</strong> Uses common indicators with automated configuration testing.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Preset Trade Logistics</CardTitle>
                  <CardDescription>Indicator-based trading workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Common Indicators</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• RSI, MACD, Bollinger Bands</div>
                        <div>• Parabolic SAR, EMA, SMA</div>
                        <div>• Stochastic Oscillator, ADX</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Configuration Testing</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• 100-1,000 configuration sets</div>
                        <div>• Historical backtesting</div>
                        <div>• Performance validation</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bot" className="space-y-6 mt-6">
              <Alert className="border-2 border-green-500/50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trading Bots:</strong> Automated strategies with custom logic.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Trading Bot Types</CardTitle>
                  <CardDescription>Custom automated trading strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Bot Categories</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• Grid Trading Bot</div>
                        <div>• DCA Bot</div>
                        <div>• Arbitrage Bot</div>
                        <div>• Market Making Bot</div>
                        <div>• Custom Bot</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium mb-2">Features</div>
                      <div className="text-sm text-muted-foreground">
                        <div>• Independent operation</div>
                        <div>• Custom logic support</div>
                        <div>• Per-bot risk management</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
