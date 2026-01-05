import crypto from "crypto"
import {
  BaseExchangeConnector,
  type ConnectionTestResult,
  type BalanceResult,
  type OrderParams,
  type OrderResult,
} from "./base-connector"

export class PionexConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return "https://api.pionex.com"
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "leverage", "hedge_mode", "cross_margin"]
  }

  generateSignature(data: string | Record<string, any>): string {
    const dataString =
      typeof data === "string"
        ? data
        : Object.entries(data)
            .sort()
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
    return crypto.createHmac("sha256", this.credentials.apiSecret).update(dataString).digest("hex")
  }

  async testConnection(): Promise<ConnectionTestResult> {
    this.log("Starting Pionex connection test")
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
        balance: 0,
        latency: Date.now() - startTime,
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
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(queryString).digest("hex")

      this.log("Fetching account balance...")

      const response = await this.rateLimitedFetch(
        `${baseUrl}/api/v1/account/balances?${queryString}&signature=${signature}`,
        {
          method: "GET",
          headers: {
            "PIONEX-KEY": this.credentials.apiKey,
          },
        },
      )

      const data = await response.json()

      if (!response.ok || !data.result) {
        this.logError(`API Error: ${data.message || "Unknown error"}`)
        throw new Error(data.message || "Pionex API error")
      }

      this.log("Successfully retrieved account data")

      const balanceData = data.data?.balances || []
      const usdtBalance = Number.parseFloat(balanceData.find((b: any) => b.coin === "USDT")?.free || "0")
      const usdtLocked = Number.parseFloat(balanceData.find((b: any) => b.coin === "USDT")?.locked || "0")
      const totalUsdt = usdtBalance + usdtLocked

      const balances = balanceData.map((b: any) => ({
        asset: b.coin,
        free: Number.parseFloat(b.free || "0"),
        locked: Number.parseFloat(b.locked || "0"),
        total: Number.parseFloat(b.free || "0") + Number.parseFloat(b.locked || "0"),
      }))

      this.log(`Account Balance: ${totalUsdt.toFixed(2)} USDT`)

      return {
        totalBalance: totalUsdt,
        availableBalance: usdtBalance,
        balances,
      }
    } catch (error) {
      this.logError(`Connection error: ${error instanceof Error ? error.message : "Unknown"}`)
      throw error
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    this.resetLogs()
    this.log("Placing order on Pionex...")
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

      const response = await this.rateLimitedFetch(
        `${baseUrl}/api/v1/trade/order?${queryString}&signature=${signature}`,
        {
          method: "POST",
          headers: {
            "PIONEX-KEY": this.credentials.apiKey,
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()

      if (!response.ok || !data.result) {
        this.logError(`Order failed: ${data.message || "Unknown error"}`)
        return {
          success: false,
          error: data.message || "Order placement failed",
          timestamp: Date.now(),
        }
      }

      this.log(`Order placed successfully: ${data.data.orderId}`)

      return {
        success: true,
        orderId: data.data.orderId.toString(),
        status: "NEW",
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
