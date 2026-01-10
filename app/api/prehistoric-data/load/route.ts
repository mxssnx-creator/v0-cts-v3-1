import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId, symbol, startDate, endDate, interval = "1h" } = body

    if (!connectionId || !symbol) {
      return NextResponse.json({ error: "Connection ID and symbol are required" }, { status: 400 })
    }

    console.log("[v0] Loading prehistoric data:", { connectionId, symbol, startDate, endDate, interval })
    await SystemLogger.logAPI(`Loading prehistoric data for ${symbol}`, "info", "POST /api/prehistoric-data/load", {
      connectionId,
      symbol,
      interval,
    })

    const existingData = await query<{ min_timestamp: string; max_timestamp: string; count: number }>(
      `SELECT MIN(timestamp) as min_timestamp, MAX(timestamp) as max_timestamp, COUNT(*) as count 
       FROM market_data 
       WHERE connection_id = ? AND symbol = ?`,
      [connectionId, symbol],
    )

    let missingRanges: { start: string; end: string }[] = []

    if (!existingData[0] || existingData[0].count === 0) {
      // No data exists, load full range
      missingRanges = [{ start: startDate, end: endDate }]
    } else {
      // Calculate gaps in existing data
      const minTime = new Date(existingData[0].min_timestamp).getTime()
      const maxTime = new Date(existingData[0].max_timestamp).getTime()
      const requestedStart = new Date(startDate).getTime()
      const requestedEnd = new Date(endDate).getTime()

      if (requestedStart < minTime) {
        missingRanges.push({ start: startDate, end: new Date(minTime).toISOString() })
      }

      if (requestedEnd > maxTime) {
        missingRanges.push({ start: new Date(maxTime).toISOString(), end: endDate })
      }
    }

    console.log("[v0] Missing data ranges:", missingRanges.length)

    const totalRanges = missingRanges.length
    let completedRanges = 0
    let totalRecordsLoaded = 0

    for (const range of missingRanges) {
      try {
        // Load data from exchange API (this would connect to actual exchange)
        const { loadHistoricalData } = await import("@/lib/exchange-data-loader")
        const records = await loadHistoricalData(connectionId, symbol, range.start, range.end, interval)

        totalRecordsLoaded += records.length
        completedRanges++

        const progress = Math.round((completedRanges / totalRanges) * 100)
        console.log(`[v0] Prehistoric load progress: ${progress}% (${completedRanges}/${totalRanges} ranges)`)

        // Stream progress update
        await SystemLogger.logAPI(
          `Prehistoric data progress: ${progress}%`,
          "info",
          "POST /api/prehistoric-data/load",
          { symbol, progress, recordsLoaded: totalRecordsLoaded },
        )
      } catch (rangeError) {
        console.error("[v0] Error loading range:", range, rangeError)
        // Continue with next range even if one fails
      }
    }

    console.log("[v0] Prehistoric data loading complete:", totalRecordsLoaded, "records")
    await SystemLogger.logConnection(`Prehistoric data loaded: ${totalRecordsLoaded} records`, connectionId, "info", {
      symbol,
      ranges: totalRanges,
    })

    return NextResponse.json({
      success: true,
      message: "Prehistoric data loaded successfully",
      recordsLoaded: totalRecordsLoaded,
      rangesProcessed: completedRanges,
      missingRanges: totalRanges,
    })
  } catch (error) {
    console.error("[v0] Error loading prehistoric data:", error)
    await SystemLogger.logError(error, "api", "POST /api/prehistoric-data/load")

    return NextResponse.json(
      {
        error: "Failed to load prehistoric data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connectionId")
    const symbol = searchParams.get("symbol")

    if (!connectionId || !symbol) {
      return NextResponse.json({ error: "Connection ID and symbol are required" }, { status: 400 })
    }

    // Check data coverage
    const coverage = await query<{ min_timestamp: string; max_timestamp: string; total_records: number }>(
      `SELECT MIN(timestamp) as min_timestamp, MAX(timestamp) as max_timestamp, COUNT(*) as total_records 
       FROM market_data 
       WHERE connection_id = ? AND symbol = ?`,
      [connectionId, symbol],
    )

    const hasCoverage = coverage[0] && coverage[0].total_records > 0

    return NextResponse.json({
      hasCoverage,
      coverage: hasCoverage
        ? {
            startDate: coverage[0].min_timestamp,
            endDate: coverage[0].max_timestamp,
            totalRecords: coverage[0].total_records,
          }
        : null,
    })
  } catch (error) {
    console.error("[v0] Error checking prehistoric data:", error)
    return NextResponse.json(
      {
        error: "Failed to check prehistoric data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
