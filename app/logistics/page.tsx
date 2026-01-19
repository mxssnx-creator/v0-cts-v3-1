"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Info,
  Database,
  TrendingUp,
  CheckCircle2,
  Bot,
  Layers,
  Workflow,
  ArrowRight,
  Clock,
  Activity,
  Settings,
  BarChart3,
  Zap,
  Shield,
  Target,
  Cpu,
  RefreshCw,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

interface SystemState {
  engines: any[]
  indications: Record<string, number>
  pseudoPositions: number
  realPositions: number
  performance: any
  timestamp: string
}

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("main")
  const [systemState, setSystemState] = useState<SystemState | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSystemState = async () => {
    try {
      const response = await fetch("/api/logistics/system-state")
      if (response.ok) {
        const data = await response.json()
        setSystemState(data)
      }
    } catch (error) {
      console.error("Failed to fetch system state:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemState()
    const interval = setInterval(fetchSystemState, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <PageHeader
          title="System Logistics & Trade Workflow"
          description="Complete end-to-end visualization of Main System, Preset Trade, and Trading Bots with real-time execution data"
          icon={Workflow}
        />

        <div className="flex-1 overflow-auto p-6">
          <Card className="border-2 border-primary mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Database className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold text-lg">Live System Status</div>
                    <div className="text-sm text-muted-foreground">
                      {systemState ? (
                        <>
                          {systemState.engines.length} Active Engines • {systemState.realPositions} Real Positions •{" "}
                          {systemState.pseudoPositions} Pseudo Positions • Updated:{" "}
                          {new Date(systemState.timestamp).toLocaleTimeString()}
                        </>
                      ) : (
                        "Loading system data..."
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={fetchSystemState} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-2 border-primary mb-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>System Architecture:</strong> Dual-mode parallel trade engine with 3 independent loops (Preset,
              Main, Real Positions), 70+ database indexes, parallel symbol processing, and sub-second query performance
              for high-frequency operations.
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

            {/* MAIN SYSTEM TAB */}
            <TabsContent value="main" className="space-y-6 mt-6">
              <Alert className="border-2 border-primary">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Main System Trade Mode:</strong> Advanced step-based indication system with 4 indication types
                  (Direction, Move, Active, Optimal). Each indication generates up to 250 pseudo positions with parallel
                  symbol processing.
                  {systemState && (
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Direction: {systemState.indications["direction"] || 0} active</Badge>
                      <Badge variant="secondary">Move: {systemState.indications["move"] || 0} active</Badge>
                      <Badge variant="secondary">Active: {systemState.indications["active"] || 0} active</Badge>
                      <Badge variant="secondary">Optimal: {systemState.indications["optimal"] || 0} active</Badge>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Phase 1: System Initialization */}
              <Card className="border-2 border-blue-500/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <div>
                      <div>System Initialization & Startup</div>
                      <CardDescription className="mt-1">
                        Core settings load, database preparation, and WebSocket initialization
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {systemState && systemState.engines.length > 0 && (
                    <Alert className="mb-4">
                      <Activity className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        <strong>Current Engine Status:</strong>{" "}
                        {systemState.engines.map((e: any) => (
                          <Badge key={e.connection_id} variant="outline" className="ml-2">
                            {e.connection_name}: {e.status.toUpperCase()}
                            {e.prehistoric_data_loaded ? " ✓" : " (loading data)"}
                          </Badge>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        System Configuration Load
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Position Cost: $0.10 per trade</div>
                        <div>• Base Volume Factor: 1.0x</div>
                        <div>• Positions Average: 50 positions</div>
                        <div>• Max Leverage: User-defined (1-20x)</div>
                        <div>• Leverage %: 80% of max available</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Engine Timing Configuration
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Main Trade Interval: 1.0s</div>
                        <div>• Preset Trade Interval: 2.0s (independent)</div>
                        <div>• Real Positions Interval: 0.3s (mirror sync)</div>
                        <div>• Market Data Timeframe: 1 second candles</div>
                        <div>• Historical Data Range: 5 days prehistoric</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database Preparation
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• SQLite as default (zero config)</div>
                        <div>• 70+ performance indexes active</div>
                        <div>• Connection-level coordination</div>
                        <div>• Symbol-level async processing</div>
                        <div>• Sub-second query performance</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Exchange Connections
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Load active connections</div>
                        <div>• Validate API credentials</div>
                        <div>• Initialize WebSocket streams (Bybit v5)</div>
                        <div>• Setup rate limit handlers</div>
                        <div>• Test connectivity & balance</div>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Initialization Complete:</strong> All systems loaded, database ready with indexes,
                      connections validated, prehistoric data loading in background. Trade engine ready to start
                      parallel loops.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Phase 2: Main Trade Interval Loop */}
              <Card className="border-2 border-purple-500/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                    <div>
                      <div>Main Trade Interval Loop (1.0s)</div>
                      <CardDescription className="mt-1">
                        Non-overlapping execution: Indications → Strategies → Validation → Positions
                        {systemState?.performance?.avg_cycle_duration && (
                          <span className="text-green-600 font-semibold ml-2">
                            Avg: {Math.round(systemState.performance.avg_cycle_duration)}ms
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Alert className="border-blue-500/50 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <strong>Non-Overlapping Execution:</strong> New interval cycle starts ONLY after previous cycle
                      completes entirely. This prevents race conditions and ensures data consistency across all
                      processing stages.
                    </AlertDescription>
                  </Alert>

                  {/* Step 2A: Process Indications */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <ArrowRight className="h-5 w-5 text-blue-500" />
                      Step 2A: Process Indications (Parallel by Symbol)
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Direction Type Indication
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Step ranges: 3-30 steps configurable</div>
                          <div>• Direction: LONG or SHORT</div>
                          <div>• Interval: 60s by default</div>
                          <div>• Timeout: 300s max calculation time</div>
                          <div>• Generates pseudo positions per step</div>
                          <div>• Validates against 5-day historical data</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Move Type Indication
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Step ranges: 3-30 steps</div>
                          <div>• Detects price movements patterns</div>
                          <div>• Interval: 90s by default</div>
                          <div>• Momentum-based analysis</div>
                          <div>• Volume correlation checks</div>
                          <div>• Volatility adjustments</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Active Type Indication
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Threshold: 0.5% - 2.5% price change</div>
                          <div>• Real-time market activity detection</div>
                          <div>• Interval: 30s for quick response</div>
                          <div>• Immediate opportunity capture</div>
                          <div>• High-frequency compatible</div>
                          <div>• Liquidity validation required</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          Optimal Type Indication
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Advanced multi-factor analysis</div>
                          <div>• Combines Direction + Move + Active</div>
                          <div>• ML-assisted optimization</div>
                          <div>• Adaptive step calculation</div>
                          <div>• Historical pattern matching</div>
                          <div>• Risk-adjusted positioning</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="font-medium mb-2">Indication Processing Output</div>
                      <div className="text-sm text-muted-foreground">
                        Each indication type generates up to 250 pseudo positions with calculated entry/exit points,
                        stop losses, take profits, and expected profit factors. All data is stored with symbol-level
                        indexing for instant retrieval.
                        {systemState && (
                          <span className="font-semibold text-primary ml-2">
                            Currently: {systemState.pseudoPositions} pseudo positions active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Step 2B: Process Strategies */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <ArrowRight className="h-5 w-5 text-purple-500" />
                      Step 2B: Process Strategies (Parallel by Symbol)
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                        <div className="font-semibold mb-3">Momentum Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Detects strong trending markets</div>
                          <div>• RSI &gt; 70 or RSI &lt; 30 triggers</div>
                          <div>• Volume confirmation required</div>
                          <div>• Trailing stop loss enabled</div>
                          <div>• Risk/Reward: 1:2 minimum</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-pink-500 bg-pink-500/5">
                        <div className="font-semibold mb-3">Mean Reversion Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Identifies oversold/overbought</div>
                          <div>• Bollinger Bands extremes (&gt;2σ)</div>
                          <div>• Quick profit targets (1-3%)</div>
                          <div>• Tight stop losses (0.5-1%)</div>
                          <div>• High win rate strategy</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-indigo-500 bg-indigo-500/5">
                        <div className="font-semibold mb-3">Breakout Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Support/resistance breaks</div>
                          <div>• Volume surge confirmation (2x avg)</div>
                          <div>• Explosive move capture</div>
                          <div>• Position size scaling</div>
                          <div>• Consolidation pattern required</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-teal-500 bg-teal-500/5">
                        <div className="font-semibold mb-3">Trend Following Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• EMA crossovers (9/21/50)</div>
                          <div>• MACD signal alignment</div>
                          <div>• Long-term position holding</div>
                          <div>• Pyramid entry allowed</div>
                          <div>• ADX &gt; 25 strength filter</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="font-medium mb-2">Strategy Execution Flow</div>
                      <div className="text-sm text-muted-foreground">
                        Each strategy evaluates all active indications and their pseudo positions. Strategies can
                        modify, enhance, or reject positions based on their rules. Final positions are marked with
                        strategy IDs for tracking and performance analysis.
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Step 2C: Validation & Real Position Creation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <ArrowRight className="h-5 w-5 text-green-500" />
                      Step 2C: Validation & Real Position Creation
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Validation Criteria
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>
                            • <strong>Profit Factor:</strong> Must be ≥ 0.6
                          </div>
                          <div>
                            • <strong>Max Drawdown Time:</strong> ≤ 12 hours
                          </div>
                          <div>
                            • <strong>Win Rate:</strong> Minimum 45%
                          </div>
                          <div>
                            • <strong>Risk/Reward Ratio:</strong> At least 1:1.5
                          </div>
                          <div>
                            • <strong>Liquidity Check:</strong> Sufficient volume
                          </div>
                          <div>
                            • <strong>Spread Check:</strong> Below 0.1% threshold
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Position Creation
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Convert pseudo → real position</div>
                          <div>• Calculate exact order quantities</div>
                          <div>• Set leverage and margin mode</div>
                          <div>• Configure stop loss & take profit</div>
                          <div>• Enable trailing if applicable</div>
                          <div>• Store in database with all metadata</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Performance Metrics Logging
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Every validated position is logged with complete performance metrics: entry/exit prices,
                        profit/loss, win/loss ratio, holding time, slippage, and strategy effectiveness. This data feeds
                        into the ML optimization system for continuous improvement.
                        {systemState && systemState.realPositions > 0 && (
                          <span className="font-semibold text-primary ml-2">
                            Currently tracking: {systemState.realPositions} real positions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-6 border-green-500/50 bg-green-500/5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Trade Interval Cycle Complete:</strong> All symbols processed, strategies applied,
                      positions validated and created. Ready for next interval cycle after 1.0s delay.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Phase 3: Real Positions Management Loop */}
              <Card className="border-2 border-green-500/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <div>
                      <div>Real Positions Management Loop (0.3s)</div>
                      <CardDescription className="mt-1">
                        Continuous monitoring and management of all active positions with exchange mirroring
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Alert>
                    <Activity className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Real-Time Position Management:</strong> This loop runs independently at 300ms intervals,
                      monitoring all active positions, updating P&L, checking stop/take profit triggers, and
                      synchronizing with exchange positions via REST API and WebSocket updates.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                      <div className="font-semibold mb-3">Position Monitoring</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Real-time P&L calculation</div>
                        <div>• Stop loss / Take profit checks</div>
                        <div>• Trailing stop updates</div>
                        <div>• Liquidation price monitoring</div>
                        <div>• Margin level validation</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/5">
                      <div className="font-semibold mb-3">Exchange Synchronization</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Mirror exchange positions</div>
                        <div>• Reconcile any discrepancies</div>
                        <div>• Update position quantities</div>
                        <div>• Sync average entry prices</div>
                        <div>• Handle partial fills</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-teal-500 bg-teal-500/5">
                      <div className="font-semibold mb-3">Risk Management</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Portfolio exposure tracking</div>
                        <div>• Max drawdown monitoring</div>
                        <div>• Correlation checks</div>
                        <div>• Auto-hedging if needed</div>
                        <div>• Emergency position closure</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                      <div className="font-semibold mb-3">Order Management</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Close triggered positions</div>
                        <div>• Modify stop/take levels</div>
                        <div>• Handle order rejections</div>
                        <div>• Retry failed orders</div>
                        <div>• Log all order activity</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PRESET TRADE TAB */}
            <TabsContent value="preset" className="space-y-6 mt-6">
              <Alert className="border-2 border-primary">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preset Trade Mode:</strong> Uses common technical indicators (RSI, MACD, Bollinger Bands, SAR,
                  ADX) for quick trade setup. Runs in parallel to Main System with 2.0s intervals. Ideal for preset
                  indicator configurations and backtesting.
                </AlertDescription>
              </Alert>

              <Card className="border-2 border-indigo-500/20">
                <CardHeader>
                  <CardTitle>Preset Indicator System</CardTitle>
                  <CardDescription>Configure and test standard technical indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">RSI (Relative Strength Index)</div>
                      <div className="text-sm text-muted-foreground">Period: 14, Overbought: 70, Oversold: 30</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">MACD</div>
                      <div className="text-sm text-muted-foreground">Fast: 12, Slow: 26, Signal: 9</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">Bollinger Bands</div>
                      <div className="text-sm text-muted-foreground">Period: 20, StdDev: 2</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">Parabolic SAR</div>
                      <div className="text-sm text-muted-foreground">Acceleration: 0.02, Max: 0.2</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">ADX</div>
                      <div className="text-sm text-muted-foreground">Period: 14, Threshold: 25</div>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold mb-2">EMA Crossover</div>
                      <div className="text-sm text-muted-foreground">Fast: 9, Slow: 21</div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Preset indicators can be configured per connection and tested independently before enabling live
                      trading. All indicators support custom parameters and can be combined for signal confirmation.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TRADING BOTS TAB */}
            <TabsContent value="bot" className="space-y-6 mt-6">
              <Alert className="border-2 border-primary">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trading Bots:</strong> Specialized automated trading strategies for specific market
                  conditions. Each bot type has unique logic and risk parameters optimized for its trading style.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Grid Trading Bot
                    </CardTitle>
                    <CardDescription>Range-bound market profit capture</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>• Creates buy/sell grid in price range</div>
                    <div>• Profits from oscillations</div>
                    <div>• Configurable grid spacing</div>
                    <div>• Auto-rebalancing</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      DCA Bot (Dollar Cost Average)
                    </CardTitle>
                    <CardDescription>Systematic position building</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>• Averages entry price over time</div>
                    <div>• Reduces timing risk</div>
                    <div>• Configurable intervals</div>
                    <div>• Take profit on target</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Arbitrage Bot
                    </CardTitle>
                    <CardDescription>Cross-exchange price differences</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>• Monitors multiple exchanges</div>
                    <div>• Exploits price discrepancies</div>
                    <div>• Low-risk strategy</div>
                    <div>• Requires fast execution</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Market Making Bot
                    </CardTitle>
                    <CardDescription>Liquidity provision with spread capture</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div>• Places bid/ask orders</div>
                    <div>• Earns spread difference</div>
                    <div>• Manages inventory risk</div>
                    <div>• High-frequency updates</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
