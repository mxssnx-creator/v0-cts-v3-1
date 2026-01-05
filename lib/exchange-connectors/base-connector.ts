import { getRateLimiter } from "@/lib/rate-limiter"

export interface ExchangeCredentials {
  apiKey: string
  apiSecret: string
  apiPassphrase?: string
  isTestnet: boolean
}

export interface ExchangeBalance {
  asset: string
  free: number
  locked: number
  total: number
}

export interface ExchangeConnectorResult {
  success: boolean
  balance: number // USDT balance
  balances?: ExchangeBalance[]
  capabilities: string[]
  error?: string
  logs: string[]
}

export interface OrderResult {
  success: boolean
  orderId?: string
  clientOrderId?: string
  error?: string
  logs: string[]
}

export interface OrderParams {
  symbol: string
  side: "buy" | "sell"
  type: "market" | "limit"
  quantity: number
  price?: number
  timeInForce?: "GTC" | "IOC" | "FOK"
}

export abstract class BaseExchangeConnector {
  public credentials: ExchangeCredentials
  protected logs: string[] = []
  protected timeout = 10000 // 10 seconds
  protected rateLimiter: ReturnType<typeof getRateLimiter>
  public exchange: string

  constructor(credentials: ExchangeCredentials, exchange: string) {
    this.credentials = credentials
    this.exchange = exchange
    this.rateLimiter = getRateLimiter(exchange)
  }

  protected log(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    this.logs.push(logMessage)
    console.log(`[v0] ${logMessage}`)
  }

  protected logError(message: string): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ERROR: ${message}`
    this.logs.push(logMessage)
    console.error(`[v0] ${logMessage}`)
  }

  protected async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    return this.rateLimiter.execute(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${this.timeout}ms`)
        }
        throw error
      }
    })
  }

  protected resetLogs(): void {
    this.logs = []
  }

  abstract generateSignature(data: string | Record<string, unknown>): string

  abstract testConnection(): Promise<ExchangeConnectorResult>
  abstract getBalance(): Promise<ExchangeConnectorResult>
  abstract getCapabilities(): string[]
  abstract placeOrder(params: OrderParams): Promise<OrderResult>

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    this.logError(`cancelOrder not implemented for ${this.exchange}`)
    return false
  }

  async getPositions(): Promise<any[]> {
    this.logError(`getPositions not implemented for ${this.exchange}`)
    return []
  }
}
