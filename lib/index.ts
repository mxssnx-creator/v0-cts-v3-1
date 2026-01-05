/**
 * Library Module Exports
 *
 * Centralized export for all library modules
 */

export * from "./trade-engine"
export * from "./types"
export { sql, query, queryOne, execute, insertReturning, getDatabaseType } from "./db"
export { OrderExecutor, orderExecutor, type OrderParams, type ExecutionResult } from "./order-executor"
export { PositionManager, positionManager } from "./position-manager"
export { ConnectionStateManager } from "./connection-state-manager"
export { default as connectionStateManager } from "./connection-state-manager"
export { SystemLogger } from "./system-logger"
export { createExchangeConnector, getExchangeConnector } from "./exchange-connectors"
export { getRateLimiter } from "./rate-limiter"
export { VolumeCalculator } from "./volume-calculator"
export { AnalyticsEngine } from "./analytics"
export { BacktestEngine, runPresetBacktest } from "./backtest-engine"
export { DataSyncManager } from "./data-sync-manager"
export { DataCleanupManager, dataCleanupManager } from "./data-cleanup-manager"
export { ErrorHandler, errorHandler, AppError } from "./error-handler"
export { ErrorLogger } from "./error-logger"
export { DatabaseInitializer } from "./db-initializer"
export {
  CONNECTION_PREDEFINITIONS,
  getConnectionPredefinition,
  getAllConnectionPredefinitions,
} from "./connection-predefinitions"
export {
  DEFAULT_LEVERAGE,
  MIN_LEVERAGE,
  MAX_LEVERAGE,
  DEFAULT_VOLUME,
  MIN_VOLUME,
  MAX_VOLUME,
  MIN_ENTRY_DISTANCE,
  MAX_ENTRY_DISTANCE,
  DEFAULT_ENTRY_DISTANCE,
  MIN_TP_DISTANCE,
  MAX_TP_DISTANCE,
  DEFAULT_TP_DISTANCE,
  MIN_SL_DISTANCE,
  MAX_SL_DISTANCE,
  DEFAULT_SL_DISTANCE,
  TRADE_ENGINE_TYPES,
  STRATEGY_BASES,
  TP_ADJUSTMENT_TYPES,
  VOLUME_ADJUSTMENT_TYPES,
  ADJUSTMENT_TYPES,
  // Note: AdjustmentType already exported from ./types - not re-exported to avoid duplicate
  type TpAdjustmentType,
  type VolumeAdjustmentType,
} from "./constants/types"
