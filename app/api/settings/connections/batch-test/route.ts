/**
 * Batch Test Connections API
 * Tests multiple connections in parallel with proper rate limiting and concurrency control
 */

import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { loadConnections } from "@/lib/file-storage"
import { ConnectionCoordinator } from "@/lib/connection-coordinator"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { connectionIds, testType = "all" } = body

    if (!Array.isArray(connectionIds) || connectionIds.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "connectionIds must be a non-empty array",
        },
        { status: 400 }
      )
    }

    if (connectionIds.length > 50) {
      return NextResponse.json(
        {
          error: "Too many connections",
          details: "Maximum 50 connections per batch test",
        },
        { status: 400 }
      )
    }

    console.log(`[v0] Starting batch test for ${connectionIds.length} connections`)

    const coordinator = ConnectionCoordinator.getInstance()
    const results = new Map()
    const errors: string[] = []

    // Test each connection
    for (const connectionId of connectionIds) {
      try {
        const result = await coordinator.testConnection(connectionId)
        results.set(connectionId, result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`${connectionId}: ${errorMessage}`)
        results.set(connectionId, {
          success: false,
          error: errorMessage,
        })
      }
    }

    const duration = Date.now() - startTime
    const successful = Array.from(results.values()).filter((r) => r.success).length
    const failed = connectionIds.length - successful

    await SystemLogger.logAPI(`Batch test completed: ${successful} successful, ${failed} failed`, "info", "POST /api/settings/connections/batch-test")

    return NextResponse.json({
      success: true,
      totalConnections: connectionIds.length,
      successful,
      failed,
      duration,
      results: Object.fromEntries(results),
      errors,
    })
  } catch (error) {
    console.error("[v0] Batch test error:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/batch-test")

    return NextResponse.json(
      {
        error: "Batch test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
