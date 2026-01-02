import crypto from "crypto"
import { BaseExchangeConnector, type ExchangeConnectorResult } from "./base-connector"

export class BinanceConnector extends BaseExchangeConnector {
  private getBaseUrl(): string {
    return this.credentials.isTestnet ? "https://testnet.binancefuture.com" : "https://fapi.binance.com"
  }

  getCapabilities(): string[] {
    return ["futures", "perpetual_futures", "spot", "leverage", "hedge_mode", "cross_margin", "isolated_margin"]
  }

  async testConnection(): Promise<ExchangeConnectorResult> {
    this.log("Starting Binance connection test")
    this.log(`Testnet: ${this.credentials.isTestnet ? "Yes" : "No"}`)
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

      const usdtBalance = Number.parseFloat(data.find((b: any) => b.asset === "USDT")?.balance || "0")

      const balances = data.map((b: any) => ({
        asset: b.asset,
        free: Number.parseFloat(b.availableBalance || "0"),
        locked: Number.parseFloat(b.balance || "0") - Number.parseFloat(b.availableBalance || "0"),
        total: Number.parseFloat(b.balance || "0"),
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
}
