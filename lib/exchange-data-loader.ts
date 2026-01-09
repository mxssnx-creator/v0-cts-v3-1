import { execute } from "@/lib/db"
import { loadConnections } from "@/lib/file-storage"
import { getExchangeConnector } from "@/lib/exchange-connectors"

export interface HistoricalDataRecord {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function loadHistoricalData(
  connectionId: string,
  symbol: string,
  startDate: string,
  endDate: string,
  interval = "1h",
): Promise<HistoricalDataRecord[]> {
  console.log(`[v0] Loading historical data for ${symbol} from ${startDate} to ${endDate}`)

  const connections = loadConnections()
  const connection = connections.find((c) => c.id === connectionId)

  if (!connection) {
    throw new Error(`Connection not found: ${connectionId}`)
  }

  // Get exchange connector
  const connector = getExchangeConnector(connection.exchange, connection)

  // Fetch historical klines/candles from exchange
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const intervalMs = parseInterval(interval)

  const records: HistoricalDataRecord[] = []
  let currentTime = start

  // Load data in chunks to avoid rate limits
  while (currentTime < end) {
    const chunkEnd = Math.min(currentTime + intervalMs * 1000, end) // Load 1000 candles at a time

    try {
      // Call exchange API to fetch historical data
      const klines = await connector.fetchHistoricalKlines(symbol, interval, currentTime, chunkEnd)

      for (const kline of klines) {
        const record: HistoricalDataRecord = {
          timestamp: new Date(kline.timestamp).toISOString(),
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume,
        }

        records.push(record)

        // Store in database immediately for persistent storage
        await execute(
          `INSERT INTO market_data (connection_id, symbol, timestamp, open, high, low, close, volume, interval, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (connection_id, symbol, timestamp, interval) DO NOTHING`,
          [
            connectionId,
            symbol,
            record.timestamp,
            record.open,
            record.high,
            record.low,
            record.close,
            record.volume,
            interval,
            new Date().toISOString(),
          ],
        )
      }

      currentTime = chunkEnd
      console.log(`[v0] Loaded ${records.length} records so far...`)

      // Rate limit protection - wait between chunks
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`[v0] Error loading chunk ${currentTime} to ${chunkEnd}:`, error)
      // Continue with next chunk
      currentTime = chunkEnd
    }
  }

  console.log(`[v0] Historical data loading complete: ${records.length} records`)
  return records
}

function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)([smhd])$/)
  if (!match) return 3600000 // Default 1 hour

  const value = Number.parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case "s":
      return value * 1000
    case "m":
      return value * 60 * 1000
    case "h":
      return value * 60 * 60 * 1000
    case "d":
      return value * 24 * 60 * 60 * 1000
    default:
      return 3600000
  }
}
