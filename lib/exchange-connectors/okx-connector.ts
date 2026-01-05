import crypto from "crypto"
import {
  BaseExchangeConnector,
  type ConnectionTestResult,
  type BalanceResult,
  type OrderParams,
  type OrderResult,
} from "./base-connector"

export class OKXConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return this.credentials.isTestnet ? "https://www.okx.com" : "https://www.okx.com"
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "spot", "leverage", "hedge_mode", "cross_margin", "isolated_margin"]
  }

  generateSignature(data: string | Record<string, any>): string {
    const dataString = typeof data === "string" ? data : JSON.stringify(data)
    return crypto.createHmac("sha256", this.credentials.apiSecret).update(dataString).digest("base64")
  }

  async testConnection(): Promise<ConnectionTestResult> {
    this.log("Starting OKX connection test")
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
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logError(error instanceof Error ? error.message : "Unknown error")
      return {
        success: false,
        balance: 0,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Connection test failed",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async getBalance(): Promise<BalanceResult> {
    const timestamp = new Date().toISOString()
    const baseUrl = this.getBaseUrl()

    this.log("Generating signature...")

    try {
      const method = "GET"
      const requestPath = "/api/v5/account/balance"
      const body = ""
      const prehash = timestamp + method + requestPath + body
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(prehash).digest("base64")

      this.log("Fetching account balance...")

      const response = await this.rateLimitedFetch(`${baseUrl}${requestPath}`, {
        method: "GET",
        headers: {
          "OK-ACCESS-KEY": this.credentials.apiKey,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-TIMESTAMP": timestamp,
          "OK-ACCESS-PASSPHRASE": this.credentials.apiPassphrase || "",
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok || data.code !== "0") {
        this.logError(`API Error: ${data.msg || "Unknown error"}`)
        throw new Error(data.msg || "OKX API error")
      }

      this.log("Successfully retrieved account data")

      const details = data.data?.[0]?.details || []
      const usdtDetail = details.find((d: any) => d.ccy === "USDT")
      const usdtBalance = Number.parseFloat(usdtDetail?.eq || "0")
      const usdtAvailable = Number.parseFloat(usdtDetail?.availBal || "0")

      const balances = details.map((d: any) => ({
        asset: d.ccy,
        free: Number.parseFloat(d.availBal || "0"),
        locked: Number.parseFloat(d.frozenBal || "0"),
        total: Number.parseFloat(d.eq || "0"),
      }))

      this.log(`Account Balance: ${usdtBalance.toFixed(2)} USDT`)

      return {
        totalBalance: usdtBalance,
        availableBalance: usdtAvailable,
        balances,
      }
    } catch (error) {
      this.logError(`Connection error: ${error instanceof Error ? error.message : "Unknown"}`)
      throw error
    }
  }

  async placeOrder(params: OrderParams): Promise<OrderResult> {
    this.resetLogs()
    this.log("Placing order on OKX...")
    this.log(`Symbol: ${params.symbol}, Side: ${params.side}, Type: ${params.type}, Qty: ${params.quantity}`)

    const timestamp = new Date().toISOString()
    const baseUrl = this.getBaseUrl()

    try {
      const orderData: any = {
        instId: params.symbol,
        tdMode: "cross",
        side: params.side,
        ordType: params.type,
        sz: params.quantity.toString(),
      }

      if (params.type === "limit" && params.price) {
        orderData.px = params.price.toString()
      }

      const requestBody = JSON.stringify([orderData])
      const method = "POST"
      const requestPath = "/api/v5/trade/order"
      const prehash = timestamp + method + requestPath + requestBody
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(prehash).digest("base64")

      this.log("Sending order request...")

      const response = await this.rateLimitedFetch(`${baseUrl}${requestPath}`, {
        method: "POST",
        headers: {
          "OK-ACCESS-KEY": this.credentials.apiKey,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-TIMESTAMP": timestamp,
          "OK-ACCESS-PASSPHRASE": this.credentials.apiPassphrase || "",
          "Content-Type": "application/json",
        },
        body: requestBody,
      })

      const data = await response.json()

      if (!response.ok || data.code !== "0") {
        this.logError(`Order failed: ${data.msg || "Unknown error"}`)
        return {
          success: false,
          error: data.msg || "Order placement failed",
          timestamp: new Date().toISOString(),
        }
      }

      const orderResult = data.data[0]
      this.log(`Order placed successfully: ${orderResult.ordId}`)

      return {
        success: true,
        orderId: orderResult.ordId,
        status: "NEW",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logError(`Order placement error: ${error instanceof Error ? error.message : "Unknown"}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Order placement failed",
        timestamp: new Date().toISOString(),
      }
    }
  }
}
