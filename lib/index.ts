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
export { ConnectionStateManager, connectionStateManager } from "./connection-state-manager"
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
export * from "./constants"
