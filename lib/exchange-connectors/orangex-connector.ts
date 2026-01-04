import crypto from "crypto"
import {
  BaseExchangeConnector,
  type ExchangeConnectorResult,
  type OrderParams,
  type OrderResult,
} from "./base-connector"

export class OrangeXConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return "https://api.orangex.com"
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "leverage", "cross_margin"]
  }

  async testConnection(): Promise<ExchangeConnectorResult> {
    this.log("Starting OrangeX connection test")
    this.log(`Using endpoint: ${this.getBaseUrl()}`)

    try {
      return await this.getBalance()
    } catch (error) {
      this.logError(error instanceof Error ? error.message : "Unknown error")
      return {
        success: false,
        balance: 0,
        capabilities: this.getCapabilities(),
        error: error instanceof Error ? error.message : "Connection test failed",
        logs: this.logs,
      }
    }
  }

  async getBalance(): Promise<ExchangeConnectorResult> {
    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    this.log("Generating signature...")

    try {
      const queryString = `timestamp=${timestamp}`
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(queryString).digest("hex")

      this.log("Fetching account balance...")

      const response = await this.rateLimitedFetch(
        `${baseUrl}/v1/account/balance?${queryString}&signature=${signature}`,
        {
          method: "GET",
          headers: {
            "X-CH-APIKEY": this.credentials.apiKey,
          },
        },
      )

      const data = await response.json()

      if (!response.ok || data.code !== "0") {
        this.logError(`API Error: ${data.msg || "Unknown error"}`)
        throw new Error(data.msg || "OrangeX API error")
      }

      this.log("Successfully retrieved account data")

      const balanceData = data.data || []
      const usdtBalance = Number.parseFloat(balanceData.find((b: any) => b.asset === "USDT")?.free || "0")

      const balances = balanceData.map((b: any) => ({
        asset: b.asset,
        free: Number.parseFloat(b.free || "0"),
        locked: Number.parseFloat(b.locked || "0"),
        total: Number.parseFloat(b.free || "0") + Number.parseFloat(b.locked || "0"),
      }))

      this.log(`Account Balance: ${usdtBalance.toFixed(2)} USDT`)

      return {
        success: true,
        balance: usdtBalance,
        balances,
        capabilities: this.getCapabilities(),
        logs: this.logs,
      }
    } catch (error) {
      this.logError(`Connection error: ${error instanceof Error ? error.message : "Unknown"}`)
      throw error
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    this.resetLogs()
    this.log("Placing order on OrangeX...")
    this.log(`Symbol: ${params.symbol}, Side: ${params.side}, Type: ${params.type}, Qty: ${params.quantity}`)

    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    try {
      const orderData: any = {
        symbol: params.symbol,
        side: params.side.toUpperCase(),
        type: params.type.toUpperCase(),
        quantity: params.quantity.toString(),
        timestamp,
      }

      if (params.type === "limit" && params.price) {
        orderData.price = params.price.toString()
        orderData.timeInForce = params.timeInForce || "GTC"
      }

      const queryString = Object.keys(orderData)
        .sort()
        .map((key) => `${key}=${orderData[key]}`)
        .join("&")
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(queryString).digest("hex")

      this.log("Sending order request...")

      const response = await this.rateLimitedFetch(`${baseUrl}/v1/order?${queryString}&signature=${signature}`, {
        method: "POST",
        headers: {
          "X-CH-APIKEY": this.credentials.apiKey,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok || data.code !== "0") {
        this.logError(`Order failed: ${data.msg || "Unknown error"}`)
        return {
          success: false,
          error: data.msg || "Order placement failed",
          logs: this.logs,
        }
      }

      this.log(`Order placed successfully: ${data.orderId}`)

      return {
        success: true,
        orderId: data.orderId.toString(),
        logs: this.logs,
      }
    } catch (error) {
      this.logError(`Order placement error: ${error instanceof Error ? error.message : "Unknown"}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Order placement failed",
        logs: this.logs,
      }
    }
  }
}
