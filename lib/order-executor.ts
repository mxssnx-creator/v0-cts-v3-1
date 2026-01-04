import { sql } from "./db"
import { getExchangeConnector } from "./exchange-connectors"
import { SystemLogger } from "./system-logger"
import { getRateLimiter } from "./rate-limiter"

export interface OrderParams {
  connection_id: string
  symbol: string
  order_type: "market" | "limit" | "stop_loss" | "take_profit"
  side: "buy" | "sell"
  price?: number
  quantity: number
  time_in_force?: "GTC" | "IOC" | "FOK"
  reduce_only?: boolean
}

export interface ExecutionResult {
  success: boolean
  order_id?: string
  exchange_order_id?: string
  filled_quantity?: number
  average_price?: number
  status?: string
  error?: string
  retries?: number
}

export class OrderExecutor {
  private static activeOrders = new Map<string, boolean>()
  private static maxRetries = 3
  private static retryDelayMs = 1000

  private static generateOrderKey(params: OrderParams): string {
    return `${params.connection_id}-${params.symbol}-${params.side}-${params.quantity}-${Date.now()}`
  }

  private static isOrderInProgress(orderKey: string): boolean {
    return this.activeOrders.has(orderKey)
  }

  private static markOrderInProgress(orderKey: string): void {
    this.activeOrders.set(orderKey, true)
  }

  private static clearOrderInProgress(orderKey: string): void {
    this.activeOrders.delete(orderKey)
  }

  async executeOrder(params: OrderParams): Promise<ExecutionResult> {
    const orderKey = OrderExecutor.generateOrderKey(params)

    // Check for duplicate order
    if (OrderExecutor.isOrderInProgress(orderKey)) {
      console.warn("[v0] [OrderExecutor] Duplicate order detected, skipping:", params.symbol)
      return {
        success: false,
        error: "Duplicate order detected",
      }
    }

    OrderExecutor.markOrderInProgress(orderKey)

    try {
      console.log("[v0] [OrderExecutor] Executing order:", params)
      await SystemLogger.logTradeEngine(`Executing order: ${params.side} ${params.quantity} ${params.symbol}`, "info", {
        ...params,
      })

      // Get connection details
      const [connection] = await sql`
        SELECT * FROM exchange_connections
        WHERE id = ${params.connection_id} AND is_enabled = true
      `

      if (!connection) {
        throw new Error(`Connection ${params.connection_id} not found or not enabled`)
      }

      // Create order record in database FIRST (for tracking)
      const [orderRecord] = await sql`
        INSERT INTO orders (
          connection_id, symbol, order_type, side, price, quantity, 
          remaining_quantity, time_in_force, status, created_at
        )
        VALUES (
          ${params.connection_id}, ${params.symbol}, ${params.order_type}, ${params.side},
          ${params.price || null}, ${params.quantity}, ${params.quantity},
          ${params.time_in_force || "GTC"}, 'pending', CURRENT_TIMESTAMP
        )
        RETURNING id
      `

      const orderId = orderRecord.id

      // Execute with retry logic
      let lastError: Error | null = null
      let exchangeOrderId: string | undefined = undefined
      let filledQuantity = 0
      let averagePrice = 0

      for (let attempt = 1; attempt <= OrderExecutor.maxRetries; attempt++) {
        try {
          console.log(`[v0] [OrderExecutor] Order execution attempt ${attempt}/${OrderExecutor.maxRetries}`)

          // Get exchange connector
          const connector = await getExchangeConnector(connection)

          // Place order on exchange
          const result = await this.placeOrderOnExchange(connector, connection.exchange, params)

          if (result.success) {
            exchangeOrderId = result.orderId
            filledQuantity = result.filledQty || params.quantity
            averagePrice = result.avgPrice || params.price || 0

            // Update order record with success
            await sql`
              UPDATE orders
              SET 
                status = ${result.status},
                exchange_order_id = ${exchangeOrderId || null},
                filled_quantity = ${filledQuantity},
                average_fill_price = ${averagePrice},
                executed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ${orderId}
            `

            console.log(`[v0] [OrderExecutor] Order executed successfully: ${exchangeOrderId}`)
            await SystemLogger.logTradeEngine(
              `Order executed: ${params.side} ${filledQuantity} ${params.symbol} @ ${averagePrice}`,
              "info",
              {
                orderId,
                exchangeOrderId,
                filledQuantity,
                averagePrice,
              },
            )

            OrderExecutor.clearOrderInProgress(orderKey)
            return {
              success: true,
              order_id: orderId,
              exchange_order_id: exchangeOrderId,
              filled_quantity: filledQuantity,
              average_price: averagePrice,
              status: result.status,
              retries: attempt,
            }
          }

          lastError = new Error(result.error || "Order execution failed")
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error")
          console.error(`[v0] [OrderExecutor] Attempt ${attempt} failed:`, lastError.message)

          if (attempt < OrderExecutor.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, OrderExecutor.retryDelayMs * attempt))
          }
        }
      }

      // All retries failed
      await sql`
        UPDATE orders
        SET 
          status = 'failed',
          error_message = ${lastError?.message || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${orderId}
      `

      await SystemLogger.logTradeEngine(
        `Order failed after ${OrderExecutor.maxRetries} retries: ${params.symbol}`,
        "error",
        {
          orderId,
          error: lastError?.message,
        },
      )

      OrderExecutor.clearOrderInProgress(orderKey)
      return {
        success: false,
        order_id: orderId,
        error: lastError?.message || "Order execution failed after retries",
        retries: OrderExecutor.maxRetries,
      }
    } catch (error) {
      OrderExecutor.clearOrderInProgress(orderKey)
      console.error("[v0] [OrderExecutor] Fatal error:", error)
      await SystemLogger.logError(error as Error, "trade-engine", "OrderExecutor.executeOrder")

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async placeOrderOnExchange(
    connector: any,
    exchange: string,
    params: OrderParams,
  ): Promise<{
    success: boolean
    orderId?: string
    status?: string
    filledQty?: number
    avgPrice?: number
    error?: string
  }> {
    try {
      const rateLimiter = getRateLimiter(exchange)

      return await rateLimiter.execute(async () => {
        // Use exchange-specific connector method
        if (exchange === "bybit") {
          return await this.placeBybitOrder(connector, params)
        } else if (exchange === "binance") {
          return await this.placeBinanceOrder(connector, params)
        } else if (exchange === "bingx") {
          return await this.placeBingXOrder(connector, params)
        } else if (exchange === "pionex") {
          return await this.placePionexOrder(connector, params)
        } else if (exchange === "orangex") {
          return await this.placeOrangeXOrder(connector, params)
        } else {
          throw new Error(`Exchange ${exchange} not supported`)
        }
      })
    } catch (error) {
      console.error("[v0] [OrderExecutor] Exchange API error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown exchange error",
      }
    }
  }

  private async placeBybitOrder(connector: any, params: OrderParams): Promise<any> {
    const endpoint = connector.credentials.isTestnet ? "https://api-testnet.bybit.com" : "https://api.bybit.com"

    const payload = {
      category: "linear",
      symbol: params.symbol,
      side: params.side === "buy" ? "Buy" : "Sell",
      orderType: params.order_type === "market" ? "Market" : "Limit",
      qty: params.quantity.toString(),
      ...(params.price && { price: params.price.toString() }),
      timeInForce: params.time_in_force || "GTC",
      reduceOnly: params.reduce_only || false,
    }

    const timestamp = Date.now().toString()
    const signature = connector.generateSignature(timestamp, payload)

    const response = await fetch(`${endpoint}/v5/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BAPI-API-KEY": connector.credentials.apiKey,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.retCode === 0) {
      return {
        success: true,
        orderId: data.result.orderId,
        status: data.result.orderStatus === "Filled" ? "filled" : "open",
        filledQty: Number.parseFloat(data.result.cumExecQty || "0"),
        avgPrice: Number.parseFloat(data.result.avgPrice || params.price?.toString() || "0"),
      }
    }

    return {
      success: false,
      error: data.retMsg || "Bybit order failed",
    }
  }

  private async placeBinanceOrder(connector: any, params: OrderParams): Promise<any> {
    // Implement Binance order placement
    return {
      success: false,
      error: "Binance implementation pending",
    }
  }

  private async placeBingXOrder(connector: any, params: OrderParams): Promise<any> {
    // Implement BingX order placement
    return {
      success: false,
      error: "BingX implementation pending",
    }
  }

  private async placePionexOrder(connector: any, params: OrderParams): Promise<any> {
    // Implement Pionex order placement
    return {
      success: false,
      error: "Pionex implementation pending",
    }
  }

  private async placeOrangeXOrder(connector: any, params: OrderParams): Promise<any> {
    // Implement OrangeX order placement
    return {
      success: false,
      error: "OrangeX implementation pending",
    }
  }

  async cancelOrder(orderId: string, connectionId: string): Promise<boolean> {
    try {
      const [order] = await sql`
        SELECT * FROM orders WHERE id = ${orderId} AND connection_id = ${connectionId}
      `

      if (!order || !order.exchange_order_id) {
        return false
      }

      const [connection] = await sql`
        SELECT * FROM exchange_connections WHERE id = ${connectionId}
      `

      const connector = await getExchangeConnector(connection)

      // TODO: Implement cancelOrder in exchange connectors
      // await connector.cancelOrder(order.exchange_order_id, order.symbol)

      // Update database to cancelled status
      await sql`
        UPDATE orders
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${orderId}
      `

      await SystemLogger.logTradeEngine(`Order cancelled: ${order.symbol}`, "info", { orderId })
      return true
    } catch (error) {
      console.error("[v0] [OrderExecutor] Cancel order error:", error)
      return false
    }
  }

  async getOrderStatus(orderId: string, connectionId: string): Promise<any> {
    try {
      const [order] = await sql`
        SELECT o.*, ec.exchange, ec.api_key, ec.api_secret, ec.testnet
        FROM orders o
        JOIN exchange_connections ec ON o.connection_id = ec.id
        WHERE o.id = ${orderId} AND o.connection_id = ${connectionId}
      `

      return order || null
    } catch (error) {
      console.error("[v0] [OrderExecutor] Get order status error:", error)
      return null
    }
  }
}
