/**
 * Base Exchange Connector Interface
 * All exchange connectors must implement this interface for consistency
 */

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

export abstract class BaseExchangeConnector {
  protected credentials: ExchangeCredentials
  protected logs: string[] = []
  protected timeout = 10000 // 10 seconds
  protected rateLimiter: ReturnType<typeof getRateLimiter>

  constructor(credentials: ExchangeCredentials, exchange: string) {
    this.credentials = credentials
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
        throw error
      }
    })
  }

  abstract testConnection(): Promise<ExchangeConnectorResult>
  abstract getBalance(): Promise<ExchangeConnectorResult>
  abstract getCapabilities(): string[]

  abstract fetchHistoricalKlines?(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): Promise<
    Array<{
      timestamp: number
      open: number
      high: number
      low: number
      close: number
      volume: number
    }>
  >
}
