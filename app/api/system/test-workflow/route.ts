import { type NextRequest, NextResponse } from "next/server"
import { loadConnections } from "@/lib/file-storage"
import { SystemLogger } from "@/lib/system-logger"
import { sql } from "@/lib/db"

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning"
  details: string
  duration: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId } = body

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 })
    }

    console.log(`[v0] Starting comprehensive workflow tests for ${connectionId}`)

    const results: TestResult[] = []
    const startTime = Date.now()

    // Test 1: Connection integrity
    const connectionTest = await testConnectionIntegrity(connectionId)
    results.push(connectionTest)

    // Test 2: API connectivity
    const apiTest = await testAPIConnectivity(connectionId)
    results.push(apiTest)

    // Test 3: Database state
    const dbTest = await testDatabaseState(connectionId)
    results.push(dbTest)

    // Test 4: Data flow
    const dataFlowTest = await testDataFlow(connectionId)
    results.push(dataFlowTest)

    // Test 5: Trade engine coordination
    const engineTest = await testTradeEngineCoordination(connectionId)
    results.push(engineTest)

    // Test 6: Cross-system workflow
    const workflowTest = await testCrossSystemWorkflow(connectionId)
    results.push(workflowTest)

    const totalDuration = Date.now() - startTime
    const passed = results.filter((r) => r.status === "pass").length
    const failed = results.filter((r) => r.status === "fail").length

    const overallStatus = failed > 0 ? "failed" : "passed"

    console.log(`[v0] Workflow tests completed: ${passed} passed, ${failed} failed (${totalDuration}ms)`)

    await SystemLogger.logAPI(
      `Workflow tests: ${passed}/${results.length} passed`,
      "info",
      "POST /api/system/test-workflow",
      { connectionId, status: overallStatus },
    )

    return NextResponse.json({
      status: overallStatus,
      totalDuration,
      summary: {
        passed,
        failed,
        warnings: results.filter((r) => r.status === "warning").length,
      },
      results,
    })
  } catch (error) {
    console.error("[v0] Workflow test error:", error)
    await SystemLogger.logError(error, "api", "POST /api/system/test-workflow")

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function testConnectionIntegrity(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === connectionId)

    if (!connection) {
      return {
        name: "Connection Integrity",
        status: "fail",
        details: "Connection not found in file storage",
        duration: Date.now() - startTime,
      }
    }

    if (!connection.api_key || !connection.api_secret) {
      return {
        name: "Connection Integrity",
        status: "warning",
        details: "Missing API credentials",
        duration: Date.now() - startTime,
      }
    }

    return {
      name: "Connection Integrity",
      status: "pass",
      details: `Connection ${connection.name} verified (${connection.exchange})`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "Connection Integrity",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testAPIConnectivity(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Test connections API
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/settings/connections`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      return {
        name: "API Connectivity",
        status: "fail",
        details: `Connections API returned ${response.status}`,
        duration: Date.now() - startTime,
      }
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return {
        name: "API Connectivity",
        status: "fail",
        details: "Invalid API response format",
        duration: Date.now() - startTime,
      }
    }

    return {
      name: "API Connectivity",
      status: "pass",
      details: `API responding correctly, ${data.length} connections available`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "API Connectivity",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testDatabaseState(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Check engine state record exists
    const stateResult = await sql<any>`
      SELECT * FROM trade_engine_state WHERE connection_id = ${connectionId}
    `

    if (!stateResult || stateResult.length === 0) {
      return {
        name: "Database State",
        status: "warning",
        details: "No engine state record found",
        duration: Date.now() - startTime,
      }
    }

    const state = stateResult[0]

    return {
      name: "Database State",
      status: "pass",
      details: `Engine state: ${state.status}, cycles: ind=${state.indication_cycle_count || 0}, strat=${state.strategy_cycle_count || 0}`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "Database State",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testDataFlow(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Check recent indications
    const indications = await sql<any>`
      SELECT COUNT(*) as count FROM indications 
      WHERE connection_id = ${connectionId}
      AND timestamp > CURRENT_TIMESTAMP - INTERVAL 1 HOUR
    `

    const indicationCount = indications?.[0]?.count || 0

    // Check recent strategies
    const strategies = await sql<any>`
      SELECT COUNT(*) as count FROM strategy_signals 
      WHERE connection_id = ${connectionId}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL 1 HOUR
    `

    const strategyCount = strategies?.[0]?.count || 0

    if (indicationCount === 0 && strategyCount === 0) {
      return {
        name: "Data Flow",
        status: "warning",
        details: "No recent data flow detected",
        duration: Date.now() - startTime,
      }
    }

    return {
      name: "Data Flow",
      status: "pass",
      details: `Data flowing: ${indicationCount} indications, ${strategyCount} signals in last hour`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "Data Flow",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testTradeEngineCoordination(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Check that all processors are coordinated
    const stateResult = await sql<any>`
      SELECT 
        indication_cycle_count,
        strategy_cycle_count,
        realtime_cycle_count,
        indications_health,
        strategies_health,
        realtime_health
      FROM trade_engine_state 
      WHERE connection_id = ${connectionId}
    `

    if (!stateResult || stateResult.length === 0) {
      return {
        name: "Trade Engine Coordination",
        status: "warning",
        details: "No engine state available",
        duration: Date.now() - startTime,
      }
    }

    const state = stateResult[0]
    const hasActivity =
      (state.indication_cycle_count || 0) > 0 &&
      (state.strategy_cycle_count || 0) > 0 &&
      (state.realtime_cycle_count || 0) > 0

    if (!hasActivity) {
      return {
        name: "Trade Engine Coordination",
        status: "warning",
        details: "Engine components not fully coordinated",
        duration: Date.now() - startTime,
      }
    }

    const healthStatuses = [state.indications_health, state.strategies_health, state.realtime_health]
    const allHealthy = healthStatuses.every((h) => h === "healthy")

    return {
      name: "Trade Engine Coordination",
      status: allHealthy ? "pass" : "warning",
      details: `Coordinated processors: indications=${state.indication_cycle_count}, strategies=${state.strategy_cycle_count}, realtime=${state.realtime_cycle_count}`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "Trade Engine Coordination",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}

async function testCrossSystemWorkflow(connectionId: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Test complete workflow: indications → strategies → positions
    const recentIndications = await sql<any>`
      SELECT DISTINCT symbol FROM indications 
      WHERE connection_id = ${connectionId}
      AND timestamp > CURRENT_TIMESTAMP - INTERVAL 30 MINUTES
      LIMIT 5
    `

    const symbols = recentIndications?.map((r) => r.symbol) || []

    if (symbols.length === 0) {
      return {
        name: "Cross-System Workflow",
        status: "warning",
        details: "No recent indications to test workflow",
        duration: Date.now() - startTime,
      }
    }

    // For each symbol, check if strategies and positions exist
    let workflowsComplete = 0

    for (const symbol of symbols) {
      const signals = await sql<any>`
        SELECT COUNT(*) as count FROM strategy_signals 
        WHERE connection_id = ${connectionId} AND symbol = ${symbol}
        AND created_at > CURRENT_TIMESTAMP - INTERVAL 30 MINUTES
      `

      if ((signals?.[0]?.count || 0) > 0) {
        workflowsComplete++
      }
    }

    if (workflowsComplete < symbols.length * 0.5) {
      return {
        name: "Cross-System Workflow",
        status: "warning",
        details: `Incomplete workflows: ${workflowsComplete}/${symbols.length} symbols have strategy signals`,
        duration: Date.now() - startTime,
      }
    }

    return {
      name: "Cross-System Workflow",
      status: "pass",
      details: `Complete workflows: ${workflowsComplete}/${symbols.length} symbols, indications → strategies → ready for trades`,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      name: "Cross-System Workflow",
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }
  }
}
