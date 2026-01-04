// Exchange Connector Type Definitions
// Centralized type definitions for all exchange connector functionality

export interface ExchangeCredentials {
  apiKey: string
  apiSecret: string
  passphrase?: string
  isTestnet?: boolean
}

export interface BaseExchangeConnector {
  credentials: ExchangeCredentials
  exchange: string

  // Core methods
  getBalance(): Promise<BalanceResult>
  placeOrder(params: OrderParams): Promise<OrderResult>
  cancelOrder(orderId: string, symbol: string): Promise<boolean>
  getPositions(symbol?: string): Promise<PositionResult[]>

  // Utility methods
  generateSignature(data: string | Record<string, unknown>): string
  testConnection(): Promise<ConnectionTestResult>
}

export interface OrderParams {
  symbol: string
  side: "buy" | "sell"
  type: "market" | "limit" | "stop" | "stop_limit"
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: "GTC" | "IOC" | "FOK"
  reduceOnly?: boolean
  postOnly?: boolean
}

export interface OrderResult {
  success: boolean
  orderId?: string
  status?: string
  filledQty?: number
  avgPrice?: number
  error?: string
  timestamp?: number
}

export interface BalanceResult {
  totalBalance: number
  availableBalance: number
  balances: BalanceItem[]
}

export interface BalanceItem {
  currency: string
  total: number
  available: number
  locked: number
}

export interface PositionResult {
  symbol: string
  side: "long" | "short"
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
  marginType: "isolated" | "cross"
  liquidationPrice?: number
}

export interface ConnectionTestResult {
  success: boolean
  balance?: number
  latency?: number
  error?: string
  timestamp: number
}

export interface OrderRow {
  id: string
  connection_id: string
  symbol: string
  order_type: string
  side: string
  price: number | null
  quantity: number
  status: string
  exchange_order_id: string | null
  filled_quantity?: number
  average_fill_price?: number
  created_at: string
  executed_at?: string
  updated_at?: string
  error_message?: string | null
}

export interface ExchangeApiResponse {
  success: boolean
  data?: unknown
  error?: string
  code?: number
  message?: string
}

export interface RateLimitConfig {
  requestsPerSecond: number
  requestsPerMinute: number
  maxConcurrent: number
}

export interface WebSocketMessage {
  channel: string
  event: string
  data: unknown
  timestamp: number
}

export interface OrderBookSnapshot {
  symbol: string
  bids: Array<[number, number]>
  asks: Array<[number, number]>
  timestamp: number
}

export interface TradeData {
  id: string
  symbol: string
  price: number
  quantity: number
  side: "buy" | "sell"
  timestamp: number
}

export interface TickerData {
  symbol: string
  lastPrice: number
  volume24h: number
  high24h: number
  low24h: number
  change24h: number
  changePercent24h: number
  timestamp: number
}
