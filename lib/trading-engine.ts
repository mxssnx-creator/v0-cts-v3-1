/**
 * Trading Engine
 * Manages real-time trading operations and position tracking
 */

export interface TradePosition {
  id: string
  symbol: string
  entryPrice: number
  currentPrice: number
  profit: number
  profitPercent: number
  status: "open" | "closed"
}

export interface TradeStats {
  totalPositions: number
  openPositions: number
  closedPositions: number
  totalProfit: number
  winRate: number
}

class TradingEngine {
  private positions: Map<string, TradePosition> = new Map()
  private stats: TradeStats = {
    totalPositions: 0,
    openPositions: 0,
    closedPositions: 0,
    totalProfit: 0,
    winRate: 0,
  }

  constructor() {
    console.log("[v0] TradingEngine initialized")
  }

  /**
   * Add a new trading position
   */
  addPosition(position: TradePosition): void {
    this.positions.set(position.id, position)
    this.updateStats()
    console.log(`[v0] Position added: ${position.symbol}`)
  }

  /**
   * Update an existing position
   */
  updatePosition(id: string, updates: Partial<TradePosition>): void {
    const position = this.positions.get(id)
    if (position) {
      Object.assign(position, updates)
      this.updateStats()
      console.log(`[v0] Position updated: ${id}`)
    }
  }

  /**
   * Close a position
   */
  closePosition(id: string): void {
    const position = this.positions.get(id)
    if (position) {
      position.status = "closed"
      this.updateStats()
      console.log(`[v0] Position closed: ${id}`)
    }
  }

  /**
   * Get all positions
   */
  getPositions(): TradePosition[] {
    return Array.from(this.positions.values())
  }

  /**
   * Get position by ID
   */
  getPosition(id: string): TradePosition | undefined {
    return this.positions.get(id)
  }

  /**
   * Get current trading statistics
   */
  getStats(): TradeStats {
    return { ...this.stats }
  }

  /**
   * Get open positions
   */
  getOpenPositions(): TradePosition[] {
    return Array.from(this.positions.values()).filter((p) => p.status === "open")
  }

  /**
   * Get closed positions
   */
  getClosedPositions(): TradePosition[] {
    return Array.from(this.positions.values()).filter((p) => p.status === "closed")
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    const positions = Array.from(this.positions.values())
    const openPositions = positions.filter((p) => p.status === "open")
    const closedPositions = positions.filter((p) => p.status === "closed")

    this.stats = {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalProfit: positions.reduce((sum, p) => sum + p.profit, 0),
      winRate:
        closedPositions.length > 0
          ? (closedPositions.filter((p) => p.profit > 0).length / closedPositions.length) * 100
          : 0,
    }
  }

  /**
   * Clear all positions
   */
  clear(): void {
    this.positions.clear()
    this.updateStats()
    console.log("[v0] TradingEngine cleared")
  }
}

export default TradingEngine
