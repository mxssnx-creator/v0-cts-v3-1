import { type NextRequest, NextResponse } from "next/server"
import { SystemLogger } from "@/lib/system-logger"
import { createExchangeConnector } from "@/lib/exchange-connectors"
import { loadConnections, saveConnections } from "@/lib/file-storage"
import DatabaseManager from "@/lib/database"

const TEST_TIMEOUT_MS = 30000

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const testLog: string[] = []
  const startTime = Date.now()
  const { id } = await params

  try {
    testLog.push(`[${new Date().toISOString()}] Starting connection test for ID: ${id}`)

    const connections = loadConnections()

    if (!Array.isArray(connections)) {
      testLog.push(`[${new Date().toISOString()}] ERROR: Connections data is not an array`)
      return NextResponse.json({ error: "Invalid connections data", log: testLog }, { status: 500 })
    }

    const connectionIndex = connections.findIndex((c) => c.id === id)
    if (connectionIndex === -1) {
      testLog.push(`[${new Date().toISOString()}] ERROR: Connection not found (ID: ${id})`)
      await SystemLogger.logAPI(
        `Connection test failed: not found`,
        "error",
        "POST /api/settings/connections/[id]/test",
      )
      return NextResponse.json({ error: "Connection not found", log: testLog }, { status: 404 })
    }

    const connection = connections[connectionIndex]

    testLog.push(`[${new Date().toISOString()}] Connection found: ${connection.name} (${connection.exchange})`)
    testLog.push(`[${new Date().toISOString()}] API Type: ${connection.api_type}`)
    testLog.push(`[${new Date().toISOString()}] Connection Method: ${connection.connection_method}`)
    testLog.push(`[${new Date().toISOString()}] Testnet: ${connection.is_testnet ? "Yes" : "No"}`)

    if (!connection.api_key || connection.api_key === "" || connection.api_key.includes("PLACEHOLDER")) {
      testLog.push(`[${new Date().toISOString()}] WARNING: API key appears to be empty or placeholder`)
      testLog.push(`[${new Date().toISOString()}] Please configure valid API credentials before testing`)

      connections[connectionIndex] = {
        ...connection,
        last_test_status: "warning",
        last_test_log: testLog,
        last_test_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      saveConnections(connections)

      return NextResponse.json(
        {
          error: "Invalid credentials",
          details: "API key and secret must be configured. Please enter your valid exchange API credentials.",
          log: testLog,
          duration: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    let minInterval = 200
    try {
      const db = await DatabaseManager.getInstance()
      const intervalSetting = await db.getSetting("minimum_connect_interval")
      minInterval = intervalSetting ? Number.parseInt(intervalSetting) : 200
    } catch (settingsError) {
      testLog.push(`[${new Date().toISOString()}] Using default connect interval: ${minInterval}ms`)
    }

    testLog.push(`[${new Date().toISOString()}] Minimum connect interval: ${minInterval}ms`)

    await new Promise((resolve) => setTimeout(resolve, minInterval))

    const connector = createExchangeConnector(connection.exchange, {
      apiKey: connection.api_key,
      apiSecret: connection.api_secret,
      apiPassphrase: connection.api_passphrase || "",
      isTestnet: connection.is_testnet || false,
    })

    const testPromise = connector.testConnection()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection test timeout after 30 seconds")), TEST_TIMEOUT_MS),
    )

    const result = (await Promise.race([testPromise, timeoutPromise])) as any

    if (!result.success) {
      throw new Error(result.error || "Connection test failed")
    }

    const duration = Date.now() - startTime
    testLog.push(`[${new Date().toISOString()}] Connection successful!`)
    testLog.push(`[${new Date().toISOString()}] Account Balance: ${result.balance.toFixed(2)} USDT`)
    testLog.push(`[${new Date().toISOString()}] Test completed in ${duration}ms`)

    connections = loadConnections()
    const updatedIndex = connections.findIndex((c) => c.id === id)

    if (updatedIndex !== -1) {
      const updatedConnection = {
        ...connections[updatedIndex],
        last_test_status: "success",
        last_test_balance: result.balance,
        last_test_log: testLog,
        last_test_at: new Date().toISOString(),
        api_capabilities: JSON.stringify(result.capabilities || []),
        updated_at: new Date().toISOString(),
      }

      connections[updatedIndex] = updatedConnection
      saveConnections(connections)
    }

    await SystemLogger.logConnection(`Connection test successful: ${connection.name}`, id, "info", {
      balance: result.balance,
      duration,
    })

    return NextResponse.json({
      success: true,
      balance: result.balance,
      balances: result.balances || [],
      capabilities: result.capabilities || [],
      log: testLog,
      duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    let userFriendlyError = errorMessage
    if (errorMessage.includes("JSON")) {
      userFriendlyError = "API returned invalid response. Check your credentials or try again."
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      userFriendlyError = "Invalid API credentials. Please verify your API key and secret."
    } else if (errorMessage.includes("timeout")) {
      userFriendlyError = "Connection timeout. Check your network or if the API endpoint is available."
    }

    testLog.push(`[${new Date().toISOString()}] ERROR: ${errorMessage}`)
    testLog.push(`[${new Date().toISOString()}] Test failed after ${duration}ms`)

    console.error("[v0] Connection test failed:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/test")

    try {
      const connections = loadConnections()
      if (Array.isArray(connections)) {
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
      }
    } catch (updateError) {
      console.error("[v0] Failed to update connection with error status:", updateError)
    }

    return NextResponse.json(
      {
        error: "Connection test failed",
        details: userFriendlyError,
        log: testLog,
        duration,
      },
      { status: 500 }
    )
  }
}
