import { NextRequest, NextResponse } from "next/server"
import { createExchangeConnector } from "@/lib/exchange-connectors"
import { connectionDb, connectionLogsDb } from "@/lib/db-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exchange, api_key, api_secret, api_passphrase, is_testnet, connection_method, connection_library, api_type, connection_id } = body

    if (!exchange || !api_key || !api_secret) {
      return NextResponse.json(
        { success: false, log: ["Error: API Key and Secret are required"] },
        { status: 400 }
      )
    }

    const testLog: string[] = []
    testLog.push(`[${new Date().toISOString()}] Starting connection test...`)
    testLog.push(`[${new Date().toISOString()}] Exchange: ${exchange}`)
    testLog.push(`[${new Date().toISOString()}] API Type: ${api_type}`)
    testLog.push(`[${new Date().toISOString()}] Connection Method: ${connection_method}`)
    testLog.push(`[${new Date().toISOString()}] Connection Library: ${connection_library}`)
    testLog.push(`[${new Date().toISOString()}] Testnet: ${is_testnet ? "Yes" : "No"}`)

    try {
      testLog.push(`[${new Date().toISOString()}] Creating exchange connector...`)
      const connector = await createExchangeConnector(exchange, {
        apiKey: api_key,
        apiSecret: api_secret,
        apiPassphrase: api_passphrase || "",
        isTestnet: is_testnet || false,
      })

      testLog.push(`[${new Date().toISOString()}] Testing connection...`)
      const result = await connector.testConnection()

      if (result.success) {
        testLog.push(`[${new Date().toISOString()}] ✓ Connection successful`)
        if (result.balance !== undefined) {
          testLog.push(`[${new Date().toISOString()}] Account Balance: $${result.balance.toFixed(2)}`)
        }
        if (result.capabilities?.length) {
          testLog.push(`[${new Date().toISOString()}] Capabilities: ${result.capabilities.join(", ")}`)
        }

        if (connection_id) {
          await connectionDb.recordTestResult(connection_id, "success", testLog)
          await connectionLogsDb.add(connection_id, "test", "success", "Connection test passed", {
            balance: result.balance,
            capabilities: result.capabilities,
          })
        }

        return NextResponse.json({ 
          success: true, 
          log: testLog, 
          balance: result.balance,
          capabilities: result.capabilities 
        })
      } else {
        testLog.push(`[${new Date().toISOString()}] ✗ Connection failed`)
        testLog.push(`[${new Date().toISOString()}] Error: ${result.error || "Unknown error"}`)

        if (connection_id) {
          await connectionDb.recordTestResult(connection_id, "failed", testLog)
          await connectionLogsDb.add(connection_id, "test", "failed", `Connection test failed: ${result.error}`)
        }

        return NextResponse.json(
          { 
            success: false, 
            log: testLog,
            error: result.error || "Connection test failed"
          }, 
          { status: 400 }
        )
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      testLog.push(`[${new Date().toISOString()}] ✗ Error: ${errorMsg}`)

      if (connection_id) {
        await connectionDb.recordTestResult(connection_id, "failed", testLog)
        await connectionLogsDb.add(connection_id, "test", "error", `Connection test error: ${errorMsg}`)
      }

      return NextResponse.json(
        { 
          success: false, 
          log: testLog,
          error: errorMsg
        }, 
        { status: 500 }
      )
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Invalid request"
    return NextResponse.json(
      { 
        success: false, 
        log: [`Error: ${errorMsg}`],
        error: errorMsg
      },
      { status: 400 }
    )
  }
}
