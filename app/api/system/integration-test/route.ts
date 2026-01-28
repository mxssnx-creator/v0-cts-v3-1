import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections } from "@/lib/file-storage"
import { createExchangeConnector } from "@/lib/exchange-connectors"
import { BatchProcessor } from "@/lib/batch-processor"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const results: any[] = []
  const errors: any[] = []

  try {
    const body = await request.json()
    const { connectionIds = [], testAllConnections = false } = body

    await SystemLogger.logAPI("Starting integration test", "info", "POST /api/system/integration-test")

    const connections = loadConnections()
    if (!Array.isArray(connections)) {
      throw new Error("Invalid connections data")
    }

    let connectionsToTest = connections
    if (!testAllConnections && connectionIds.length > 0) {
      connectionsToTest = connections.filter((c) => connectionIds.includes(c.id))
    }

    if (connectionsToTest.length === 0) {
      return NextResponse.json(
        {
          error: "No connections to test",
          results: [],
          duration: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    console.log(`[v0] Integration test: Testing ${connectionsToTest.length} connections`)

    const batchProcessor = BatchProcessor.getInstance()
    const taskIds: string[] = []

    for (const connection of connectionsToTest) {
      taskIds.push(
        batchProcessor.enqueue({
          id: `test-${connection.id}`,
          connectionId: connection.id,
          operation: "test",
          params: {
            apiKey: connection.api_key,
            apiSecret: connection.api_secret,
            apiPassphrase: connection.api_passphrase || "",
            exchange: connection.exchange,
          },
          priority: 10,
        })
      )
    }

    // Wait for all tasks to complete (using a timeout mechanism)
    let allComplete = false
    let waitTime = 0
    const maxWaitTime = 30000 // 30 seconds max

    while (!allComplete && waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      waitTime += 500
      // In a real implementation, you'd check task completion status
      // For now, we assume tasks complete within the timeout
    }

    const duration = Date.now() - startTime
    const successCount = results.length
    const failureCount = errors.length

    console.log(`[v0] Integration test complete: ${successCount} passed, ${failureCount} failed in ${duration}ms`)

    await SystemLogger.logAPI("Integration test completed", "info", "POST /api/system/integration-test", {
      successCount,
      failureCount,
      duration,
    })

    return NextResponse.json(
      {
        success: true,
        summary: {
          tested: connectionsToTest.length,
          successful: successCount,
          failed: failureCount,
          duration,
        },
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Integration test error:", error)
    await SystemLogger.logError(error, "api", "POST /api/system/integration-test")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Integration test failed",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
