// Re-export everything from global-trade-engine-coordinator for backward compatibility
export {
  GlobalTradeEngineCoordinator,
  getGlobalCoordinator,
  initializeGlobalCoordinator,
  getTradeEngine,
  initializeTradeEngine,
  type TradeEngineInterface,
  type EngineStatus,
  type ConnectionStatus,
  type HealthStatus,
  type ComponentHealth,
} from "./global-trade-engine-coordinator"

// Re-export TradeEngine class and config from subdirectory
export { TradeEngine, type TradeEngineConfig } from "./trade-engine/trade-engine"
export { TradeEngineManager, type EngineConfig } from "./trade-engine/engine-manager"
