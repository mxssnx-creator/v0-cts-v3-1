import crypto from "crypto"
import {
  BaseExchangeConnector,
  type ConnectionTestResult,
  type BalanceResult,
  type OrderParams,
  type OrderResult,
} from "./base-connector"

export class BingXConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return "https://open-api.bingx.com"
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "leverage", "hedge_mode", "cross_margin"]
  }

  generateSignature(data: string | Record<string, any>): string {
    const queryString = typeof data === "string" ? data : new URLSearchParams(data as any).toString()
    return crypto.createHmac("sha256", this.credentials.apiSecret).update(queryString).digest("hex")
  }

  async testConnection(): Promise<ConnectionTestResult> {
    this.log("Starting BingX connection test")
    this.log(`Using endpoint: ${this.getBaseUrl()}`)

    try {
      const balanceResult = await this.getBalance()
      return {
        success: balanceResult.totalBalance > 0,
        balance: balanceResult.totalBalance,
        latency: 0,
        timestamp: Date.now(),
      }
    } catch (error) {
      this.logError(error instanceof Error ? error.message : "Unknown error")
      return {
        success: false,
        balance: 0,
        latency: 0,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Connection test failed",
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

      const response = await this.rateLimitedFetch(
        `${baseUrl}/openApi/swap/v2/user/balance?${queryString}&signature=${signature}`,
        {
          method: "GET",
          headers: {
            "X-BX-APIKEY": this.credentials.apiKey,
          },
        },
      )

      const data = await response.json()

      if (!response.ok || data.code !== 0) {
        this.logError(`API Error: ${data.msg || "Unknown error"}`)
        throw new Error(data.msg || "BingX API error")
      }

      this.log("Successfully retrieved account data")

      const balanceData = data.data?.balance || []
      const usdtBalance = Number.parseFloat(balanceData.find((b: any) => b.asset === "USDT")?.balance || "0")

      const balances = balanceData.map((b: any) => ({
        asset: b.asset,
        free: Number.parseFloat(b.availableMargin || "0"),
        locked: Number.parseFloat(b.frozenMargin || "0"),
        total: Number.parseFloat(b.balance || "0"),
      }))

      this.log(`Account Balance: ${usdtBalance.toFixed(2)} USDT`)

      return {
        totalBalance: usdtBalance,
        availableBalance: balances.find((b) => b.asset === "USDT")?.free || 0,
        balances,
      }
    } catch (error) {
      this.logError(`Connection error: ${error instanceof Error ? error.message : "Unknown"}`)
      throw error
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    this.resetLogs()
    this.log("Placing order on BingX...")
    this.log(`Symbol: ${params.symbol}, Side: ${params.side}, Type: ${params.type}, Qty: ${params.quantity}`)

    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    try {
      let queryString = `symbol=${params.symbol}&side=${params.side.toUpperCase()}&type=${params.type.toUpperCase()}&quantity=${params.quantity}&timestamp=${timestamp}`

      if (params.type === "limit" && params.price) {
        queryString += `&price=${params.price}&timeInForce=${params.timeInForce || "GTC"}`
      }

      const signature = this.generateSignature(queryString)

      this.log("Sending order request...")

      const response = await this.rateLimitedFetch(
        `${baseUrl}/openApi/swap/v2/trade/order?${queryString}&signature=${signature}`,
        {
          method: "POST",
          headers: {
            "X-BX-APIKEY": this.credentials.apiKey,
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()

      if (!response.ok || data.code !== 0) {
        this.logError(`Order failed: ${data.msg || "Unknown error"}`)
        return {
          success: false,
          error: data.msg || "Order placement failed",
          timestamp: Date.now(),
        }
      }

      this.log(`Order placed successfully: ${data.data.orderId}`)

      return {
        success: true,
        orderId: data.data.orderId.toString(),
        status: "filled",
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
