"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ExchangeConnectionManager from "@/components/settings/exchange-connection-manager"
import InstallManager from "@/components/settings/install-manager"
import { toast } from "sonner"
import { Save, Download, Upload, RefreshCw, Activity, Layers, X, Plus, Info } from "lucide-react"
import type { ExchangeConnection } from "@/lib/types"
import { LogsViewer } from "@/components/settings/logs-viewer"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import AutoIndicationSettings from "@/components/settings/auto-indication-settings"
import { StatisticsOverview } from "@/components/settings/statistics-overview"

const EXCHANGE_MAX_POSITIONS: Record<string, number> = {
  bybit: 500,
  binance: 500,
  okx: 150,
  kucoin: 150,
  gateio: 150,
  bitget: 150,
  mexc: 100,
  bingx: 100,
}

// Define Settings type for better type safety
interface Settings {
  base_volume_factor: number
  positions_average: number
  max_leverage: number
  negativeChangePercent: number
  leveragePercentage: number
  prehistoricDataDays: number
  marketTimeframe: number
  tradeIntervalSeconds: number
  realPositionsIntervalSeconds: number
  validationTimeoutSeconds: number
  mainTradeInterval: number
  presetTradeInterval: number
  positionCost: number
  useMaximalLeverage: boolean
  baseValueRangeMin: number
  baseValueRangeMax: number
  baseRatioMin: number
  baseRatioMax: number
  trailingOption: boolean
  previousPositionsCount: number
  lastStateCount: number
  trailingEnabled: boolean
  trailingStartValues: string
  trailingStopValues: string
  blockAdjustment: boolean
  dcaAdjustment: boolean
  arrangementType: string
  numberOfSymbolsToSelect: number
  quoteAsset: string
  baseProfitFactor: number
  mainProfitFactor: number
  realProfitFactor: number
  trailingStopLoss: boolean
  maxDrawdownTimeHours: number
  mainEngineIntervalMs: number
  presetEngineIntervalMs: number
  activeOrderHandlingIntervalMs: number
  databaseSizeBase: number
  databaseSizeMain: number
  databaseSizeReal: number
  databaseSizePreset: number
  positionCooldownMs: number
  maxPositionsPerConfigDirection: number
  maxConcurrentOperations: number
  autoRestartOnErrors: boolean
  logLevel: string
  maxDatabaseSizeMB: number
  databaseThresholdPercent: number
  automaticDatabaseCleanup: boolean
  automaticDatabaseBackups: boolean
  backupInterval: string
  minimumConnectIntervalMs: number
  symbolsPerExchange: number
  defaultMarginType: string
  defaultPositionMode: string
  rateLimitDelayMs: number
  maxConcurrentConnections: number
  enableTestnetByDefault: boolean
  logsLevel: string
  logsCategory: string
  logsLimit: number
  enableSystemMonitoring: boolean
  metricsRetentionDays: number
  mainEngineEnabled: boolean
  presetEngineEnabled: boolean
  maxPositionsPerExchange: Record<string, number>
  mainSymbols: string[]
  forcedSymbols: string[]
  useMainSymbols: boolean
  symbolOrderType: string
  indication_time_interval: number
  indication_range_min: number
  indication_range_max: number
  indication_min_profit_factor: number
  strategy_time_interval: number
  strategy_min_profit_factor: number
  stepRelationMinRatio: number
  stepRelationMaxRatio: number
  block_enabled: boolean
  dca_enabled: boolean
  marketActivityEnabled: boolean
  marketActivityCalculationRange: number
  marketActivityPositionCostRatio: number
  directionEnabled: boolean
  directionInterval: number
  directionTimeout: number
  directionRangeFrom: number
  directionRangeTo: number
  moveEnabled: boolean
  moveInterval: number
  moveTimeout: number
  activeEnabled: boolean
  activeInterval: number
  activeTimeout: number
  optimalCoordinationEnabled: boolean
  trailingOptimalRanges: boolean
  simultaneousTrading: boolean
  positionIncrementAfterSituation: boolean
  // Common Indicators - RSI
  rsiEnabled: boolean
  rsiPeriod: number
  rsiOversold: number
  rsiOverbought: number
  rsiPeriodFrom: number
  rsiPeriodTo: number
  rsiPeriodStep: number
  rsiOversoldFrom: number
  rsiOversoldTo: number
  rsiOversoldStep: number
  rsiOverboughtFrom: number
  rsiOverboughtTo: number
  rsiOverboughtStep: number
  // Common Indicators - MACD
  macdEnabled: boolean
  macdFastPeriod: number
  macdSlowPeriod: number
  macdSignalPeriod: number
  macdFastPeriodFrom: number
  macdFastPeriodTo: number
  macdFastPeriodStep: number
  macdSlowPeriodFrom: number
  macdSlowPeriodTo: number
  macdSlowPeriodStep: number
  macdSignalPeriodFrom: number
  macdSignalPeriodTo: number
  macdSignalPeriodStep: number
  // Common Indicators - Bollinger Bands
  bollingerEnabled: boolean
  bollingerPeriod: number
  bollingerStdDev: number
  bollingerPeriodFrom: number
  bollingerPeriodTo: number
  bollingerPeriodStep: number
  bollingerStdDevFrom: number
  bollingerStdDevTo: number
  bollingerStdDevStep: number
  // Common Indicators - EMA (Exponential Moving Average)
  emaEnabled: boolean
  emaShortPeriod: number
  emaLongPeriod: number
  emaShortPeriodFrom: number
  emaShortPeriodTo: number
  emaShortPeriodStep: number
  emaLongPeriodFrom: number
  emaLongPeriodTo: number
  emaLongPeriodStep: number
  // Common Indicators - SMA (Simple Moving Average)
  smaEnabled: boolean
  smaShortPeriod: number
  smaLongPeriod: number
  smaShortPeriodFrom: number
  smaShortPeriodTo: number
  smaShortPeriodStep: number
  smaLongPeriodFrom: number
  smaLongPeriodTo: number
  smaLongPeriodStep: number
  // Common Indicators - Stochastic
  stochasticEnabled: boolean
  stochasticKPeriod: number
  stochasticDPeriod: number
  stochasticSlowing: number
  stochasticKPeriodFrom: number
  stochasticKPeriodTo: number
  stochasticKPeriodStep: number
  stochasticDPeriodFrom: number
  stochasticDPeriodTo: number
  stochasticDPeriodStep: number
  stochasticSlowingFrom: number
  stochasticSlowingTo: number
  stochasticSlowingStep: number
  // Common Indicators - ADX (Average Directional Index)
  adxEnabled: boolean
  adxPeriod: number
  adxThreshold: number
  adxPeriodFrom: number
  adxPeriodTo: number
  adxPeriodStep: number
  adxThresholdFrom: number
  adxThresholdTo: number
  adxThresholdStep: number
  // Common Indicators - ATR (Average True Range)
  atrEnabled: boolean
  atrPeriod: number
  atrMultiplier: number
  atrPeriodFrom: number
  atrPeriodTo: number
  atrPeriodStep: number
  atrMultiplierFrom: number
  atrMultiplierTo: number
  atrMultiplierStep: number
  // Parabolic SAR
  parabolicSAREnabled: boolean
  parabolicSARAcceleration: number
  parabolicSARMaximum: number
  parabolicSARAccelerationFrom: number
  parabolicSARAccelerationTo: number
  parabolicSARAccelerationStep: number
  parabolicSARMaximumFrom: number
  parabolicSARMaximumTo: number
  parabolicSARMaximumStep: number
  autoRestartOnError: boolean
  restartCooldownMinutes: number
  maxRestartAttempts: number
  min_volume_enforcement: boolean
  exchangeDirectionEnabled: boolean
  exchangeMoveEnabled: boolean
  exchangeActiveEnabled: boolean
  exchangeOptimalEnabled: boolean
  exchangeBaseStrategyEnabled: boolean
  exchangeMainStrategyEnabled: boolean
  exchangeRealStrategyEnabled: boolean
  exchangeTrailingEnabled: boolean
  exchangeBlockEnabled: boolean
  exchangeDcaEnabled: boolean
  // Main Trade Specific Settings
  profitFactorMinMain?: number
  drawdownTimeMain?: number
  mainDirectionEnabled?: boolean
  mainMoveEnabled?: boolean
  mainActiveEnabled?: boolean
  mainOptimalEnabled?: boolean
  mainTrailingStrategy?: boolean
  mainBlockStrategy?: boolean
  mainDcaStrategy?: boolean
  // Preset Trade Specific Settings
  profitFactorMinPreset?: number
  drawdownTimePreset?: number
  presetTrailingEnabled?: boolean
  presetBlockEnabled?: boolean
  presetDcaEnabled?: boolean
  presetDirectionEnabled?: boolean
  presetMoveEnabled?: boolean
  presetActiveEnabled?: boolean
  presetOptimalEnabled?: boolean
  presetTrailingStrategy?: boolean
  presetBlockStrategy?: boolean
  presetDcaStrategy?: boolean
  // Trade Mode
  tradeMode?: string
  // Exchange Position Cost
  exchangePositionCost?: number
  // Volume Factor Settings
  baseVolumeFactorLive?: number
  baseVolumeFactorPreset?: number
  // Strategy Configuration Settings
  strategyTrailingEnabled?: boolean
  strategyBlockEnabled?: boolean
  strategyDcaEnabled?: boolean
  // Indication Configuration Settings
  directionRangeStep: number
  directionDrawdownValues: string // comma-separated: "10,20,30,40,50"
  directionMarketChangeFrom: number
  directionMarketChangeTo: number
  directionMarketChangeStep: number
  directionMinCalcTime: number
  directionLastPartRatio: number
  directionRatioFactorFrom: number
  directionRatioFactorTo: number
  directionRatioFactorStep: number

  moveRangeFrom: number
  moveRangeTo: number
  moveRangeStep: number
  moveDrawdownValues: string
  moveMarketChangeFrom: number
  moveMarketChangeTo: number
  moveMarketChangeStep: number
  moveMinCalcTime: number
  moveLastPartRatio: number
  moveRatioFactorFrom: number
  moveRatioFactorTo: number
  moveRatioFactorStep: number

  activeRangeFrom: number
  activeRangeTo: number
  activeRangeStep: number
  activeDrawdownValues: string
  activeMarketChangeFrom: number
  activeMarketChangeTo: number
  activeMarketChangeStep: number
  activeMinCalcTime: number
  activeLastPartRatio: number
  activeRatioFactorFrom: number
  activeRatioFactorTo: number
  activeRatioFactorStep: number
  activeCalculatedFrom: number
  activeCalculatedTo: number
  activeCalculatedStep: number
  activeLastPartFrom: number
  activeLastPartTo: number
  activeLastPartStep: number

  database_type: string
  database_url: string
}

const initialSettings: Settings = {
  // Overall / Main
  base_volume_factor: 1.0,
  positions_average: 50,
  max_leverage: 125,
  negativeChangePercent: 20, // 5-30 step 5, Default 20 - used for loss trigger calculation
  leveragePercentage: 100, // 5-100 step 5, Default 100
  prehistoricDataDays: 5,
  marketTimeframe: 1,
  tradeIntervalSeconds: 1,
  realPositionsIntervalSeconds: 0.3,
  validationTimeoutSeconds: 15,
  mainTradeInterval: 1,
  presetTradeInterval: 2,
  positionCost: 0.1, // Fixed default to 0.1 (representing 0.1%)
  useMaximalLeverage: true,
  min_volume_enforcement: true, // Added missing min_volume_enforcement property

  // Base Strategy
  baseValueRangeMin: 0.5,
  baseValueRangeMax: 2.5,
  baseRatioMin: 0.2,
  baseRatioMax: 1,
  trailingOption: false,

  // Main Strategy
  previousPositionsCount: 5,
  lastStateCount: 3,

  // Trailing Configuration
  trailingEnabled: true,
  trailingStartValues: "0.5, 1.0, 1.5",
  trailingStopValues: "0.2, 0.4, 0.6",

  // Adjustment Strategies
  blockAdjustment: true,
  dcaAdjustment: false,
  block_enabled: true,
  dca_enabled: false,

  // Symbol Selection
  arrangementType: "marketCap24h",
  // numberOfSymbolsToSelect: 12, // Moved to exchange tab default
  quoteAsset: "USDT", // Moved to exchange tab default

  // Minimum Profit Factor Requirements
  baseProfitFactor: 0.6,
  mainProfitFactor: 0.6,
  realProfitFactor: 0.6,

  // Risk Management
  trailingStopLoss: false,
  maxDrawdownTimeHours: 24,

  // Trade Engine Intervals (milliseconds)
  mainEngineIntervalMs: 100, // 50-1000ms, step 50, default 200ms
  presetEngineIntervalMs: 100, // 50-1000ms, step 50, default 200ms
  activeOrderHandlingIntervalMs: 50, // 50-1000ms, step 50, default 50ms

  // Database Size Configuration (range: 50-750, step 50, default 250)
  databaseSizeBase: 250,
  databaseSizeMain: 250,
  databaseSizeReal: 250,
  databaseSizePreset: 250,

  // Trade Engine Configuration
  positionCooldownMs: 100, // 50-3000ms, default 100ms
  maxPositionsPerConfigDirection: 2, // default 2
  maxConcurrentOperations: 100, // 10-250, default 100

  // System Configuration
  autoRestartOnErrors: true,
  logLevel: "info",

  // Database Management
  maxDatabaseSizeMB: 10240,
  databaseThresholdPercent: 80,
  automaticDatabaseCleanup: true,
  automaticDatabaseBackups: true,
  backupInterval: "daily",

  // Connection Settings
  minimumConnectIntervalMs: 200,
  symbolsPerExchange: 50,

  // Connection Defaults
  defaultMarginType: "cross",
  defaultPositionMode: "hedge",
  rateLimitDelayMs: 50,
  maxConcurrentConnections: 3,
  enableTestnetByDefault: false,

  // Application Logs
  logsLevel: "all",
  logsCategory: "all",
  logsLimit: 100,

  // Monitoring Configuration
  enableSystemMonitoring: true,
  metricsRetentionDays: 30,

  mainEngineEnabled: true,
  presetEngineEnabled: true,

  mainSymbols: ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL"],
  forcedSymbols: ["XRP", "BCH"],

  useMainSymbols: false,
  numberOfSymbolsToSelect: 8,
  symbolOrderType: "volume24h",

  // Indication
  indication_time_interval: 1,
  indication_range_min: 3,
  indication_range_max: 30,
  indication_min_profit_factor: 0.7,

  // Strategy
  strategy_time_interval: 1,
  strategy_min_profit_factor: 0.5,
  stepRelationMinRatio: 0.2, // Moved to strategy section
  stepRelationMaxRatio: 1.0, // Moved to strategy section

  // Main Indication Settings
  marketActivityEnabled: true, // Changed to enabled by default
  marketActivityCalculationRange: 10,
  marketActivityPositionCostRatio: 2,
  directionEnabled: true, // Changed to enabled by default
  directionInterval: 100,
  directionTimeout: 3,
  directionRangeFrom: 3,
  directionRangeTo: 30,
  moveEnabled: true, // Changed to enabled by default
  moveInterval: 100,
  moveTimeout: 3,
  activeEnabled: true, // Changed to enabled by default
  activeInterval: 100,
  activeTimeout: 3,

  // Optimal Indication Settings
  optimalCoordinationEnabled: false,
  trailingOptimalRanges: false,
  simultaneousTrading: false,
  positionIncrementAfterSituation: false,

  // Common Indicators
  rsiEnabled: true, // Changed to true by default
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  rsiPeriodFrom: 7,
  rsiPeriodTo: 21,
  rsiPeriodStep: 1,
  rsiOversoldFrom: 15,
  rsiOversoldTo: 45,
  rsiOversoldStep: 5,
  rsiOverboughtFrom: 55,
  rsiOverboughtTo: 85,
  rsiOverboughtStep: 5,

  macdEnabled: true, // Changed to true by default
  macdFastPeriod: 12,
  macdSlowPeriod: 26,
  macdSignalPeriod: 9,
  macdFastPeriodFrom: 6,
  macdFastPeriodTo: 18,
  macdFastPeriodStep: 2,
  macdSlowPeriodFrom: 13,
  macdSlowPeriodTo: 39,
  macdSlowPeriodStep: 2,
  macdSignalPeriodFrom: 5,
  macdSignalPeriodTo: 13,
  macdSignalPeriodStep: 1,

  bollingerEnabled: true, // Changed to true by default
  bollingerPeriod: 20,
  bollingerStdDev: 2.0,
  bollingerPeriodFrom: 10,
  bollingerPeriodTo: 30,
  bollingerPeriodStep: 2,
  bollingerStdDevFrom: 1.0,
  bollingerStdDevTo: 3.0,
  bollingerStdDevStep: 0.5,

  emaEnabled: true, // Changed to true by default
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  emaShortPeriodFrom: 5,
  emaShortPeriodTo: 13,
  emaShortPeriodStep: 1,
  emaLongPeriodFrom: 11,
  emaLongPeriodTo: 31,
  emaLongPeriodStep: 2,

  smaEnabled: true, // Changed to true by default
  smaShortPeriod: 10,
  smaLongPeriod: 50,
  smaShortPeriodFrom: 5,
  smaShortPeriodTo: 15,
  smaShortPeriodStep: 1,
  smaLongPeriodFrom: 25,
  smaLongPeriodTo: 75,
  smaLongPeriodStep: 5,

  stochasticEnabled: true, // Changed to true by default
  stochasticKPeriod: 14,
  stochasticDPeriod: 3,
  stochasticSlowing: 3,
  stochasticKPeriodFrom: 7,
  stochasticKPeriodTo: 21,
  stochasticKPeriodStep: 1,
  stochasticDPeriodFrom: 2,
  stochasticDPeriodTo: 4,
  stochasticDPeriodStep: 1,
  stochasticSlowingFrom: 2,
  stochasticSlowingTo: 4,
  stochasticSlowingStep: 1,

  adxEnabled: true, // Changed to true by default
  adxPeriod: 14,
  adxThreshold: 25,
  adxPeriodFrom: 7,
  adxPeriodTo: 21,
  adxPeriodStep: 1,
  adxThresholdFrom: 13,
  adxThresholdTo: 37,
  adxThresholdStep: 2,

  atrEnabled: true, // Changed to true by default
  atrPeriod: 14,
  atrMultiplier: 1.5,
  atrPeriodFrom: 7,
  atrPeriodTo: 21,
  atrPeriodStep: 1,
  atrMultiplierFrom: 1.0,
  atrMultiplierTo: 3.0,
  atrMultiplierStep: 0.5,

  // Parabolic SAR
  parabolicSAREnabled: false, // Disabled by default
  parabolicSARAcceleration: 0.02,
  parabolicSARMaximum: 0.2,
  parabolicSARAccelerationFrom: 0.01,
  parabolicSARAccelerationTo: 0.03,
  parabolicSARAccelerationStep: 0.005,
  parabolicSARMaximumFrom: 0.1,
  parabolicSARMaximumTo: 0.3,
  parabolicSARMaximumStep: 0.05,

  autoRestartOnError: true,
  restartCooldownMinutes: 5,
  maxRestartAttempts: 3,

  // Exchange-specific overrides for indications and strategies
  exchangeDirectionEnabled: true,
  exchangeMoveEnabled: true,
  exchangeActiveEnabled: true,
  exchangeOptimalEnabled: false,
  exchangeBaseStrategyEnabled: true,
  exchangeMainStrategyEnabled: true,
  exchangeRealStrategyEnabled: true,
  exchangeTrailingEnabled: true,
  exchangeBlockEnabled: true,
  exchangeDcaEnabled: true,

  // Initialize maxPositionsPerExchange correctly
  maxPositionsPerExchange: Object.keys(EXCHANGE_MAX_POSITIONS).reduce(
    (acc, key) => {
      acc[key] = EXCHANGE_MAX_POSITIONS[key]
      return acc
    },
    {} as Record<string, number>,
  ),

  // Indication Settings Defaults
  directionRangeStep: 1,
  directionDrawdownValues: "10,20,30,40,50",
  directionMarketChangeFrom: 0.5,
  directionMarketChangeTo: 5,
  directionMarketChangeStep: 0.5,
  directionMinCalcTime: 30,
  directionLastPartRatio: 0.2,
  directionRatioFactorFrom: 0.5,
  directionRatioFactorTo: 2.0,
  directionRatioFactorStep: 0.1,

  moveRangeFrom: 3,
  moveRangeTo: 30,
  moveRangeStep: 1,
  moveDrawdownValues: "10,20,30,40,50",
  moveMarketChangeFrom: 0.5,
  moveMarketChangeTo: 5,
  moveMarketChangeStep: 0.5,
  moveMinCalcTime: 30,
  moveLastPartRatio: 0.2,
  moveRatioFactorFrom: 0.5,
  moveRatioFactorTo: 2.0,
  moveRatioFactorStep: 0.1,

  activeRangeFrom: 3,
  activeRangeTo: 30,
  activeRangeStep: 1,
  activeDrawdownValues: "10,20,30,40,50",
  activeMarketChangeFrom: 0.5,
  activeMarketChangeTo: 5,
  activeMarketChangeStep: 0.5,
  activeMinCalcTime: 30,
  activeLastPartRatio: 0.2,
  activeRatioFactorFrom: 0.5,
  activeRatioFactorTo: 2.0,
  activeRatioFactorStep: 0.1,
  activeCalculatedFrom: 1,
  activeCalculatedTo: 5,
  activeCalculatedStep: 0.1,
  activeLastPartFrom: 1,
  activeLastPartTo: 5,
  activeLastPartStep: 0.1,

  database_type: "sqlite",
  database_url: "",
}

export default function SettingsPage() {
  // useToast hook removed, toast from sonner imported and used.
  const [newMainSymbol, setNewMainSymbol] = useState("")
  const [newForcedSymbol, setNewForcedSymbol] = useState("")
  const [databaseType, setDatabaseType] = useState<"sqlite" | "postgresql" | "remote">("sqlite")

  // FIX: positionCost default to 0.001 meaning 0.1% (displayed as 0.1%, not 10%)
  const [settings, setSettings] = useState<Settings>({
    ...initialSettings,
    // Ensure defaults are applied if not present in initialSettings
    positionCost: initialSettings.positionCost ?? 0.1, // 0.1% default (slider value)
    exchangePositionCost: initialSettings.exchangePositionCost ?? 0.1, // Sync with positionCost
    baseVolumeFactorLive: initialSettings.baseVolumeFactorLive ?? 1.0,
    baseVolumeFactorPreset: initialSettings.baseVolumeFactorPreset ?? 1.0,
    profitFactorMinMain: initialSettings.profitFactorMinMain ?? 0.6,
    drawdownTimeMain: initialSettings.drawdownTimeMain ?? 300,
    mainDirectionEnabled: initialSettings.mainDirectionEnabled ?? true,
    mainMoveEnabled: initialSettings.mainMoveEnabled ?? true,
    mainActiveEnabled: initialSettings.mainActiveEnabled ?? true,
    mainOptimalEnabled: initialSettings.mainOptimalEnabled ?? false,
    mainTrailingStrategy: initialSettings.mainTrailingStrategy ?? true,
    mainBlockStrategy: initialSettings.mainBlockStrategy ?? false,
    mainDcaStrategy: initialSettings.mainDcaStrategy ?? false,
    profitFactorMinPreset: initialSettings.profitFactorMinPreset ?? 0.6,
    drawdownTimePreset: initialSettings.drawdownTimePreset ?? 300,
    presetTrailingEnabled: initialSettings.presetTrailingEnabled ?? false,
    presetBlockEnabled: initialSettings.presetBlockEnabled ?? false,
    presetDcaEnabled: initialSettings.presetDcaEnabled ?? false,
    presetDirectionEnabled: initialSettings.presetDirectionEnabled ?? true,
    presetMoveEnabled: initialSettings.presetMoveEnabled ?? true,
    presetActiveEnabled: initialSettings.presetActiveEnabled ?? true,
    presetOptimalEnabled: initialSettings.presetOptimalEnabled ?? false,
    presetTrailingStrategy: initialSettings.presetTrailingStrategy ?? false,
    presetBlockStrategy: initialSettings.presetBlockStrategy ?? false,
    presetDcaStrategy: initialSettings.presetDcaStrategy ?? false,
    tradeMode: initialSettings.tradeMode ?? "both",
    strategyTrailingEnabled: initialSettings.strategyTrailingEnabled ?? true,
    strategyBlockEnabled: initialSettings.strategyBlockEnabled ?? true,
    strategyDcaEnabled: initialSettings.strategyDcaEnabled ?? true,
    // FIX: Ensure useMainSymbols default is applied
    useMainSymbols: initialSettings.useMainSymbols ?? false,
    // FIX: Ensure numberOfSymbolsToSelect default is applied
    numberOfSymbolsToSelect: initialSettings.numberOfSymbolsToSelect ?? 8,
    // FIX: Ensure quoteAsset default is applied
    quoteAsset: initialSettings.quoteAsset ?? "USDT",
    // FIX: Ensure symbolOrderType default is applied
    symbolOrderType: initialSettings.symbolOrderType ?? "volume24h",
    // FIX: Ensure min_volume_enforcement default is applied
    min_volume_enforcement: initialSettings.min_volume_enforcement ?? false, // Now defaults to false in initialSettings
    // Apply defaults for new indicator ranges
    rsiPeriodFrom: initialSettings.rsiPeriodFrom ?? 5,
    rsiPeriodTo: initialSettings.rsiPeriodTo ?? 20,
    rsiPeriodStep: initialSettings.rsiPeriodStep ?? 1,
    rsiOversoldFrom: initialSettings.rsiOversoldFrom ?? 20,
    rsiOversoldTo: initialSettings.rsiOversoldTo ?? 40,
    rsiOversoldStep: initialSettings.rsiOversoldStep ?? 1,
    rsiOverboughtFrom: initialSettings.rsiOverboughtFrom ?? 60,
    rsiOverboughtTo: initialSettings.rsiOverboughtTo ?? 80,
    rsiOverboughtStep: initialSettings.rsiOverboughtStep ?? 1,
    macdFastPeriodFrom: initialSettings.macdFastPeriodFrom ?? 5,
    macdFastPeriodTo: initialSettings.macdFastPeriodTo ?? 25,
    macdFastPeriodStep: initialSettings.macdFastPeriodStep ?? 1,
    macdSlowPeriodFrom: initialSettings.macdSlowPeriodFrom ?? 20,
    macdSlowPeriodTo: initialSettings.macdSlowPeriodTo ?? 50,
    macdSlowPeriodStep: initialSettings.macdSlowPeriodStep ?? 1,
    macdSignalPeriodFrom: initialSettings.macdSignalPeriodFrom ?? 5,
    macdSignalPeriodTo: initialSettings.macdSignalPeriodTo ?? 25,
    macdSignalPeriodStep: initialSettings.macdSignalPeriodStep ?? 1,
    bollingerPeriodFrom: initialSettings.bollingerPeriodFrom ?? 5,
    bollingerPeriodTo: initialSettings.bollingerPeriodTo ?? 50,
    bollingerPeriodStep: initialSettings.bollingerPeriodStep ?? 1,
    bollingerStdDevFrom: initialSettings.bollingerStdDevFrom ?? 0.5,
    bollingerStdDevTo: initialSettings.bollingerStdDevTo ?? 5.0,
    bollingerStdDevStep: initialSettings.bollingerStdDevStep ?? 0.1,
    emaShortPeriodFrom: initialSettings.emaShortPeriodFrom ?? 5,
    emaShortPeriodTo: initialSettings.emaShortPeriodTo ?? 25,
    emaShortPeriodStep: initialSettings.emaShortPeriodStep ?? 1,
    emaLongPeriodFrom: initialSettings.emaLongPeriodFrom ?? 20,
    emaLongPeriodTo: initialSettings.emaLongPeriodTo ?? 50,
    emaLongPeriodStep: initialSettings.emaLongPeriodStep ?? 1,
    smaShortPeriodFrom: initialSettings.smaShortPeriodFrom ?? 5,
    smaShortPeriodTo: initialSettings.smaShortPeriodTo ?? 25,
    smaShortPeriodStep: initialSettings.smaShortPeriodStep ?? 1,
    smaLongPeriodFrom: initialSettings.smaLongPeriodFrom ?? 20,
    smaLongPeriodTo: initialSettings.smaLongPeriodTo ?? 50,
    smaLongPeriodStep: initialSettings.smaLongPeriodStep ?? 1,
    stochasticKPeriodFrom: initialSettings.stochasticKPeriodFrom ?? 5,
    stochasticKPeriodTo: initialSettings.stochasticKPeriodTo ?? 25,
    stochasticKPeriodStep: initialSettings.stochasticKPeriodStep ?? 1,
    stochasticDPeriodFrom: initialSettings.stochasticDPeriodFrom ?? 2,
    stochasticDPeriodTo: initialSettings.stochasticDPeriodTo ?? 10,
    stochasticDPeriodStep: initialSettings.stochasticDPeriodStep ?? 1,
    stochasticSlowingFrom: initialSettings.stochasticSlowingFrom ?? 1,
    stochasticSlowingTo: initialSettings.stochasticSlowingTo ?? 5,
    stochasticSlowingStep: initialSettings.stochasticSlowingStep ?? 1,
    adxPeriodFrom: initialSettings.adxPeriodFrom ?? 5,
    adxPeriodTo: initialSettings.adxPeriodTo ?? 30,
    adxPeriodStep: initialSettings.adxPeriodStep ?? 1,
    adxThresholdFrom: initialSettings.adxThresholdFrom ?? 15,
    adxThresholdTo: initialSettings.adxThresholdTo ?? 40,
    adxThresholdStep: initialSettings.adxThresholdStep ?? 1,
    atrPeriodFrom: initialSettings.atrPeriodFrom ?? 5,
    atrPeriodTo: initialSettings.atrPeriodTo ?? 30,
    atrPeriodStep: initialSettings.atrPeriodStep ?? 1,
    atrMultiplierFrom: initialSettings.atrMultiplierFrom ?? 1.0,
    atrMultiplierTo: initialSettings.atrMultiplierTo ?? 3.0,
    atrMultiplierStep: initialSettings.atrMultiplierStep ?? 0.1,
  })

  const [originalDatabaseType, setOriginalDatabaseType] = useState<string>("sqlite")
  const [databaseChanged, setDatabaseChanged] = useState(false)

  const [activeTab, setActiveTab] = useState("overall")
  const [overallSubTab, setOverallSubTab] = useState("main")
  const [indicationSubTab, setIndicationSubTab] = useState("main")
  const [indicationMainSubTab, setIndicationMainSubTab] = useState("main")
  const [strategySubTab, setStrategySubTab] = useState("main")
  const [strategyMainSubTab, setStrategyMainSubTab] = useState("base")

  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [selectedExchangeConnection, setSelectedExchangeConnection] = useState<string | null>(null) // Added state for selected exchange connection
  const [exchangeSymbols, setExchangeSymbols] = useState<string[]>([]) // Added state for exchange symbols
  const [loadingSymbols, setLoadingSymbols] = useState(false) // Added state for loading symbols

  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [reorganizing, setReorganizing] = useState(false)

  const [isRestarting, setIsRestarting] = useState(false)
  const [restartHistory, setRestartHistory] = useState<
    Array<{
      timestamp: string
      status: string
      message: string
    }>
  >([])

  const handleRestartEngine = async (options: { force?: boolean; clearCache?: boolean } = {}) => {
    setIsRestarting(true)
    try {
      const response = await fetch("/api/trade-engine/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      })

      const data = await response.json()

      const historyEntry = {
        timestamp: new Date().toISOString(),
        status: data.success ? "success" : "error",
        message: data.message || data.error || "Unknown result",
      }

      setRestartHistory((prev) => [historyEntry, ...prev.slice(0, 9)])

      if (data.success) {
        toast.success("Engine Restarted", {
          description: "Trade engine restarted successfully",
        })
      } else {
        toast.error("Restart Failed", {
          description: data.error || "Failed to restart engine",
        })
      }
    } catch (error) {
      console.error("Error restarting engine:", error)
      toast.error("Error", {
        description: "Failed to restart trade engine",
      })
    } finally {
      setIsRestarting(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        if (!data.settings) {
          console.error("[v0] No settings found in response")
          return
        }
        // Merge loaded settings with existing state, prioritizing loaded data
        setSettings((prevSettings: Settings) => {
          const updatedSettings = { ...prevSettings, ...data.settings }

          // Ensure arrays are not overwritten if empty in the loaded data
          if (data.settings.mainSymbols && Array.isArray(data.settings.mainSymbols)) {
            updatedSettings.mainSymbols = data.settings.mainSymbols
          }
          if (data.settings.forcedSymbols && Array.isArray(data.settings.forcedSymbols)) {
            updatedSettings.forcedSymbols = data.settings.forcedSymbols
          }
          if (data.settings.maxPositionsPerExchange && typeof data.settings.maxPositionsPerExchange === "object") {
            updatedSettings.maxPositionsPerExchange = data.settings.maxPositionsPerExchange
          }
          // Ensure engine interval defaults are applied if not present in loaded data
          if (data.settings.mainEngineIntervalMs === undefined) {
            updatedSettings.mainEngineIntervalMs = 100
          }
          if (data.settings.presetEngineIntervalMs === undefined) {
            updatedSettings.presetEngineIntervalMs = 100
          }
          if (data.settings.activeOrderHandlingIntervalMs === undefined) {
            updatedSettings.activeOrderHandlingIntervalMs = 50
          }
          // Ensure engine toggles are applied
          if (data.settings.mainEngineEnabled === undefined) {
            updatedSettings.mainEngineEnabled = true
          }
          if (data.settings.presetEngineEnabled === undefined) {
            updatedSettings.presetEngineEnabled = true
          }
          // Ensure trade engine configuration defaults are applied
          if (data.settings.positionCooldownMs === undefined) {
            updatedSettings.positionCooldownMs = 100
          }
          if (data.settings.maxPositionsPerConfigDirection === undefined) {
            updatedSettings.maxPositionsPerConfigDirection = 2
          }
          if (data.settings.maxConcurrentOperations === undefined) {
            updatedSettings.maxConcurrentOperations = 100
          }
          // FIX: Ensure positionCost default is applied if not present in loaded data
          if (data.settings.positionCost === undefined) {
            updatedSettings.positionCost = 0.1
          }
          if (data.settings.negativeChangePercent === undefined) {
            updatedSettings.negativeChangePercent = 20
          }
          // Fix typo: data.data.settings.leveragePercentage -> data.settings.leveragePercentage
          if (data.settings.leveragePercentage === undefined) {
            updatedSettings.leveragePercentage = 100
          }

          // Merge exchange-specific settings, prioritizing loaded data but falling back to defaults if needed
          updatedSettings.exchangeDirectionEnabled =
            data.settings.exchangeDirectionEnabled ?? prevSettings.directionEnabled
          updatedSettings.exchangeMoveEnabled = data.settings.exchangeMoveEnabled ?? prevSettings.moveEnabled
          updatedSettings.exchangeActiveEnabled = data.settings.exchangeActiveEnabled ?? prevSettings.activeEnabled
          updatedSettings.exchangeOptimalEnabled =
            data.settings.exchangeOptimalEnabled ?? prevSettings.optimalCoordinationEnabled
          updatedSettings.exchangeBaseStrategyEnabled =
            data.settings.exchangeBaseStrategyEnabled ?? prevSettings.exchangeBaseStrategyEnabled
          updatedSettings.exchangeMainStrategyEnabled =
            data.settings.exchangeMainStrategyEnabled ?? prevSettings.exchangeMainStrategyEnabled
          updatedSettings.exchangeRealStrategyEnabled =
            data.settings.exchangeRealStrategyEnabled ?? prevSettings.exchangeRealStrategyEnabled
          updatedSettings.exchangeTrailingEnabled =
            data.settings.exchangeTrailingEnabled ?? prevSettings.trailingEnabled
          updatedSettings.exchangeBlockEnabled = data.settings.exchangeBlockEnabled ?? prevSettings.blockAdjustment
          updatedSettings.exchangeDcaEnabled = data.settings.exchangeDcaEnabled ?? prevSettings.dcaAdjustment

          // Apply specific settings from loaded data or fall back to initial defaults
          updatedSettings.profitFactorMinMain = data.settings.profitFactorMinMain ?? initialSettings.profitFactorMinMain
          updatedSettings.drawdownTimeMain = data.settings.drawdownTimeMain ?? initialSettings.drawdownTimeMain
          updatedSettings.mainDirectionEnabled =
            data.settings.mainDirectionEnabled ?? initialSettings.mainDirectionEnabled
          updatedSettings.mainMoveEnabled = data.settings.mainMoveEnabled ?? initialSettings.mainMoveEnabled
          updatedSettings.mainActiveEnabled = data.settings.mainActiveEnabled ?? initialSettings.mainActiveEnabled
          updatedSettings.mainOptimalEnabled = data.settings.mainOptimalEnabled ?? initialSettings.mainOptimalEnabled
          updatedSettings.mainTrailingStrategy =
            data.settings.mainTrailingStrategy ?? initialSettings.mainTrailingStrategy
          updatedSettings.mainBlockStrategy = data.settings.mainBlockStrategy ?? initialSettings.mainBlockStrategy
          updatedSettings.mainDcaStrategy = data.settings.mainDcaStrategy ?? initialSettings.mainDcaStrategy

          updatedSettings.profitFactorMinPreset =
            data.settings.profitFactorMinPreset ?? initialSettings.profitFactorMinPreset
          updatedSettings.drawdownTimePreset = data.settings.drawdownTimePreset ?? initialSettings.drawdownTimePreset
          updatedSettings.presetTrailingEnabled =
            data.settings.presetTrailingEnabled ?? initialSettings.presetTrailingEnabled
          updatedSettings.presetBlockEnabled = data.settings.presetBlockEnabled ?? initialSettings.presetBlockEnabled
          updatedSettings.presetDcaEnabled = data.settings.presetDcaEnabled ?? initialSettings.presetDcaEnabled
          updatedSettings.presetDirectionEnabled =
            data.settings.presetDirectionEnabled ?? initialSettings.presetDirectionEnabled
          updatedSettings.presetMoveEnabled = data.settings.presetMoveEnabled ?? initialSettings.presetMoveEnabled
          updatedSettings.presetActiveEnabled = data.settings.presetActiveEnabled ?? initialSettings.presetActiveEnabled
          updatedSettings.presetOptimalEnabled =
            data.settings.presetOptimalEnabled ?? initialSettings.presetOptimalEnabled
          updatedSettings.presetTrailingStrategy =
            data.settings.presetTrailingStrategy ?? initialSettings.presetTrailingStrategy
          updatedSettings.presetBlockStrategy = data.settings.presetBlockStrategy ?? initialSettings.presetBlockStrategy
          updatedSettings.presetDcaStrategy = data.settings.presetDcaStrategy ?? initialSettings.presetDcaStrategy

          updatedSettings.tradeMode = data.settings.tradeMode ?? initialSettings.tradeMode

          // FIX: Ensure exchangePositionCost is synced if not explicitly loaded
          if (data.settings.exchangePositionCost === undefined) {
            updatedSettings.exchangePositionCost = updatedSettings.positionCost
          } else {
            updatedSettings.exchangePositionCost = data.settings.exchangePositionCost
          }

          // FIX: Apply defaults for the newly added settings if they are missing in loaded data
          updatedSettings.useMainSymbols = data.settings.useMainSymbols ?? initialSettings.useMainSymbols
          updatedSettings.numberOfSymbolsToSelect =
            data.settings.numberOfSymbolsToSelect ?? initialSettings.numberOfSymbolsToSelect
          updatedSettings.symbolOrderType = data.settings.symbolOrderType ?? initialSettings.symbolOrderType
          updatedSettings.quoteAsset = data.settings.quoteAsset ?? initialSettings.quoteAsset
          updatedSettings.min_volume_enforcement =
            data.settings.min_volume_enforcement ?? initialSettings.min_volume_enforcement

          // Apply Indication Settings Defaults if not present in loaded data
          updatedSettings.directionRangeStep = data.settings.directionRangeStep ?? initialSettings.directionRangeStep
          updatedSettings.directionDrawdownValues =
            data.settings.directionDrawdownValues ?? initialSettings.directionDrawdownValues
          updatedSettings.directionMarketChangeFrom =
            data.settings.directionMarketChangeFrom ?? initialSettings.directionMarketChangeFrom
          updatedSettings.directionMarketChangeTo =
            data.settings.directionMarketChangeTo ?? initialSettings.directionMarketChangeTo
          updatedSettings.directionMarketChangeStep =
            data.settings.directionMarketChangeStep ?? initialSettings.directionMarketChangeStep
          updatedSettings.directionMinCalcTime =
            data.settings.directionMinCalcTime ?? initialSettings.directionMinCalcTime
          updatedSettings.directionLastPartRatio =
            data.settings.directionLastPartRatio ?? initialSettings.directionLastPartRatio
          updatedSettings.directionRatioFactorFrom =
            data.settings.directionRatioFactorFrom ?? initialSettings.directionRatioFactorFrom
          updatedSettings.directionRatioFactorTo =
            data.settings.directionRatioFactorTo ?? initialSettings.directionRatioFactorTo
          updatedSettings.directionRatioFactorStep =
            data.settings.directionRatioFactorStep ?? initialSettings.directionRatioFactorStep

          updatedSettings.moveRangeStep = data.settings.moveRangeStep ?? initialSettings.moveRangeStep
          updatedSettings.moveDrawdownValues = data.settings.moveDrawdownValues ?? initialSettings.moveDrawdownValues
          updatedSettings.moveMarketChangeFrom =
            data.settings.moveMarketChangeFrom ?? initialSettings.moveMarketChangeFrom
          updatedSettings.moveMarketChangeTo = data.settings.moveMarketChangeTo ?? initialSettings.moveMarketChangeTo
          updatedSettings.moveMarketChangeStep =
            data.settings.moveMarketChangeStep ?? initialSettings.moveMarketChangeStep
          updatedSettings.moveMinCalcTime = data.settings.moveMinCalcTime ?? initialSettings.moveMinCalcTime
          updatedSettings.moveLastPartRatio = data.settings.moveLastPartRatio ?? initialSettings.moveLastPartRatio
          updatedSettings.moveRatioFactorFrom = data.settings.moveRatioFactorFrom ?? initialSettings.moveRatioFactorFrom
          updatedSettings.moveRatioFactorTo = data.settings.moveRatioFactorTo ?? initialSettings.moveRatioFactorTo
          updatedSettings.moveRatioFactorStep = data.settings.moveRatioFactorStep ?? initialSettings.moveRatioFactorStep

          updatedSettings.activeRangeStep = data.settings.activeRangeStep ?? initialSettings.activeRangeStep
          updatedSettings.activeDrawdownValues =
            data.settings.activeDrawdownValues ?? initialSettings.activeDrawdownValues
          updatedSettings.activeMarketChangeFrom =
            data.settings.activeMarketChangeFrom ?? initialSettings.activeMarketChangeFrom
          updatedSettings.activeMarketChangeTo =
            data.settings.activeMarketChangeTo ?? initialSettings.activeMarketChangeTo
          updatedSettings.activeMarketChangeStep =
            data.settings.activeMarketChangeStep ?? initialSettings.activeMarketChangeStep
          updatedSettings.activeMinCalcTime = data.settings.activeMinCalcTime ?? initialSettings.activeMinCalcTime
          updatedSettings.activeLastPartRatio = data.settings.activeLastPartRatio ?? initialSettings.activeLastPartRatio
          updatedSettings.activeRatioFactorFrom =
            data.settings.activeRatioFactorFrom ?? initialSettings.activeRatioFactorFrom
          updatedSettings.activeRatioFactorTo = data.settings.activeRatioFactorTo ?? initialSettings.activeRatioFactorTo
          updatedSettings.activeRatioFactorStep =
            data.settings.activeRatioFactorStep ?? initialSettings.activeRatioFactorStep
          updatedSettings.activeCalculatedFrom =
            data.settings.activeCalculatedFrom ?? initialSettings.activeCalculatedFrom
          updatedSettings.activeCalculatedTo = data.settings.activeCalculatedTo ?? initialSettings.activeCalculatedTo
          updatedSettings.activeCalculatedStep =
            data.settings.activeCalculatedStep ?? initialSettings.activeCalculatedStep
          updatedSettings.activeLastPartFrom = data.settings.activeLastPartFrom ?? initialSettings.activeLastPartFrom
          updatedSettings.activeLastPartTo = data.settings.activeLastPartTo ?? initialSettings.activeLastPartTo
          updatedSettings.activeLastPartStep = data.settings.activeLastPartStep ?? initialSettings.activeLastPartStep

          // Apply new indicator range defaults
          updatedSettings.rsiPeriodFrom = data.settings.rsiPeriodFrom ?? initialSettings.rsiPeriodFrom
          updatedSettings.rsiPeriodTo = data.settings.rsiPeriodTo ?? initialSettings.rsiPeriodTo
          updatedSettings.rsiPeriodStep = data.settings.rsiPeriodStep ?? initialSettings.rsiPeriodStep
          updatedSettings.rsiOversoldFrom = data.settings.rsiOversoldFrom ?? initialSettings.rsiOversoldFrom
          updatedSettings.rsiOversoldTo = data.settings.rsiOversoldTo ?? initialSettings.rsiOversoldTo
          updatedSettings.rsiOversoldStep = data.settings.rsiOversoldStep ?? initialSettings.rsiOversoldStep
          updatedSettings.rsiOverboughtFrom = data.settings.rsiOverboughtFrom ?? initialSettings.rsiOverboughtFrom
          updatedSettings.rsiOverboughtTo = data.settings.rsiOverboughtTo ?? initialSettings.rsiOverboughtTo
          updatedSettings.rsiOverboughtStep = data.settings.rsiOverboughtStep ?? initialSettings.rsiOverboughtStep

          updatedSettings.macdFastPeriodFrom = data.settings.macdFastPeriodFrom ?? initialSettings.macdFastPeriodFrom
          updatedSettings.macdFastPeriodTo = data.settings.macdFastPeriodTo ?? initialSettings.macdFastPeriodTo
          updatedSettings.macdFastPeriodStep = data.settings.macdFastPeriodStep ?? initialSettings.macdFastPeriodStep
          updatedSettings.macdSlowPeriodFrom = data.settings.macdSlowPeriodFrom ?? initialSettings.macdSlowPeriodFrom
          updatedSettings.macdSlowPeriodTo = data.settings.macdSlowPeriodTo ?? initialSettings.macdSlowPeriodTo
          updatedSettings.macdSlowPeriodStep = data.settings.macdSlowPeriodStep ?? initialSettings.macdSlowPeriodStep
          updatedSettings.macdSignalPeriodFrom =
            data.settings.macdSignalPeriodFrom ?? initialSettings.macdSignalPeriodFrom
          updatedSettings.macdSignalPeriodTo = data.settings.macdSignalPeriodTo ?? initialSettings.macdSignalPeriodTo
          updatedSettings.macdSignalPeriodStep =
            data.settings.macdSignalPeriodStep ?? initialSettings.macdSignalPeriodStep

          updatedSettings.bollingerPeriodFrom = data.settings.bollingerPeriodFrom ?? initialSettings.bollingerPeriodFrom
          updatedSettings.bollingerPeriodTo = data.settings.bollingerPeriodTo ?? initialSettings.bollingerPeriodTo
          updatedSettings.bollingerPeriodStep = data.settings.bollingerPeriodStep ?? initialSettings.bollingerPeriodStep
          updatedSettings.bollingerStdDevFrom = data.settings.bollingerStdDevFrom ?? initialSettings.bollingerStdDevFrom
          updatedSettings.bollingerStdDevTo = data.settings.bollingerStdDevTo ?? initialSettings.bollingerStdDevTo
          updatedSettings.bollingerStdDevStep = data.settings.bollingerStdDevStep ?? initialSettings.bollingerStdDevStep

          updatedSettings.emaShortPeriodFrom = data.settings.emaShortPeriodFrom ?? initialSettings.emaShortPeriodFrom
          updatedSettings.emaShortPeriodTo = data.settings.emaShortPeriodTo ?? initialSettings.emaShortPeriodTo
          updatedSettings.emaShortPeriodStep = data.settings.emaShortPeriodStep ?? initialSettings.emaShortPeriodStep
          updatedSettings.emaLongPeriodFrom = data.settings.emaLongPeriodFrom ?? initialSettings.emaLongPeriodFrom
          updatedSettings.emaLongPeriodTo = data.settings.emaLongPeriodTo ?? initialSettings.emaLongPeriodTo
          updatedSettings.emaLongPeriodStep = data.settings.emaLongPeriodStep ?? initialSettings.emaLongPeriodStep

          updatedSettings.smaShortPeriodFrom = data.settings.smaShortPeriodFrom ?? initialSettings.smaShortPeriodFrom
          updatedSettings.smaShortPeriodTo = data.settings.smaShortPeriodTo ?? initialSettings.smaShortPeriodTo
          updatedSettings.smaShortPeriodStep = data.settings.smaShortPeriodStep ?? initialSettings.smaShortPeriodStep
          updatedSettings.smaLongPeriodFrom = data.settings.smaLongPeriodFrom ?? initialSettings.smaLongPeriodFrom
          updatedSettings.smaLongPeriodTo = data.settings.smaLongPeriodTo ?? initialSettings.smaLongPeriodTo
          updatedSettings.smaLongPeriodStep = data.settings.smaLongPeriodStep ?? initialSettings.smaLongPeriodStep

          updatedSettings.stochasticKPeriodFrom =
            data.settings.stochasticKPeriodFrom ?? initialSettings.stochasticKPeriodFrom
          updatedSettings.stochasticKPeriodTo = data.settings.stochasticKPeriodTo ?? initialSettings.stochasticKPeriodTo
          updatedSettings.stochasticKPeriodStep =
            data.settings.stochasticKPeriodStep ?? initialSettings.stochasticKPeriodStep
          updatedSettings.stochasticDPeriodFrom =
            data.settings.stochasticDPeriodFrom ?? initialSettings.stochasticDPeriodFrom
          updatedSettings.stochasticDPeriodTo = data.settings.stochasticDPeriodTo ?? initialSettings.stochasticDPeriodTo
          updatedSettings.stochasticDPeriodStep =
            data.settings.stochasticDPeriodStep ?? initialSettings.stochasticDPeriodStep
          updatedSettings.stochasticSlowingFrom =
            data.settings.stochasticSlowingFrom ?? initialSettings.stochasticSlowingFrom
          updatedSettings.stochasticSlowingTo = data.settings.stochasticSlowingTo ?? initialSettings.stochasticSlowingTo
          updatedSettings.stochasticSlowingStep =
            data.settings.stochasticSlowingStep ?? initialSettings.stochasticSlowingStep

          updatedSettings.adxPeriodFrom = data.settings.adxPeriodFrom ?? initialSettings.adxPeriodFrom
          updatedSettings.adxPeriodTo = data.settings.adxPeriodTo ?? initialSettings.adxPeriodTo
          updatedSettings.adxPeriodStep = data.settings.adxPeriodStep ?? initialSettings.adxPeriodStep
          updatedSettings.adxThresholdFrom = data.settings.adxThresholdFrom ?? initialSettings.adxThresholdFrom
          updatedSettings.adxThresholdTo = data.settings.adxThresholdTo ?? initialSettings.adxThresholdTo
          updatedSettings.adxThresholdStep = data.settings.adxThresholdStep ?? initialSettings.adxThresholdStep

          updatedSettings.atrPeriodFrom = data.settings.atrPeriodFrom ?? initialSettings.atrPeriodFrom
          updatedSettings.atrPeriodTo = data.settings.atrPeriodTo ?? initialSettings.atrPeriodTo
          updatedSettings.atrPeriodStep = data.settings.atrPeriodStep ?? initialSettings.atrPeriodStep
          updatedSettings.atrMultiplierFrom = data.settings.atrMultiplierFrom ?? initialSettings.atrMultiplierFrom
          updatedSettings.atrMultiplierTo = data.settings.atrMultiplierTo ?? initialSettings.atrMultiplierTo
          updatedSettings.atrMultiplierStep = data.settings.atrMultiplierStep ?? initialSettings.atrMultiplierStep

          // Add Parabolic SAR defaults if missing
          updatedSettings.parabolicSAREnabled = data.settings.parabolicSAREnabled ?? initialSettings.parabolicSAREnabled
          updatedSettings.parabolicSARAcceleration =
            data.settings.parabolicSARAcceleration ?? initialSettings.parabolicSARAcceleration
          updatedSettings.parabolicSARMaximum = data.settings.parabolicSARMaximum ?? initialSettings.parabolicSARMaximum
          updatedSettings.parabolicSARAccelerationFrom =
            data.settings.parabolicSARAccelerationFrom ?? initialSettings.parabolicSARAccelerationFrom
          updatedSettings.parabolicSARAccelerationTo =
            data.settings.parabolicSARAccelerationTo ?? initialSettings.parabolicSARAccelerationTo
          updatedSettings.parabolicSARAccelerationStep =
            data.settings.parabolicSARAccelerationStep ?? initialSettings.parabolicSARAccelerationStep
          updatedSettings.parabolicSARMaximumFrom =
            data.settings.parabolicSARMaximumFrom ?? initialSettings.parabolicSARMaximumFrom
          updatedSettings.parabolicSARMaximumTo =
            data.settings.parabolicSARMaximumTo ?? initialSettings.parabolicSARMaximumTo
          updatedSettings.parabolicSARMaximumStep =
            data.settings.parabolicSARMaximumStep ?? initialSettings.parabolicSARMaximumStep

          // Load current database type and URL
          if (data.settings.database_type !== undefined) {
            updatedSettings.database_type = data.settings.database_type
          }
          if (data.settings.database_url !== undefined) {
            updatedSettings.database_url = data.settings.database_url
          }

          return updatedSettings
        })
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
    }
  }

  const loadConnections = async () => {
    try {
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
    }
  }

  // Added dummy function for preset connections to avoid runtime error
  const loadPresetConnections = async () => {
    // Placeholder for loading preset connections if needed in the future
  }

  // Added function to load symbols for a specific exchange connection
  const loadExchangeSymbols = async (connectionId: string) => {
    if (!connectionId) return
    setLoadingSymbols(true)
    try {
      const response = await fetch(`/api/settings/connections/${connectionId}/symbols`)
      if (response.ok) {
        const data = await response.json()
        setExchangeSymbols(data.symbols || [])
      } else {
        setExchangeSymbols([]) // Clear symbols if request fails
      }
    } catch (error) {
      console.error("Failed to load exchange symbols:", error)
      setExchangeSymbols([]) // Clear symbols on error
    } finally {
      setLoadingSymbols(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Effect to load symbols when the selected connection changes
  useEffect(() => {
    if (selectedExchangeConnection) {
      loadExchangeSymbols(selectedExchangeConnection)
    } else {
      setExchangeSymbols([]) // Clear symbols if no connection is selected
    }
  }, [selectedExchangeConnection])

  // Effect to set the initial selected connection when connections load
  useEffect(() => {
    if (connections.length > 0 && !selectedExchangeConnection) {
      // Try to find an active and enabled connection, otherwise pick the first one
      const activeConn = connections.find((c) => c.is_active && c.is_enabled) || connections[0]
      if (activeConn) {
        setSelectedExchangeConnection(activeConn.id)
        localStorage.setItem("activeExchangeConnection", activeConn.id)
      }
    } else if (connections.length === 0 && selectedExchangeConnection) {
      // If connections are cleared, reset selected connection
      setSelectedExchangeConnection(null)
      localStorage.removeItem("activeExchangeConnection")
    }
  }, [connections, selectedExchangeConnection])

  const saveAllSettings = async () => {
    setSaving(true)
    setReorganizing(false)

    try {
      console.log("[v0] Starting settings save operation...")
      toast.info("Saving settings...", {
        description: "Please wait while we save your configuration.",
      })

      // Step 1: Fetch previous settings to detect database size changes
      const previousSettingsResponse = await fetch("/api/settings")
      if (!previousSettingsResponse.ok) {
        throw new Error("Failed to fetch previous settings")
      }
      const previousSettingsData = await previousSettingsResponse.json()

      // Step 2: Check if database sizes changed (requires reorganization)
      const databaseSizesChanged =
        previousSettingsData.settings.databaseSizeBase !== settings.databaseSizeBase ||
        previousSettingsData.settings.databaseSizeMain !== settings.databaseSizeMain ||
        previousSettingsData.settings.databaseSizeReal !== settings.databaseSizeReal ||
        previousSettingsData.settings.databaseSizePreset !== settings.databaseSizePreset

      // Step 3: Check if engine intervals changed (requires engine restart)
      const engineIntervalsChanged =
        previousSettingsData.settings.mainEngineIntervalMs !== settings.mainEngineIntervalMs ||
        previousSettingsData.settings.presetEngineIntervalMs !== settings.presetEngineIntervalMs ||
        previousSettingsData.settings.activeOrderHandlingIntervalMs !== settings.activeOrderHandlingIntervalMs

      const databaseTypeChanged = settings.database_type !== originalDatabaseType

      if (databaseSizesChanged || engineIntervalsChanged || databaseTypeChanged) {
        setReorganizing(true)
        console.log("[v0] Critical changes detected, pausing engine...")

        if (databaseTypeChanged) {
          toast.info("Database type changed", {
            description: "Switching database requires system restart. Pausing engine...",
          })
        } else {
          toast.info("Pausing trade engine...", {
            description: "Applying critical configuration changes requires pausing the engine.",
          })
        }

        // Step 3a: Pause trade engine
        const pauseResponse = await fetch("/api/trade-engine/pause", { method: "POST" })
        if (!pauseResponse.ok) {
          console.warn("[v0] Failed to pause trade engine, continuing anyway...")
        } else {
          console.log("[v0] Trade engine paused successfully")
        }

        // Step 3b: Wait for engine to fully stop
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Step 4: Save settings to database
      console.log("[v0] Saving settings to database...")
      const settingsResponse = await fetch("/api/settings", {
        method: "PUT", // Changed from POST to PUT as per original logic
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (!settingsResponse.ok) {
        throw new Error("Failed to save settings to database")
      }
      console.log("[v0] Settings saved to database successfully")

      toast.success("Settings saved!", {
        description: "All changes have been applied successfully.",
      })

      // Step 5: If database sizes changed, reorganize database
      if (databaseSizesChanged) {
        console.log("[v0] Database sizes changed, reorganizing...")
        toast.info("Reorganizing database with new size limits...", {
          description: "Applying new database size configurations.",
        })

        const reorganizeResponse = await fetch("/api/database/reorganize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseSize: settings.databaseSizeBase,
            mainSize: settings.databaseSizeMain,
            realSize: settings.databaseSizeReal,
            presetSize: settings.databaseSizePreset,
          }),
        })

        if (!reorganizeResponse.ok) {
          const errorData = await reorganizeResponse.json()
          console.error("[v0] Database reorganization failed:", errorData)
          toast.error("Database reorganization failed", {
            description: "Settings saved but limits not applied. Please check logs.",
          })
        } else {
          const reorganizeData = await reorganizeResponse.json()
          console.log("[v0] Database reorganized successfully:", reorganizeData)
          toast.success("Database reorganized successfully", {
            description: "New size limits have been applied.",
          })
        }
      }

      if (databaseTypeChanged) {
        console.log("[v0] Database type changed, applying configuration...")
        toast.info("Switching database type...", {
          description: `Changing from ${originalDatabaseType} to ${settings.database_type}`,
        })

        const dbChangeResponse = await fetch("/api/database/change-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            database_type: settings.database_type,
            database_url: settings.database_url,
          }),
        })

        if (!dbChangeResponse.ok) {
          const errorData = await dbChangeResponse.json()
          console.error("[v0] Database type change failed:", errorData)
          toast.error("Database change failed", {
            description: errorData.error || "Failed to change database type",
          })
          throw new Error("Database type change failed")
        }

        console.log("[v0] Database type changed successfully")
        setOriginalDatabaseType(settings.database_type)
        setDatabaseChanged(false)

        toast.success("Database type changed!", {
          description: "System will restart automatically to apply changes.",
        })

        // Wait a moment before restarting
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Trigger system restart
        window.location.reload()
        return
      }

      // Step 6: If critical settings changed, resume engine
      if (databaseSizesChanged || engineIntervalsChanged) {
        console.log("[v0] Resuming trade engine with new settings...")
        toast.info("Resuming trade engine...", {
          description: "Trade engine will restart with updated configuration.",
        })

        // Wait a moment before resuming
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const resumeResponse = await fetch("/api/trade-engine/resume", { method: "POST" })
        if (!resumeResponse.ok) {
          console.error("[v0] Failed to resume trade engine")
          toast.error("Failed to resume trade engine", {
            description: "Please check System status to ensure it is running.",
          })
        } else {
          console.log("[v0] Trade engine resumed successfully")
          toast.success("Trade engine resumed", {
            description: "Engine is now running with the new settings.",
          })
        }

        // Step 7: Reload page to refresh all components with new settings
        toast.info("Applying all changes...", {
          description: "The page will reload to fully apply all updated settings.",
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast.error("Error saving settings", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })

      // Try to resume engine if it was paused
      try {
        await fetch("/api/trade-engine/resume", { method: "POST" })
      } catch (resumeError) {
        console.error("[v0] Failed to resume engine after error:", resumeError)
      }
    } finally {
      setSaving(false)
      setReorganizing(false)
    }
  }

  const exportSettings = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/settings/export")
      const data = await response.json()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `settings-${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Settings exported", {
        description: "Your configuration has been successfully exported.",
      })
    } catch (error) {
      console.error("[v0] Failed to export settings:", error)
      toast.error("Export Failed", {
        description: "Could not export settings. Please try again.",
      })
    } finally {
      setExporting(false)
    }
  }

  const importSettings = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"

    input.onchange = async (e: any) => {
      setImporting(true)
      try {
        const file = e.target.files[0]
        const text = await file.text()
        const data = JSON.parse(text)

        const response = await fetch("/api/settings/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) throw new Error("Failed to import settings")

        await loadSettings()
        toast.success("Settings Imported", {
          description: "Configuration has been successfully imported and applied.",
        })
      } catch (error) {
        console.error("[v0] Failed to import settings:", error)
        toast.error("Import Failed", {
          description: "Could not import settings. Please check the file format and try again.",
        })
      } finally {
        setImporting(false)
      }
    }

    input.click()
  }

  const addMainSymbol = () => {
    if (!newMainSymbol.trim()) return
    const currentSymbols = Array.isArray(settings.mainSymbols) ? settings.mainSymbols : []
    let symbol = newMainSymbol.trim().toUpperCase()
    symbol = symbol.replace(/(USDT|BUSD|USD|BTC|ETH|BNB)$/, "")
    if (!currentSymbols.includes(symbol) && symbol.length > 0) {
      handleSettingChange("mainSymbols", [...currentSymbols, symbol])
      setNewMainSymbol("")
    }
  }

  const removeMainSymbol = (symbol: string) => {
    const currentSymbols = Array.isArray(settings.mainSymbols) ? settings.mainSymbols : []
    handleSettingChange(
      "mainSymbols",
      currentSymbols.filter((s) => s !== symbol),
    )
  }

  const addForcedSymbol = () => {
    if (!newForcedSymbol.trim()) return
    const currentSymbols = Array.isArray(settings.forcedSymbols) ? settings.forcedSymbols : []
    let symbol = newForcedSymbol.trim().toUpperCase()
    symbol = symbol.replace(/(USDT|BUSD|USD|BTC|ETH|BNB)$/, "")
    if (!currentSymbols.includes(symbol) && symbol.length > 0) {
      handleSettingChange("forcedSymbols", [...currentSymbols, symbol])
      setNewForcedSymbol("")
    }
  }

  const removeForcedSymbol = (symbol: string) => {
    const currentSymbols = Array.isArray(settings.forcedSymbols) ? settings.forcedSymbols : []
    handleSettingChange(
      "forcedSymbols",
      currentSymbols.filter((s) => s !== symbol),
    )
  }

  const handleDatabaseTypeChange = async (newType: "sqlite" | "postgresql" | "remote") => {
    if (!confirm("Changing database type requires system restart. Continue?")) return

    try {
      toast.info("Changing database type...", {
        description: "This may take a moment.",
      })

      const response = await fetch("/api/database/change-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      })

      if (!response.ok) {
        throw new Error("Failed to change database type")
      }

      toast.info("Database type changed", {
        description: "The page will reload to apply changes.",
      })

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("[v0] Failed to change database type:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to change database type",
      })
    }
  }

  useEffect(() => {
    const loadSettingsAndDB = async () => {
      try {
        // Fetch settings
        const settingsResponse = await fetch("/api/settings")
        if (settingsResponse.ok) {
          const data = await settingsResponse.json()
          if (!data.settings) {
            console.error("[v0] No settings found in response")
          } else {
            setSettings((prevSettings: Settings) => {
              const updatedSettings = { ...prevSettings, ...data.settings }
              // Ensure arrays are not overwritten if empty in the loaded data
              if (data.settings.mainSymbols && Array.isArray(data.settings.mainSymbols)) {
                updatedSettings.mainSymbols = data.settings.mainSymbols
              }
              if (data.settings.forcedSymbols && Array.isArray(data.settings.forcedSymbols)) {
                updatedSettings.forcedSymbols = data.settings.forcedSymbols
              }
              if (data.settings.maxPositionsPerExchange && typeof data.settings.maxPositionsPerExchange === "object") {
                updatedSettings.maxPositionsPerExchange = data.settings.maxPositionsPerExchange
              }
              // Ensure engine interval defaults
              if (data.settings.mainEngineIntervalMs === undefined) updatedSettings.mainEngineIntervalMs = 100
              if (data.settings.presetEngineIntervalMs === undefined) updatedSettings.presetEngineIntervalMs = 100
              if (data.settings.activeOrderHandlingIntervalMs === undefined)
                updatedSettings.activeOrderHandlingIntervalMs = 50
              // Ensure engine toggles
              if (data.settings.mainEngineEnabled === undefined) updatedSettings.mainEngineEnabled = true
              if (data.settings.presetEngineEnabled === undefined) updatedSettings.presetEngineEnabled = true
              // Trade engine config defaults
              if (data.settings.positionCooldownMs === undefined) updatedSettings.positionCooldownMs = 100
              if (data.settings.maxPositionsPerConfigDirection === undefined)
                updatedSettings.maxPositionsPerConfigDirection = 2
              if (data.settings.maxConcurrentOperations === undefined) updatedSettings.maxConcurrentOperations = 100
              // Position cost default
              if (data.settings.positionCost === undefined) updatedSettings.positionCost = 0.1
              if (data.settings.negativeChangePercent === undefined) updatedSettings.negativeChangePercent = 20
              if (data.settings.leveragePercentage === undefined) updatedSettings.leveragePercentage = 100
              // Merge exchange-specific settings
              updatedSettings.exchangeDirectionEnabled =
                data.settings.exchangeDirectionEnabled ?? prevSettings.directionEnabled
              updatedSettings.exchangeMoveEnabled = data.settings.exchangeMoveEnabled ?? prevSettings.moveEnabled
              updatedSettings.exchangeActiveEnabled = data.settings.exchangeActiveEnabled ?? prevSettings.activeEnabled
              updatedSettings.exchangeOptimalEnabled =
                data.settings.exchangeOptimalEnabled ?? prevSettings.optimalCoordinationEnabled
              updatedSettings.exchangeBaseStrategyEnabled =
                data.settings.exchangeBaseStrategyEnabled ?? prevSettings.exchangeBaseStrategyEnabled
              updatedSettings.exchangeMainStrategyEnabled =
                data.settings.exchangeMainStrategyEnabled ?? prevSettings.exchangeMainStrategyEnabled
              updatedSettings.exchangeRealStrategyEnabled =
                data.settings.exchangeRealStrategyEnabled ?? prevSettings.exchangeRealStrategyEnabled
              updatedSettings.exchangeTrailingEnabled =
                data.settings.exchangeTrailingEnabled ?? prevSettings.trailingEnabled
              updatedSettings.exchangeBlockEnabled = data.settings.exchangeBlockEnabled ?? prevSettings.blockAdjustment
              updatedSettings.exchangeDcaEnabled = data.settings.exchangeDcaEnabled ?? prevSettings.dcaAdjustment
              // Apply specific settings or fall back
              updatedSettings.profitFactorMinMain =
                data.settings.profitFactorMinMain ?? initialSettings.profitFactorMinMain
              updatedSettings.drawdownTimeMain = data.settings.drawdownTimeMain ?? initialSettings.drawdownTimeMain
              updatedSettings.mainDirectionEnabled =
                data.settings.mainDirectionEnabled ?? initialSettings.mainDirectionEnabled
              updatedSettings.mainMoveEnabled = data.settings.mainMoveEnabled ?? initialSettings.mainMoveEnabled
              updatedSettings.mainActiveEnabled = data.settings.mainActiveEnabled ?? initialSettings.mainActiveEnabled
              updatedSettings.mainOptimalEnabled =
                data.settings.mainOptimalEnabled ?? initialSettings.mainOptimalEnabled
              updatedSettings.mainTrailingStrategy =
                data.settings.mainTrailingStrategy ?? initialSettings.mainTrailingStrategy
              updatedSettings.mainBlockStrategy = data.settings.mainBlockStrategy ?? initialSettings.mainBlockStrategy
              updatedSettings.mainDcaStrategy = data.settings.mainDcaStrategy ?? initialSettings.mainDcaStrategy
              updatedSettings.profitFactorMinPreset =
                data.settings.profitFactorMinPreset ?? initialSettings.profitFactorMinPreset
              updatedSettings.drawdownTimePreset =
                data.settings.drawdownTimePreset ?? initialSettings.drawdownTimePreset
              updatedSettings.presetTrailingEnabled =
                data.settings.presetTrailingEnabled ?? initialSettings.presetTrailingEnabled
              updatedSettings.presetBlockEnabled =
                data.settings.presetBlockEnabled ?? initialSettings.presetBlockEnabled
              updatedSettings.presetDcaEnabled = data.settings.presetDcaEnabled ?? initialSettings.presetDcaEnabled
              updatedSettings.presetDirectionEnabled =
                data.settings.presetDirectionEnabled ?? initialSettings.presetDirectionEnabled
              updatedSettings.presetMoveEnabled = data.settings.presetMoveEnabled ?? initialSettings.presetMoveEnabled
              updatedSettings.presetActiveEnabled =
                data.settings.presetActiveEnabled ?? initialSettings.presetActiveEnabled
              updatedSettings.presetOptimalEnabled =
                data.settings.presetOptimalEnabled ?? initialSettings.presetOptimalEnabled
              updatedSettings.presetTrailingStrategy =
                data.settings.presetTrailingStrategy ?? initialSettings.presetTrailingStrategy
              updatedSettings.presetBlockStrategy =
                data.settings.presetBlockStrategy ?? initialSettings.presetBlockStrategy
              updatedSettings.presetDcaStrategy = data.settings.presetDcaStrategy ?? initialSettings.presetDcaStrategy
              updatedSettings.tradeMode = data.settings.tradeMode ?? initialSettings.tradeMode
              // Sync exchangePositionCost
              if (data.settings.exchangePositionCost === undefined) {
                updatedSettings.exchangePositionCost = updatedSettings.positionCost
              } else {
                updatedSettings.exchangePositionCost = data.settings.exchangePositionCost
              }
              // Apply defaults for new settings
              updatedSettings.useMainSymbols = data.settings.useMainSymbols ?? initialSettings.useMainSymbols
              updatedSettings.numberOfSymbolsToSelect =
                data.settings.numberOfSymbolsToSelect ?? initialSettings.numberOfSymbolsToSelect
              updatedSettings.symbolOrderType = data.settings.symbolOrderType ?? initialSettings.symbolOrderType
              updatedSettings.quoteAsset = data.settings.quoteAsset ?? initialSettings.quoteAsset
              updatedSettings.min_volume_enforcement =
                data.settings.min_volume_enforcement ?? initialSettings.min_volume_enforcement
              // Apply Indication Settings Defaults
              updatedSettings.directionRangeStep =
                data.settings.directionRangeStep ?? initialSettings.directionRangeStep
              updatedSettings.directionDrawdownValues =
                data.settings.directionDrawdownValues ?? initialSettings.directionDrawdownValues
              updatedSettings.directionMarketChangeFrom =
                data.settings.directionMarketChangeFrom ?? initialSettings.directionMarketChangeFrom
              updatedSettings.directionMarketChangeTo =
                data.settings.directionMarketChangeTo ?? initialSettings.directionMarketChangeTo
              updatedSettings.directionMarketChangeStep =
                data.settings.directionMarketChangeStep ?? initialSettings.directionMarketChangeStep
              updatedSettings.directionMinCalcTime =
                data.settings.directionMinCalcTime ?? initialSettings.directionMinCalcTime
              updatedSettings.directionLastPartRatio =
                data.settings.directionLastPartRatio ?? initialSettings.directionLastPartRatio
              updatedSettings.directionRatioFactorFrom =
                data.settings.directionRatioFactorFrom ?? initialSettings.directionRatioFactorFrom
              updatedSettings.directionRatioFactorTo =
                data.settings.directionRatioFactorTo ?? initialSettings.directionRatioFactorTo
              updatedSettings.directionRatioFactorStep =
                data.settings.directionRatioFactorStep ?? initialSettings.directionRatioFactorStep
              updatedSettings.moveRangeStep = data.settings.moveRangeStep ?? initialSettings.moveRangeStep
              updatedSettings.moveDrawdownValues =
                data.settings.moveDrawdownValues ?? initialSettings.moveDrawdownValues
              updatedSettings.moveMarketChangeFrom =
                data.settings.moveMarketChangeFrom ?? initialSettings.moveMarketChangeFrom
              updatedSettings.moveMarketChangeTo =
                data.settings.moveMarketChangeTo ?? initialSettings.moveMarketChangeTo
              updatedSettings.moveMarketChangeStep =
                data.settings.moveMarketChangeStep ?? initialSettings.moveMarketChangeStep
              updatedSettings.moveMinCalcTime = data.settings.moveMinCalcTime ?? initialSettings.moveMinCalcTime
              updatedSettings.moveLastPartRatio = data.settings.moveLastPartRatio ?? initialSettings.moveLastPartRatio
              updatedSettings.moveRatioFactorFrom =
                data.settings.moveRatioFactorFrom ?? initialSettings.moveRatioFactorFrom
              updatedSettings.moveRatioFactorTo = data.settings.moveRatioFactorTo ?? initialSettings.moveRatioFactorTo
              updatedSettings.moveRatioFactorStep =
                data.settings.moveRatioFactorStep ?? initialSettings.moveRatioFactorStep
              updatedSettings.activeRangeStep = data.settings.activeRangeStep ?? initialSettings.activeRangeStep
              updatedSettings.activeDrawdownValues =
                data.settings.activeDrawdownValues ?? initialSettings.activeDrawdownValues
              updatedSettings.activeMarketChangeFrom =
                data.settings.activeMarketChangeFrom ?? initialSettings.activeMarketChangeFrom
              updatedSettings.activeMarketChangeTo =
                data.settings.activeMarketChangeTo ?? initialSettings.activeMarketChangeTo
              updatedSettings.activeMarketChangeStep =
                data.settings.activeMarketChangeStep ?? initialSettings.activeMarketChangeStep
              updatedSettings.activeMinCalcTime = data.settings.activeMinCalcTime ?? initialSettings.activeMinCalcTime
              updatedSettings.activeLastPartRatio =
                data.settings.activeLastPartRatio ?? initialSettings.activeLastPartRatio
              updatedSettings.activeRatioFactorFrom =
                data.settings.activeRatioFactorFrom ?? initialSettings.activeRatioFactorFrom
              updatedSettings.activeRatioFactorTo =
                data.settings.activeRatioFactorTo ?? initialSettings.activeRatioFactorTo
              updatedSettings.activeRatioFactorStep =
                data.settings.activeRatioFactorStep ?? initialSettings.activeRatioFactorStep
              updatedSettings.activeCalculatedFrom =
                data.settings.activeCalculatedFrom ?? initialSettings.activeCalculatedFrom
              updatedSettings.activeCalculatedTo =
                data.settings.activeCalculatedTo ?? initialSettings.activeCalculatedTo
              updatedSettings.activeCalculatedStep =
                data.settings.activeCalculatedStep ?? initialSettings.activeCalculatedStep
              updatedSettings.activeLastPartFrom =
                data.settings.activeLastPartFrom ?? initialSettings.activeLastPartFrom
              updatedSettings.activeLastPartTo = data.settings.activeLastPartTo ?? initialSettings.activeLastPartTo
              updatedSettings.activeLastPartStep =
                data.settings.activeLastPartStep ?? initialSettings.activeLastPartStep
              // Apply new indicator range defaults
              updatedSettings.rsiPeriodFrom = data.settings.rsiPeriodFrom ?? initialSettings.rsiPeriodFrom
              updatedSettings.rsiPeriodTo = data.settings.rsiPeriodTo ?? initialSettings.rsiPeriodTo
              updatedSettings.rsiPeriodStep = data.settings.rsiPeriodStep ?? initialSettings.rsiPeriodStep
              updatedSettings.rsiOversoldFrom = data.settings.rsiOversoldFrom ?? initialSettings.rsiOversoldFrom
              updatedSettings.rsiOversoldTo = data.settings.rsiOversoldTo ?? initialSettings.rsiOversoldTo
              updatedSettings.rsiOversoldStep = data.settings.rsiOversoldStep ?? initialSettings.rsiOversoldStep
              updatedSettings.rsiOverboughtFrom = data.settings.rsiOverboughtFrom ?? initialSettings.rsiOverboughtFrom
              updatedSettings.rsiOverboughtTo = data.settings.rsiOverboughtTo ?? initialSettings.rsiOverboughtTo
              updatedSettings.rsiOverboughtStep = data.settings.rsiOverboughtStep ?? initialSettings.rsiOverboughtStep

              updatedSettings.macdFastPeriodFrom =
                data.settings.macdFastPeriodFrom ?? initialSettings.macdFastPeriodFrom
              updatedSettings.macdFastPeriodTo = data.settings.macdFastPeriodTo ?? initialSettings.macdFastPeriodTo
              updatedSettings.macdFastPeriodStep =
                data.settings.macdFastPeriodStep ?? initialSettings.macdFastPeriodStep
              updatedSettings.macdSlowPeriodFrom =
                data.settings.macdSlowPeriodFrom ?? initialSettings.macdSlowPeriodFrom
              updatedSettings.macdSlowPeriodTo = data.settings.macdSlowPeriodTo ?? initialSettings.macdSlowPeriodTo
              updatedSettings.macdSlowPeriodStep =
                data.settings.macdSlowPeriodStep ?? initialSettings.macdSlowPeriodStep
              updatedSettings.macdSignalPeriodFrom =
                data.settings.macdSignalPeriodFrom ?? initialSettings.macdSignalPeriodFrom
              updatedSettings.macdSignalPeriodTo =
                data.settings.macdSignalPeriodTo ?? initialSettings.macdSignalPeriodTo
              updatedSettings.macdSignalPeriodStep =
                data.settings.macdSignalPeriodStep ?? initialSettings.macdSignalPeriodStep

              updatedSettings.bollingerPeriodFrom =
                data.settings.bollingerPeriodFrom ?? initialSettings.bollingerPeriodFrom
              updatedSettings.bollingerPeriodTo = data.settings.bollingerPeriodTo ?? initialSettings.bollingerPeriodTo
              updatedSettings.bollingerPeriodStep =
                data.settings.bollingerPeriodStep ?? initialSettings.bollingerPeriodStep
              updatedSettings.bollingerStdDevFrom =
                data.settings.bollingerStdDevFrom ?? initialSettings.bollingerStdDevFrom
              updatedSettings.bollingerStdDevTo = data.settings.bollingerStdDevTo ?? initialSettings.bollingerStdDevTo
              updatedSettings.bollingerStdDevStep =
                data.settings.bollingerStdDevStep ?? initialSettings.bollingerStdDevStep

              updatedSettings.emaShortPeriodFrom =
                data.settings.emaShortPeriodFrom ?? initialSettings.emaShortPeriodFrom
              updatedSettings.emaShortPeriodTo = data.settings.emaShortPeriodTo ?? initialSettings.emaShortPeriodTo
              updatedSettings.emaShortPeriodStep =
                data.settings.emaShortPeriodStep ?? initialSettings.emaShortPeriodStep
              updatedSettings.emaLongPeriodFrom = data.settings.emaLongPeriodFrom ?? initialSettings.emaLongPeriodFrom
              updatedSettings.emaLongPeriodTo = data.settings.emaLongPeriodTo ?? initialSettings.emaLongPeriodTo
              updatedSettings.emaLongPeriodStep = data.settings.emaLongPeriodStep ?? initialSettings.emaLongPeriodStep

              updatedSettings.smaShortPeriodFrom =
                data.settings.smaShortPeriodFrom ?? initialSettings.smaShortPeriodFrom
              updatedSettings.smaShortPeriodTo = data.settings.smaShortPeriodTo ?? initialSettings.smaShortPeriodTo
              updatedSettings.smaShortPeriodStep =
                data.settings.smaShortPeriodStep ?? initialSettings.smaShortPeriodStep
              updatedSettings.smaLongPeriodFrom = data.settings.smaLongPeriodFrom ?? initialSettings.smaLongPeriodFrom
              updatedSettings.smaLongPeriodTo = data.settings.smaLongPeriodTo ?? initialSettings.smaLongPeriodTo
              updatedSettings.smaLongPeriodStep = data.settings.smaLongPeriodStep ?? initialSettings.smaLongPeriodStep

              updatedSettings.stochasticKPeriodFrom =
                data.settings.stochasticKPeriodFrom ?? initialSettings.stochasticKPeriodFrom
              updatedSettings.stochasticKPeriodTo =
                data.settings.stochasticKPeriodTo ?? initialSettings.stochasticKPeriodTo
              updatedSettings.stochasticKPeriodStep =
                data.settings.stochasticKPeriodStep ?? initialSettings.stochasticKPeriodStep
              updatedSettings.stochasticDPeriodFrom =
                data.settings.stochasticDPeriodFrom ?? initialSettings.stochasticDPeriodFrom
              updatedSettings.stochasticDPeriodTo =
                data.settings.stochasticDPeriodTo ?? initialSettings.stochasticDPeriodTo
              updatedSettings.stochasticDPeriodStep =
                data.settings.stochasticDPeriodStep ?? initialSettings.stochasticDPeriodStep
              updatedSettings.stochasticSlowingFrom =
                data.settings.stochasticSlowingFrom ?? initialSettings.stochasticSlowingFrom
              updatedSettings.stochasticSlowingTo =
                data.settings.stochasticSlowingTo ?? initialSettings.stochasticSlowingTo
              updatedSettings.stochasticSlowingStep =
                data.settings.stochasticSlowingStep ?? initialSettings.stochasticSlowingStep

              updatedSettings.adxPeriodFrom = data.settings.adxPeriodFrom ?? initialSettings.adxPeriodFrom
              updatedSettings.adxPeriodTo = data.settings.adxPeriodTo ?? initialSettings.adxPeriodTo
              updatedSettings.adxPeriodStep = data.settings.adxPeriodStep ?? initialSettings.adxPeriodStep
              updatedSettings.adxThresholdFrom = data.settings.adxThresholdFrom ?? initialSettings.adxThresholdFrom
              updatedSettings.adxThresholdTo = data.settings.adxThresholdTo ?? initialSettings.adxThresholdTo
              updatedSettings.adxThresholdStep = data.settings.adxThresholdStep ?? initialSettings.adxThresholdStep

              updatedSettings.atrPeriodFrom = data.settings.atrPeriodFrom ?? initialSettings.atrPeriodFrom
              updatedSettings.atrPeriodTo = data.settings.atrPeriodTo ?? initialSettings.atrPeriodTo
              updatedSettings.atrPeriodStep = data.settings.atrPeriodStep ?? initialSettings.atrPeriodStep
              updatedSettings.atrMultiplierFrom = data.settings.atrMultiplierFrom ?? initialSettings.atrMultiplierFrom
              updatedSettings.atrMultiplierTo = data.settings.atrMultiplierTo ?? initialSettings.atrMultiplierTo
              updatedSettings.atrMultiplierStep = data.settings.atrMultiplierStep ?? initialSettings.atrMultiplierStep

              // Add Parabolic SAR defaults if missing
              updatedSettings.parabolicSAREnabled =
                data.settings.parabolicSAREnabled ?? initialSettings.parabolicSAREnabled
              updatedSettings.parabolicSARAcceleration =
                data.settings.parabolicSARAcceleration ?? initialSettings.parabolicSARAcceleration
              updatedSettings.parabolicSARMaximum =
                data.settings.parabolicSARMaximum ?? initialSettings.parabolicSARMaximum
              updatedSettings.parabolicSARAccelerationFrom =
                data.settings.parabolicSARAccelerationFrom ?? initialSettings.parabolicSARAccelerationFrom
              updatedSettings.parabolicSARAccelerationTo =
                data.settings.parabolicSARAccelerationTo ?? initialSettings.parabolicSARAccelerationTo
              updatedSettings.parabolicSARAccelerationStep =
                data.settings.parabolicSARAccelerationStep ?? initialSettings.parabolicSARAccelerationStep
              updatedSettings.parabolicSARMaximumFrom =
                data.settings.parabolicSARMaximumFrom ?? initialSettings.parabolicSARMaximumFrom
              updatedSettings.parabolicSARMaximumTo =
                data.settings.parabolicSARMaximumTo ?? initialSettings.parabolicSARMaximumTo
              updatedSettings.parabolicSARMaximumStep =
                data.settings.parabolicSARMaximumStep ?? initialSettings.parabolicSARMaximumStep

              return updatedSettings
            })
          }
        }

        // Load current database type and URL
        const dbTypeResponse = await fetch("/api/database/type")
        if (dbTypeResponse.ok) {
          const dbData = await dbTypeResponse.json()
          setSettings((prev) => ({
            ...prev,
            database_type: dbData.database_type || "sqlite",
            database_url: dbData.database_url || "",
          }))
          setOriginalDatabaseType(dbData.database_type || "sqlite")
        }

        loadConnections()
        loadPresetConnections()
      } catch (error) {
        console.error("[v0] Failed to load settings:", error)
      }
    }
    loadSettingsAndDB()
  }, [])

  useEffect(() => {
    setDatabaseChanged(settings.database_type !== originalDatabaseType)
  }, [settings.database_type, originalDatabaseType])

  const loadDatabaseType = async () => {
    try {
      const response = await fetch("/api/database/type")
      if (response.ok) {
        const data = await response.json()
        setDatabaseType(data.type || "sqlite")
      }
    } catch (error) {
      console.error("[v0] Failed to load database type:", error)
    }
  }

  const getMinIndicationInterval = () => {
    // Indication intervals should be at least as long as the main engine interval
    return Math.max(settings.mainEngineIntervalMs || 100, 50)
  }

  const getMinActiveIndicationInterval = () => {
    // Active indication is part of main trade engine, uses main engine interval as minimum
    return Math.max(settings.mainEngineIntervalMs || 100, 50)
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Configure system parameters and trading strategies</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportSettings} disabled={exporting} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={importSettings} disabled={importing} variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={saveAllSettings} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {reorganizing ? "Reorganizing..." : saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="exchange">Exchange</TabsTrigger>
            <TabsTrigger value="indication">Indication</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <Tabs value={overallSubTab} onValueChange={setOverallSubTab}>
              <TabsList>
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="install">Install</TabsTrigger>
                <TabsTrigger value="backup">Backup</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Main Configuration</CardTitle>
                    <CardDescription>Core trading parameters and symbol selection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Data & Timeframe Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure historical data retrieval and market timeframes
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Days of Prehistoric Data</Label>
                            <span className="text-sm font-medium">{settings.prehistoricDataDays || 5} days</span>
                          </div>
                          <Slider
                            min={1}
                            max={15}
                            step={1}
                            value={[settings.prehistoricDataDays || 5]}
                            onValueChange={([value]) => handleSettingChange("prehistoricDataDays", value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Historical data to load on startup (1-15 days)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Market Timeframe</Label>
                          <Select
                            value={String(settings.marketTimeframe || 1)}
                            onValueChange={(value) => handleSettingChange("marketTimeframe", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 second</SelectItem>
                              <SelectItem value="5">5 seconds</SelectItem>
                              <SelectItem value="15">15 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">1 minute</SelectItem>
                              <SelectItem value="300">5 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Market data update interval</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Removed Position Configuration section, moved settings to Volume Configuration */}

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Volume Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure volume factors and position calculation settings
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Base Volume Factor</Label>
                            <span className="text-sm font-medium">{settings.base_volume_factor || 1}</span>
                          </div>
                          <Slider
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={[settings.base_volume_factor || 1]}
                            onValueChange={([value]) => handleSettingChange("base_volume_factor", value)}
                          />
                          <p className="text-xs text-muted-foreground">Position volume multiplier (0.5-10)</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Range Percentage (Loss Trigger)</Label>
                            <span className="text-sm font-medium">{settings.negativeChangePercent || 20}%</span>
                          </div>
                          <Slider
                            min={5}
                            max={30}
                            step={5}
                            value={[settings.negativeChangePercent || 20]}
                            onValueChange={([value]) => {
                              handleSettingChange("negativeChangePercent", value)
                              handleSettingChange("risk_percentage", value)
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Market price change % to trigger loss calculation (5-30%)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Positions Average</Label>
                            <span className="text-sm font-medium">{settings.positions_average || 50}</span>
                          </div>
                          <Slider
                            min={20}
                            max={300}
                            step={10}
                            value={[settings.positions_average || 50]}
                            onValueChange={([value]) => handleSettingChange("positions_average", value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Target positions count for volume averaging calculation (20-300)
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label>Minimum Volume Enforcement</Label>
                            <p className="text-xs text-muted-foreground">
                              Require minimum trading volume for positions
                            </p>
                          </div>
                          <Switch
                            checked={settings.min_volume_enforcement !== false}
                            onCheckedChange={(checked) => handleSettingChange("min_volume_enforcement", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Position Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Position cost as ratio/percentage used for pseudo position calculations (Base/Main/Real levels).
                        Volume is calculated ONLY at Exchange level when orders are executed. This value is
                        account-balance independent.
                      </p>

                      <div className="space-y-2">
                        <Label>Position Cost Percentage (0.01% - 1.0%)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={0.01}
                            max={1.0}
                            step={0.01}
                            value={[settings.exchangePositionCost ?? settings.positionCost ?? 0.1]}
                            onValueChange={([value]) => {
                              handleSettingChange("exchangePositionCost", value)
                              // Sync with Position Configuration settings
                              handleSettingChange("positionCost", value)
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-16 text-right">
                            {(settings.exchangePositionCost ?? settings.positionCost ?? 0.1).toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Position cost ratio used for Base/Main/Real pseudo position calculations (count-based, no
                          volume). Volume is calculated at Exchange level: volume = (accountBalance × positionCost) /
                          (entryPrice × leverage). Range: 0.01% - 1.0%, Default: 0.1%
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Leverage Configuration</h3>
                      <p className="text-sm text-muted-foreground">Configure leverage settings and limits</p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Leverage Percentage</Label>
                            <span className="text-sm font-medium">{settings.leveragePercentage || 100}%</span>
                          </div>
                          <Slider
                            min={5}
                            max={100}
                            step={5}
                            value={[settings.leveragePercentage || 100]}
                            onValueChange={([value]) => handleSettingChange("leveragePercentage", value)}
                          />
                          <p className="text-xs text-muted-foreground">Percentage of max leverage to use (5-100%)</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Max Leverage</Label>
                            <span className="text-sm font-medium">{settings.max_leverage || 125}x</span>
                          </div>
                          <Slider
                            min={1}
                            max={125}
                            step={1}
                            value={[settings.max_leverage || 125]}
                            onValueChange={([value]) => handleSettingChange("max_leverage", value)}
                          />
                          <p className="text-xs text-muted-foreground">Maximum leverage allowed (1-125x)</p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label>Use Maximal Leverage</Label>
                            <p className="text-xs text-muted-foreground">Always use maximum available leverage</p>
                          </div>
                          <Switch
                            checked={settings.useMaximalLeverage !== false}
                            onCheckedChange={(checked) => handleSettingChange("useMaximalLeverage", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Symbol Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure symbol selection and ordering from exchanges
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Symbol Order Type</Label>
                          <Select
                            value={settings.symbolOrderType || "volume24h"}
                            onValueChange={(value) => handleSettingChange("symbolOrderType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="volume24h">24h Volume (Highest First)</SelectItem>
                              <SelectItem value="marketCap">Market Cap (Largest First)</SelectItem>
                              <SelectItem value="priceChange24h">24h Price Change</SelectItem>
                              <SelectItem value="volatility">Volatility (Most Volatile)</SelectItem>
                              <SelectItem value="trades24h">24h Trades (Most Active)</SelectItem>
                              <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Order symbols retrieved from exchange</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Number of Symbols</Label>
                            <span className="text-sm font-medium">{settings.numberOfSymbolsToSelect || 8}</span>
                          </div>
                          <Slider
                            min={2}
                            max={30}
                            step={1}
                            value={[settings.numberOfSymbolsToSelect || 8]}
                            onValueChange={([value]) => handleSettingChange("numberOfSymbolsToSelect", value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Count of symbols to retrieve from exchange (2-30)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Quote Asset</Label>
                          <Select
                            value={settings.quoteAsset || "USDT"}
                            onValueChange={(value) => handleSettingChange("quoteAsset", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USDT">USDT</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="BUSD">BUSD</SelectItem>
                              <SelectItem value="BTC">BTC</SelectItem>
                              <SelectItem value="ETH">ETH</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Quote currency for trading pairs</p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label>Use Main Symbols Only</Label>
                            <p className="text-xs text-muted-foreground">
                              Trade only configured main symbols instead of exchange retrieval
                            </p>
                          </div>
                          <Switch
                            id="useMainSymbols"
                            checked={settings.useMainSymbols || false}
                            onCheckedChange={(checked) => handleSettingChange("useMainSymbols", checked)}
                          />
                        </div>
                      </div>

                      {/* Main Symbols Configuration */}
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Main Symbols</Label>
                            <p className="text-xs text-muted-foreground">
                              Primary trading symbols - used when "Use Main Symbols Only" is enabled
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(settings.mainSymbols || ["BTC", "ETH", "BNB", "XRP", "ADA", "SOL"]).map((symbol) => (
                            <Badge key={symbol} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                              {symbol}
                              <button onClick={() => removeMainSymbol(symbol)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add symbol (e.g., DOGE)"
                            value={newMainSymbol}
                            onChange={(e) => setNewMainSymbol(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && addMainSymbol()}
                            className="max-w-[200px]"
                          />
                          <Button variant="outline" size="sm" onClick={addMainSymbol}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Forced Symbols Configuration */}
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Forced Symbols</Label>
                            <p className="text-xs text-muted-foreground">
                              Symbols always included in trading regardless of other settings
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(settings.forcedSymbols || ["XRP", "BCH"]).map((symbol) => (
                            <Badge key={symbol} variant="default" className="flex items-center gap-1 px-3 py-1">
                              {symbol}
                              <button
                                onClick={() => removeForcedSymbol(symbol)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add symbol (e.g., LTC)"
                            value={newForcedSymbol}
                            onChange={(e) => setNewForcedSymbol(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && addForcedSymbol()}
                            className="max-w-[200px]"
                          />
                          <Button variant="outline" size="sm" onClick={addForcedSymbol}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connection" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Exchange Connections</CardTitle>
                    <CardDescription>Manage exchange API connections and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExchangeConnectionManager onConnectionsChange={loadConnections} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Connection Defaults</CardTitle>
                    <CardDescription>Default settings for new connections</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Margin Type</Label>
                      <Select
                        value={settings.defaultMarginType || "cross"}
                        onValueChange={(value) => handleSettingChange("defaultMarginType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cross">Cross Margin</SelectItem>
                          <SelectItem value="isolated">Isolated Margin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Position Mode</Label>
                      <Select
                        value={settings.defaultPositionMode || "hedge"}
                        onValueChange={(value) => handleSettingChange("defaultPositionMode", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hedge">Hedge Mode</SelectItem>
                          <SelectItem value="one-way">One-Way Mode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rate Limit Delay (ms)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={settings.rateLimitDelayMs || 50}
                        onChange={(e) => handleSettingChange("rateLimitDelayMs", Number.parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Delay between API requests to respect rate limits</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Concurrent Connections</Label>
                      <Input
                        type="number"
                        min="1"
                        value={settings.maxConcurrentConnections || 3}
                        onChange={(e) =>
                          handleSettingChange("maxConcurrentConnections", Number.parseInt(e.target.value))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum concurrent active connections to exchanges
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Testnet by Default</Label>
                      <Switch
                        checked={settings.enableTestnetByDefault || false}
                        onCheckedChange={(checked) => handleSettingChange("enableTestnetByDefault", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Monitoring</CardTitle>
                    <CardDescription>Configure monitoring and logging settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable System Monitoring</Label>
                      <Switch
                        checked={settings.enableSystemMonitoring !== false}
                        onCheckedChange={(checked) => handleSettingChange("enableSystemMonitoring", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Metrics Retention (days)</Label>
                      <Slider
                        min={7}
                        max={90}
                        step={1}
                        value={[settings.metricsRetentionDays || 30]}
                        onValueChange={([value]) => handleSettingChange("metricsRetentionDays", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.metricsRetentionDays || 30} days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Restart Engine Options</CardTitle>
                    <CardDescription>
                      Control trade engine restart behavior and manually restart when needed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Manual Restart Controls */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Manual Restart</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRestartEngine({ force: false, clearCache: false })}
                          disabled={isRestarting}
                          variant="default"
                        >
                          {isRestarting ? "Restarting..." : "Restart Engine"}
                        </Button>
                        <Button
                          onClick={() => handleRestartEngine({ force: true, clearCache: true })}
                          disabled={isRestarting}
                          variant="destructive"
                        >
                          Force Restart & Clear Cache
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Restart the trade engine. Force restart will clear all cached data and force a fresh start.
                      </p>
                    </div>

                    <Separator />

                    {/* Auto-restart Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Auto-restart on Errors</Label>
                          <p className="text-xs text-muted-foreground">Automatically restart trade engine on failure</p>
                        </div>
                        <Switch
                          checked={settings.autoRestartOnErrors !== false}
                          onCheckedChange={(checked) => handleSettingChange("autoRestartOnErrors", checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Restart Cooldown (minutes)</Label>
                        <Slider
                          min={1}
                          max={30}
                          step={1}
                          value={[settings.restartCooldownMinutes || 5]}
                          onValueChange={([value]) => handleSettingChange("restartCooldownMinutes", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum time between automatic restarts: {settings.restartCooldownMinutes || 5} minutes
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Restart Attempts</Label>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[settings.maxRestartAttempts || 3]}
                          onValueChange={([value]) => handleSettingChange("maxRestartAttempts", value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum automatic restart attempts before manual intervention required:{" "}
                          {settings.maxRestartAttempts || 3}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Restart History */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Recent Restart History</Label>
                      {restartHistory.length > 0 ? (
                        <div className="space-y-2">
                          {restartHistory.map((entry, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border p-3 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    entry.status === "success" ? "bg-green-500" : "bg-red-500"
                                  }`}
                                />
                                <div>
                                  <p className="font-medium">{entry.message}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-semibold uppercase ${
                                  entry.status === "success" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {entry.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                          No restart history available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <LogsViewer />
              </TabsContent>

              <TabsContent value="install" className="space-y-4">
                <InstallManager />
              </TabsContent>

              <TabsContent value="backup" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup & Restore</CardTitle>
                    <CardDescription>Manage system backups and data restoration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={exportSettings} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Settings
                      </Button>
                      <Button onClick={importSettings} variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-4">
            {/* Exchange Connection Selection at Top */}
            <Card>
              <CardHeader>
                <CardTitle>Exchange Connection</CardTitle>
                <CardDescription>Select and configure exchange connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Exchange Connection</Label>
                  <Select
                    value={selectedExchangeConnection || ""}
                    onValueChange={(value) => {
                      setSelectedExchangeConnection(value)
                      localStorage.setItem("activeExchangeConnection", value)
                      toast.info("Connection selected", {
                        description: "Active connection updated and synchronized with Dashboard.",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exchange connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections
                        .filter((conn) => conn.is_enabled)
                        .map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${conn.is_active ? "bg-green-500" : "bg-gray-400"}`}
                              />
                              {conn.name} ({conn.exchange}){conn.is_testnet && " • Testnet"}
                            </div>
                          </SelectItem>
                        ))}
                      {connections.filter((conn) => conn.is_enabled).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">No enabled connections available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the exchange connection to configure. Synchronized with Dashboard selection.
                  </p>
                </div>

                {selectedExchangeConnection && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {connections.find((c) => c.id === selectedExchangeConnection)?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {connections.find((c) => c.id === selectedExchangeConnection)?.exchange} •
                          {connections.find((c) => c.id === selectedExchangeConnection)?.is_testnet
                            ? " Testnet"
                            : " Mainnet"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          connections.find((c) => c.id === selectedExchangeConnection)?.is_active
                            ? "default"
                            : "secondary"
                        }
                      >
                        {connections.find((c) => c.id === selectedExchangeConnection)?.is_active
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Volume Factors</CardTitle>
                <CardDescription>Configure volume multipliers for Main and Preset trading engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Main Trade Volume Factor</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={[settings.baseVolumeFactorLive || 1.0]}
                        onValueChange={([value]) => handleSettingChange("baseVolumeFactorLive", value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {(settings.baseVolumeFactorLive || 1.0).toFixed(1)}x
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Position size multiplier for main trading</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preset Trade Volume Factor</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={[settings.baseVolumeFactorPreset || 1.0]}
                        onValueChange={([value]) => handleSettingChange("baseVolumeFactorPreset", value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {(settings.baseVolumeFactorPreset || 1.0).toFixed(1)}x
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Position size multiplier for preset trading</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symbol Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle>Symbol Selection</CardTitle>
                <CardDescription>Configure symbol selection, ordering and filtering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Symbol Order Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Symbol Ordering</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Use Main Symbols Only</Label>
                      <p className="text-xs text-muted-foreground">Trade only configured main symbols</p>
                    </div>
                    <Switch
                      id="exchange-useMainSymbols"
                      checked={settings.useMainSymbols || false}
                      onCheckedChange={(checked) => handleSettingChange("useMainSymbols", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Order Symbols By</Label>
                    <Select
                      value={settings.symbolOrderType || "volume24h"}
                      onValueChange={(value) => handleSettingChange("symbolOrderType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume24h">24h Volume (Highest First)</SelectItem>
                        <SelectItem value="marketCap">Market Cap (Largest First)</SelectItem>
                        <SelectItem value="priceChange24h">24h Price Change</SelectItem>
                        <SelectItem value="volatility">Volatility (Most Volatile)</SelectItem>
                        <SelectItem value="trades24h">24h Trades (Most Active)</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Determines how symbols are sorted when selecting for trading
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Symbol Count & Filtering */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Symbol Count & Filtering</h3>

                  <div className="space-y-2">
                    <Label>Number of Symbols (2-30)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={2}
                        max={30}
                        step={1}
                        value={[settings.numberOfSymbolsToSelect || 12]}
                        onValueChange={([value]) => handleSettingChange("numberOfSymbolsToSelect", value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-8 text-right">
                        {settings.numberOfSymbolsToSelect || 12}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Number of symbols to select from exchange</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Quote Asset</Label>
                    <Select
                      value={settings.quoteAsset || "USDT"}
                      onValueChange={(value) => handleSettingChange("quoteAsset", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="BUSD">BUSD</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Base quote asset for symbol pairs</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Minimum Volume Enforcement</Label>
                      <p className="text-xs text-muted-foreground">Require minimum 24h trading volume</p>
                    </div>
                    <Switch
                      checked={settings.min_volume_enforcement !== false}
                      onCheckedChange={(checked) => handleSettingChange("min_volume_enforcement", checked)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Active Symbol List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Active Symbols</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedExchangeConnection && loadExchangeSymbols(selectedExchangeConnection)}
                      disabled={loadingSymbols || !selectedExchangeConnection}
                    >
                      {loadingSymbols ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Symbols
                        </>
                      )}
                    </Button>
                  </div>

                  {exchangeSymbols.length > 0 ? (
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {exchangeSymbols.slice(0, settings.numberOfSymbolsToSelect || 12).map((symbol, idx) => (
                          <Badge key={symbol} variant={idx < 5 ? "default" : "outline"}>
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing {Math.min(settings.numberOfSymbolsToSelect || 12, exchangeSymbols.length)} of{" "}
                        {exchangeSymbols.length} available symbols
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 text-center text-muted-foreground">
                      {selectedExchangeConnection
                        ? "Click 'Refresh Symbols' to load available symbols"
                        : "Select an exchange connection to view symbols"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Position Cost Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Position cost as ratio/percentage used for pseudo position calculations (Base/Main/Real levels). Volume
                is calculated ONLY at Exchange level when orders are executed. This value is account-balance
                independent.
              </p>

              <div className="space-y-2">
                <Label>Position Cost Percentage (0.01% - 1.0%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={[settings.exchangePositionCost ?? settings.positionCost ?? 0.1]}
                    onValueChange={([value]) => {
                      handleSettingChange("exchangePositionCost", value)
                      // Sync with Position Configuration settings
                      handleSettingChange("positionCost", value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16 text-right">
                    {(settings.exchangePositionCost ?? settings.positionCost ?? 0.1).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Position cost ratio used for Base/Main/Real pseudo position calculations (count-based, no volume).
                  Volume is calculated at Exchange level: volume = (accountBalance × positionCost) / (entryPrice ×
                  leverage). Range: 0.01% - 1.0%, Default: 0.1%
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Main Trade Configuration
                </CardTitle>
                <CardDescription>Configure main trading engine settings, indications, and strategies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Trade Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Trade Settings</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Profit Factor Minimum</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={0.1}
                          max={2.0}
                          step={0.1}
                          value={[settings.profitFactorMinMain || 0.6]}
                          onValueChange={([value]) => handleSettingChange("profitFactorMinMain", value)}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-10 text-right">
                          {(settings.profitFactorMinMain || 0.6).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Drawdown Time (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={60}
                          max={1440}
                          step={60}
                          value={[settings.drawdownTimeMain || 300]}
                          onValueChange={([value]) => handleSettingChange("drawdownTimeMain", value)}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16 text-right">{settings.drawdownTimeMain || 300}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Trailing</Label>
                        <p className="text-xs text-muted-foreground">Enable trailing stops</p>
                      </div>
                      <Switch
                        checked={settings.trailingEnabled === true}
                        onCheckedChange={(checked) => handleSettingChange("trailingEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Block</Label>
                        <p className="text-xs text-muted-foreground">Enable block trading</p>
                      </div>
                      <Switch
                        checked={settings.block_enabled === true}
                        onCheckedChange={(checked) => handleSettingChange("block_enabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>DCA</Label>
                        <p className="text-xs text-muted-foreground">Dollar cost averaging</p>
                      </div>
                      <Switch
                        checked={settings.dca_enabled === true}
                        onCheckedChange={(checked) => handleSettingChange("dca_enabled", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Main Trade Indication Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Indication Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Settings disabled in base Indication settings cannot be enabled here
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                      className={`p-4 border rounded-lg ${settings.directionEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Direction</Label>
                          <p className="text-xs text-muted-foreground">Market direction</p>
                        </div>
                        <Switch
                          checked={settings.mainDirectionEnabled !== false && settings.directionEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("mainDirectionEnabled", checked)}
                          disabled={settings.directionEnabled === false}
                        />
                      </div>
                      {settings.directionEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.moveEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Move</Label>
                          <p className="text-xs text-muted-foreground">Price movement</p>
                        </div>
                        <Switch
                          checked={settings.mainMoveEnabled !== false && settings.moveEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("mainMoveEnabled", checked)}
                          disabled={settings.moveEnabled === false}
                        />
                      </div>
                      {settings.moveEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.activeEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Active</Label>
                          <p className="text-xs text-muted-foreground">Active conditions</p>
                        </div>
                        <Switch
                          checked={settings.mainActiveEnabled !== false && settings.activeEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("mainActiveEnabled", checked)}
                          disabled={settings.activeEnabled === false}
                        />
                      </div>
                      {settings.activeEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.optimalCoordinationEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Optimal</Label>
                          <p className="text-xs text-muted-foreground">Entry optimization</p>
                        </div>
                        <Switch
                          checked={
                            settings.mainOptimalEnabled !== false && settings.optimalCoordinationEnabled !== false
                          }
                          onCheckedChange={(checked) => handleSettingChange("mainOptimalEnabled", checked)}
                          disabled={settings.optimalCoordinationEnabled === false}
                        />
                      </div>
                      {settings.optimalCoordinationEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Main Trade Strategy Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Strategy Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Settings disabled in base Strategy settings cannot be enabled here
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      className={`p-4 border rounded-lg ${settings.strategyTrailingEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Trailing Strategy</Label>
                          <p className="text-xs text-muted-foreground">Trailing stop strategy</p>
                        </div>
                        <Switch
                          checked={
                            settings.mainTrailingStrategy !== false && settings.strategyTrailingEnabled !== false
                          }
                          onCheckedChange={(checked) => handleSettingChange("mainTrailingStrategy", checked)}
                          disabled={settings.strategyTrailingEnabled === false}
                        />
                      </div>
                      {settings.strategyTrailingEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.strategyBlockEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Block Strategy</Label>
                          <p className="text-xs text-muted-foreground">Block trading strategy</p>
                        </div>
                        <Switch
                          checked={settings.mainBlockStrategy !== false && settings.strategyBlockEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("mainBlockStrategy", checked)}
                          disabled={settings.strategyBlockEnabled === false}
                        />
                      </div>
                      {settings.strategyBlockEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.strategyDcaEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">DCA Strategy</Label>
                          <p className="text-xs text-muted-foreground">Dollar cost average strategy</p>
                        </div>
                        <Switch
                          checked={settings.mainDcaStrategy !== false && settings.strategyDcaEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("mainDcaStrategy", checked)}
                          disabled={settings.strategyDcaEnabled === false}
                        />
                      </div>
                      {settings.strategyDcaEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Preset Trade Configuration
                </CardTitle>
                <CardDescription>
                  Configure preset trading engine settings synchronized with default values. Preset configurations are
                  managed through Preset Types and Sets on the Presets page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Trade Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Trade Settings</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Profit Factor Minimum</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={0.1}
                          max={2.0}
                          step={0.1}
                          value={[settings.profitFactorMinPreset || 0.6]}
                          onValueChange={([value]) => handleSettingChange("profitFactorMinPreset", value)}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-10 text-right">
                          {(settings.profitFactorMinPreset || 0.6).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Drawdown Time (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={60}
                          max={1440}
                          step={60}
                          value={[settings.drawdownTimePreset || 300]}
                          onValueChange={([value]) => handleSettingChange("drawdownTimePreset", value)}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16 text-right">
                          {settings.drawdownTimePreset || 300}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Trailing</Label>
                        <p className="text-xs text-muted-foreground">Enable trailing stop strategy</p>
                      </div>
                      <Switch
                        checked={settings.presetTrailingEnabled === true}
                        onCheckedChange={(checked) => handleSettingChange("presetTrailingEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Block</Label>
                        <p className="text-xs text-muted-foreground">Enable block trading strategy</p>
                      </div>
                      <Switch
                        checked={settings.presetBlockEnabled === true}
                        onCheckedChange={(checked) => handleSettingChange("presetBlockEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>DCA</Label>
                        <p className="text-xs text-muted-foreground">Dollar cost averaging strategy</p>
                      </div>
                      <Switch
                        checked={settings.presetDcaEnabled === true}
                        onCheckedChange={(checked) => handleSettingChange("presetDcaEnabled", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Indication Settings (Filter)</h4>
                    <Badge variant="outline" className="text-xs">
                      Synchronization
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Settings disabled in base Indication settings cannot be enabled here. These are synchronized with
                    default values.
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                      className={`p-4 border rounded-lg ${settings.directionEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Direction</Label>
                          <p className="text-xs text-muted-foreground">Market direction</p>
                        </div>
                        <Switch
                          checked={settings.presetDirectionEnabled !== false && settings.directionEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("presetDirectionEnabled", checked)}
                          disabled={settings.directionEnabled === false}
                        />
                      </div>
                      {settings.directionEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.moveEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Move</Label>
                          <p className="text-xs text-muted-foreground">Price movement</p>
                        </div>
                        <Switch
                          checked={settings.presetMoveEnabled !== false && settings.moveEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("presetMoveEnabled", checked)}
                          disabled={settings.moveEnabled === false}
                        />
                      </div>
                      {settings.moveEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.activeEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Active</Label>
                          <p className="text-xs text-muted-foreground">Active conditions</p>
                        </div>
                        <Switch
                          checked={settings.presetActiveEnabled !== false && settings.activeEnabled !== false}
                          onCheckedChange={(checked) => handleSettingChange("presetActiveEnabled", checked)}
                          disabled={settings.activeEnabled === false}
                        />
                      </div>
                      {settings.activeEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>

                    <div
                      className={`p-4 border rounded-lg ${settings.optimalCoordinationEnabled === false ? "opacity-50 bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Optimal</Label>
                          <p className="text-xs text-muted-foreground">Entry optimization</p>
                        </div>
                        <Switch
                          checked={
                            settings.presetOptimalEnabled !== false && settings.optimalCoordinationEnabled !== false
                          }
                          onCheckedChange={(checked) => handleSettingChange("presetOptimalEnabled", checked)}
                          disabled={settings.optimalCoordinationEnabled === false}
                        />
                      </div>
                      {settings.optimalCoordinationEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Strategy Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Settings disabled in base Strategy settings cannot be enabled here. Organized by category.
                  </p>

                  {/* Additional Category - Trailing */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Additional</span>
                      <Badge variant="outline" className="text-xs">
                        Enhancement
                      </Badge>
                    </div>
                    <div
                      className={`p-4 border rounded-lg border-purple-200 dark:border-purple-800 ${settings.strategyTrailingEnabled === false ? "opacity-50 bg-muted" : "bg-purple-50/50 dark:bg-purple-950/20"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold">Trailing Strategy</Label>
                          <p className="text-xs text-muted-foreground">Trailing stop strategy for profit protection</p>
                        </div>
                        <Switch
                          checked={
                            settings.presetTrailingStrategy !== false && settings.strategyTrailingEnabled !== false
                          }
                          onCheckedChange={(checked) => handleSettingChange("presetTrailingStrategy", checked)}
                          disabled={settings.strategyTrailingEnabled === false}
                        />
                      </div>
                      {settings.strategyTrailingEnabled === false && (
                        <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                      )}
                    </div>
                  </div>

                  {/* Adjust Category - Block, DCA */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Adjust</span>
                      <Badge variant="outline" className="text-xs">
                        Volume/Position
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div
                        className={`p-4 border rounded-lg border-blue-200 dark:border-blue-800 ${settings.strategyBlockEnabled === false ? "opacity-50 bg-muted" : "bg-blue-50/50 dark:bg-blue-950/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">Block Strategy</Label>
                            <p className="text-xs text-muted-foreground">Block-based volume adjustments</p>
                          </div>
                          <Switch
                            checked={settings.presetBlockStrategy !== false && settings.strategyBlockEnabled !== false}
                            onCheckedChange={(checked) => handleSettingChange("presetBlockStrategy", checked)}
                            disabled={settings.strategyBlockEnabled === false}
                          />
                        </div>
                        {settings.strategyBlockEnabled === false && (
                          <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                        )}
                      </div>

                      <div
                        className={`p-4 border rounded-lg border-blue-200 dark:border-blue-800 ${settings.strategyDcaEnabled === false ? "opacity-50 bg-muted" : "bg-blue-50/50 dark:bg-blue-950/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-semibold">DCA Strategy</Label>
                            <p className="text-xs text-muted-foreground">Dollar cost average adjustments</p>
                          </div>
                          <Switch
                            checked={settings.presetDcaStrategy !== false && settings.strategyDcaEnabled !== false}
                            onCheckedChange={(checked) => handleSettingChange("presetDcaStrategy", checked)}
                            disabled={settings.strategyDcaEnabled === false}
                          />
                        </div>
                        {settings.strategyDcaEnabled === false && (
                          <p className="text-xs text-amber-600 mt-2">Disabled in base settings</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Configuration Management
                  </h4>
                  <p className="text-sm">
                    These settings define the default values synchronized with preset configurations. The actual preset
                    configuration sets and their availability are managed on the <strong>Presets page</strong>, where
                    you can create and organize multiple configurations into sets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indication" className="space-y-4">
            <Tabs value={indicationSubTab} onValueChange={setIndicationSubTab}>
              <TabsList>
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="common">Common</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <Tabs value={indicationMainSubTab} onValueChange={setIndicationMainSubTab}>
                  <TabsList>
                    <TabsTrigger value="main">Main (Direction/Move/Active)</TabsTrigger>
                    <TabsTrigger value="optimal">Optimal</TabsTrigger>
                    <TabsTrigger value="auto">Auto</TabsTrigger>
                  </TabsList>

                  <TabsContent value="main" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Main Indication Settings</CardTitle>
                        <CardDescription>Configure Direction, Move, and Active indication parameters</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Market Activity Configuration */}
                        <div className="space-y-4 border-b pb-4">
                          <h3 className="text-lg font-semibold">Market Activity</h3>
                          <div className="flex items-center justify-between">
                            <Label>Enable Market Activity Monitoring</Label>
                            <Switch
                              checked={settings.marketActivityEnabled !== false}
                              onCheckedChange={(checked) => handleSettingChange("marketActivityEnabled", checked)}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Calculation Range (5-20 sec)</Label>
                              <Slider
                                min={5}
                                max={20}
                                step={1}
                                value={[settings.marketActivityCalculationRange || 10]}
                                onValueChange={([value]) =>
                                  handleSettingChange("marketActivityCalculationRange", value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.marketActivityCalculationRange || 10}s
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Active Factor (1-20)</Label>
                              <Slider
                                min={1}
                                max={20}
                                step={1}
                                value={[settings.marketActivityPositionCostRatio || 2]}
                                onValueChange={([value]) =>
                                  handleSettingChange("marketActivityPositionCostRatio", value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.marketActivityPositionCostRatio || 2}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Calculation: Active Factor = Position Cost × Market Activity × Volume Ratio. Higher
                                values increase position sensitivity to market movements.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Direction Indication */}
                        <div className="space-y-4 border-b pb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Direction Indication</h3>
                            <Switch
                              checked={settings.directionEnabled !== false}
                              onCheckedChange={(checked) => handleSettingChange("directionEnabled", checked)}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Interval ({getMinIndicationInterval()}-1000ms, step 50ms)</Label>
                              <Slider
                                min={getMinIndicationInterval()}
                                max={1000}
                                step={50}
                                value={[Math.max(settings.directionInterval || 100, getMinIndicationInterval())]}
                                onValueChange={([value]) => handleSettingChange("directionInterval", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.directionInterval || 100}ms (Min: {getMinIndicationInterval()}ms
                                based on Main Engine)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Timeout (0-10 sec, step 1 sec)</Label>
                              <Slider
                                min={0}
                                max={10}
                                step={1}
                                value={[settings.directionTimeout || 3]}
                                onValueChange={([value]) => handleSettingChange("directionTimeout", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.directionTimeout || 3}s
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Range Configuration (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={50}
                                  value={settings.directionRangeFrom || 3}
                                  onChange={(e) =>
                                    handleSettingChange("directionRangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={100}
                                  value={settings.directionRangeTo || 30}
                                  onChange={(e) =>
                                    handleSettingChange("directionRangeTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={10}
                                  value={settings.directionRangeStep || 1}
                                  onChange={(e) =>
                                    handleSettingChange("directionRangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.directionRangeTo || 30) - (settings.directionRangeFrom || 3)) /
                                  (settings.directionRangeStep || 1),
                              ) + 1}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Drawdown Values (% comma-separated)</Label>
                            <Input
                              type="text"
                              placeholder="10,20,30,40,50"
                              value={settings.directionDrawdownValues || "10,20,30,40,50"}
                              onChange={(e) => handleSettingChange("directionDrawdownValues", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Values: {(settings.directionDrawdownValues || "10,20,30,40,50").split(",").length}{" "}
                              variations
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Market Change Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={20}
                                  value={settings.directionMarketChangeFrom || 1}
                                  onChange={(e) =>
                                    handleSettingChange("directionMarketChangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={20}
                                  value={settings.directionMarketChangeTo || 9}
                                  onChange={(e) =>
                                    handleSettingChange("directionMarketChangeTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={5}
                                  value={settings.directionMarketChangeStep || 2}
                                  onChange={(e) =>
                                    handleSettingChange("directionMarketChangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.directionMarketChangeTo || 9) - (settings.directionMarketChangeFrom || 1)) /
                                  (settings.directionMarketChangeStep || 2),
                              ) + 1}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Calculation Time (seconds)</Label>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[settings.directionMinCalcTime || 3]}
                                onValueChange={([value]) => handleSettingChange("directionMinCalcTime", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.directionMinCalcTime || 3}s
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Last Part Ratio (0.1-0.5)</Label>
                              <Slider
                                min={0.1}
                                max={0.5}
                                step={0.05}
                                value={[settings.directionLastPartRatio || 0.2]}
                                onValueChange={([value]) => handleSettingChange("directionLastPartRatio", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {((settings.directionLastPartRatio || 0.2) * 100).toFixed(0)}% (last portion of
                                data)
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Ratio Factor Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={0.5}
                                  max={3.0}
                                  step={0.1}
                                  value={settings.directionRatioFactorFrom || 1.0}
                                  onChange={(e) =>
                                    handleSettingChange("directionRatioFactorFrom", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={0.5}
                                  max={5.0}
                                  step={0.1}
                                  value={settings.directionRatioFactorTo || 2.5}
                                  onChange={(e) =>
                                    handleSettingChange("directionRatioFactorTo", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={0.1}
                                  max={1.0}
                                  step={0.1}
                                  value={settings.directionRatioFactorStep || 0.5}
                                  onChange={(e) =>
                                    handleSettingChange("directionRatioFactorStep", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.directionRatioFactorTo || 2.5) -
                                  (settings.directionRatioFactorFrom || 1.0)) /
                                  (settings.directionRatioFactorStep || 0.5),
                              ) + 1}
                            </p>
                          </div>

                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">
                              Total Direction Configurations:{" "}
                              {(
                                (Math.floor(
                                  ((settings.directionRangeTo || 30) - (settings.directionRangeFrom || 3)) /
                                    (settings.directionRangeStep || 1),
                                ) +
                                  1) *
                                (settings.directionDrawdownValues || "10,20,30,40,50").split(",").length *
                                (Math.floor(
                                  ((settings.directionMarketChangeTo || 9) -
                                    (settings.directionMarketChangeFrom || 1)) /
                                    (settings.directionMarketChangeStep || 2),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.directionRatioFactorTo || 2.5) -
                                    (settings.directionRatioFactorFrom || 1.0)) /
                                    (settings.directionRatioFactorStep || 0.5),
                                ) +
                                  1)
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Move Indication */}
                        <div className="space-y-4 border-b pb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Move Indication</h3>
                            <Switch
                              checked={settings.moveEnabled !== false}
                              onCheckedChange={(checked) => handleSettingChange("moveEnabled", checked)}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Interval ({getMinIndicationInterval()}-1000ms, step 50ms)</Label>
                              <Slider
                                min={getMinIndicationInterval()}
                                max={1000}
                                step={50}
                                value={[Math.max(settings.moveInterval || 100, getMinIndicationInterval())]}
                                onValueChange={([value]) => handleSettingChange("moveInterval", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.moveInterval || 100}ms (Min: {getMinIndicationInterval()}ms based on
                                Main Engine)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Timeout (0-10 sec, step 1 sec)</Label>
                              <Slider
                                min={0}
                                max={10}
                                step={1}
                                value={[settings.moveTimeout || 3]}
                                onValueChange={([value]) => handleSettingChange("moveTimeout", value)}
                              />
                              <p className="text-xs text-muted-foreground">Current: {settings.moveTimeout || 3}s</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Range Configuration (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={50}
                                  value={settings.moveRangeFrom || 3}
                                  onChange={(e) =>
                                    handleSettingChange("moveRangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={100}
                                  value={settings.moveRangeTo || 30}
                                  onChange={(e) => handleSettingChange("moveRangeTo", Number.parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={10}
                                  value={settings.moveRangeStep || 1}
                                  onChange={(e) =>
                                    handleSettingChange("moveRangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.moveRangeTo || 30) - (settings.moveRangeFrom || 3)) /
                                  (settings.moveRangeStep || 1),
                              ) + 1}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Drawdown Values (% comma-separated)</Label>
                            <Input
                              type="text"
                              placeholder="10,20,30,40,50"
                              value={settings.moveDrawdownValues || "10,20,30,40,50"}
                              onChange={(e) => handleSettingChange("moveDrawdownValues", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Values: {(settings.moveDrawdownValues || "10,20,30,40,50").split(",").length} variations
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Market Change Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={20}
                                  value={settings.moveMarketChangeFrom || 1}
                                  onChange={(e) =>
                                    handleSettingChange("moveMarketChangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={20}
                                  value={settings.moveMarketChangeTo || 9}
                                  onChange={(e) =>
                                    handleSettingChange("moveMarketChangeTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={5}
                                  value={settings.moveMarketChangeStep || 2}
                                  onChange={(e) =>
                                    handleSettingChange("moveMarketChangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.moveMarketChangeTo || 9) - (settings.moveMarketChangeFrom || 1)) /
                                  (settings.moveMarketChangeStep || 2),
                              ) + 1}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Calculation Time (seconds)</Label>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[settings.moveMinCalcTime || 3]}
                                onValueChange={([value]) => handleSettingChange("moveMinCalcTime", value)}
                              />
                              <p className="text-xs text-muted-foreground">Current: {settings.moveMinCalcTime || 3}s</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Last Part Ratio (0.1-0.5)</Label>
                              <Slider
                                min={0.1}
                                max={0.5}
                                step={0.05}
                                value={[settings.moveLastPartRatio || 0.2]}
                                onValueChange={([value]) => handleSettingChange("moveLastPartRatio", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {((settings.moveLastPartRatio || 0.2) * 100).toFixed(0)}% (last portion of
                                data)
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Ratio Factor Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={0.5}
                                  max={3.0}
                                  step={0.1}
                                  value={settings.moveRatioFactorFrom || 1.0}
                                  onChange={(e) =>
                                    handleSettingChange("moveRatioFactorFrom", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={0.5}
                                  max={5.0}
                                  step={0.1}
                                  value={settings.moveRatioFactorTo || 2.5}
                                  onChange={(e) =>
                                    handleSettingChange("moveRatioFactorTo", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={0.1}
                                  max={1.0}
                                  step={0.1}
                                  value={settings.moveRatioFactorStep || 0.5}
                                  onChange={(e) =>
                                    handleSettingChange("moveRatioFactorStep", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.moveRatioFactorTo || 2.5) - (settings.moveRatioFactorFrom || 1.0)) /
                                  (settings.moveRatioFactorStep || 0.5),
                              ) + 1}
                            </p>
                          </div>

                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">
                              Total Move Configurations:{" "}
                              {(
                                (Math.floor(
                                  ((settings.moveRangeTo || 30) - (settings.moveRangeFrom || 3)) /
                                    (settings.moveRangeStep || 1),
                                ) +
                                  1) *
                                (settings.moveDrawdownValues || "10,20,30,40,50").split(",").length *
                                (Math.floor(
                                  ((settings.moveMarketChangeTo || 9) - (settings.moveMarketChangeFrom || 1)) /
                                    (settings.moveMarketChangeStep || 2),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.moveRatioFactorTo || 2.5) - (settings.moveRatioFactorFrom || 1.0)) /
                                    (settings.moveRatioFactorStep || 0.5),
                                ) +
                                  1)
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Active Indication */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Active Indication</h3>
                            <Switch
                              checked={settings.activeEnabled !== false}
                              onCheckedChange={(checked) => handleSettingChange("activeEnabled", checked)}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Interval ({getMinIndicationInterval()}-1000ms, step 50ms)</Label>
                              <Slider
                                min={getMinIndicationInterval()}
                                max={1000}
                                step={50}
                                value={[Math.max(settings.activeInterval || 100, getMinIndicationInterval())]}
                                onValueChange={([value]) => handleSettingChange("activeInterval", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.activeInterval || 100}ms (Min: {getMinIndicationInterval()}ms based
                                on Main Engine Interval)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Timeout (0-10 sec, step 1 sec)</Label>
                              <Slider
                                min={0}
                                max={10}
                                step={1}
                                value={[settings.activeTimeout || 3]}
                                onValueChange={([value]) => handleSettingChange("activeTimeout", value)}
                              />
                              <p className="text-xs text-muted-foreground">Current: {settings.activeTimeout || 3}s</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Active Range Configuration (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={20}
                                  value={settings.activeRangeFrom || 1}
                                  onChange={(e) =>
                                    handleSettingChange("activeRangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={30}
                                  value={settings.activeRangeTo || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeRangeTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={5}
                                  value={settings.activeRangeStep || 1}
                                  onChange={(e) =>
                                    handleSettingChange("activeRangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.activeRangeTo || 10) - (settings.activeRangeFrom || 1)) /
                                  (settings.activeRangeStep || 1),
                              ) + 1}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Activity Calculated % (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={5}
                                  max={50}
                                  value={settings.activeCalculatedFrom || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeCalculatedFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin %</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={50}
                                  max={95}
                                  value={settings.activeCalculatedTo || 90}
                                  onChange={(e) =>
                                    handleSettingChange("activeCalculatedTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End %</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={5}
                                  max={20}
                                  value={settings.activeCalculatedStep || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeCalculatedStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step %</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.activeCalculatedTo || 90) - (settings.activeCalculatedFrom || 10)) /
                                  (settings.activeCalculatedStep || 10),
                              ) + 1}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Activity Last Part % (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={5}
                                  max={50}
                                  value={settings.activeLastPartFrom || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeLastPartFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin %</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={50}
                                  max={95}
                                  value={settings.activeLastPartTo || 90}
                                  onChange={(e) =>
                                    handleSettingChange("activeLastPartTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End %</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={5}
                                  max={20}
                                  value={settings.activeLastPartStep || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeLastPartStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step %</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.activeLastPartTo || 90) - (settings.activeLastPartFrom || 10)) /
                                  (settings.activeLastPartStep || 10),
                              ) + 1}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Drawdown Values (% comma-separated)</Label>
                            <Input
                              type="text"
                              placeholder="10,20,30,40,50"
                              value={settings.activeDrawdownValues || "10,20,30,40,50"}
                              onChange={(e) => handleSettingChange("activeDrawdownValues", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Values: {(settings.activeDrawdownValues || "10,20,30,40,50").split(",").length} variations
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Market Change Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={1}
                                  max={20}
                                  value={settings.activeMarketChangeFrom || 1}
                                  onChange={(e) =>
                                    handleSettingChange("activeMarketChangeFrom", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={1}
                                  max={20}
                                  value={settings.activeMarketChangeTo || 10}
                                  onChange={(e) =>
                                    handleSettingChange("activeMarketChangeTo", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={1}
                                  max={5}
                                  value={settings.activeMarketChangeStep || 1}
                                  onChange={(e) =>
                                    handleSettingChange("activeMarketChangeStep", Number.parseInt(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.activeMarketChangeTo || 10) - (settings.activeMarketChangeFrom || 1)) /
                                  (settings.activeMarketChangeStep || 1),
                              ) + 1}
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Calculation Time (seconds)</Label>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[settings.activeMinCalcTime || 3]}
                                onValueChange={([value]) => handleSettingChange("activeMinCalcTime", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {settings.activeMinCalcTime || 3}s
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Last Part Ratio (0.1-0.5)</Label>
                              <Slider
                                min={0.1}
                                max={0.5}
                                step={0.05}
                                value={[settings.activeLastPartRatio || 0.2]}
                                onValueChange={([value]) => handleSettingChange("activeLastPartRatio", value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {((settings.activeLastPartRatio || 0.2) * 100).toFixed(0)}% (last portion of
                                data)
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Ratio Factor Range (Begin, End, Step)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Begin"
                                  min={0.5}
                                  max={3.0}
                                  step={0.1}
                                  value={settings.activeRatioFactorFrom || 1.0}
                                  onChange={(e) =>
                                    handleSettingChange("activeRatioFactorFrom", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Begin</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="End"
                                  min={0.5}
                                  max={5.0}
                                  step={0.1}
                                  value={settings.activeRatioFactorTo || 2.5}
                                  onChange={(e) =>
                                    handleSettingChange("activeRatioFactorTo", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">End</p>
                              </div>
                              <div>
                                <Input
                                  type="number"
                                  placeholder="Step"
                                  min={0.1}
                                  max={1.0}
                                  step={0.1}
                                  value={settings.activeRatioFactorStep || 0.5}
                                  onChange={(e) =>
                                    handleSettingChange("activeRatioFactorStep", Number.parseFloat(e.target.value))
                                  }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Step</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Variations:{" "}
                              {Math.floor(
                                ((settings.activeRatioFactorTo || 2.5) - (settings.activeRatioFactorFrom || 1.0)) /
                                  (settings.activeRatioFactorStep || 0.5),
                              ) + 1}
                            </p>
                          </div>

                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">
                              Total Active Configurations:{" "}
                              {(
                                (Math.floor(
                                  ((settings.activeRangeTo || 10) - (settings.activeRangeFrom || 1)) /
                                    (settings.activeRangeStep || 1),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.activeCalculatedTo || 90) - (settings.activeCalculatedFrom || 10)) /
                                    (settings.activeCalculatedStep || 10),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.activeLastPartTo || 90) - (settings.activeLastPartFrom || 10)) /
                                    (settings.activeLastPartStep || 10),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.activeMarketChangeTo || 10) - (settings.activeMarketChangeFrom || 1)) /
                                    (settings.activeMarketChangeStep || 1),
                                ) +
                                  1) *
                                (Math.floor(
                                  ((settings.activeRatioFactorTo || 2.5) - (settings.activeRatioFactorFrom || 1.0)) /
                                    (settings.activeRatioFactorStep || 0.5),
                                ) +
                                  1)
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="optimal" className="space-y-4">
                    <StatisticsOverview settings={settings} />

                    <Card>
                      <CardHeader>
                        <CardTitle>Optimal Indication Settings</CardTitle>
                        <CardDescription>Configure optimal performance thresholds and coordination</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Optimal Situation Coordination</h3>
                          <div className="flex items-center justify-between">
                            <Label>Enable Optimal Coordination</Label>
                            <Switch
                              checked={settings.optimalCoordinationEnabled !== false}
                              onCheckedChange={(checked) => handleSettingChange("optimalCoordinationEnabled", checked)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Trailing Optimal Ranges</Label>
                            <Switch
                              checked={settings.trailingOptimalRanges !== false}
                              onCheckedChange={(checked) => handleSettingChange("trailingOptimalRanges", checked)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Simultaneous Trading</Label>
                            <Switch
                              checked={settings.simultaneousTrading !== false}
                              onCheckedChange={(checked) => handleSettingChange("simultaneousTrading", checked)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Position Increment After Situation</Label>
                            <Switch
                              checked={settings.positionIncrementAfterSituation !== false}
                              onCheckedChange={(checked) =>
                                handleSettingChange("positionIncrementAfterSituation", checked)
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="auto">
                    <AutoIndicationSettings />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="common" className="space-y-4">
                {/* RSI Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>RSI (Relative Strength Index)</span>
                      <Switch
                        checked={settings.rsiEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("rsiEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Momentum oscillator measuring price movement speed and magnitude (Default: Period 14, Oversold 30,
                      Overbought 70)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>RSI Period</Label>
                        <Input
                          type="number"
                          value={settings.rsiPeriod || 14}
                          onChange={(e) => handleSettingChange("rsiPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.rsiEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Oversold Threshold</Label>
                        <Input
                          type="number"
                          value={settings.rsiOversold || 30}
                          onChange={(e) => handleSettingChange("rsiOversold", Number.parseInt(e.target.value))}
                          disabled={!settings.rsiEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Overbought Threshold</Label>
                        <Input
                          type="number"
                          value={settings.rsiOverbought || 70}
                          onChange={(e) => handleSettingChange("rsiOverbought", Number.parseInt(e.target.value))}
                          disabled={!settings.rsiEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      {/* RSI Period Range */}
                      <div className="space-y-2">
                        <Label className="text-sm">RSI Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.rsiPeriodFrom || 7}
                            onChange={(e) => handleSettingChange("rsiPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.rsiPeriodTo || 21}
                            onChange={(e) => handleSettingChange("rsiPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.rsiPeriodStep || 1}
                            onChange={(e) => handleSettingChange("rsiPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.rsiPeriodTo && settings.rsiPeriodFrom && settings.rsiPeriodStep
                            ? Math.floor((settings.rsiPeriodTo - settings.rsiPeriodFrom) / settings.rsiPeriodStep) + 1
                            : 0}
                        </p>
                      </div>

                      {/* Oversold Range */}
                      <div className="space-y-2">
                        <Label className="text-sm">Oversold Threshold Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.rsiOversoldFrom || 15}
                            onChange={(e) => handleSettingChange("rsiOversoldFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.rsiOversoldTo || 45}
                            onChange={(e) => handleSettingChange("rsiOversoldTo", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.rsiOversoldStep || 5}
                            onChange={(e) => handleSettingChange("rsiOversoldStep", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.rsiOversoldTo && settings.rsiOversoldFrom && settings.rsiOversoldStep
                            ? Math.floor(
                                (settings.rsiOversoldTo - settings.rsiOversoldFrom) / settings.rsiOversoldStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      {/* Overbought Range */}
                      <div className="space-y-2">
                        <Label className="text-sm">Overbought Threshold Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.rsiOverboughtFrom || 55}
                            onChange={(e) => handleSettingChange("rsiOverboughtFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.rsiOverboughtTo || 85}
                            onChange={(e) => handleSettingChange("rsiOverboughtTo", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.rsiOverboughtStep || 5}
                            onChange={(e) => handleSettingChange("rsiOverboughtStep", Number.parseInt(e.target.value))}
                            disabled={!settings.rsiEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.rsiOverboughtTo && settings.rsiOverboughtFrom && settings.rsiOverboughtStep
                            ? Math.floor(
                                (settings.rsiOverboughtTo - settings.rsiOverboughtFrom) / settings.rsiOverboughtStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* MACD Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>MACD (Moving Average Convergence Divergence)</span>
                      <Switch
                        checked={settings.macdEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("macdEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Trend-following momentum indicator (Default: Fast 12, Slow 26, Signal 9)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Fast Period</Label>
                        <Input
                          type="number"
                          value={settings.macdFastPeriod || 12}
                          onChange={(e) => handleSettingChange("macdFastPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.macdEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slow Period</Label>
                        <Input
                          type="number"
                          value={settings.macdSlowPeriod || 26}
                          onChange={(e) => handleSettingChange("macdSlowPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.macdEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Signal Period</Label>
                        <Input
                          type="number"
                          value={settings.macdSignalPeriod || 9}
                          onChange={(e) => handleSettingChange("macdSignalPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.macdEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Fast Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.macdFastPeriodFrom || 6}
                            onChange={(e) => handleSettingChange("macdFastPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.macdFastPeriodTo || 18}
                            onChange={(e) => handleSettingChange("macdFastPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.macdFastPeriodStep || 2}
                            onChange={(e) => handleSettingChange("macdFastPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.macdFastPeriodTo && settings.macdFastPeriodFrom && settings.macdFastPeriodStep
                            ? Math.floor(
                                (settings.macdFastPeriodTo - settings.macdFastPeriodFrom) / settings.macdFastPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Slow Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.macdSlowPeriodFrom || 13}
                            onChange={(e) => handleSettingChange("macdSlowPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.macdSlowPeriodTo || 39}
                            onChange={(e) => handleSettingChange("macdSlowPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.macdSlowPeriodStep || 2}
                            onChange={(e) => handleSettingChange("macdSlowPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.macdSlowPeriodTo && settings.macdSlowPeriodFrom && settings.macdSlowPeriodStep
                            ? Math.floor(
                                (settings.macdSlowPeriodTo - settings.macdSlowPeriodFrom) / settings.macdSlowPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Signal Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.macdSignalPeriodFrom || 5}
                            onChange={(e) =>
                              handleSettingChange("macdSignalPeriodFrom", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.macdSignalPeriodTo || 13}
                            onChange={(e) => handleSettingChange("macdSignalPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.macdEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.macdSignalPeriodStep || 1}
                            onChange={(e) =>
                              handleSettingChange("macdSignalPeriodStep", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.macdEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.macdSignalPeriodTo && settings.macdSignalPeriodFrom && settings.macdSignalPeriodStep
                            ? Math.floor(
                                (settings.macdSignalPeriodTo - settings.macdSignalPeriodFrom) /
                                  settings.macdSignalPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* EMA Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>EMA (Exponential Moving Average)</span>
                      <Switch
                        checked={settings.emaEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("emaEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Weighted moving average giving more importance to recent prices (Default: Short 9, Long 21)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Short Period</Label>
                        <Input
                          type="number"
                          value={settings.emaShortPeriod || 9}
                          onChange={(e) => handleSettingChange("emaShortPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.emaEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Long Period</Label>
                        <Input
                          type="number"
                          value={settings.emaLongPeriod || 21}
                          onChange={(e) => handleSettingChange("emaLongPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.emaEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Short Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.emaShortPeriodFrom || 5}
                            onChange={(e) => handleSettingChange("emaShortPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.emaShortPeriodTo || 13}
                            onChange={(e) => handleSettingChange("emaShortPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.emaShortPeriodStep || 1}
                            onChange={(e) => handleSettingChange("emaShortPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.emaShortPeriodTo && settings.emaShortPeriodFrom && settings.emaShortPeriodStep
                            ? Math.floor(
                                (settings.emaShortPeriodTo - settings.emaShortPeriodFrom) / settings.emaShortPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Long Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.emaLongPeriodFrom || 11}
                            onChange={(e) => handleSettingChange("emaLongPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.emaLongPeriodTo || 31}
                            onChange={(e) => handleSettingChange("emaLongPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.emaLongPeriodStep || 2}
                            onChange={(e) => handleSettingChange("emaLongPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.emaEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.emaLongPeriodTo && settings.emaLongPeriodFrom && settings.emaLongPeriodStep
                            ? Math.floor(
                                (settings.emaLongPeriodTo - settings.emaLongPeriodFrom) / settings.emaLongPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SMA Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>SMA (Simple Moving Average)</span>
                      <Switch
                        checked={settings.smaEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("smaEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Average price over a specified period (Default: Short 10, Long 50)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Short Period</Label>
                        <Input
                          type="number"
                          value={settings.smaShortPeriod || 10}
                          onChange={(e) => handleSettingChange("smaShortPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.smaEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Long Period</Label>
                        <Input
                          type="number"
                          value={settings.smaLongPeriod || 50}
                          onChange={(e) => handleSettingChange("smaLongPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.smaEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Short Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.smaShortPeriodFrom || 5}
                            onChange={(e) => handleSettingChange("smaShortPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.smaShortPeriodTo || 15}
                            onChange={(e) => handleSettingChange("smaShortPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.smaShortPeriodStep || 1}
                            onChange={(e) => handleSettingChange("smaShortPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.smaShortPeriodTo && settings.smaShortPeriodFrom && settings.smaShortPeriodStep
                            ? Math.floor(
                                (settings.smaShortPeriodTo - settings.smaShortPeriodFrom) / settings.smaShortPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Long Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.smaLongPeriodFrom || 25}
                            onChange={(e) => handleSettingChange("smaLongPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.smaLongPeriodTo || 75}
                            onChange={(e) => handleSettingChange("smaLongPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.smaLongPeriodStep || 5}
                            onChange={(e) => handleSettingChange("smaLongPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.smaEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.smaLongPeriodTo && settings.smaLongPeriodFrom && settings.smaLongPeriodStep
                            ? Math.floor(
                                (settings.smaLongPeriodTo - settings.smaLongPeriodFrom) / settings.smaLongPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stochastic Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Stochastic Oscillator</span>
                      <Switch
                        checked={settings.stochasticEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("stochasticEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Compares closing price to price range over time (Default: K 14, D 3, Slowing 3)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>K Period</Label>
                        <Input
                          type="number"
                          value={settings.stochasticKPeriod || 14}
                          onChange={(e) => handleSettingChange("stochasticKPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.stochasticEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>D Period</Label>
                        <Input
                          type="number"
                          value={settings.stochasticDPeriod || 3}
                          onChange={(e) => handleSettingChange("stochasticDPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.stochasticEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slowing</Label>
                        <Input
                          type="number"
                          value={settings.stochasticSlowing || 3}
                          onChange={(e) => handleSettingChange("stochasticSlowing", Number.parseInt(e.target.value))}
                          disabled={!settings.stochasticEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">K Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.stochasticKPeriodFrom || 7}
                            onChange={(e) =>
                              handleSettingChange("stochasticKPeriodFrom", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.stochasticKPeriodTo || 21}
                            onChange={(e) =>
                              handleSettingChange("stochasticKPeriodTo", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.stochasticKPeriodStep || 1}
                            onChange={(e) =>
                              handleSettingChange("stochasticKPeriodStep", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.stochasticKPeriodTo &&
                          settings.stochasticKPeriodFrom &&
                          settings.stochasticKPeriodStep
                            ? Math.floor(
                                (settings.stochasticKPeriodTo - settings.stochasticKPeriodFrom) /
                                  settings.stochasticKPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">D Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.stochasticDPeriodFrom || 2}
                            onChange={(e) =>
                              handleSettingChange("stochasticDPeriodFrom", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.stochasticDPeriodTo || 4}
                            onChange={(e) =>
                              handleSettingChange("stochasticDPeriodTo", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.stochasticDPeriodStep || 1}
                            onChange={(e) =>
                              handleSettingChange("stochasticDPeriodStep", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.stochasticDPeriodTo &&
                          settings.stochasticDPeriodFrom &&
                          settings.stochasticDPeriodStep
                            ? Math.floor(
                                (settings.stochasticDPeriodTo - settings.stochasticDPeriodFrom) /
                                  settings.stochasticDPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Slowing Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.stochasticSlowingFrom || 1}
                            onChange={(e) =>
                              handleSettingChange("stochasticSlowingFrom", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.stochasticSlowingTo || 5}
                            onChange={(e) =>
                              handleSettingChange("stochasticSlowingTo", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.stochasticSlowingStep || 1}
                            onChange={(e) =>
                              handleSettingChange("stochasticSlowingStep", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.stochasticEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.stochasticSlowingTo &&
                          settings.stochasticSlowingFrom &&
                          settings.stochasticSlowingStep
                            ? Math.floor(
                                (settings.stochasticSlowingTo - settings.stochasticSlowingFrom) /
                                  settings.stochasticSlowingStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bollinger Bands Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Bollinger Bands</span>
                      <Switch
                        checked={settings.bollingerEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("bollingerEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Measures volatility and identifies potential overbought/oversold levels (Default: Period 20,
                      StdDev 2.0)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input
                          type="number"
                          value={settings.bollingerPeriod || 20}
                          onChange={(e) => handleSettingChange("bollingerPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.bollingerEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Standard Deviations</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={settings.bollingerStdDev || 2.0}
                          onChange={(e) => handleSettingChange("bollingerStdDev", Number.parseFloat(e.target.value))}
                          disabled={!settings.bollingerEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.bollingerPeriodFrom || 10}
                            onChange={(e) =>
                              handleSettingChange("bollingerPeriodFrom", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.bollingerEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.bollingerPeriodTo || 30}
                            onChange={(e) => handleSettingChange("bollingerPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.bollingerEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.bollingerPeriodStep || 2}
                            onChange={(e) =>
                              handleSettingChange("bollingerPeriodStep", Number.parseInt(e.target.value))
                            }
                            disabled={!settings.bollingerEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.bollingerPeriodTo && settings.bollingerPeriodFrom && settings.bollingerPeriodStep
                            ? Math.floor(
                                (settings.bollingerPeriodTo - settings.bollingerPeriodFrom) /
                                  settings.bollingerPeriodStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Standard Deviations Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.bollingerStdDevFrom || 1.0}
                            onChange={(e) =>
                              handleSettingChange("bollingerStdDevFrom", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.bollingerEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.bollingerStdDevTo || 3.0}
                            onChange={(e) =>
                              handleSettingChange("bollingerStdDevTo", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.bollingerEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.bollingerStdDevStep || 0.5}
                            onChange={(e) =>
                              handleSettingChange("bollingerStdDevStep", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.bollingerEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.bollingerStdDevTo && settings.bollingerStdDevFrom && settings.bollingerStdDevStep
                            ? Math.floor(
                                (settings.bollingerStdDevTo - settings.bollingerStdDevFrom) /
                                  settings.bollingerStdDevStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ADX Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>ADX (Average Directional Index)</span>
                      <Switch
                        checked={settings.adxEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("adxEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Measures trend strength, not direction (Default: Period 14, Threshold 25)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input
                          type="number"
                          value={settings.adxPeriod || 14}
                          onChange={(e) => handleSettingChange("adxPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.adxEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Threshold</Label>
                        <Input
                          type="number"
                          value={settings.adxThreshold || 25}
                          onChange={(e) => handleSettingChange("adxThreshold", Number.parseInt(e.target.value))}
                          disabled={!settings.adxEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.adxPeriodFrom || 7}
                            onChange={(e) => handleSettingChange("adxPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.adxPeriodTo || 21}
                            onChange={(e) => handleSettingChange("adxPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.adxPeriodStep || 1}
                            onChange={(e) => handleSettingChange("adxPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.adxPeriodTo && settings.adxPeriodFrom && settings.adxPeriodStep
                            ? Math.floor((settings.adxPeriodTo - settings.adxPeriodFrom) / settings.adxPeriodStep) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Threshold Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.adxThresholdFrom || 13}
                            onChange={(e) => handleSettingChange("adxThresholdFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.adxThresholdTo || 37}
                            onChange={(e) => handleSettingChange("adxThresholdTo", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.adxThresholdStep || 2}
                            onChange={(e) => handleSettingChange("adxThresholdStep", Number.parseInt(e.target.value))}
                            disabled={!settings.adxEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.adxThresholdTo && settings.adxThresholdFrom && settings.adxThresholdStep
                            ? Math.floor(
                                (settings.adxThresholdTo - settings.adxThresholdFrom) / settings.adxThresholdStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ATR Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>ATR (Average True Range)</span>
                      <Switch
                        checked={settings.atrEnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("atrEnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>Measures market volatility (Default: Period 14, Multiplier 1.5)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input
                          type="number"
                          value={settings.atrPeriod || 14}
                          onChange={(e) => handleSettingChange("atrPeriod", Number.parseInt(e.target.value))}
                          disabled={!settings.atrEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.atrMultiplier || 1.5}
                          onChange={(e) => handleSettingChange("atrMultiplier", Number.parseFloat(e.target.value))}
                          disabled={!settings.atrEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Period Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.atrPeriodFrom || 7}
                            onChange={(e) => handleSettingChange("atrPeriodFrom", Number.parseInt(e.target.value))}
                            disabled={!settings.atrEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.atrPeriodTo || 21}
                            onChange={(e) => handleSettingChange("atrPeriodTo", Number.parseInt(e.target.value))}
                            disabled={!settings.atrEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.atrPeriodStep || 1}
                            onChange={(e) => handleSettingChange("atrPeriodStep", Number.parseInt(e.target.value))}
                            disabled={!settings.atrEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.atrPeriodTo && settings.atrPeriodFrom && settings.atrPeriodStep
                            ? Math.floor((settings.atrPeriodTo - settings.atrPeriodFrom) / settings.atrPeriodStep) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Multiplier Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.atrMultiplierFrom || 1.0}
                            onChange={(e) =>
                              handleSettingChange("atrMultiplierFrom", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.atrEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.atrMultiplierTo || 3.0}
                            onChange={(e) => handleSettingChange("atrMultiplierTo", Number.parseFloat(e.target.value))}
                            disabled={!settings.atrEnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.atrMultiplierStep || 0.5}
                            onChange={(e) =>
                              handleSettingChange("atrMultiplierStep", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.atrEnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.atrMultiplierTo && settings.atrMultiplierFrom && settings.atrMultiplierStep
                            ? Math.floor(
                                (settings.atrMultiplierTo - settings.atrMultiplierFrom) / settings.atrMultiplierStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parabolic SAR Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Parabolic SAR</span>
                      <Switch
                        checked={settings.parabolicSAREnabled !== false}
                        onCheckedChange={(checked) => handleSettingChange("parabolicSAREnabled", checked)}
                      />
                    </CardTitle>
                    <CardDescription>
                      Trend-following indicator (Default: Acceleration 0.02, Maximum 0.2)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Values */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Acceleration</Label>
                        <Input
                          type="number"
                          step="0.005"
                          value={settings.parabolicSARAcceleration || 0.02}
                          onChange={(e) =>
                            handleSettingChange("parabolicSARAcceleration", Number.parseFloat(e.target.value))
                          }
                          disabled={!settings.parabolicSAREnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.parabolicSARMaximum || 0.2}
                          onChange={(e) =>
                            handleSettingChange("parabolicSARMaximum", Number.parseFloat(e.target.value))
                          }
                          disabled={!settings.parabolicSAREnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Configuration Ranges */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Configuration Ranges (50% variation)</h4>

                      <div className="space-y-2">
                        <Label className="text-sm">Acceleration Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.parabolicSARAccelerationFrom || 0.01}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARAccelerationFrom", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.parabolicSARAccelerationTo || 0.03}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARAccelerationTo", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.parabolicSARAccelerationStep || 0.005}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARAccelerationStep", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.parabolicSARAccelerationTo &&
                          settings.parabolicSARAccelerationFrom &&
                          settings.parabolicSARAccelerationStep
                            ? Math.floor(
                                (settings.parabolicSARAccelerationTo - settings.parabolicSARAccelerationFrom) /
                                  settings.parabolicSARAccelerationStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Maximum Range</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={settings.parabolicSARMaximumFrom || 0.1}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARMaximumFrom", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            value={settings.parabolicSARMaximumTo || 0.3}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARMaximumTo", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                          <Input
                            type="number"
                            placeholder="Step"
                            value={settings.parabolicSARMaximumStep || 0.05}
                            onChange={(e) =>
                              handleSettingChange("parabolicSARMaximumStep", Number.parseFloat(e.target.value))
                            }
                            disabled={!settings.parabolicSAREnabled}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variations:{" "}
                          {settings.parabolicSARMaximumTo &&
                          settings.parabolicSARMaximumFrom &&
                          settings.parabolicSARMaximumStep
                            ? Math.floor(
                                (settings.parabolicSARMaximumTo - settings.parabolicSARMaximumFrom) /
                                  settings.parabolicSARMaximumStep,
                              ) + 1
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <Tabs value={strategySubTab} onValueChange={setStrategySubTab}>
              <TabsList>
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="preset">Preset</TabsTrigger>
                <TabsTrigger value="auto">Auto</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <Tabs value={strategyMainSubTab} onValueChange={setStrategyMainSubTab}>
                  <TabsList>
                    <TabsTrigger value="base">Base</TabsTrigger>
                    <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="base" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Base Strategy Configuration</CardTitle>
                        <CardDescription>Configure base strategy parameters</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Minimum Profit Factor</Label>
                            <div className="flex items-center gap-4">
                              <Slider
                                min={0.1}
                                max={2.0}
                                step={0.1}
                                value={[settings.baseProfitFactor || 0.6]}
                                onValueChange={([value]) => handleSettingChange("baseProfitFactor", value)}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-10 text-right">
                                {(settings.baseProfitFactor || 0.6).toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Maximum Drawdown Time (hours)</Label>
                            <div className="flex items-center gap-4">
                              <Slider
                                min={1}
                                max={72}
                                step={1}
                                value={[settings.maxDrawdownTimeHours || 24]}
                                onValueChange={([value]) => handleSettingChange("maxDrawdownTimeHours", value)}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-16 text-right">
                                {settings.maxDrawdownTimeHours || 24}h
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Trading Range Configuration</h3>
                          <p className="text-xs text-muted-foreground">
                            Define ranges for base value and ratios to control position sizing and risk.
                          </p>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Base Value Range (Min/Max)</Label>
                              <div className="flex items-center gap-4">
                                <Slider
                                  min={0.1}
                                  max={5.0}
                                  step={0.1}
                                  value={[settings.baseValueRangeMin || 0.5, settings.baseValueRangeMax || 2.5]}
                                  onValueChange={([min, max]) => {
                                    handleSettingChange("baseValueRangeMin", min)
                                    handleSettingChange("baseValueRangeMax", max)
                                  }}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-24 text-right">
                                  {settings.baseValueRangeMin?.toFixed(1)} - {settings.baseValueRangeMax?.toFixed(1)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Base Ratio Range (Min/Max)</Label>
                              <div className="flex items-center gap-4">
                                <Slider
                                  min={0.1}
                                  max={1.0}
                                  step={0.1}
                                  value={[settings.baseRatioMin || 0.2, settings.baseRatioMax || 1.0]}
                                  onValueChange={([min, max]) => {
                                    handleSettingChange("baseRatioMin", min)
                                    handleSettingChange("baseRatioMax", max)
                                  }}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium w-20 text-right">
                                  {settings.baseRatioMin?.toFixed(1)} - {settings.baseRatioMax?.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="adjustment" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Adjustment Strategies</CardTitle>
                        <CardDescription>Configure block and DCA adjustments</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <Label>Block Adjustment</Label>
                              <p className="text-xs text-muted-foreground">
                                Adjusts positions based on predefined blocks or segments
                              </p>
                            </div>
                            <Switch
                              checked={settings.blockAdjustment !== false}
                              onCheckedChange={(checked) => handleSettingChange("blockAdjustment", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <Label>DCA (Dollar Cost Averaging)</Label>
                              <p className="text-xs text-muted-foreground">
                                Automatically adds to positions at lower prices
                              </p>
                            </div>
                            <Switch
                              checked={settings.dcaAdjustment !== false}
                              onCheckedChange={(checked) => handleSettingChange("dcaAdjustment", checked)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="preset" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Preset Strategy Configuration</CardTitle>
                    <CardDescription>Configure preset strategy parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Profit Factor</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={0.1}
                            max={2.0}
                            step={0.1}
                            value={[settings.profitFactorMinPreset || 0.6]}
                            onValueChange={([value]) => handleSettingChange("profitFactorMinPreset", value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-10 text-right">
                            {(settings.profitFactorMinPreset || 0.6).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum Drawdown Time (hours)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={1}
                            max={72}
                            step={1}
                            value={[settings.drawdownTimePreset || 24]}
                            onValueChange={([value]) => handleSettingChange("drawdownTimePreset", value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-16 text-right">
                            {settings.drawdownTimePreset || 24}h
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Strategy Type Enabling</h3>
                      <p className="text-xs text-muted-foreground">
                        Enable or disable specific strategy types for preset trading.
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <Label>Trailing Strategy</Label>
                            <p className="text-xs text-muted-foreground">Enable trailing stop strategy</p>
                          </div>
                          <Switch
                            checked={settings.presetTrailingEnabled === true}
                            onCheckedChange={(checked) => handleSettingChange("presetTrailingEnabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <Label>Block Strategy</Label>
                            <p className="text-xs text-muted-foreground">Enable block trading strategy</p>
                          </div>
                          <Switch
                            checked={settings.presetBlockEnabled === true}
                            onCheckedChange={(checked) => handleSettingChange("presetBlockEnabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <Label>DCA Strategy</Label>
                            <p className="text-xs text-muted-foreground">Enable Dollar Cost Averaging strategy</p>
                          </div>
                          <Switch
                            checked={settings.presetDcaEnabled === true}
                            onCheckedChange={(checked) => handleSettingChange("presetDcaEnabled", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auto">
                <AutoIndicationSettings />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Core system settings, database management, and application logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Database Configuration</h3>
                  <p className="text-xs text-muted-foreground">
                    Select database type and configuration. Changes require system restart.
                  </p>

                  {databaseChanged && (
                    <div className="p-3 border border-orange-500 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Database type change detected. Click "Save Changes" to apply and restart system.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Database Type</Label>
                      <Select
                        value={settings.database_type}
                        onValueChange={(value) => handleSettingChange("database_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sqlite">
                            <div className="flex flex-col">
                              <span>SQLite (Local)</span>
                              <span className="text-xs text-muted-foreground">File-based, no setup required</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="postgresql">
                            <div className="flex flex-col">
                              <span>PostgreSQL (Local)</span>
                              <span className="text-xs text-muted-foreground">Local PostgreSQL server</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="remote">
                            <div className="flex flex-col">
                              <span>PostgreSQL (Remote)</span>
                              <span className="text-xs text-muted-foreground">Remote PostgreSQL server</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Current: {originalDatabaseType}</p>
                    </div>

                    {(settings.database_type === "postgresql" || settings.database_type === "remote") && (
                      <div className="space-y-2">
                        <Label>Database Connection URL</Label>
                        <Input
                          type="text"
                          placeholder="postgresql://user:pass@host:5432/dbname"
                          value={settings.database_url}
                          onChange={(e) => handleSettingChange("database_url", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          PostgreSQL connection string (leave empty to use environment variable)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border rounded-lg bg-muted/50">
                    <h4 className="text-sm font-semibold mb-2">Database Type Information</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>
                        <strong>SQLite:</strong> Best for development and single-server deployments. No external
                        database required.
                      </li>
                      <li>
                        <strong>PostgreSQL (Local):</strong> For production with local PostgreSQL installation. Better
                        performance and scalability.
                      </li>
                      <li>
                        <strong>PostgreSQL (Remote):</strong> For distributed systems with remote database server (e.g.,
                        Vercel Postgres, Supabase).
                      </li>
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Trade Engine Intervals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Trade Engine Intervals</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure intervals for trade engine operations (in milliseconds)
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Main Engine Interval</Label>
                      <Slider
                        min={50}
                        max={1000}
                        step={50}
                        value={[settings.mainEngineIntervalMs || 100]}
                        onValueChange={([value]) => handleSettingChange("mainEngineIntervalMs", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.mainEngineIntervalMs || 100}ms</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Preset Engine Interval</Label>
                      <Slider
                        min={50}
                        max={1000}
                        step={50}
                        value={[settings.presetEngineIntervalMs || 100]}
                        onValueChange={([value]) => handleSettingChange("presetEngineIntervalMs", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.presetEngineIntervalMs || 100}ms
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Active Order Handling Interval</Label>
                      <Slider
                        min={50}
                        max={1000}
                        step={50}
                        value={[settings.activeOrderHandlingIntervalMs || 50]}
                        onValueChange={([value]) => handleSettingChange("activeOrderHandlingIntervalMs", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.activeOrderHandlingIntervalMs || 50}ms
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Trade Engine Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Trade Engine Configuration</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Position Cooldown (ms)</Label>
                      <Slider
                        min={50}
                        max={3000}
                        step={50}
                        value={[settings.positionCooldownMs || 100]}
                        onValueChange={([value]) => handleSettingChange("positionCooldownMs", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.positionCooldownMs || 100}ms</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Positions Per Config / Direction</Label>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[settings.maxPositionsPerConfigDirection || 2]}
                        onValueChange={([value]) => handleSettingChange("maxPositionsPerConfigDirection", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.maxPositionsPerConfigDirection || 2}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Concurrent Operations</Label>
                      <Slider
                        min={10}
                        max={250}
                        step={10}
                        value={[settings.maxConcurrentOperations || 100]}
                        onValueChange={([value]) => handleSettingChange("maxConcurrentOperations", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.maxConcurrentOperations || 100}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Database Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Database Management</h3>
                  <p className="text-xs text-muted-foreground">Configure database size limits and cleanup settings</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Database Size Base (MB)</Label>
                      <Slider
                        min={50}
                        max={750}
                        step={50}
                        value={[settings.databaseSizeBase || 250]}
                        onValueChange={([value]) => handleSettingChange("databaseSizeBase", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.databaseSizeBase || 250}MB</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Database Size Main (MB)</Label>
                      <Slider
                        min={50}
                        max={750}
                        step={50}
                        value={[settings.databaseSizeMain || 250]}
                        onValueChange={([value]) => handleSettingChange("databaseSizeMain", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.databaseSizeMain || 250}MB</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Database Size Real (MB)</Label>
                      <Slider
                        min={50}
                        max={750}
                        step={50}
                        value={[settings.databaseSizeReal || 250]}
                        onValueChange={([value]) => handleSettingChange("databaseSizeReal", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.databaseSizeReal || 250}MB</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Database Size Preset (MB)</Label>
                      <Slider
                        min={50}
                        max={750}
                        step={50}
                        value={[settings.databaseSizePreset || 250]}
                        onValueChange={([value]) => handleSettingChange("databaseSizePreset", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.databaseSizePreset || 250}MB</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Database Size Threshold (%)</Label>
                    <Slider
                      min={10}
                      max={95}
                      step={5}
                      value={[settings.databaseThresholdPercent || 80]}
                      onValueChange={([value]) => handleSettingChange("databaseThresholdPercent", value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {settings.databaseThresholdPercent || 80}% (Cleanup triggers when DB exceeds this size)
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Automatic Database Cleanup</Label>
                        <p className="text-xs text-muted-foreground">Perform automatic cleanup</p>
                      </div>
                      <Switch
                        checked={settings.automaticDatabaseCleanup !== false}
                        onCheckedChange={(checked) => handleSettingChange("automaticDatabaseCleanup", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Automatic Database Backups</Label>
                        <p className="text-xs text-muted-foreground">Perform automatic backups</p>
                      </div>
                      <Switch
                        checked={settings.automaticDatabaseBackups !== false}
                        onCheckedChange={(checked) => handleSettingChange("automaticDatabaseBackups", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Backup Interval</Label>
                    <Select
                      value={settings.backupInterval || "daily"}
                      onValueChange={(value) => handleSettingChange("backupInterval", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Application Logs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Application Logs</h3>
                  <p className="text-xs text-muted-foreground">Configure log level, category, and limit</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Log Level</Label>
                      <Select
                        value={settings.logsLevel || "info"}
                        onValueChange={(value) => handleSettingChange("logsLevel", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warn</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="fatal">Fatal</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Log Category</Label>
                      <Select
                        value={settings.logsCategory || "all"}
                        onValueChange={(value) => handleSettingChange("logsCategory", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                          <SelectItem value="engine">Engine</SelectItem>
                          <SelectItem value="indicator">Indicator</SelectItem>
                          <SelectItem value="connection">Connection</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Log Limit</Label>
                      <Slider
                        min={10}
                        max={1000}
                        step={10}
                        value={[settings.logsLimit || 100]}
                        onValueChange={([value]) => handleSettingChange("logsLimit", value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: {settings.logsLimit || 100}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Database Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Database Type</h3>
                  <p className="text-xs text-muted-foreground">
                    Select the database type. Changes require system restart.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button
                      variant={databaseType === "sqlite" ? "default" : "outline"}
                      onClick={() => handleDatabaseTypeChange("sqlite")}
                      disabled={databaseType === "sqlite"}
                    >
                      SQLite (Default)
                    </Button>
                    <Button
                      variant={databaseType === "postgresql" ? "default" : "outline"}
                      onClick={() => handleDatabaseTypeChange("postgresql")}
                      disabled={databaseType === "postgresql"}
                    >
                      PostgreSQL
                    </Button>
                    <Button
                      variant={databaseType === "remote" ? "default" : "outline"}
                      onClick={() => handleDatabaseTypeChange("remote")}
                      disabled={databaseType === "remote"}
                    >
                      Remote Database
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
