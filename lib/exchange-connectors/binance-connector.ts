import crypto from "crypto"
import {
  BaseExchangeConnector,
  type OrderParams,
  type OrderResult,
  type ConnectionTestResult,
  type BalanceResult,
} from "./base-connector"

export class BinanceConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return this.credentials.isTestnet ? "https://testnet.binancefuture.com" : "https://fapi.binance.com"
  }

  generateSignature(data: string | Record<string, unknown>): string {
    const payload = typeof data === "string" ? data : new URLSearchParams(data as Record<string, string>).toString()
    return crypto.createHmac("sha256", this.credentials.apiSecret).update(payload).digest("hex")
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "spot", "leverage", "hedge_mode", "cross_margin", "isolated_margin"]
  }

  async testConnection(): Promise<ConnectionTestResult> {
    this.log("Starting Binance connection test")
    this.log(`Testnet: ${this.credentials.isTestnet ? "Yes" : "No"}`)
    this.log(`Using endpoint: ${this.getBaseUrl()}`)

    const startTime = Date.now()

    try {
      const balanceResult = await this.getBalance()
      const latency = Date.now() - startTime

      return {
        success: true,
        balance: balanceResult.totalBalance,
        latency,
        timestamp: Date.now(),
      }
    } catch (error) {
      this.logError(error instanceof Error ? error.message : "Unknown error")
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
        timestamp: Date.now(),
      }
    }
  }

  async getBalance(): Promise<BalanceResult> {
    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    this.log("Generating signature...")

    try {
      const queryString = `timestamp=${timestamp}`
      const signature = this.generateSignature(queryString)

      this.log("Fetching account balance...")

      const response = await this.rateLimitedFetch(`${baseUrl}/fapi/v2/balance?${queryString}&signature=${signature}`, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": this.credentials.apiKey,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        this.logError(`API Error: ${data.msg || "Unknown error"}`)
        throw new Error(data.msg || "Binance API error")
      }

      this.log("Successfully retrieved account data")

      let totalBalance = 0
      let availableBalance = 0

      const balances = data.map((b: any) => {
        const total = Number.parseFloat(b.balance || "0")
        const available = Number.parseFloat(b.availableBalance || "0")
        const locked = total - available

        if (b.asset === "USDT") {
          totalBalance += total
          availableBalance += available
        }

        return {
          currency: b.asset,
          total,
          available,
          locked,
        }
      })

      this.log(`Account Balance: ${totalBalance.toFixed(2)} USDT`)

      return {
        totalBalance,
        availableBalance,
        balances,
      }
    } catch (error) {
      this.logError(`Connection error: ${error instanceof Error ? error.message : "Unknown"}`)
      throw error
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    this.resetLogs()
    this.log("Placing order on Binance...")
    this.log(`Symbol: ${params.symbol}, Side: ${params.side}, Type: ${params.type}, Qty: ${params.quantity}`)

    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    try {
      let queryString = `symbol=${params.symbol}&side=${params.side.toUpperCase()}&type=${params.type.toUpperCase()}&quantity=${params.quantity}&timestamp=${timestamp}`

      if (params.type === "limit" && params.price) {
        queryString += `&price=${params.price}&timeInForce=${params.timeInForce || "GTC"}`
      }

      const signature = this.generateSignature(queryString)
      queryString += `&signature=${signature}`

      this.log("Sending order request...")

      const response = await this.rateLimitedFetch(`${baseUrl}/fapi/v1/order?${queryString}`, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.credentials.apiKey,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        this.logError(`Order failed: ${data.msg || "Unknown error"}`)
        return {
          success: false,
          error: data.msg || "Order placement failed",
          timestamp: Date.now(),
        }
      }

      this.log(`Order placed successfully: ${data.orderId}`)

      return {
        success: true,
        orderId: data.orderId.toString(),
        status: data.status,
        timestamp: Date.now(),
      }
    } catch (error) {
      this.logError(`Order placement error: ${error instanceof Error ? error.message : "Unknown"}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Order placement failed",
        timestamp: Date.now(),
      }
    }
  }
}
