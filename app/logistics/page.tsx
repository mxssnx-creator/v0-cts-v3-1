"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, Database, TrendingUp, CheckCircle2, AlertTriangle, Bot, Layers } from "lucide-react"

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("main")

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logistics</h1>
        <p className="text-muted-foreground mt-2">
          Complete workflow visualization for Main System, Presets, and Trading Bots
        </p>
      </div>

      <Separator />

      <Alert className="border-2 border-primary">
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> Database optimized with 50+ indexes, automatic script execution enabled, step
          ratio controls active (0.2-1.0 default).
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

        {/* Main System Trade Logistics */}
        <TabsContent value="main" className="space-y-6 mt-6">
          {/* Trade Mode Alert */}
          <Alert className="border-2 border-primary">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Main System Trade Mode:</strong> Uses step-based indication calculations (Direction, Move, Active
              types with 3-30 step ranges) generating up to 250 pseudo positions per indication.
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
              <CardDescription>System startup and prehistoric data loading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1.1 */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.1 Load System Settings from Database</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>
                    • <strong>Trade Engine Interval:</strong> 1.0s (default) - Indications + Strategies + Pseudo +
                    Logging
                  </div>
                  <div>
                    • <strong>Real Positions Interval:</strong> 0.3s (default) - Exchange position updates only
                  </div>
                  <div>
                    • <strong>Market Data Timeframe:</strong> 1 second (configurable in Settings / Main)
                  </div>
                  <div>
                    • <strong>Time Range History:</strong> 5 days (configurable 1-12 days in Settings / Main)
                  </div>
                  <div>
                    • <strong>Trade Mode:</strong> Preset Trade OR Main System Trade (Settings / Main)
                  </div>
                  <div>
                    • <strong>Validation Timeout:</strong> 15 seconds (after indication validated)
                  </div>
                  <div>
                    • <strong>Position Cooldown:</strong> 20 seconds (wait before new position from same config)
                  </div>
                  <div>
                    • <strong>Max Positions Per Config:</strong> 1 (only one active position per configuration set)
                  </div>
                  <div>
                    • <strong>Forced Symbols:</strong> Always included (e.g., XRP, BCH)
                  </div>
                </div>
              </div>

              {/* Step 1.2 */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.2 Load Symbols</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>
                    • <strong>Mode: Main Symbols</strong> → Use configured list + forced symbols
                  </div>
                  <div>
                    • <strong>Mode: Exchange Symbols</strong> → Fetch top N by volume + forced symbols
                  </div>
                  <div>
                    • <strong>Mode: Default Symbols</strong> → Use fallback list + forced symbols
                  </div>
                  <div className="text-primary font-medium">
                    → Result: Unique symbol list (25-100 symbols, forced symbols always included)
                  </div>
                </div>
              </div>

              {/* Step 1.3 */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  1.3 Load Prehistoric Data (Async per Symbol)
                  <Badge className="bg-blue-500">Parallel</Badge>
                </div>
                <div className="text-sm space-y-2 ml-4">
                  <div className="font-medium text-blue-600">Async Processing:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• All symbols processed simultaneously (concurrency limit: 10)</div>
                    <div>• Time Range: Last 5 days (from settings)</div>
                    <div>• Timeframe: 1 second candles (from settings)</div>
                    <div>• Data per symbol: ~432,000 candles (5 days × 86,400 seconds)</div>
                  </div>

                  <div className="font-medium text-blue-600 mt-2">Data Loading Sequence:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>1. Fetch OHLCV data from exchange</div>
                    <div>2. Calculate technical indicators (RSI, MACD, Bollinger, etc.)</div>
                    <div>3. Generate indication signals (for Preset Trade mode)</div>
                    <div>4. Calculate step-based indications (for Main System Trade mode)</div>
                    <div>5. Evaluate strategies and create pseudo positions</div>
                    <div>6. Store all data in database</div>
                  </div>

                  <div className="font-medium text-blue-600 mt-2">Purpose:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• Enables historical validation of strategies</div>
                    <div>• Calculates profit factors from past performance</div>
                    <div>• Identifies best-performing configurations</div>
                    <div>• Provides baseline for real-time comparisons</div>
                  </div>

                  <div className="mt-2 p-3 bg-background rounded border">
                    <div className="text-xs font-mono text-primary">
                      ⏱️ Estimated Time: 30-120 seconds (depends on symbol count and exchange API speed)
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1.4 */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.4 Initialize Market Data Stream</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Connect to exchange WebSocket</div>
                  <div>• Subscribe to all symbols simultaneously</div>
                  <div>• Real-time price updates (1-second candles)</div>
                  <div>• Automatic reconnection on disconnect</div>
                </div>
              </div>

              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Initialization Complete:</strong> System ready to start Trade Engine intervals
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Phase 2: Trade Interval Loop */}
          <Card className="border-2 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                Trade Interval Loop (1.0s)
              </CardTitle>
              <CardDescription>Indications → Strategies → Pseudo Positions → Logging (Non-Overlapping)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Non-Overlapping Execution:</strong> New interval starts ONLY after previous completes.
                  Prevents race conditions and ensures data consistency.
                </AlertDescription>
              </Alert>

              {/* Stage 2.1 - Indications */}
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <span>2.1 Process Indications (Base Pseudo Positions)</span>
                  <Badge className="bg-blue-500">Parallel by Symbol</Badge>
                </div>

                {/* Preset Trade Mode */}
                <div className="mb-4 p-3 rounded border bg-background">
                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Badge variant="outline">Preset Trade Mode</Badge>
                    Common Indicators
                  </div>
                  <div className="text-sm space-y-2 ml-4">
                    <div className="font-medium text-blue-600">Indicators Used:</div>
                    <div className="ml-4 space-y-1 text-muted-foreground">
                      <div>• RSI (Relative Strength Index) - Overbought/oversold</div>
                      <div>• MACD (Moving Average Convergence Divergence) - Trend momentum</div>
                      <div>• Bollinger Bands - Volatility and price extremes</div>
                      <div>• Parabolic SAR - Trend direction and reversal</div>
                      <div>• EMA (Exponential Moving Average) - Trend following</div>
                      <div>• SMA (Simple Moving Average) - Support/resistance</div>
                      <div>• Stochastic Oscillator - Momentum</div>
                      <div>• ADX (Average Directional Index) - Trend strength</div>
                    </div>

                    <div className="font-medium text-blue-600 mt-2">Signal Generation:</div>
                    <div className="ml-4 space-y-1 text-muted-foreground">
                      <div>• Each indicator generates: BUY, SELL, or NEUTRAL</div>
                      <div>
                        • Example: RSI {"<"} 30 → BUY, RSI {">"} 70 → SELL
                      </div>
                      <div>• Signals combined for confluence (2+ indicators agree)</div>
                    </div>

                    <div className="font-medium text-blue-600 mt-2">Calculation Possibilities:</div>
                    <div className="ml-4 space-y-1 text-muted-foreground">
                      <div>
                        • <strong>Per Symbol:</strong> 8 indicators × 2 signals = 16 base positions max
                      </div>
                      <div>
                        • <strong>Total (50 symbols):</strong> 800 base positions per interval
                      </div>
                      <div>
                        • <strong>Filtered:</strong> Only profit_factor ≥ 0.6 stored (typically 10-20% pass)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main System Trade Mode */}
                <div className="p-3 rounded border bg-background">
                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Badge variant="outline">Main System Trade Mode</Badge>
                    Step-Based Indication Calculations
                  </div>
                  <div className="text-sm space-y-2 ml-4">
                    <div className="font-medium text-green-600">Indication Types:</div>
                    <div className="ml-4 space-y-2 text-muted-foreground">
                      <div>
                        <strong>1. Direction Type (3-30 step ranges):</strong>
                        <div className="ml-4 mt-1">
                          • Uses simple average vs endpoint comparison
                          <br />• Recent average significantly different from older price
                          <br />• Threshold: 0.5% change
                          <br />• Used for: Reversal trading strategies
                        </div>
                      </div>
                      <div>
                        <strong>2. Move Type (3-30 step ranges):</strong>
                        <div className="ml-4 mt-1">
                          • Uses endpoint comparison method
                          <br />• Current price vs price N steps ago
                          <br />• Threshold: 0.3% absolute change
                          <br />• Used for: Trend following strategies
                        </div>
                      </div>
                      <div>
                        <strong>3. Active Type (0.5-2.5% thresholds):</strong>
                        <div className="ml-4 mt-1">
                          • Fast price change detection within 1 minute
                          <br />• Threshold: 0.5-2.5% configurable
                          <br />• Used for: Breakout and volatility strategies
                        </div>
                      </div>
                      <div>
                        <strong>4. Optimal Type (Advanced - 3-30 step ranges):</strong>
                        <div className="ml-4 mt-1">
                          • <strong>Consecutive Step Detection:</strong> Counts actual consecutive price movements
                          <br />• <strong>Market Change Tracking:</strong> 3+ second validation with acceleration checks
                          <br />• <strong>Base Pseudo Layer:</strong> 250 position limit with performance filtering
                          <br />• <strong>Performance Thresholds:</strong>
                          <div className="ml-4 mt-1">
                            - Phase 1 (10 positions): 40% win rate required
                            <br />- Phase 2 (50 positions): 45% win rate + 1.2x profit ratio
                            <br />- Production: 42% win rate, max 30% drawdown
                          </div>
                          <br />• <strong>Drawdown Ratios:</strong> 0.1-0.5 (5 variations)
                          <br />• <strong>Market Change Ranges:</strong> 1,3,5,7,9 (direction/move) or 1-10 (active)
                          <br />• <strong>Last Part Ratios:</strong> 1.0-2.5 (4 variations)
                          <br />• <strong>Position Matrix:</strong> TP(11) × SL(21) × Trailing(4) = 924 per base config
                          <br />• Used for: High-precision trading with validated configurations
                        </div>
                      </div>
                    </div>

                    <div className="font-medium text-green-600 mt-3">Complete Position Flow Architecture:</div>
                    <div className="ml-4 space-y-2 text-muted-foreground">
                      <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <strong className="text-lg block mb-2">
                          ✓ CORRECTED ARCHITECTURE - UNLIMITED CONFIGURATION SETS:
                        </strong>

                        <div className="mt-3 space-y-3">
                          <div className="p-3 bg-background rounded border-2 border-green-500">
                            <strong className="text-green-600">1. BASE PSEUDO POSITIONS (Indication Valid):</strong>
                            <div className="mt-2 space-y-1">
                              <div>
                                • <strong>Created when:</strong> Indication is VALID (Direction/Move/Active/Optimal
                                detected)
                              </div>
                              <div>
                                • <strong>Purpose:</strong> Base layer for valid market indications
                              </div>
                              <div>
                                • <strong>Configuration sets:</strong> UNLIMITED (each TP/SL/Trailing combo = separate
                                set)
                              </div>
                              <div>
                                • <strong>Database limit per set:</strong> 250 entries maximum in pseudo_positions table
                              </div>
                              <div>
                                • <strong>Total possible:</strong> 11 TP × 21 SL × 4 Trailing = 924 sets × 250 entries =
                                231,000 positions
                              </div>
                              <div>
                                • <strong>Performance tracking:</strong> win_rate, profit_loss, drawdown per
                                base_position_id
                              </div>
                              <div>
                                • <strong>Status progression:</strong> evaluating → active → paused → failed
                              </div>
                              <div>
                                • <strong>Evaluation phases:</strong>
                              </div>
                              <div className="ml-4">
                                - Phase 1 (10 positions): Requires 40% win rate
                                <br />- Phase 2 (50 positions): Requires 45% win rate + 1.2x profit ratio
                                <br />- Production (50+ positions): Requires 42% win rate, max 30% drawdown
                              </div>
                              <div className="mt-2 p-2 bg-green-500/10 rounded border">
                                <strong>Key Point:</strong> Each unique config (TP=2/SL=0.2/Trailing=OFF) creates ONE
                                base position entry in base_pseudo_positions table, which can link to up to 250
                                pseudo_positions entries.
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-background rounded border-2 border-blue-500">
                            <strong className="text-blue-600">2. MAIN PSEUDO POSITIONS (Evaluating from Base):</strong>
                            <div className="mt-2 space-y-1">
                              <div>
                                • <strong>Created when:</strong> Base position meets profit factor threshold (≥ 0.5)
                              </div>
                              <div>
                                • <strong>Purpose:</strong> EVALUATE FROM base pseudo with enhanced strategies
                              </div>
                              <div>
                                • <strong>Evaluation criteria:</strong>
                              </div>
                              <div className="ml-4">
                                - Profit factor from base ≥ 0.5
                                <br />- Minimum 10 base positions evaluated
                                <br />- Base position status = "active" or "evaluating"
                              </div>
                              <div>
                                • <strong>Enhancements applied:</strong>
                              </div>
                              <div className="ml-4">
                                - Strategy layer: Momentum, Mean Reversion, Breakout, Trend Following
                                <br />- Adjustment strategies: Block (size scaling after loss), DCA (averaging down)
                                <br />- Previous count tracking (1-100 positions history)
                                <br />- Last state tracking (won/loss affects next sizing)
                              </div>
                              <div>
                                • <strong>Validation filter:</strong> profit_factor ≥ 0.6 from historical performance
                              </div>
                              <div>
                                • <strong>Database:</strong> pseudo_positions table with position_level = 'main'
                              </div>
                              <div>
                                • <strong>Links:</strong> References base_position_id for parent tracking
                              </div>
                              <div className="mt-2 p-2 bg-blue-500/10 rounded border">
                                <strong>Continuous Flow:</strong> When Base position meets threshold → Main position
                                automatically created → Strategies applied → Performance tracked
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-background rounded border-2 border-purple-500">
                            <strong className="text-purple-600">
                              3. REAL PSEUDO POSITIONS (Representing from Main):
                            </strong>
                            <div className="mt-2 space-y-1">
                              <div>
                                • <strong>Created when:</strong> Main position validated with last X positions analysis
                              </div>
                              <div>
                                • <strong>Purpose:</strong> REPRESENT validated Main positions, ready for exchange
                                mirroring
                              </div>
                              <div>
                                • <strong>Validation criteria:</strong>
                              </div>
                              <div className="ml-4">
                                - Recent profit factor ≥ 0.6 (from last 20 Main positions)
                                <br />- Average drawdown time ≤ 12 hours (from last 20 Main positions)
                                <br />- Minimum 10 historical Main positions required
                                <br />- Base position still in good standing (not failed)
                              </div>
                              <div>
                                • <strong>Drawdown time calculation:</strong>
                              </div>
                              <div className="ml-4">
                                - Tracks time from position open to close for last X positions
                                <br />- Calculates average across all tracked positions
                                <br />- Ensures positions don't stay open too long in losing state
                              </div>
                              <div>
                                • <strong>Database:</strong> real_pseudo_positions table
                              </div>
                              <div>
                                • <strong>Links:</strong> References main_config_id and base_config_id
                              </div>
                              <div>
                                • <strong>Status:</strong> validated → ready_for_mirror
                              </div>
                              <div className="mt-2 p-2 bg-purple-500/10 rounded border">
                                <strong>Continuous Flow:</strong> When Main position passes all validations → Real
                                Pseudo automatically created → Ready for exchange mirroring
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-background rounded border-2 border-orange-500">
                            <strong className="text-orange-600">
                              4. ACTIVE EXCHANGE POSITIONS (Mirrored to Exchange):
                            </strong>
                            <div className="mt-2 space-y-1">
                              <div>
                                • <strong>Created when:</strong> Real Pseudo validated with last X exchange positions
                                check
                              </div>
                              <div>
                                • <strong>Purpose:</strong> Actual trading positions on exchange
                              </div>
                              <div>
                                • <strong>Final validation before mirroring:</strong>
                              </div>
                              <div className="ml-4">
                                - Last 30 exchange positions profit factor ≥ 0.6
                                <br />- Recent performance check prevents opening during losing streaks
                                <br />- Ensures system-wide performance acceptable before new trades
                              </div>
                              <div>
                                • <strong>Exchange integration:</strong>
                              </div>
                              <div className="ml-4">
                                - Unique exchange_id assigned for coordination
                                <br />- Real-time price updates via WebSocket
                                <br />- TP/SL/Trailing stop management
                                <br />- Performance statistics tracked
                              </div>
                              <div>
                                • <strong>Database:</strong> active_exchange_positions table
                              </div>
                              <div>
                                • <strong>Coordination logs:</strong> All actions logged for audit trail
                              </div>
                              <div>
                                • <strong>Sync status:</strong> Monitored continuously (synced/out_of_sync)
                              </div>
                              <div className="mt-2 p-2 bg-orange-500/10 rounded border">
                                <strong>Continuous Flow:</strong> Real Pseudo passes final check → Exchange position
                                opened → Updates flow back through all layers
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border-2 border-green-500">
                          <strong className="text-xl block mb-2">
                            ✓ WORKFLOW IS CONTINUOUS, ASYNCHRONOUS, AND OPTIMAL:
                          </strong>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Event-Driven Architecture:</strong> Position close events trigger immediate
                                performance updates across all layers without polling
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Automatic Graduation:</strong> Base → Main → Real → Exchange happens
                                automatically when criteria met, no manual intervention
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Continuous Representation:</strong> Base positions continuously represent
                                actively if validated through complete chain
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Historical Context:</strong> Previous positions tracked at each layer for profit
                                factor and drawdown calculations
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Performance Filtering:</strong> Multiple validation layers ensure only
                                best-performing configurations reach exchange
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-background rounded border">
                              <TrendingUp className="h-5 w-5 inline mr-2 text-primary" />
                              <strong className="text-primary">
                                The workflow creates a self-optimizing system where positions naturally graduate through
                                layers based on performance
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border-2 border-yellow-500">
                          <strong className="text-lg block mb-2">⚡ PERFORMANCE & OPTIMIZATION:</strong>
                          <div className="mt-2 space-y-1">
                            <div>
                              • <strong>Async Processing:</strong> Promise.allSettled for parallel symbol processing
                            </div>
                            <div>
                              • <strong>Batch Operations:</strong> 50 positions per database insert batch
                            </div>
                            <div>
                              • <strong>Smart Caching:</strong> Price cache (1s TTL), Range cache (60s TTL)
                            </div>
                            <div>
                              • <strong>Queue Management:</strong> Prevents duplicate processing with pending operations
                              map
                            </div>
                            <div>
                              • <strong>Non-overlapping Intervals:</strong> Trade engine waits for completion before
                              next cycle
                            </div>
                            <div>
                              • <strong>Event-driven Updates:</strong> Position closes trigger immediate cascading
                              updates
                            </div>
                            <div>
                              • <strong>Database Indexes:</strong> 50+ indexes optimized for high-frequency lookups
                            </div>
                            <div>
                              • <strong>Connection Pooling:</strong> Reuses database connections for efficiency
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-cyan-500/10 rounded-lg border-2 border-cyan-500">
                          <strong className="text-lg block mb-2">📊 CALCULATION EXAMPLE (50 symbols):</strong>
                          <div className="mt-2 space-y-2">
                            <div className="p-2 bg-background rounded border">
                              <strong>Base Positions:</strong>
                              <br />• Direction (3-30): 28 ranges × 924 configs = 25,872 sets
                              <br />• Move (3-30): 28 ranges × 924 configs = 25,872 sets
                              <br />• Active (0.5-2.5%): 5 thresholds × 924 configs = 4,620 sets
                              <br />• Optimal (3-30): 28 ranges × 125 drawdown combos × 924 configs = 3,234,000 sets
                              <br />• <strong>Total possible base sets per symbol: ~3,290,364 sets</strong>
                              <br />• <strong>Each set: Up to 250 database entries</strong>
                              <br />• <strong>Total capacity: ~822 million position entries!</strong>
                            </div>
                            <div className="p-2 bg-background rounded border">
                              <strong>Main Positions:</strong>
                              <br />• Created from Base positions with PF ≥ 0.5
                              <br />• Typically 5-10% of Base positions qualify
                              <br />• Enhanced with 4 strategy types
                              <br />• Filtered to PF ≥ 0.6 (1-2% pass)
                            </div>
                            <div className="p-2 bg-background rounded border">
                              <strong>Real Positions:</strong>
                              <br />• Created from Main positions with full validation
                              <br />• Requires ≥10 historical positions
                              <br />• Drawdown time check (≤12h average)
                              <br />• Typically 0.1-1% of Main positions qualify
                            </div>
                            <div className="p-2 bg-background rounded border">
                              <strong>Exchange Positions:</strong>
                              <br />• Mirrored from Real positions after final check
                              <br />• Last 30 exchange positions PF ≥ 0.6
                              <br />• Typically 10-100 active exchange positions
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="font-medium text-green-600 mt-3">Complete Position Flow:</div>
                <div className="ml-4 space-y-2 text-muted-foreground">
                  <div className="p-3 bg-background rounded border">
                    <div className="text-xs font-mono text-primary">
                      → Output: Base Pseudo Positions (indication-based, no validation required)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2.2 - Strategies */}
              <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span>2.2 Process Strategies (Main Pseudo Positions)</span>
                  <Badge className="bg-purple-500">Parallel by Symbol</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-purple-600">Async Processing:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• All symbols processed in parallel (concurrency: 10)</div>
                    <div>• Each symbol: Load Base positions → Apply strategy logic → Create Main positions</div>
                    <div>• Strategies: Momentum, Mean Reversion, Breakout, Trend Following</div>
                  </div>

                  <div className="font-medium text-purple-600 mt-3">Configuration Impact:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>
                      • <strong>Previous Count:</strong> 1-100 (tracks position history for adjustment)
                    </div>
                    <div>
                      • <strong>Last State:</strong> Won/Loss (affects next position sizing)
                    </div>
                    <div>
                      • <strong>Ongoing Positions:</strong> Trailing remains from Base settings
                    </div>
                    <div>
                      • <strong>Block Adjust:</strong> If enabled, multiply size by 1.5-3.0x after loss
                    </div>
                    <div>
                      • <strong>DCA Adjust:</strong> If enabled, average down by 0.5-2.0x
                    </div>
                    <div>
                      • <strong>Min Profit Factor:</strong> 0.6 (filters weak strategies)
                    </div>
                  </div>

                  <div className="font-medium text-purple-600 mt-3">Calculation Possibilities:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>
                      • <strong>Preset Trade:</strong> 800 Base × 4 strategies = 3,200 evaluations
                    </div>
                    <div>
                      • <strong>Main System Trade:</strong> 10,000-50,000 Base × 4 strategies = 40,000-200,000
                      evaluations
                    </div>
                    <div>
                      • <strong>With Adjustments:</strong> Each position × (1 + Block + DCA) = 3x calculations
                    </div>
                    <div>
                      • <strong>Total (50 symbols):</strong> 120,000-600,000 strategy evaluations per interval
                    </div>
                    <div>
                      • <strong>Filtered:</strong> Only profit_factor ≥ 0.6 stored (typically 5-15% pass)
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-background rounded border">
                    <div className="text-xs font-mono text-primary">
                      → Output: Main Pseudo Positions (strategy-enhanced, with adjustment logic)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2.3 - Validation */}
              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span>2.3 Validate & Create Real Pseudo Positions</span>
                  <Badge className="bg-green-500">Parallel by Symbol</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-green-600">Validation Criteria:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>
                      • <strong>Profit Factor (Base):</strong> ≥ 0.6 (configurable)
                    </div>
                    <div>
                      • <strong>Profit Factor (Main):</strong> ≥ 0.6 (configurable)
                    </div>
                    <div>
                      • <strong>Profit Factor (Real):</strong> ≥ 0.6 (configurable)
                    </div>
                    <div>
                      • <strong>Drawdown Time:</strong> ≤ 12 hours (configurable)
                    </div>
                    <div>
                      • <strong>Position Count:</strong> Within max limits
                    </div>
                    <div>
                      • <strong>Risk Management:</strong> Daily loss, max drawdown checks
                    </div>
                  </div>

                  <div className="font-medium text-green-600 mt-3">Calculation Possibilities:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>
                      • <strong>Preset Trade:</strong> 3,200 Main positions → Validate each
                    </div>
                    <div>
                      • <strong>Main System Trade:</strong> 40,000-200,000 Main positions → Validate each
                    </div>
                    <div>
                      • <strong>Pass Rate:</strong> Typically 1-5% meet all validation criteria
                    </div>
                    <div>
                      • <strong>Total (50 symbols):</strong> 30-10,000 Real pseudo positions created
                    </div>
                    <div>
                      • <strong>Ready for Trading:</strong> Only if connection has trading enabled
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-background rounded border">
                    <div className="text-xs font-mono text-primary">
                      → Output: Real Pseudo Positions (validated, ready for mirroring to exchange)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2.4 - Logging */}
              <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span>2.4 Logging & Metrics</span>
                  <Badge className="bg-orange-500">Parallel</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-orange-600">Logged Data:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• Position counts (Base, Main, Real)</div>
                    <div>• Profit factors (min, max, avg)</div>
                    <div>• Win/loss ratios</div>
                    <div>• Drawdown times</div>
                    <div>• Adjustment statistics (Block, DCA usage)</div>
                    <div>• Symbol performance rankings</div>
                  </div>

                  <div className="mt-3 p-3 bg-background rounded border">
                    <div className="text-xs font-mono text-primary">
                      → Output: Complete audit trail for analysis and optimization
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Trade Interval Complete:</strong> All symbols processed, positions created/updated, metrics
                  logged. System waits 1.0s before next interval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Phase 3: Real Positions Interval */}
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                Real Positions Interval Loop (0.3s)
              </CardTitle>
              <CardDescription>Exchange position management (Non-Overlapping)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Non-Overlapping Execution:</strong> New interval starts ONLY after previous completes. Runs
                  independently from Trade Interval.
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span>3.1 Fetch Exchange Positions (Batched)</span>
                  <Badge className="bg-green-500">Rate Limit Safe</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-green-600">Batched Processing:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>
                      • <strong>Single API Call:</strong> Fetch ALL open positions at once
                    </div>
                    <div>• Respects exchange rate limits (typically 1200 req/min)</div>
                    <div>• Includes: Position details, current prices, PnL, margin</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span>3.2 Execute Actions (Batched)</span>
                  <Badge className="bg-green-500">Rate Limit Safe</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-green-600">Action Types:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• Close positions (TP/SL hit)</div>
                    <div>• Modify trailing stops</div>
                    <div>• Open new positions (from validated Real pseudo)</div>
                    <div>• Cancel pending orders</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2">3.3 Sync & Log</div>
                <div className="text-sm space-y-2">
                  <div className="font-medium text-green-600">Synchronization:</div>
                  <div className="ml-4 space-y-1 text-muted-foreground">
                    <div>• Update Real pseudo positions with exchange data</div>
                    <div>• Mark closed positions</div>
                    <div>• Calculate final PnL</div>
                    <div>• Update performance metrics</div>
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Real Positions Interval Complete:</strong> All exchange positions updated, actions executed,
                  data synced. System waits 0.3s before next interval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                Database Optimization & Performance
              </CardTitle>
              <CardDescription>Automatic optimization for high-frequency trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-500/5">
                <div className="font-medium mb-2">4.1 Automatic Index Management</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• 50+ composite indexes for common query patterns</div>
                  <div>• Partial indexes for filtered queries (status = 'open')</div>
                  <div>• Covering indexes for frequently accessed columns</div>
                  <div>• Time-based indexes for recent data queries</div>
                  <div>• Runs automatically during database initialization</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-500/5">
                <div className="font-medium mb-2">4.2 SQLite PRAGMA Optimizations</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• WAL mode: Better concurrency for read/write operations</div>
                  <div>• Cache size: 10MB for faster query execution</div>
                  <div>• Memory-mapped I/O: 100MB for reduced disk access</div>
                  <div>• Synchronous NORMAL: Balanced safety and performance</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-500/5">
                <div className="font-medium mb-2">4.3 Performance Impact</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• 10-100x faster queries on indexed columns</div>
                  <div>• Better JOIN performance with composite indexes</div>
                  <div>• Reduced I/O with covering indexes</div>
                  <div>• Faster aggregations with pre-sorted indexes</div>
                  <div>• Critical for 1-second interval execution</div>
                </div>
              </div>

              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>Optimization Active:</strong> All performance enhancements applied automatically during system
                  startup.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">
                  5
                </div>
                Step Ratio Configuration
              </CardTitle>
              <CardDescription>Indication/Strategy step relationship control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                <div className="font-medium mb-2">5.1 Step Ratio Settings</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>
                    • <strong>Minimum Ratio:</strong> 0.2 (default) - If indication step is 10, min position step is 2
                  </div>
                  <div>
                    • <strong>Maximum Ratio:</strong> 1.0 (default) - If indication step is 10, max position step is 10
                  </div>
                  <div>
                    • <strong>Range:</strong> 0.1-3.0 (configurable in Settings / Strategy)
                  </div>
                  <div>
                    • <strong>Purpose:</strong> Ensures position steps are proportional to indication sensitivity
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/5">
                <div className="font-medium mb-2">5.2 Impact on Position Generation</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Prevents mismatched granularity between indication and position sizing</div>
                  <div>• Example: Indication step 10 → Position steps 2-10 (with default ratios)</div>
                  <div>• Reduces invalid configurations automatically</div>
                  <div>• Improves strategy validation accuracy</div>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configuration:</strong> Adjust step ratios in Settings / Strategy to fine-tune position sizing
                  relative to indication sensitivity.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Coordination Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Interval Coordination & Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Trade Interval (1.0s)</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 text-sm space-y-1 text-muted-foreground">
                    <div>• Runs independently</div>
                    <div>• Non-overlapping execution</div>
                    <div>• Processes: Indications → Strategies → Pseudo → Logging</div>
                    <div>• Creates Real pseudo positions</div>
                    <div>• Does NOT interact with exchange</div>
                    <div className="text-primary font-medium mt-2">
                      ⏱️ Typical Duration: 650-1,650ms (completes before next 1.0s tick)
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Real Positions Interval (0.3s)</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 text-sm space-y-1 text-muted-foreground">
                    <div>• Runs independently</div>
                    <div>• Non-overlapping execution</div>
                    <div>• Processes: Fetch → Update → Execute → Sync</div>
                    <div>• Mirrors Real pseudo to exchange</div>
                    <div>• ONLY interval that interacts with exchange</div>
                    <div className="text-primary font-medium mt-2">
                      ⏱️ Typical Duration: 100-250ms (completes before next 0.3s tick)
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-4">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Key Insight:</strong> The two intervals run independently and asynchronously. Trade Interval
                  creates validated positions, Real Positions Interval executes them. This separation ensures
                  calculation accuracy and exchange rate limit compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Calculation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Possibilities Summary</CardTitle>
              <CardDescription>Total calculations per interval based on configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">Preset Trade Mode</Badge>
                    </div>
                    <div className="text-sm space-y-2 text-muted-foreground">
                      <div>
                        <strong>Base Positions:</strong> 800 per interval
                      </div>
                      <div>
                        <strong>Main Positions:</strong> 3,200 evaluations
                      </div>
                      <div>
                        <strong>Real Positions:</strong> 30-160 created
                      </div>
                      <div className="text-primary font-medium mt-2">Total: ~4,000 calculations/interval</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">Main System Trade Mode</Badge>
                    </div>
                    <div className="text-sm space-y-2 text-muted-foreground">
                      <div>
                        <strong>Base Positions:</strong> 1,050,000 calculations
                      </div>
                      <div>
                        <strong>Main Positions:</strong> 120,000-600,000 evaluations
                      </div>
                      <div>
                        <strong>Real Positions:</strong> 30-10,000 created
                      </div>
                      <div className="text-primary font-medium mt-2">Total: ~1,200,000 calculations/interval</div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Performance Note:</strong> Main System Trade mode performs significantly more calculations.
                    Ensure adequate system resources (CPU, memory, database connections) are available.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preset Trade Logistics */}
        <TabsContent value="preset" className="space-y-6 mt-6">
          <Alert className="border-2 border-blue-500/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Preset Trade Mode:</strong> Uses common indicators (RSI, MACD, Bollinger, SAR, EMA, SMA,
              Stochastic, ADX) with automated configuration testing and validation.
            </AlertDescription>
          </Alert>

          {/* Phase 1: Preset Configuration */}
          <Card className="border-2 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                Preset Configuration Phase
              </CardTitle>
              <CardDescription>Load and validate preset configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.1 Load Preset Configuration</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Load selected preset from database</div>
                  <div>• Parse indication ranges (RSI, MACD, Bollinger, etc.)</div>
                  <div>• Parse strategy ranges (TP, SL, Trailing)</div>
                  <div>• Load symbol list and filters</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.2 Generate Configuration Sets</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Combine all indication ranges</div>
                  <div>• Combine all strategy ranges</div>
                  <div>• Generate 100-1,000 unique configuration sets</div>
                  <div>• Each set = unique combination of indicators + strategies</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="font-medium mb-2">1.3 Historical Testing (Backtesting)</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Test each configuration on 5 days of historical data</div>
                  <div>• Calculate profit factor, win rate, drawdown</div>
                  <div>• Filter: Keep only profit_factor ≥ 0.6</div>
                  <div>• Result: 10-100 validated configurations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Preset Trade Execution */}
          <Card className="border-2 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                Preset Trade Execution Loop
              </CardTitle>
              <CardDescription>Real-time trading with validated configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                <div className="font-medium mb-2">2.1 Process Common Indicators</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Calculate RSI, MACD, Bollinger, SAR, EMA, SMA, Stochastic, ADX</div>
                  <div>• Generate BUY/SELL signals per indicator</div>
                  <div>• Apply validated configuration filters</div>
                  <div>• Create positions only from tested configurations</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                <div className="font-medium mb-2">2.2 Position Management</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Max 1 position per configuration set</div>
                  <div>• 20-second cooldown after position closes</div>
                  <div>• Automatic TP/SL from configuration</div>
                  <div>• Trailing stop if enabled in configuration</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-500/5">
                <div className="font-medium mb-2">2.3 Performance Tracking</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Track profit factor per configuration</div>
                  <div>• Disable configurations with profit_factor {"<"} 0.6</div>
                  <div>• Re-enable after cooldown period</div>
                  <div>• Continuous optimization</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Preset Trade Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Configuration Sets Generated:</span>
                  <span className="font-bold">100-1,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validated Configurations:</span>
                  <span className="font-bold">10-100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Positions (Max):</span>
                  <span className="font-bold">10-100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calculations per Interval:</span>
                  <span className="font-bold">~4,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Bots Logistics */}
        <TabsContent value="bot" className="space-y-6 mt-6">
          <Alert className="border-2 border-green-500/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Trading Bots:</strong> Automated trading strategies with custom logic, independent from Main
              System and Preset Trade modes.
            </AlertDescription>
          </Alert>

          {/* Phase 1: Bot Configuration */}
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                Bot Configuration Phase
              </CardTitle>
              <CardDescription>Load and initialize trading bot strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2">1.1 Load Bot Configuration</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Load bot strategy from database</div>
                  <div>• Parse custom indicators and logic</div>
                  <div>• Load risk management settings</div>
                  <div>• Initialize bot state</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-500/5">
                <div className="font-medium mb-2">1.2 Bot Types</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Grid Trading Bot: Buy low, sell high in ranges</div>
                  <div>• DCA Bot: Dollar-cost averaging strategy</div>
                  <div>• Arbitrage Bot: Cross-exchange price differences</div>
                  <div>• Market Making Bot: Provide liquidity for spreads</div>
                  <div>• Custom Bot: User-defined logic</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 2: Bot Execution */}
          <Card className="border-2 border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                Bot Execution Loop
              </CardTitle>
              <CardDescription>Real-time bot strategy execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                <div className="font-medium mb-2">2.1 Strategy Execution</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Execute bot-specific logic</div>
                  <div>• Monitor market conditions</div>
                  <div>• Generate trading signals</div>
                  <div>• Place orders according to strategy</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                <div className="font-medium mb-2">2.2 Risk Management</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Position size limits per bot</div>
                  <div>• Stop loss and take profit</div>
                  <div>• Daily loss limits</div>
                  <div>• Emergency stop conditions</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-500/5">
                <div className="font-medium mb-2">2.3 Performance Monitoring</div>
                <div className="text-sm space-y-1 text-muted-foreground ml-4">
                  <div>• Track bot P&L</div>
                  <div>• Monitor win rate and profit factor</div>
                  <div>• Auto-pause on poor performance</div>
                  <div>• Alert on anomalies</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Bot Characteristics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Execution Frequency:</span>
                  <span className="font-bold">Bot-specific (0.1s - 60s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Independent Operation:</span>
                  <span className="font-bold">Yes (separate from Main/Preset)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Logic:</span>
                  <span className="font-bold">Fully customizable</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Management:</span>
                  <span className="font-bold">Per-bot configuration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
