import crypto from "crypto"
import {
  BaseExchangeConnector,
  type ConnectionTestResult,
  type BalanceResult,
  type OrderParams,
  type OrderResult,
} from "./base-connector"

export class BybitConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return this.credentials.isTestnet ? "https://api-testnet.bybit.com" : "https://api.bybit.com"
  }

  getCapabilities(): string[] {
    return [
      "unified",
      "perpetual_futures",
      "spot",
      "leverage",
      "hedge_mode",
      "trailing",
      "cross_margin",
      "isolated_margin",
    ]
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
    this.log("Starting Bybit connection test")
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
        timestamp: new Date().getTime(),
      }
    } catch (error) {
      this.logError(error instanceof Error ? error.message : "Unknown error")
      return {
        success: false,
        balance: 0,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Connection test failed",
        timestamp: new Date().getTime(),
      }
    }
  }

  async getBalance(): Promise<BalanceResult> {
    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    this.log("Generating signature...")

    try {
      const recvWindow = "5000"
      const queryString = `api_key=${this.credentials.apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(queryString).digest("hex")

      this.log("Fetching account balance...")

      const response = await this.rateLimitedFetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
        method: "GET",
        headers: {
          "X-BAPI-API-KEY": this.credentials.apiKey,
          "X-BAPI-SIGN": signature,
          "X-BAPI-TIMESTAMP": timestamp.toString(),
          "X-BAPI-RECV-WINDOW": recvWindow,
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      const data = await response.json()

      if (!response.ok || data.retCode !== 0) {
        this.logError(`API Error: ${data.retMsg || "Unknown error"}`)
        throw new Error(data.retMsg || "Bybit API error")
      }

      this.log("Successfully retrieved account data")

      const coins = data.result?.list?.[0]?.coin || []
      const usdtCoin = coins.find((c: any) => c.coin === "USDT")
      const usdtBalance = Number.parseFloat(usdtCoin?.walletBalance || "0")
      const usdtAvailable = Number.parseFloat(usdtCoin?.availableToWithdraw || "0")

      const balances = coins.map((c: any) => ({
        asset: c.coin,
        free: Number.parseFloat(c.availableToWithdraw || "0"),
        locked: Number.parseFloat(c.locked || "0"),
        total: Number.parseFloat(c.walletBalance || "0"),
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
    this.log("Placing order on Bybit...")
    this.log(`Symbol: ${params.symbol}, Side: ${params.side}, Type: ${params.type}, Qty: ${params.quantity}`)

    const timestamp = Date.now()
    const baseUrl = this.getBaseUrl()

    try {
      const orderParams: any = {
        category: "linear",
        symbol: params.symbol,
        side: params.side.toUpperCase(),
        orderType: params.type.toUpperCase(),
        qty: params.quantity.toString(),
      }

      if (params.type === "limit" && params.price) {
        orderParams.price = params.price.toString()
        orderParams.timeInForce = params.timeInForce || "GTC"
      }

      const paramsString = JSON.stringify(orderParams)
      const recvWindow = "5000"
      const signString = timestamp + this.credentials.apiKey + recvWindow + paramsString
      const signature = crypto.createHmac("sha256", this.credentials.apiSecret).update(signString).digest("hex")

      this.log("Sending order request...")

      const response = await this.rateLimitedFetch(`${baseUrl}/v5/order/create`, {
        method: "POST",
        headers: {
          "X-BAPI-API-KEY": this.credentials.apiKey,
          "X-BAPI-SIGN": signature,
          "X-BAPI-TIMESTAMP": timestamp.toString(),
          "X-BAPI-RECV-WINDOW": recvWindow,
          "Content-Type": "application/json",
        },
        body: paramsString,
      })

      const data = await response.json()

      if (!response.ok || data.retCode !== 0) {
        this.logError(`Order failed: ${data.retMsg || "Unknown error"}`)
        return {
          success: false,
          error: data.retMsg || "Order placement failed",
          timestamp: Date.now(),
        }
      }

      this.log(`Order placed successfully: ${data.result.orderId}`)

      return {
        success: true,
        orderId: data.result.orderId,
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
