/**
 * Exchange Connector Factory
 * Creates appropriate connector based on exchange name
 */

import type { BaseExchangeConnector, ExchangeCredentials } from "./base-connector"
import { BybitConnector } from "./bybit-connector"
import { BingXConnector } from "./bingx-connector"
import { PionexConnector } from "./pionex-connector"
import { OrangeXConnector } from "./orangex-connector"
import { BinanceConnector } from "./binance-connector"
import { OKXConnector } from "./okx-connector"

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
    default:
      throw new Error(`Unsupported exchange: ${exchange}`)
  }
}

export function getExchangeConnector(connection: any): BaseExchangeConnector {
  const credentials: ExchangeCredentials = {
    apiKey: connection.api_key,
    apiSecret: connection.api_secret,
    apiPassphrase: connection.api_passphrase,
    isTestnet: connection.is_testnet || connection.testnet || false,
  }

  return createExchangeConnector(connection.exchange, credentials)
}

export { BaseExchangeConnector } from "./base-connector"
