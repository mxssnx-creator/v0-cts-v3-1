import { db } from './database'

export class TradingEngine {
  private connectionId: string
  private isRunning = false
  private positions = new Map<string, any>()

  constructor(connectionId: string) {
    this.connectionId = connectionId
  }

  async start() {
    this.isRunning = true
    console.log(`[v0] Trading engine started for connection: ${this.connectionId}`)
  }

  async stop() {
    this.isRunning = false
    console.log(`[v0] Trading engine stopped for connection: ${this.connectionId}`)
  }

  async pause() {
    this.isRunning = false
    console.log(`[v0] Trading engine paused for connection: ${this.connectionId}`)
  }

  async resume() {
    this.isRunning = true
    console.log(`[v0] Trading engine resumed for connection: ${this.connectionId}`)
  }

  async addPosition(symbol: string, side: string, size: number, price: number) {
    const positionId = `${symbol}-${Date.now()}`
    const position = {
      id: positionId,
      symbol,
      side,
      size,
      entryPrice: price,
      currentPrice: price,
      pnl: 0,
      status: 'open',
    }
    this.positions.set(positionId, position)
    return position
  }

  async closePosition(positionId: string) {
    const position = this.positions.get(positionId)
    if (position) {
      position.status = 'closed'
      console.log(`[v0] Position closed: ${positionId}`)
    }
    return position
  }

  getPositions() {
    return Array.from(this.positions.values())
  }

  getStatus() {
    return {
      connectionId: this.connectionId,
      isRunning: this.isRunning,
      positionCount: this.positions.size,
      positions: this.getPositions(),
    }
  }
}

export default TradingEngine
