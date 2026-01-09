"use client"
import type React from "react"

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
import { Save, Download, Upload, RefreshCw, Info } from "lucide-react"
import type { ExchangeConnection } from "@/lib/types"
import { LogsViewer } from "@/components/settings/logs-viewer"
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
  indication_time_interval?: number
  indication_range_min?: number
  indication_range_max?: number
  indication_min_profit_factor?: number
  baseProfitFactor?: number
  maxDrawdownTimeHours?: number
  baseValueRangeMin?: number
  baseValueRangeMax?: number
  baseRatioMin?: number
  baseRatioMax?: number
  blockAdjustment?: boolean
  dcaAdjustment?: boolean
  mainEngineEnabled?: boolean
  presetEngineEnabled?: boolean
  database_url?: string
  // Common Indicators
  rsiEnabled?: boolean
  rsiPeriod?: number
  rsiOversold?: number
  rsiOverbought?: number
  rsiPeriodFrom?: number
  rsiPeriodTo?: number
  rsiPeriodStep?: number
  rsiOversoldFrom?: number
  rsiOversoldTo?: number
  rsiOversoldStep?: number
  rsiOverboughtFrom?: number
  rsiOverboughtTo?: number
  rsiOverboughtStep?: number
  macdEnabled?: boolean
  macdFastPeriod?: number
  macdSlowPeriod?: number
  macdSignalPeriod?: number
  macdFastPeriodFrom?: number
  macdFastPeriodTo?: number
  macdFastPeriodStep?: number
  macdSlowPeriodFrom?: number
  macdSlowPeriodTo?: number
  macdSlowPeriodStep?: number
  macdSignalPeriodFrom?: number
  macdSignalPeriodTo?: number
  macdSignalPeriodStep?: number
  bollingerEnabled?: boolean
  bollingerPeriod?: number
  bollingerStdDev?: number
  bollingerPeriodFrom?: number
  bollingerPeriodTo?: number
  bollingerPeriodStep?: number
  bollingerStdDevFrom?: number
  bollingerStdDevTo?: number
  bollingerStdDevStep?: number
  emaEnabled?: boolean
  emaShortPeriod?: number
  emaLongPeriod?: number
  emaShortPeriodFrom?: number
  emaShortPeriodTo?: number
  emaShortPeriodStep?: number
  emaLongPeriodFrom?: number
  emaLongPeriodTo?: number
  emaLongPeriodStep?: number
  smaEnabled?: boolean
  smaShortPeriod?: number
  smaLongPeriod?: number
  smaShortPeriodFrom?: number
  smaShortPeriodTo?: number
  smaShortPeriodStep?: number
  smaLongPeriodFrom?: number
  smaLongPeriodTo?: number
  smaLongPeriodStep?: number
  stochasticEnabled?: boolean
  stochasticKPeriod?: number
  stochasticDPeriod?: number
  stochasticSlowing?: number
  stochasticKPeriodFrom?: number
  stochasticKPeriodTo?: number
  stochasticKPeriodStep?: number
  stochasticDPeriodFrom?: number
  stochasticDPeriodTo?: number
  stochasticDPeriodStep?: number
  stochasticSlowingFrom?: number
  stochasticSlowingTo?: number
  stochasticSlowingStep?: number
  adxEnabled?: boolean
  adxPeriod?: number
  adxThreshold?: number
  adxPeriodFrom?: number
  adxPeriodTo?: number
  adxPeriodStep?: number
  adxThresholdFrom?: number
  adxThresholdTo?: number
  adxThresholdStep?: number
  atrEnabled?: boolean
  atrPeriod?: number
  atrMultiplier?: number
  atrPeriodFrom?: number
  atrPeriodTo?: number
  atrPeriodStep?: number
  atrMultiplierFrom?: number
  atrMultiplierTo?: number
  atrMultiplierStep?: number
  parabolicSAREnabled?: boolean
  parabolicSARAcceleration?: number
  parabolicSARMaximum?: number
  parabolicSARAccelerationFrom?: number
  parabolicSARAccelerationTo?: number
  parabolicSARAccelerationStep?: number
  parabolicSARMaximumFrom?: number
  parabolicSARMaximumTo?: number
  parabolicSARMaximumStep?: number
  autoRestartOnError?: boolean
  restartCooldownMinutes?: number
  maxRestartAttempts?: number
  exchangeDirectionEnabled?: boolean
  exchangeMoveEnabled?: boolean
  exchangeActiveEnabled?: boolean
  exchangeOptimalEnabled?: boolean
  exchangeBaseStrategyEnabled?: boolean
  exchangeMainStrategyEnabled?: boolean
  exchangeRealStrategyEnabled?: boolean
  exchangeTrailingEnabled?: boolean
  exchangeBlockEnabled?: boolean
  exchangeDcaEnabled?: boolean
  // The following properties are common to both old and new settings
  // They should be present in the new SystemSettings interface as well
  // to avoid TypeScript errors when loading settings from the backend.
  overallDatabaseSizeGB?: number
  databasePositionLengthBase?: number
  databasePositionLengthMain?: number
  databasePositionLengthReal?: number
  databasePositionLengthPreset?: number
  databaseThresholdPercent?: number
  symbolsPerExchange?: number
  enableTestnetByDefault?: boolean
  logsLevel?: string
  logsCategory?: string
  logsLimit?: number
  enableSystemMonitoring?: boolean
  metricsRetentionDays?: number
  mainEngineEnabled?: boolean
  presetEngineEnabled?: boolean
  // Add more properties from the old Settings interface if they are not
  // covered by the new SystemSettings interface and are still relevant.
  [key: string]: any
}

// Define Settings interface for backward compatibility with initialSettings
interface Settings {
  // Overall / Main
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
  min_volume_enforcement: boolean

  // Base Strategy
  baseValueRangeMin: number
  baseValueRangeMax: number
  baseRatioMin: number
  baseRatioMax: number
  trailingOption: boolean

  // Main Strategy
  previousPositionsCount: number
  lastStateCount: number

  // Trailing Configuration
  trailingEnabled: boolean
  trailingStartValues: string
  trailingStopValues: string

  // Adjustment Strategies
  blockAdjustment: boolean
  dcaAdjustment: boolean
  block_enabled: boolean
  dca_enabled: boolean

  // Symbol Selection
  arrangementType: string
  quoteAsset: string

  // Minimum Profit Factor Requirements
  baseProfitFactor: number
  mainProfitFactor: number
  realProfitFactor: number

  // Risk Management
  trailingStopLoss: boolean
  maxDrawdownTimeHours: number

  // Trade Engine Intervals (milliseconds)
  mainEngineIntervalMs: number
  presetEngineIntervalMs: number
  activeOrderHandlingIntervalMs: number

  databasePositionLengthBase?: number
  databasePositionLengthMain?: number
  databasePositionLengthReal?: number
  databasePositionLengthPreset?: number
  databaseThresholdPercent?: number
  overallDatabaseSizeGB?: number

  // Trade Engine Configuration
  positionCooldownMs: number
  maxPositionsPerConfigDirection: number
  maxConcurrentOperations: number

  // System Configuration
  autoRestartOnErrors: boolean
  logLevel: string

  // Database Management
  automaticDatabaseCleanup: boolean
  automaticDatabaseBackups: boolean
  backupInterval: "daily" | "weekly" | "monthly"

  // Connection Settings
  minimumConnectIntervalMs: number
  symbolsPerExchange: number

  // Connection Defaults
  defaultMarginType: string
  defaultPositionMode: string
  rateLimitDelayMs: number
  maxConcurrentConnections: number
  enableTestnetByDefault: boolean

  // Application Logs
  logsLevel: string
  logsCategory: string
  logsLimit: number

  // Monitoring Configuration
  enableSystemMonitoring: boolean
  metricsRetentionDays: number

  mainEngineEnabled: boolean
  presetEngineEnabled: boolean

  mainSymbols: string[]
  forcedSymbols: string[]

  useMainSymbols: boolean
  numberOfSymbolsToSelect: number
  symbolOrderType: string
  symbolUpdateIntervalHours: number
  volatilityCalculationHours: number

  // Indication
  indication_time_interval: number
  indication_range_min: number
  indication_range_max: number
  indication_min_profit_factor: number

  // Strategy
  strategy_time_interval: number
  strategy_min_profit_factor: number
  stepRelationMinRatio: number
  stepRelationMaxRatio: number

  // Main Indication Settings
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

  // Optimal Indication Settings
  optimalCoordinationEnabled: boolean
  trailingOptimalRanges: boolean
  simultaneousTrading: boolean
  positionIncrementAfterSituation: boolean

  // Common Indicators (all enabled by default)
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

  // New fields added to SystemSettings should be mapped here as well for consistency
  // if they are intended to be part of the legacy Settings interface for any reason.
  // Otherwise, the SystemSettings interface should be the primary source.

  // Add more properties from the old Settings interface if they are not
  // covered by the new SystemSettings interface and are still relevant.
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
  // Initialize settings state with SystemSettings, merging with initialSettings for backward compatibility
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const baseSystemSettings: SystemSettings = {
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
      // Common Indicators
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
      // The following properties are common to both old and new settings
      // They should be present in the new SystemSettings interface as well
      // to avoid TypeScript errors when loading settings from the backend.
      overallDatabaseSizeGB: 20,
      databasePositionLengthBase: 250,
      databasePositionLengthMain: 250,
      databasePositionLengthReal: 250,
      databasePositionLengthPreset: 250,
      databaseThresholdPercent: 20,
      symbolsPerExchange: 50,
      enableTestnetByDefault: false,
      logsLevel: "all",
      logsCategory: "all",
      logsLimit: 100,
      enableSystemMonitoring: true,
      metricsRetentionDays: 30,
      mainEngineEnabled: true,
      presetEngineEnabled: true,
      // ADDED PROPERTIES FROM UPDATES:
      indication_time_interval: 1,
      indication_range_min: 3,
      indication_range_max: 30,
      indication_min_profit_factor: 0.7,
      baseProfitFactor: 0.6,
      maxDrawdownTimeHours: 24,
      baseValueRangeMin: 0.5,
      baseValueRangeMax: 2.5,
      baseRatioMin: 0.2,
      baseRatioMax: 1,
      blockAdjustment: true,
      dcaAdjustment: false,
      database_url: "",
    }
    // Merge with initialSettings to preserve legacy values if not present in the new interface
    const merged = { ...initialSettings, ...baseSystemSettings } as SystemSettings
    return merged
  })

  const [originalDatabaseType, setOriginalDatabaseType] = useState("sqlite")
  const [databaseChanged, setDatabaseChanged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connections, setConnections] = useState<ExchangeConnection[]>([])
  const [activeTab, setActiveTab] = useState("overall")
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [currentTab, setCurrentTab] = useState("overall")
  const [selectedExchange, setSelectedExchange] = useState<string>("")
  const [newMainSymbol, setNewMainSymbol] = useState("")
  const [newForcedSymbol, setNewForcedSymbol] = useState("")
  const [exchanges, setExchanges] = useState<any[]>([])
  const [presets, setPresets] = useState<any[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("")
  const [connectionSettings, setConnectionSettings] = useState<any>({})
  const [activeIndications, setActiveIndications] = useState<string[]>([])
  const [activeStrategies, setActiveStrategies] = useState<string[]>([])
  const [databaseStatus, setDatabaseStatus] = useState<any>(null) // Initialize databaseStatus
  const [databaseType, setDatabaseType] = useState<"sqlite" | "postgresql" | "remote">("sqlite")
  const [showMainEngineDisableConfirm, setShowMainEngineDisableConfirm] = useState(false)
  const [showPresetEngineDisableConfirm, setShowPresetEngineDisableConfirm] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      console.log("[v0] Settings page initializing...")

      await Promise.all([
        loadConnections(),
        loadSettings(),
        initializePredefinedConnections(),
        loadExchanges(),
        loadPresets(),
        loadDatabaseStatus(),
      ]).catch((error) => {
        console.error("[v0] Settings initialization error:", error)
      })
    }

    initialize()
  }, [])

  useEffect(() => {
    if (selectedConnectionId && currentTab === "exchange") {
      loadConnectionSettings()
      loadConnectionIndications()
      loadConnectionStrategies()
    }
  }, [selectedConnectionId, currentTab])

  useEffect(() => {
    setDatabaseChanged(settings.database_type !== originalDatabaseType)
  }, [settings.database_type, originalDatabaseType])

  const initializePredefinedConnections = async () => {
    try {
      console.log("[v0] Checking for predefined connections...")
      const response = await fetch("/api/settings/connections/init-predefined", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Predefined connections check:", data.message)
        if (data.connections) {
          await loadConnections()
        }
      }
    } catch (error) {
      console.error("[v0] Failed to initialize predefined connections:", error)
    }
  }

  const loadConnections = async () => {
    try {
      console.log("[v0] Loading connections...")
      const response = await fetch("/api/settings/connections")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setConnections(data)

          const dashboardSelection = localStorage.getItem("selectedExchange")
          if (dashboardSelection && data.some((conn: ExchangeConnection) => conn.id === dashboardSelection)) {
            setSelectedConnectionId(dashboardSelection)
          } else if (data.length > 0) {
            setSelectedConnectionId(data[0].id)
          } else {
            setSelectedConnectionId("")
          }
          console.log("[v0] Connections loaded:", data.length)
        } else {
          console.log("[v0] Invalid connections data")
          setConnections([])
          setSelectedConnectionId("")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load connections:", error)
      setConnections([])
      setSelectedConnectionId("")
    }
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleExchangeChange = (value: string) => {
    setSelectedExchange(value)
    localStorage.setItem("selectedExchange", value)
  }

  const loadSettings = async () => {
    try {
      console.log("[v0] Loading settings...")
      const response = await fetch("/api/settings/system")

      if (!response.ok) {
        const text = await response.text()
        console.error("[v0] Failed to load settings, status:", response.status, "body:", text)
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Invalid response type:", contentType, "body:", text)
        return
      }

      const data = await response.json()
      if (data && typeof data === "object") {
        console.log("[v0] Settings loaded:", Object.keys(data).length, "keys")
        setSettings((prev) => {
          const newSettings: SystemSettings = { ...prev }
          for (const key in data) {
            if (key in newSettings) {
              ;(newSettings as any)[key] = data[key]
            }
          }
          // Ensure all properties from initialSettings that might be missing in the loaded data
          // are still present, using default values. This is crucial for backward compatibility.
          for (const key in initialSettings) {
            if (!(key in newSettings) || newSettings[key as keyof SystemSettings] === undefined) {
              newSettings[key as keyof SystemSettings] = initialSettings[key as keyof Settings] as any
            }
          }
          return newSettings
        })
        // Set the original database type after loading settings
        setOriginalDatabaseType(data.database_type || "sqlite")
      } else {
        console.log("[v0] Invalid settings data")
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false) // Set isLoading to false after attempt to load settings
    }
  }

  const loadExchanges = async () => {
    try {
      const response = await fetch("/api/settings/exchanges")
      if (response.ok) {
        const data = await response.json()
        setExchanges(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load exchanges:", error)
    }
  }

  const loadPresets = async () => {
    try {
      const response = await fetch("/api/settings/presets")
      if (response.ok) {
        const data = await response.json()
        setPresets(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load presets:", error)
    }
  }

  const loadDatabaseStatus = async () => {
    try {
      console.log("[v0] Loading database status...")
      const response = await fetch("/api/settings/database-status")
      if (response.ok) {
        const status = await response.json()
        setDatabaseStatus(status)
        console.log("[v0] Database status:", status)
      } else {
        console.error("[v0] Failed to load database status:", response.statusText)
        setDatabaseStatus(null)
      }
    } catch (error) {
      console.error("[v0] Failed to load database status:", error)
      setDatabaseStatus(null)
    }
  }

  const loadConnectionSettings = async () => {
    if (!selectedConnectionId) return

    try {
      const response = await fetch(`/api/settings/connections/${selectedConnectionId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setConnectionSettings(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load connection settings:", error)
    }
  }

  const loadConnectionIndications = async () => {
    if (!selectedConnectionId) return

    try {
      const response = await fetch(`/api/settings/connections/${selectedConnectionId}/active-indications`)
      if (response.ok) {
        const data = await response.json()
        setActiveIndications(data.indications || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load connection indications:", error)
    }
  }

  const loadConnectionStrategies = async () => {
    if (!selectedConnectionId) return

    try {
      const response = await fetch(`/api/settings/connections/${selectedConnectionId}/active-strategies`)
      if (response.ok) {
        const data = await response.json()
        setActiveStrategies(data.strategies || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load connection strategies:", error)
      setActiveStrategies([])
    }
  }

  const handleConnectionSettingChange = async (key: string, value: any) => {
    if (!selectedConnectionId) return

    const updatedSettings = { ...connectionSettings, [key]: value }
    setConnectionSettings(updatedSettings)

    try {
      const response = await fetch(`/api/settings/connections/${selectedConnectionId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to update connection settings")
      }

      toast.success("Connection setting updated")
    } catch (error) {
      console.error("[v0] Failed to update connection setting:", error)
      toast.error("Failed to update connection setting")
      setConnectionSettings(connectionSettings)
    }
  }

  const initializeDatabase = async () => {
    setInitializing(true)
    try {
      console.log("[v0] Calling database init API...")
      const response = await fetch("/api/install/database/init", {
        method: "POST",
      })
      const data = await response.json()

      console.log("[v0] Database init response:", data)

      if (response.ok && data.success) {
        toast.success(data.message || `Database initialized: ${data.tables_created} tables created`)

        if (data.logs) {
          console.log("[v0] Init logs:", data.logs)
        }

        await loadDatabaseStatus()
      } else {
        toast.error(data.details || data.error || "Failed to initialize database")

        if (data.logs) {
          console.error("[v0] Init error logs:", data.logs)
        }
      }
    } catch (error) {
      console.error("[v0] Database initialization failed:", error)
      toast.error("Failed to initialize database")
    } finally {
      setInitializing(false)
    }
  }

  const runMigrations = async () => {
    setMigrating(true)
    try {
      console.log("[v0] Calling database migrate API...")
      const response = await fetch("/api/install/database/migrate", {
        method: "POST",
      })
      const data = await response.json()

      console.log("[v0] Migration response:", data)

      if (response.ok && data.success) {
        if (data.errors && data.errors.length > 0) {
          toast.error(`Migrations completed with ${data.errors.length} errors`)
        } else {
          toast.success(data.message || `Migrations complete: ${data.migrations_applied} applied`)
        }

        if (data.logs) {
          console.log("[v0] Migration logs:", data.logs)
          data.logs.forEach((log: string) => console.log(`  ${log}`))
        }

        await loadDatabaseStatus()
      } else {
        toast.error(data.details || data.error || "Failed to run migrations")

        if (data.logs) {
          console.error("[v0] Migration error logs:", data.logs)
        }
      }
    } catch (error) {
      console.error("[v0] Migration failed:", error)
      toast.error("Failed to run migrations")
    } finally {
      setMigrating(false)
    }
  }

  const saveAllSettings = async () => {
    setSaving(true)
    try {
      console.log("[v0] Saving all settings...")

      const response = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save system settings")
      }

      const result = await response.json()
      console.log("[v0] Settings save response:", result)

      toast.success("Settings saved successfully")

      await loadDatabaseStatus()
      await fetch("/api/trade-engine/reload-settings", { method: "POST" })

      if (result.dbTypeChanged) {
        toast.info("Database type changed. System reconnected successfully.")
      }
      // Update originalDatabaseType after successful save
      setOriginalDatabaseType(settings.database_type)
      setDatabaseChanged(false)
    } catch (error) {
      console.error("[v0] Failed to save settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const exportSettings = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/settings/export", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export settings")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `cts-settings-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Settings exported successfully")
    } catch (error) {
      console.error("[v0] Failed to export settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to export settings")
    } finally {
      setExporting(false)
    }
  }

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const importedSettings = JSON.parse(text)

      const response = await fetch("/api/settings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importedSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to import settings")
      }

      await loadSettings()
      toast.success("Settings imported successfully")
    } catch (error) {
      console.error("[v0] Failed to import settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import settings")
    } finally {
      setImporting(false)
      event.target.value = ""
    }
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
    setIsSaving(true)
    try {
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
      <div className="flex h-screen w-full flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="ml-auto flex items-center gap-2">
            <input type="file" id="import-settings" accept=".json" onChange={importSettings} className="hidden" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("import-settings")?.click()}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importing..." : "Import"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportSettings} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
            <Button size="sm" onClick={saveAllSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Tabs
            defaultValue="overall"
            className="w-full"
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val)
              setCurrentTab(val)
            }}
          >
            <TabsList className="w-full justify-start h-auto flex-wrap">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="exchange">Exchange</TabsTrigger>
              <TabsTrigger value="indication">Indication</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-6">
              <Tabs defaultValue="main" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="main">Main</TabsTrigger>
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>

                {/* Main Section */}
                <TabsContent value="main" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trade Mode Configuration</CardTitle>
                      <CardDescription>Configure trading mode and market data parameters</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Trade Mode</Label>
                        <Select
                          value={settings.tradeMode || "both"}
                          onValueChange={(value) => handleSettingChange("tradeMode", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main Trading Only</SelectItem>
                            <SelectItem value="preset">Preset Trading Only</SelectItem>
                            <SelectItem value="both">Both (Main + Preset)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select trading mode (default: both). Determines which trading engines are active.
                        </p>
                      </div>

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
                          className="flex-1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of days of historical market data to retrieve on startup (1-15 days, default: 5)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Market Data Timeframe</Label>
                          <span className="text-sm font-medium">{settings.marketTimeframe || 1} second(s)</span>
                        </div>
                        <Select
                          value={String(settings.marketTimeframe || 1)}
                          onValueChange={(value) => handleSettingChange("marketTimeframe", Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Second</SelectItem>
                            <SelectItem value="2">2 Seconds</SelectItem>
                            <SelectItem value="3">3 Seconds</SelectItem>
                            <SelectItem value="5">5 Seconds</SelectItem>
                            <SelectItem value="10">10 Seconds</SelectItem>
                            <SelectItem value="15">15 Seconds</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Real-time market data update interval</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Connection Section */}
                <TabsContent value="connection" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Connection Settings</CardTitle>
                      <CardDescription>Configure connection parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Connection settings content goes here...</p>
                      {/* Placeholder for connection settings details */}
                      <div className="mt-4">
                        <Label>Exchange Connections</Label>
                        <Select
                          value={selectedConnectionId}
                          onValueChange={(value) => {
                            setSelectedConnectionId(value)
                            setCurrentTab("exchange") // Navigate to exchange tab for detailed settings
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an exchange connection..." />
                          </SelectTrigger>
                          <SelectContent>
                            {connections.length === 0 ? (
                              <SelectItem value="" disabled>
                                No connections found
                              </SelectItem>
                            ) : (
                              connections.map((conn) => (
                                <SelectItem key={conn.id} value={conn.id}>
                                  {conn.name} ({conn.exchange})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Monitoring Section */}
                <TabsContent value="monitoring" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monitoring Configuration</CardTitle>
                      <CardDescription>Configure system monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LogsViewer />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Install Section */}
                <TabsContent value="install" className="space-y-6">
                  <InstallManager />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="exchange" className="space-y-6">
              <ExchangeConnectionManager />
            </TabsContent>

            {/* Indication Tab */}
            <TabsContent value="indication" className="space-y-6">
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

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6">
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

            <TabsContent value="system" className="space-y-6">
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
        </main>
      </div>

      <AlertDialog open={showMainEngineDisableConfirm} onOpenChange={setShowMainEngineDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Main Trade Engine?</AlertDialogTitle>
            <AlertDialogDescription>
              Disabling the Main Trade Engine will stop all indication-based trading. Are you sure you want to continue?
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
    </AuthGuard>
  )
}
