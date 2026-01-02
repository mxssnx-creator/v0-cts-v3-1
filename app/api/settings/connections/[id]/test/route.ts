import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { createExchangeConnector } from "@/lib/exchange-connectors"
import { loadConnections, saveConnections } from "@/lib/file-storage"
import DatabaseManager from "@/lib/database"

const TEST_TIMEOUT_MS = 30000 // 30 seconds

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const testLog: string[] = []
  const startTime = Date.now()
  const { id } = await params

  try {
    testLog.push(`[${new Date().toISOString()}] Starting connection test for ID: ${id}`)

    // Get connection details from file storage
    const connections = loadConnections()
    const connectionIndex = connections.findIndex((c) => c.id === id)
    const connection = connections[connectionIndex]

    if (!connection) {
      testLog.push(`[${new Date().toISOString()}] ERROR: Connection not found`)
      await SystemLogger.logAPI(
        `Connection test failed: not found`,
        "error",
        "POST /api/settings/connections/[id]/test",
      )
      return NextResponse.json({ error: "Connection not found", log: testLog }, { status: 404 })
    }

    testLog.push(`[${new Date().toISOString()}] Connection found: ${connection.name} (${connection.exchange})`)
    testLog.push(`[${new Date().toISOString()}] API Type: ${connection.api_type}`)
    testLog.push(`[${new Date().toISOString()}] Connection Method: ${connection.connection_method}`)
    testLog.push(`[${new Date().toISOString()}] Testnet: ${connection.is_testnet ? "Yes" : "No"}`)

    // Try to get setting from DB but fallback safely
    let minInterval = 200
    try {
      const db = await DatabaseManager.getInstance()
      const intervalSetting = await db.getSetting("minimum_connect_interval")
      minInterval = intervalSetting ? Number.parseInt(intervalSetting) : 200
    } catch (settingsError) {
      // console.warn("[v0] Could not load system settings, using default interval")
      testLog.push(`[${new Date().toISOString()}] Using default connect interval: ${minInterval}ms`)
    }

    testLog.push(`[${new Date().toISOString()}] Minimum connect interval: ${minInterval}ms`)

    // Wait for minimum interval
    await new Promise((resolve) => setTimeout(resolve, minInterval))

    const connector = createExchangeConnector(connection.exchange, {
      apiKey: connection.api_key,
      apiSecret: connection.api_secret,
      apiPassphrase: connection.api_passphrase,
      isTestnet: connection.is_testnet || false,
    })

    const testPromise = connector.testConnection()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection test timeout")), TEST_TIMEOUT_MS),
    )

    const result = (await Promise.race([testPromise, timeoutPromise])) as any

    if (!result.success) {
      throw new Error(result.error || "Connection test failed")
    }

    const duration = Date.now() - startTime
    testLog.push(`[${new Date().toISOString()}] Connection successful!`)
    testLog.push(`[${new Date().toISOString()}] Account Balance: ${result.balance.toFixed(2)} USDT`)
    testLog.push(`[${new Date().toISOString()}] Test completed in ${duration}ms`)

    // Update connection in file storage
    const updatedConnection = {
      ...connection,
      last_test_status: "success",
      last_test_balance: result.balance,
      last_test_log: testLog, // Store array directly
      last_test_at: new Date().toISOString(),
      api_capabilities: JSON.stringify(result.capabilities),
      updated_at: new Date().toISOString(),
    }

    connections[connectionIndex] = updatedConnection
    saveConnections(connections)

    await SystemLogger.logConnection(`Connection test successful: ${connection.name}`, id, "info", {
      balance: result.balance,
      duration,
    })

    return NextResponse.json({
      success: true,
      balance: result.balance,
      balances: result.balances,
      capabilities: result.capabilities,
      log: testLog,
      duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    testLog.push(`[${new Date().toISOString()}] ERROR: ${errorMessage}`)
    testLog.push(`[${new Date().toISOString()}] Test failed after ${duration}ms`)

    console.error("[v0] Connection test failed:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/test")

    try {
      // Update failure status in file storage
      const connections = loadConnections()
      const connectionIndex = connections.findIndex((c) => c.id === id)
      if (connectionIndex !== -1) {
        connections[connectionIndex] = {
          ...connections[connectionIndex],
          last_test_status: "failed",
          last_test_log: testLog,
          last_test_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        saveConnections(connections)
      }
    } catch (updateError) {
      console.error("[v0] Failed to update connection with error status:", updateError)
    }

    return NextResponse.json(
      { error: "Connection test failed", details: errorMessage, log: testLog, duration },
      { status: 500 },
    )
  }
}
