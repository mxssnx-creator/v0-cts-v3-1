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
import { toast } from "sonner"
import { Save, RefreshCw, X, Plus, Info } from "lucide-react"
import type { ExchangeConnection } from "@/lib/types"
import { LogsViewer } from "@/components/settings/logs-viewer"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import AutoIndicationSettings from "@/components/settings/auto-indication-settings"
import { StatisticsOverview } from "@/components/settings/statistics-overview"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  risk_percentage: number
  leveragePercentage: number
  prehistoricDataDays: number
  marketTimeframe: number
  tradeIntervalSeconds: number
  realPositionsIntervalSeconds: number
  validationTimeoutSeconds: number
  mainTradeInterval: number
  presetTradeInterval: number
  positionCost: number
  exchangePositionCost: number
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
  databasePositionLengthBase: number
  databasePositionLengthMain: number
  databasePositionLengthReal: number
  databasePositionLengthPreset: number
  databaseThresholdPercent: number
  overallDatabaseSizeGB: number
  positionCooldownMs: number
  maxPositionsPerConfigDirection: number
  maxConcurrentOperations: number
  autoRestartOnErrors: boolean
  logLevel: string
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
  symbolUpdateIntervalHours: number
  volatilityCalculationHours: number
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
  // Common Indicators
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
  bollingerEnabled: boolean
  bollingerPeriod: number
  bollingerStdDev: number
  bollingerPeriodFrom: number
  bollingerPeriodTo: number
  bollingerPeriodStep: number
  bollingerStdDevFrom: number
  bollingerStdDevTo: number
  bollingerStdDevStep: number
  emaEnabled: boolean
  emaShortPeriod: number
  emaLongPeriod: number
  emaShortPeriodFrom: number
  emaShortPeriodTo: number
  emaShortPeriodStep: number
  emaLongPeriodFrom: number
  emaLongPeriodTo: number
  emaLongPeriodStep: number
  smaEnabled: boolean
  smaShortPeriod: number
  smaLongPeriod: number
  smaShortPeriodFrom: number
  smaShortPeriodTo: number
  smaShortPeriodStep: number
  smaLongPeriodFrom: number
  smaLongPeriodTo: number
  smaLongPeriodStep: number
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
  adxEnabled: boolean
  adxPeriod: number
  adxThreshold: number
  adxPeriodFrom: number
  adxPeriodTo: number
  adxPeriodStep: number
  adxThresholdFrom: number
  adxThresholdTo: number
  adxThresholdStep: number
  atrEnabled: boolean
  atrPeriod: number
  atrMultiplier: number
  atrPeriodFrom: number
  atrPeriodTo: number
  atrPeriodStep: number
  atrMultiplierFrom: number
  atrMultiplierTo: number
  atrMultiplierStep: number
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
  profitFactorMinMain?: number
  drawdownTimeMain?: number
  mainDirectionEnabled?: boolean
  mainMoveEnabled?: boolean
  mainActiveEnabled?: boolean
  mainOptimalEnabled?: boolean
  mainTrailingStrategy?: boolean
  mainBlockStrategy?: boolean
  mainDcaStrategy?: boolean
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
  tradeMode?: string
  exchangePositionCost: number
  baseVolumeFactorLive?: number
  baseVolumeFactorPreset?: number
  strategyTrailingEnabled?: boolean
  strategyBlockEnabled?: boolean
  strategyDcaEnabled?: boolean
  directionRangeStep: number
  directionDrawdownValues: string
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
  // Legacy fields for backward compatibility
  databaseSizeBase?: number
  databaseSizeMain?: number
  databaseSizeReal?: number
  databaseSizePreset?: number
  maxDatabaseSizeMB?: number
  [key: string]: any
}

const initialSettings: Settings = {
  // Overall / Main
  base_volume_factor: 1.0,
  positions_average: 50,
  max_leverage: 125,
  negativeChangePercent: 20,
  risk_percentage: 20,
  leveragePercentage: 100,
  prehistoricDataDays: 5,
  marketTimeframe: 1,
  tradeIntervalSeconds: 1,
  realPositionsIntervalSeconds: 0.3,
  validationTimeoutSeconds: 15,
  mainTradeInterval: 1,
  presetTradeInterval: 2,
  positionCost: 0.1,
  exchangePositionCost: 0.1,
  useMaximalLeverage: true,
  min_volume_enforcement: true,

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
  quoteAsset: "USDT",

  // Minimum Profit Factor Requirements
  baseProfitFactor: 0.6,
  mainProfitFactor: 0.6,
  realProfitFactor: 0.6,

  // Risk Management
  trailingStopLoss: false,
  maxDrawdownTimeHours: 24,

  // Trade Engine Intervals (milliseconds)
  mainEngineIntervalMs: 100,
  presetEngineIntervalMs: 100,
  activeOrderHandlingIntervalMs: 50,

  databasePositionLengthBase: 250,
  databasePositionLengthMain: 250,
  databasePositionLengthReal: 250,
  databasePositionLengthPreset: 250,
  databaseThresholdPercent: 20,
  overallDatabaseSizeGB: 20,

  // Trade Engine Configuration
  positionCooldownMs: 100,
  maxPositionsPerConfigDirection: 2,
  maxConcurrentOperations: 100,

  // System Configuration
  autoRestartOnErrors: true,
  logLevel: "info",

  // Database Management
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
  symbolUpdateIntervalHours: 1,
  volatilityCalculationHours: 1,

  // Indication
  indication_time_interval: 1,
  indication_range_min: 3,
  indication_range_max: 30,
  indication_min_profit_factor: 0.7,

  // Strategy
  strategy_time_interval: 1,
  strategy_min_profit_factor: 0.5,
  stepRelationMinRatio: 0.2,
  stepRelationMaxRatio: 1.0,

  // Main Indication Settings
  marketActivityEnabled: true,
  marketActivityCalculationRange: 10,
  marketActivityPositionCostRatio: 2,
  directionEnabled: true,
  directionInterval: 100,
  directionTimeout: 3,
  directionRangeFrom: 3,
  directionRangeTo: 30,
  moveEnabled: true,
  moveInterval: 100,
  moveTimeout: 3,
  activeEnabled: true,
  activeInterval: 100,
  activeTimeout: 3,

  // Optimal Indication Settings
  optimalCoordinationEnabled: false,
  trailingOptimalRanges: false,
  simultaneousTrading: false,
  positionIncrementAfterSituation: false,

  // Common Indicators (all enabled by default)
  rsiEnabled: true,
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

  macdEnabled: true,
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

  bollingerEnabled: true,
  bollingerPeriod: 20,
  bollingerStdDev: 2.0,
  bollingerPeriodFrom: 10,
  bollingerPeriodTo: 30,
  bollingerPeriodStep: 2,
  bollingerStdDevFrom: 1.0,
  bollingerStdDevTo: 3.0,
  bollingerStdDevStep: 0.5,

  emaEnabled: true,
  emaShortPeriod: 9,
  emaLongPeriod: 21,
  emaShortPeriodFrom: 5,
  emaShortPeriodTo: 13,
  emaShortPeriodStep: 1,
  emaLongPeriodFrom: 11,
  emaLongPeriodTo: 31,
  emaLongPeriodStep: 2,

  smaEnabled: true,
  smaShortPeriod: 10,
  smaLongPeriod: 50,
  smaShortPeriodFrom: 5,
  smaShortPeriodTo: 15,
  smaShortPeriodStep: 1,
  smaLongPeriodFrom: 25,
  smaLongPeriodTo: 75,
  smaLongPeriodStep: 5,

  stochasticEnabled: true,
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

  adxEnabled: true,
  adxPeriod: 14,
  adxThreshold: 25,
  adxPeriodFrom: 7,
  adxPeriodTo: 21,
  adxPeriodStep: 1,
  adxThresholdFrom: 13,
  adxThresholdTo: 37,
  adxThresholdStep: 2,

  atrEnabled: true,
  atrPeriod: 14,
  atrMultiplier: 1.5,
  atrPeriodFrom: 7,
  atrPeriodTo: 21,
  atrPeriodStep: 1,
  atrMultiplierFrom: 1.0,
  atrMultiplierTo: 3.0,
  atrMultiplierStep: 0.5,

  parabolicSAREnabled: false,
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

  maxPositionsPerExchange: Object.keys(EXCHANGE_MAX_POSITIONS).reduce(
    (acc, key) => {
      acc[key] = EXCHANGE_MAX_POSITIONS[key]
      return acc
    },
    {} as Record<string, number>,
  ),

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
  const [newMainSymbol, setNewMainSymbol] = useState("")
  const [newForcedSymbol, setNewForcedSymbol] = useState("")
  const [databaseType, setDatabaseType] = useState<"sqlite" | "postgresql" | "remote">("sqlite")
  const [showMainEngineDisableConfirm, setShowMainEngineDisableConfirm] = useState(false)
  const [showPresetEngineDisableConfirm, setShowPresetEngineDisableConfirm] = useState(false)

  const [settings, setSettings] = useState<Settings>({
    ...initialSettings,
    positionCost: initialSettings.positionCost ?? 0.1,
    exchangePositionCost: initialSettings.exchangePositionCost ?? 0.1,
    baseVolumeFactorLive: initialSettings.baseVolumeFactorLive ?? 1.0,
    baseVolumeFactorPreset: initialSettings.baseVolumeFactorPreset ?? 1.0,
    profitFactorMinMain: initialSettings.profitFactorMinMain ?? 0.6,
    drawdownTimeMain: initialSettings.drawdownTimeMain ?? 300,
    mainDirectionEnabled: initialSettings.mainDirectionEnabled ?? true,
    mainMoveEnabled: initialSettings.mainMoveEnabled ?? true,
    mainActiveEnabled: initialSettings.mainActiveEnabled ?? true,
    mainOptimalEnabled: initialSettings.mainOptimalEnabled ?? false,
    mainTrailingStrategy: initialSettings.mainTrailingStrategy ?? true,
    mainBlockStrategy: initialSettings.mainBlockStrategy ?? true,
    mainDcaStrategy: initialSettings.mainDcaStrategy ?? false,
    profitFactorMinPreset: initialSettings.profitFactorMinPreset ?? 0.6,
    drawdownTimePreset: initialSettings.drawdownTimePreset ?? 24,
    presetTrailingEnabled: initialSettings.presetTrailingEnabled ?? false,
    presetBlockEnabled: initialSettings.presetBlockEnabled ?? false,
    presetDcaEnabled: initialSettings.presetDcaEnabled ?? false,
    presetDirectionEnabled: initialSettings.presetDirectionEnabled ?? true,
    presetMoveEnabled: initialSettings.presetMoveEnabled ?? true,
    presetActiveEnabled: initialSettings.presetActiveEnabled ?? true,
    presetOptimalEnabled: initialSettings.presetOptimalEnabled ?? false,
    presetTrailingStrategy: initialSettings.presetTrailingStrategy ?? true,
    presetBlockStrategy: initialSettings.presetBlockStrategy ?? true,
    presetDcaStrategy: initialSettings.presetDcaStrategy ?? false,
    tradeMode: initialSettings.tradeMode ?? "main",
    strategyTrailingEnabled: initialSettings.strategyTrailingEnabled ?? true,
    strategyBlockEnabled: initialSettings.strategyBlockEnabled ?? true,
    strategyDcaEnabled: initialSettings.strategyDcaEnabled ?? false,
  })

  const [originalDatabaseType, setOriginalDatabaseType] = useState("sqlite")
  const [databaseChanged, setDatabaseChanged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [activeTab, setActiveTab] = useState("overall")

  useEffect(() => {
    loadSettings()
    loadConnections()
  }, [])

  useEffect(() => {
    setDatabaseChanged(settings.database_type !== originalDatabaseType)
  }, [settings.database_type, originalDatabaseType])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        // Migrate old database size fields to new position length fields
        const migratedSettings = {
          ...initialSettings,
          ...data,
          databasePositionLengthBase: data.databasePositionLengthBase ?? data.databaseSizeBase ?? 250,
          databasePositionLengthMain: data.databasePositionLengthMain ?? data.databaseSizeMain ?? 250,
          databasePositionLengthReal: data.databasePositionLengthReal ?? data.databaseSizeReal ?? 250,
          databasePositionLengthPreset: data.databasePositionLengthPreset ?? data.databaseSizePreset ?? 250,
          databaseThresholdPercent: data.databaseThresholdPercent ?? 20,
          overallDatabaseSizeGB: data.overallDatabaseSizeGB ?? 20,
          symbolUpdateIntervalHours: data.symbolUpdateIntervalHours ?? 1,
          volatilityCalculationHours: data.volatilityCalculationHours ?? 1,
          risk_percentage: data.risk_percentage ?? data.negativeChangePercent ?? initialSettings.risk_percentage,
        }
        setSettings(migratedSettings)
        setOriginalDatabaseType(data.database_type || "sqlite")
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
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

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handlers for engine enable/disable with confirmation
  const handleMainEngineToggle = (enabled: boolean) => {
    if (!enabled) {
      setShowMainEngineDisableConfirm(true)
    } else {
      handleSettingChange("mainEngineEnabled", true)
    }
  }

  const handlePresetEngineToggle = (enabled: boolean) => {
    if (!enabled) {
      setShowPresetEngineDisableConfirm(true)
    } else {
      handleSettingChange("presetEngineEnabled", true)
    }
  }

  const confirmMainEngineDisable = () => {
    handleSettingChange("mainEngineEnabled", false)
    setShowMainEngineDisableConfirm(false)
    toast.info("Main Trade Engine disabled")
  }

  const confirmPresetEngineDisable = () => {
    handleSettingChange("presetEngineEnabled", false)
    setShowPresetEngineDisableConfirm(false)
    toast.info("Preset Trade Engine disabled")
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
        setOriginalDatabaseType(settings.database_type)
        setDatabaseChanged(false)
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const addMainSymbol = () => {
    if (newMainSymbol && !settings.mainSymbols.includes(newMainSymbol.toUpperCase())) {
      handleSettingChange("mainSymbols", [...settings.mainSymbols, newMainSymbol.toUpperCase()])
      setNewMainSymbol("")
    }
  }

  const removeMainSymbol = (symbol: string) => {
    handleSettingChange(
      "mainSymbols",
      settings.mainSymbols.filter((s) => s !== symbol),
    )
  }

  const addForcedSymbol = () => {
    if (newForcedSymbol && !settings.forcedSymbols.includes(newForcedSymbol.toUpperCase())) {
      handleSettingChange("forcedSymbols", [...settings.forcedSymbols, newForcedSymbol.toUpperCase()])
      setNewForcedSymbol("")
    }
  }

  const removeForcedSymbol = (symbol: string) => {
    handleSettingChange(
      "forcedSymbols",
      settings.forcedSymbols.filter((s) => s !== symbol),
    )
  }

  const calculateMaxPositionsWithThreshold = (baseLength: number, thresholdPercent: number) => {
    return Math.floor(baseLength * (1 + thresholdPercent / 100))
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex flex-col w-full min-h-screen bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSettings}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reload
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full max-w-4xl">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="indication">Indication</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Main Settings</CardTitle>
                  <CardDescription>Configure core trading parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Symbol Management</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Symbol Update Interval (Hours)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={1}
                            max={24}
                            step={1}
                            value={[settings.symbolUpdateIntervalHours || 1]}
                            onValueChange={([value]) => handleSettingChange("symbolUpdateIntervalHours", value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {settings.symbolUpdateIntervalHours || 1}h
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          How often to update symbols from exchange (default: 1 hour)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Volatility Calculation Period (Hours)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={1}
                            max={24}
                            step={1}
                            value={[settings.volatilityCalculationHours || 1]}
                            onValueChange={([value]) => handleSettingChange("volatilityCalculationHours", value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {settings.volatilityCalculationHours || 1}h
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Period for calculating volatility (default: 1 hour instead of 24h)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Existing Overall tab content from here */}
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
                        <p className="text-xs text-muted-foreground">Historical data to load on startup (1-15 days)</p>
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
                            // Update risk_percentage when negativeChangePercent changes
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
                          <p className="text-xs text-muted-foreground">Require minimum trading volume for positions</p>
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
                            <button onClick={() => removeForcedSymbol(symbol)} className="ml-1 hover:text-destructive">
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

            <TabsContent value="indication" className="space-y-4">
              <Tabs defaultValue="main" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="main">Main</TabsTrigger>
                  <TabsTrigger value="preset">Preset</TabsTrigger>
                  <TabsTrigger value="auto">Auto</TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Main Indication Settings</CardTitle>
                      <CardDescription>Configure main indication parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Indication Time Interval</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={1}
                            max={60}
                            step={1}
                            value={[settings.indication_time_interval || 5]}
                            onValueChange={([value]) => handleSettingChange("indication_time_interval", value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-16 text-right">
                            {settings.indication_time_interval || 5} min
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Range Min</Label>
                          <Input
                            type="number"
                            value={settings.indication_range_min || 0}
                            onChange={(e) => handleSettingChange("indication_range_min", Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Range Max</Label>
                          <Input
                            type="number"
                            value={settings.indication_range_max || 100}
                            onChange={(e) => handleSettingChange("indication_range_max", Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Min Profit Factor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.indication_min_profit_factor || 1.0}
                          onChange={(e) => handleSettingChange("indication_min_profit_factor", Number(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preset" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preset Indication Settings</CardTitle>
                      <CardDescription>Configure preset indication parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Preset indication configuration will use predefined values optimized for specific trading
                        scenarios.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="auto">
                  <AutoIndicationSettings />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <ExchangeConnectionManager />
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              <Tabs defaultValue="base" className="space-y-4">
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

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade Engine Types</CardTitle>
                  <CardDescription>Enable or disable different trade engine modes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-semibold">Main Trade Engine</Label>
                        <p className="text-sm text-muted-foreground">
                          Primary trading engine using indication-based strategies
                        </p>
                      </div>
                      <Switch checked={settings.mainEngineEnabled} onCheckedChange={handleMainEngineToggle} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-semibold">Preset Trade Engine</Label>
                        <p className="text-sm text-muted-foreground">
                          Secondary engine using preset indicator configurations
                        </p>
                      </div>
                      <Switch checked={settings.presetEngineEnabled} onCheckedChange={handlePresetEngineToggle} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Core system settings, database management, and application logs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Database Type Selection */}
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
                            <SelectItem value="sqlite">SQLite (Local)</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL (Local)</SelectItem>
                            <SelectItem value="remote">PostgreSQL (Remote)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Current: {originalDatabaseType}</p>
                      </div>

                      {(settings.database_type === "postgresql" || settings.database_type === "remote") && (
                        <div className="space-y-2">
                          <Label>Database Connection URL</Label>
                          <Input
                            type="text"
                            placeholder="postgresql://CTS-v3:00998877@host:5432/CTS-v3"
                            value={settings.database_url}
                            onChange={(e) => handleSettingChange("database_url", e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Default: Username: CTS-v3, Password: 00998877, Database: CTS-v3
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Database Position Length</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure maximum position count per configuration set. When threshold is reached, oldest
                      positions are removed to maintain the target length.
                    </p>

                    <div className="p-3 border rounded-lg bg-muted/50">
                      <p className="text-sm">
                        <strong>How it works:</strong> Each configuration set (Base, Main, Real, Preset) maintains its
                        own position database. When positions reach the threshold (base + threshold%), the system
                        rearranges back to the base count keeping only the most recent positions.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Example: With 250 positions and 20% threshold = max 300 positions. When 300 is reached,
                        rearrange to keep the newest 250.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Base Position Length</Label>
                        <Slider
                          min={50}
                          max={750}
                          step={50}
                          value={[settings.databasePositionLengthBase || 250]}
                          onValueChange={([value]) => handleSettingChange("databasePositionLengthBase", value)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {settings.databasePositionLengthBase || 250} positions</span>
                          <span>
                            Max:{" "}
                            {calculateMaxPositionsWithThreshold(
                              settings.databasePositionLengthBase || 250,
                              settings.databaseThresholdPercent || 20,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Main Position Length</Label>
                        <Slider
                          min={50}
                          max={750}
                          step={50}
                          value={[settings.databasePositionLengthMain || 250]}
                          onValueChange={([value]) => handleSettingChange("databasePositionLengthMain", value)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {settings.databasePositionLengthMain || 250} positions</span>
                          <span>
                            Max:{" "}
                            {calculateMaxPositionsWithThreshold(
                              settings.databasePositionLengthMain || 250,
                              settings.databaseThresholdPercent || 20,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Real Position Length</Label>
                        <Slider
                          min={50}
                          max={750}
                          step={50}
                          value={[settings.databasePositionLengthReal || 250]}
                          onValueChange={([value]) => handleSettingChange("databasePositionLengthReal", value)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {settings.databasePositionLengthReal || 250} positions</span>
                          <span>
                            Max:{" "}
                            {calculateMaxPositionsWithThreshold(
                              settings.databasePositionLengthReal || 250,
                              settings.databaseThresholdPercent || 20,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preset Position Length</Label>
                        <Slider
                          min={50}
                          max={750}
                          step={50}
                          value={[settings.databasePositionLengthPreset || 250]}
                          onValueChange={([value]) => handleSettingChange("databasePositionLengthPreset", value)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {settings.databasePositionLengthPreset || 250} positions</span>
                          <span>
                            Max:{" "}
                            {calculateMaxPositionsWithThreshold(
                              settings.databasePositionLengthPreset || 250,
                              settings.databaseThresholdPercent || 20,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Position Threshold Percentage</Label>
                      <Slider
                        min={10}
                        max={50}
                        step={5}
                        value={[settings.databaseThresholdPercent || 20]}
                        onValueChange={([value]) => handleSettingChange("databaseThresholdPercent", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.databaseThresholdPercent || 20}% (Rearrange when positions exceed target +{" "}
                        {settings.databaseThresholdPercent || 20}%)
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Overall Database Storage</h3>
                    <p className="text-xs text-muted-foreground">
                      Maximum total database file size. This is for disk space management only.
                    </p>

                    <div className="space-y-2">
                      <Label>Maximum Database Size (GB)</Label>
                      <Slider
                        min={5}
                        max={50}
                        step={5}
                        value={[settings.overallDatabaseSizeGB || 20]}
                        onValueChange={([value]) => handleSettingChange("overallDatabaseSizeGB", value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: {settings.overallDatabaseSizeGB || 20} GB
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label>Automatic Database Cleanup</Label>
                          <p className="text-xs text-muted-foreground">Perform automatic cleanup</p>
                        </div>
                        <Switch
                          checked={settings.automaticDatabaseCleanup}
                          onCheckedChange={(checked) => handleSettingChange("automaticDatabaseCleanup", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label>Automatic Backups</Label>
                          <p className="text-xs text-muted-foreground">Enable scheduled backups</p>
                        </div>
                        <Switch
                          checked={settings.automaticDatabaseBackups}
                          onCheckedChange={(checked) => handleSettingChange("automaticDatabaseBackups", checked)}
                        />
                      </div>
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
                        <p className="text-xs text-muted-foreground">
                          Current: {settings.mainEngineIntervalMs || 100}ms
                        </p>
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

                  {/* Logs Viewer */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Application Logs</h3>
                    <LogsViewer />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <StatisticsOverview settings={settings} />
            </TabsContent>
          </Tabs>
        </div>

        <AlertDialog open={showMainEngineDisableConfirm} onOpenChange={setShowMainEngineDisableConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Main Trade Engine?</AlertDialogTitle>
              <AlertDialogDescription>
                Disabling the Main Trade Engine will stop all indication-based trading. Are you sure you want to
                continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMainEngineDisable}>Disable</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showPresetEngineDisableConfirm} onOpenChange={setShowPresetEngineDisableConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Preset Trade Engine?</AlertDialogTitle>
              <AlertDialogDescription>
                Disabling the Preset Trade Engine will stop all preset indicator-based trading. Are you sure you want to
                continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPresetEngineDisable}>Disable</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  )
}
