/**
 * Connection Predefinitions
 * Pre-configured exchange connection templates for quick setup
 */

export interface ConnectionPredefinition {
  id: string
  name: string
  displayName: string
  description: string
  apiType: string
  connectionMethod: string
  connectionLibrary: string
  marginType: string
  positionMode: string
  maxLeverage: number
  contractType: string
  documentationUrl: string
  testnetSupported: boolean
  ccxtSupported: boolean
  apiKey?: string
  apiSecret?: string
  defaultSettings: {
    profitFactorMinBase: number
    profitFactorMinMain: number
    profitFactorMinReal: number
    trailingWithTrailing: boolean
    trailingOnly: boolean
    blockEnabled: boolean
    blockOnly: boolean
    dcaEnabled: boolean
    dcaOnly: boolean
  }
}

export interface ExchangeConnection {
  id: string
  name: string
  exchange: string
  api_type: string
  connection_method: string
  connection_library: string
  api_key: string
  api_secret: string
  margin_type: string
  position_mode: string
  is_testnet: boolean
  is_enabled: boolean
  is_active: boolean
  is_predefined: boolean
  is_live_trade: boolean
  is_preset_trade: boolean
  last_test_status: any | null
  last_test_balance: any | null
  last_test_log: any[]
  api_capabilities: any[]
  rate_limits: any | null
  volume_factor: number
  created_at: string
  updated_at: string
}

export const CONNECTION_PREDEFINITIONS: ConnectionPredefinition[] = [
  {
    id: "bybit-x03",
    name: "Bybit X03",
    displayName: "Bybit X03 (Unified Trading)",
    description: "Bybit Unified Trading Account with up to 125x leverage",
    apiType: "unified",
    connectionMethod: "library",
    connectionLibrary: "native",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://bybit-exchange.github.io/docs/v5/intro",
    testnetSupported: true,
    ccxtSupported: true,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "bingx-x01",
    name: "BingX X01",
    displayName: "BingX X01 (Perpetual Futures)",
    description: "BingX USDT Perpetual Futures with up to 150x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 150,
    contractType: "usdt-perpetual",
    documentationUrl: "https://bingx-api.github.io/docs/#/en-us/swapV2/introduce",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "pionex-x01",
    name: "Pionex X01",
    displayName: "Pionex X01 (Perpetual Futures)",
    description: "Pionex USDT Perpetual Futures with up to 100x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 100,
    contractType: "usdt-perpetual",
    documentationUrl: "https://pionex-doc.gitbook.io/apidocs/",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "orangex-x01",
    name: "OrangeX X01",
    displayName: "OrangeX X01 (Perpetual Futures)",
    description: "OrangeX USDT Perpetual Futures trading",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://openapi-docs.orangex.com/",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "binance-x01",
    name: "Binance X01",
    displayName: "Binance X01 (USDⓈ-M Futures)",
    description: "Binance USDT-margined perpetual futures with up to 125x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://binance-docs.github.io/apidocs/futures/en/",
    testnetSupported: true,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "okx-x01",
    name: "OKX X01",
    displayName: "OKX X01 (Perpetual Swap)",
    description: "OKX USDT perpetual swap contracts with up to 125x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://www.okx.com/docs-v5/en/",
    testnetSupported: true,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "gateio-x01",
    name: "Gate.io X01",
    displayName: "Gate.io X01 (Perpetual Futures)",
    description: "Gate.io USDT perpetual contracts with up to 100x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 100,
    contractType: "usdt-perpetual",
    documentationUrl: "https://www.gate.io/docs/developers/apiv4/",
    testnetSupported: true,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "mexc-x01",
    name: "MEXC X01",
    displayName: "MEXC X01 (Perpetual Futures)",
    description: "MEXC USDT perpetual futures with up to 200x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 200,
    contractType: "usdt-perpetual",
    documentationUrl: "https://mexcdevelop.github.io/apidocs/contract_v1_en/",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "bitget-x01",
    name: "Bitget X01",
    displayName: "Bitget X01 (Perpetual Futures)",
    description: "Bitget USDT perpetual futures with up to 125x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://www.bitget.com/api-doc/contract/intro",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "kucoin-x01",
    name: "KuCoin X01",
    displayName: "KuCoin X01 (Perpetual Futures)",
    description: "KuCoin USDT perpetual contracts with up to 100x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 100,
    contractType: "usdt-perpetual",
    documentationUrl: "https://www.kucoin.com/docs/rest/futures-trading/introduction",
    testnetSupported: true,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
  {
    id: "huobi-x01",
    name: "Huobi X01",
    displayName: "Huobi X01 (Perpetual Swaps)",
    description: "Huobi USDT linear swaps with up to 125x leverage",
    apiType: "perpetual_futures",
    connectionMethod: "library",
    marginType: "cross",
    positionMode: "hedge",
    maxLeverage: 125,
    contractType: "usdt-perpetual",
    documentationUrl: "https://www.htx.com/en-us/opend/newApiPages/",
    testnetSupported: false,
    apiKey: "00998877009988770099887700998877",
    apiSecret: "00998877009988770099887700998877",
    defaultSettings: {
      profitFactorMinBase: 0.6,
      profitFactorMinMain: 0.6,
      profitFactorMinReal: 0.6,
      trailingWithTrailing: true,
      trailingOnly: false,
      blockEnabled: true,
      blockOnly: false,
      dcaEnabled: false,
      dcaOnly: false,
    },
  },
]

export function getConnectionPredefinition(exchangeId: string): ConnectionPredefinition | undefined {
  return CONNECTION_PREDEFINITIONS.find((p) => p.id === exchangeId)
}

export function getAllConnectionPredefinitions(): ConnectionPredefinition[] {
  return CONNECTION_PREDEFINITIONS
}

export function getPredefinedConnectionsAsStatic(): ExchangeConnection[] {
  return CONNECTION_PREDEFINITIONS.map((pred) => ({
    id: pred.id,
    name: pred.name,
    exchange: pred.id.split("-")[0],
    api_type: pred.apiType,
    connection_method: pred.connectionMethod,
    connection_library: "native",
    api_key: pred.apiKey || "00998877009988770099887700998877",
    api_secret: pred.apiSecret || "00998877009988770099887700998877",
    margin_type: pred.marginType,
    position_mode: pred.positionMode,
    is_testnet: false,
    is_enabled: false,
    is_active: true,
    is_predefined: true,
    is_live_trade: false,
    is_preset_trade: false,
    last_test_status: null,
    last_test_balance: null,
    last_test_log: [],
    api_capabilities: [],
    rate_limits: null,
    volume_factor: undefined as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}
