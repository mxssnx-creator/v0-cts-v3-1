"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Info,
  Database,
  TrendingUp,
  CheckCircle2,
  Bot,
  Layers,
  Workflow,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  Clock,
  Activity,
  Settings,
  BarChart3,
  GitBranch,
  Zap,
  Shield,
  Target,
  Cpu,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { PageHeader } from "@/components/layout/page-header"

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("main")

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <PageHeader
          title="System Logistics & Trade Workflow"
          description="Complete end-to-end visualization of Main System, Preset Trade, and Trading Bots with detailed execution flow"
          icon={Workflow}
        />

        <div className="flex-1 overflow-auto p-6">
          <Alert className="border-2 border-primary mb-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>System Architecture:</strong> High-performance trade engine with 70+ database indexes, parallel
              symbol processing, async coordination, and sub-second query performance for high-frequency operations.
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
                  <strong>Main System Trade Mode:</strong> Advanced step-based indication system with comprehensive
                  strategy validation, generating up to 250 pseudo positions per indication across 4 indication types
                  (Direction, Move, Active, Optimal) with parallel symbol processing.
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
                      <CardDescription className="mt-1">Core settings load and database preparation</CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
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
                        <div>• Preset Trade Interval: 2.0s</div>
                        <div>• Real Positions Interval: 0.3s</div>
                        <div>• Market Data Timeframe: 1 second</div>
                        <div>• Historical Data Range: 5 days</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database Preparation
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• SQLite as default (optimized)</div>
                        <div>• 70+ performance indexes created</div>
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
                        <div>• Load active connections (Bybit, BingX)</div>
                        <div>• Validate API credentials</div>
                        <div>• Initialize WebSocket streams</div>
                        <div>• Setup rate limit handlers</div>
                        <div>• Test connectivity</div>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Initialization Complete:</strong> All systems loaded, database ready, connections
                      validated. Trade engine ready to start interval loops.
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
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Alert className="border-blue-500/50 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <strong>Non-Overlapping Execution:</strong> New interval cycle starts ONLY after previous cycle
                      completes entirely. This prevents race conditions and ensures data consistency.
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
                          <div>• Validates against historical data</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Move Type Indication
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Step ranges: 3-30 steps</div>
                          <div>• Detects price movements</div>
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
                          <div>• Liquidity validation</div>
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
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-pink-500 bg-pink-500/5">
                        <div className="font-semibold mb-3">Mean Reversion Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Identifies oversold/overbought</div>
                          <div>• Bollinger Bands extremes</div>
                          <div>• Quick profit targets (1-3%)</div>
                          <div>• Tight stop losses</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-indigo-500 bg-indigo-500/5">
                        <div className="font-semibold mb-3">Breakout Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Support/resistance breaks</div>
                          <div>• Volume surge confirmation</div>
                          <div>• Explosive move capture</div>
                          <div>• Position size scaling</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-teal-500 bg-teal-500/5">
                        <div className="font-semibold mb-3">Trend Following Strategy</div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• EMA crossovers (9/21/50)</div>
                          <div>• MACD signal alignment</div>
                          <div>• Long-term position holding</div>
                          <div>• Pyramid entry allowed</div>
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
                        Every validated position is logged with: symbol, direction, entry price, quantity, leverage,
                        profit factor, drawdown time, strategy ID, indication ID, timestamp, and connection ID. This
                        enables comprehensive performance tracking and strategy optimization.
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

              {/* Phase 3: Real Positions Management */}
              <Card className="border-2 border-green-500/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <div>
                      <div>Real Positions Management Interval (0.3s)</div>
                      <CardDescription className="mt-1">
                        Independent exchange position synchronization and order execution
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Alert className="border-blue-500/50 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <strong>Independent Operation:</strong> This interval runs completely independently from the Trade
                      Interval Loop, ensuring exchange operations don't block indication/strategy processing.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Position Opening
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Fetch pending positions from database</div>
                          <div>• Check exchange balance & margin</div>
                          <div>• Execute market/limit orders</div>
                          <div>• Set stop loss & take profit orders</div>
                          <div>• Confirm order fill status</div>
                          <div>• Update database with order IDs</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Position Monitoring
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Track all active positions</div>
                          <div>• Update current PnL in real-time</div>
                          <div>• Check trailing stop conditions</div>
                          <div>• Monitor for liquidation risk</div>
                          <div>• Adjust stop loss if trailing enabled</div>
                          <div>• Log position state changes</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-red-500 bg-red-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <PauseCircle className="h-4 w-4" />
                          Position Closing
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Take profit hit → close immediately</div>
                          <div>• Stop loss hit → close immediately</div>
                          <div>• Manual close request → execute</div>
                          <div>• Time-based close (max duration)</div>
                          <div>• Record final PnL and metrics</div>
                          <div>• Archive position data</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Exchange Synchronization
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 ml-4">
                          <div>• Fetch all open positions from exchange</div>
                          <div>• Compare with database records</div>
                          <div>• Reconcile any discrepancies</div>
                          <div>• Handle partially filled orders</div>
                          <div>• Process exchange notifications</div>
                          <div>• Rate limit compliance (10 req/s)</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                      <div className="font-semibold mb-2">Error Handling & Recovery</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• Network errors: Retry with exponential backoff (max 3 attempts)</div>
                        <div>• Insufficient balance: Skip order and log warning</div>
                        <div>• Order rejection: Log reason and mark position as failed</div>
                        <div>• Exchange downtime: Queue operations for later execution</div>
                        <div>• Rate limit exceeded: Delay next request automatically</div>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-green-500/50 bg-green-500/5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>Real Positions Interval Complete:</strong> All exchange operations executed, positions
                      synced, database updated. Next cycle starts in 0.3s.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* System Coordination Summary */}
              <Card className="border-2 border-primary shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    System Coordination & Performance
                  </CardTitle>
                  <CardDescription>How the intervals work together</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border">
                      <div className="font-semibold mb-3 text-purple-600">Trade Interval (1.0s)</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          • <strong>Non-overlapping:</strong> Waits for completion
                        </div>
                        <div>
                          • <strong>Parallel Processing:</strong> By symbol
                        </div>
                        <div>
                          • <strong>Output:</strong> Validated real positions
                        </div>
                        <div>
                          • <strong>Dependencies:</strong> Historical data only
                        </div>
                        <div>
                          • <strong>Performance:</strong> ~500-800ms typical
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border">
                      <div className="font-semibold mb-3 text-green-600">Real Positions Interval (0.3s)</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          • <strong>Independent:</strong> Doesn't block trade interval
                        </div>
                        <div>
                          • <strong>Fast Execution:</strong> Exchange API calls
                        </div>
                        <div>
                          • <strong>Output:</strong> Synced exchange positions
                        </div>
                        <div>
                          • <strong>Dependencies:</strong> Network latency
                        </div>
                        <div>
                          • <strong>Performance:</strong> ~100-200ms typical
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="font-semibold mb-2 text-lg">Database Performance Optimizations</div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div>
                        • <strong>70+ Indexes:</strong> Symbol, timestamp, connection, indication type, strategy ID
                      </div>
                      <div>
                        • <strong>Query Performance:</strong> Sub-100ms for most operations, sub-10ms for indexed
                        lookups
                      </div>
                      <div>
                        • <strong>Async Coordination:</strong> Symbol-level semaphores prevent duplicate work
                      </div>
                      <div>
                        • <strong>Caching Layers:</strong> Active positions cached for 1s, market data for 500ms
                      </div>
                      <div>
                        • <strong>Batch Operations:</strong> Up to 10 concurrent symbols processed in parallel
                      </div>
                      <div>
                        • <strong>Connection Pooling:</strong> Reuses database connections, prevents exhaustion
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High-Frequency Ready:</strong> The system can handle 100+ symbols across multiple
                      exchanges with sub-second response times, maintaining data consistency through proper async
                      coordination.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PRESET TRADE TAB */}
            <TabsContent value="preset" className="space-y-6 mt-6">
              <Alert className="border-2 border-blue-500/50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preset Trade Mode:</strong> Uses common technical indicators (RSI, MACD, Bollinger Bands,
                  etc.) with automated configuration testing across 100-1,000 parameter sets for optimal performance
                  discovery.
                </AlertDescription>
              </Alert>

              <Card className="border-2 border-blue-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Preset Trade System Architecture</CardTitle>
                  <CardDescription>Indicator-based trading with automated optimization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                      <div className="font-semibold mb-3">Supported Indicators</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>
                          • <strong>RSI:</strong> Period 14, oversold 30, overbought 70
                        </div>
                        <div>
                          • <strong>MACD:</strong> Fast 12, Slow 26, Signal 9
                        </div>
                        <div>
                          • <strong>Bollinger Bands:</strong> Period 20, StdDev 2
                        </div>
                        <div>
                          • <strong>EMA:</strong> Multiple periods (9, 21, 50, 200)
                        </div>
                        <div>
                          • <strong>SMA:</strong> Simple moving averages
                        </div>
                        <div>
                          • <strong>Parabolic SAR:</strong> Trend following
                        </div>
                        <div>
                          • <strong>Stochastic:</strong> Momentum oscillator
                        </div>
                        <div>
                          • <strong>ADX:</strong> Trend strength indicator
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                      <div className="font-semibold mb-3">Configuration Testing</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Test 100-1,000 config combinations</div>
                        <div>• Backtest on 5 days of historical data</div>
                        <div>• Calculate profit factor for each</div>
                        <div>• Rank by performance metrics</div>
                        <div>• Select top 10 configurations</div>
                        <div>• Live trade with best performers</div>
                        <div>• Continuous re-optimization</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                      <div className="font-semibold mb-3">Signal Generation</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Indicator values calculated per candle</div>
                        <div>• Multi-timeframe analysis (1m, 5m, 15m)</div>
                        <div>• Signal confluence required (2+ indicators)</div>
                        <div>• Entry condition validation</div>
                        <div>• Dynamic stop loss calculation</div>
                        <div>• Take profit target optimization</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                      <div className="font-semibold mb-3">Performance Tracking</div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Win rate per indicator combination</div>
                        <div>• Average profit per trade</div>
                        <div>• Max drawdown percentage</div>
                        <div>• Sharpe ratio calculation</div>
                        <div>• Recovery time from losses</div>
                        <div>• Auto-disable poor performers</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="font-semibold mb-2">Preset Trade Interval: 2.0s</div>
                    <div className="text-sm text-muted-foreground">
                      Runs independently from Main System. Each cycle: fetches market data → calculates all indicators →
                      generates signals → validates against current positions → executes trades on exchange. Optimized
                      for indicator-based strategies that don't require step calculations.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TRADING BOTS TAB */}
            <TabsContent value="bot" className="space-y-6 mt-6">
              <Alert className="border-2 border-green-500/50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trading Bots:</strong> Automated custom strategies with independent logic, risk management,
                  and execution. Each bot type implements specific trading methodologies.
                </AlertDescription>
              </Alert>

              <Card className="border-2 border-green-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Trading Bot Categories</CardTitle>
                  <CardDescription>Specialized automated trading strategies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Grid Trading Bot
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Places buy/sell orders at set intervals</div>
                        <div>• Profits from price oscillations</div>
                        <div>• Configurable grid size and spacing</div>
                        <div>• Works best in ranging markets</div>
                        <div>• Auto-rebalancing on trends</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        DCA Bot (Dollar Cost Averaging)
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Accumulates positions over time</div>
                        <div>• Averages entry price on dips</div>
                        <div>• Reduces timing risk</div>
                        <div>• Configurable buy intervals</div>
                        <div>• Smart exit on profit targets</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Arbitrage Bot
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Finds price differences across exchanges</div>
                        <div>• Executes simultaneous buy/sell</div>
                        <div>• Risk-free profits (minus fees)</div>
                        <div>• Requires fast execution</div>
                        <div>• Cross-exchange balance management</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Market Making Bot
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• Provides liquidity to order books</div>
                        <div>• Places bids and asks simultaneously</div>
                        <div>• Profits from bid-ask spread</div>
                        <div>• Dynamic spread adjustment</div>
                        <div>• Inventory risk management</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-l-4 border-l-pink-500 bg-pink-500/5 md:col-span-2">
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        Custom Bot Framework
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 ml-4">
                        <div>• User-defined trading logic</div>
                        <div>• Python/TypeScript scripting support</div>
                        <div>• Access to all market data and indicators</div>
                        <div>• Built-in risk management hooks</div>
                        <div>• Backtesting before live deployment</div>
                        <div>• Real-time performance monitoring</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="font-semibold mb-2">Bot Management Features</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        • <strong>Independent Operation:</strong> Each bot runs in its own process with isolated risk
                      </div>
                      <div>
                        • <strong>Per-Bot Limits:</strong> Max position size, daily loss limits, stop conditions
                      </div>
                      <div>
                        • <strong>Performance Tracking:</strong> Individual PnL, win rate, and execution metrics
                      </div>
                      <div>
                        • <strong>Auto-Shutdown:</strong> Stops trading if performance degrades below threshold
                      </div>
                      <div>
                        • <strong>Logging & Alerts:</strong> Real-time notifications for trades and errors
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
