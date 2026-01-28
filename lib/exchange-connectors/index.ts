/**
 * Exchange Connector Factory
 * Creates appropriate connector based on exchange name
 * Falls back to CCXT for any supported exchange
 */

import type { BaseExchangeConnector, ExchangeCredentials } from "./base-connector"
import { BybitConnector } from "./bybit-connector"
import { BingXConnector } from "./bingx-connector"
import { PionexConnector } from "./pionex-connector"
import { OrangeXConnector } from "./orangex-connector"
import { BinanceConnector } from "./binance-connector"
import { OKXConnector } from "./okx-connector"
import { CCXTConnector } from "./ccxt-connector"

export function createExchangeConnector(exchange: string, credentials: ExchangeCredentials): BaseExchangeConnector {
  const normalizedExchange = exchange.toLowerCase().replace(/[^a-z]/g, "")

  switch (normalizedExchange) {
    case "bybit":
      return new BybitConnector(credentials, "bybit")
    case "bingx":
      return new BingXConnector(credentials, "bingx")
    case "pionex":
      return new PionexConnector(credentials, "pionex")
    case "orangex":
      return new OrangeXConnector(credentials, "orangex")
    case "binance":
      return new BinanceConnector(credentials, "binance")
    case "okx":
      return new OKXConnector(credentials, "okx")
    // CCXT fallback for any other supported exchange
    default:
      // Check if it's a known CCXT exchange
      const ccxtSupportedExchanges = [
        "binance",
        "bybit",
        "okx",
        "gateio",
        "mexc",
        "kucoin",
        "huobi",
        "bitget",
        "bingx",
        "pionex",
        "kraken",
        "coinbase",
        "crypto.com",
        "dydx",
        "hyperliquid",
        "polymarket",
      ]

      if (ccxtSupportedExchanges.includes(normalizedExchange)) {
        return new CCXTConnector(credentials, exchange)
      }

      throw new Error(
        `Unsupported exchange: ${exchange}. Supported exchanges: ${ccxtSupportedExchanges.join(", ")}`
      )
  }
}

export type { ExchangeConnectorResult, ExchangeCredentials } from "./base-connector"
export { BaseExchangeConnector } from "./base-connector"
export { CCXTConnector } from "./ccxt-connector"
