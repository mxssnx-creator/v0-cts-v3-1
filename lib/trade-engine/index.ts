/**
 * Trade Engine Module Exports
 *
 * This module provides two types of trade engines:
 *
 * 1. GlobalTradeEngineCoordinator (from ../trade-engine.ts)
 *    - Global singleton that coordinates all connections
 *    - Use for system-wide trade management
 *    - Functions: getTradeEngine(), initializeTradeEngine()
 *
 * 2. TradeEngine (from ./trade-engine.tsx)
 *    - Per-connection service instance
 *    - Runs continuously with three parallel loops
 *    - Use for individual exchange connection management
 *    - Service name: project_name-trade
 */

export {
  getTradeEngine,
  getGlobalCoordinator,
  initializeTradeEngine,
  initializeGlobalCoordinator,
  type GlobalTradeEngineCoordinator,
  type TradeEngineInterface,
  type EngineStatus,
  type ConnectionStatus,
  type HealthStatus,
  type ComponentHealth,
} from "../trade-engine"

export {
  TradeEngine,
  TRADE_SERVICE_NAME,
  type TradeEngineConfig,
} from "./trade-engine"

export {
  TradeEngineManager,
  type EngineConfig,
} from "./engine-manager"
