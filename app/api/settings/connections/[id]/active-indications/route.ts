import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"
import { ErrorRecoveryManager } from "@/lib/error-recovery"
import { loadConnections } from "@/lib/file-storage"

const DEFAULT_ACTIVE_INDICATIONS = {
  direction: true,
  move: true,
  active: true,
  optimal: false,
  active_advanced: false,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    console.log("[v0] Fetching active indications for connection:", connectionId)

    try {
      const result = await sql`
        SELECT value FROM system_settings
        WHERE key = ${`connection_${connectionId}_active_indications`}
        LIMIT 1
      `
      const settings = result[0] as { value: string } | undefined

      if (!settings) {
        console.log("[v0] No active indications found, returning defaults")

        await SystemLogger.logConnection(
          "Returned default active indications (not configured)",
          connectionId,
          "info"
        )

        return NextResponse.json({
          success: true,
          connectionId,
          indications: DEFAULT_ACTIVE_INDICATIONS,
          isDefault: true,
          timestamp: new Date().toISOString(),
        })
      }

      const parsedValue = JSON.parse(settings.value)

      await SystemLogger.logConnection(
        "Retrieved active indications configuration",
        connectionId,
        "info"
      )

      return NextResponse.json({
        success: true,
        connectionId,
        indications: parsedValue,
        isDefault: false,
        timestamp: new Date().toISOString(),
      })
    } catch (parseError) {
      console.warn("[v0] Failed to parse active indications, returning defaults:", parseError)

      return NextResponse.json({
        success: false,
        connectionId,
        indications: DEFAULT_ACTIVE_INDICATIONS,
        isDefault: true,
        message: "Stored configuration was invalid, returning defaults",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("[v0] Error fetching active indications:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "get-active-indications",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", "GET /api/settings/connections/[id]/active-indications")

    return NextResponse.json(
      {
        error: "Failed to fetch active indications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const connectionId = id
    const body = await request.json()

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Validate request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid object" },
        { status: 400 }
      )
    }

    console.log("[v0] Saving active indications for connection:", connectionId, "- Fields:", Object.keys(body))

    // Merge with defaults to ensure required fields
    const indicationsToSave = {
      ...DEFAULT_ACTIVE_INDICATIONS,
      ...body,
    }

    try {
      await sql`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (${`connection_${connectionId}_active_indications`}, ${JSON.stringify(indicationsToSave)}, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET 
          value = ${JSON.stringify(indicationsToSave)},
          updated_at = CURRENT_TIMESTAMP
      `

      console.log("[v0] Active indications saved successfully for connection:", connectionId)

      await SystemLogger.logConnection(
        "Updated active indications configuration",
        connectionId,
        "info",
        { fields: Object.keys(body) }
      )

      return NextResponse.json({
        success: true,
        message: "Active indications updated",
        connectionId,
        indications: indicationsToSave,
        timestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error("[v0] Database error saving active indications:", dbError)

      // Check if it's a database table missing error
      if (dbError instanceof Error && dbError.message.includes("no such table")) {
        ErrorRecoveryManager.handleError(dbError, {
          component: "database",
          action: "save-active-indications",
          connectionId,
          details: "system_settings table not found",
        })

        return NextResponse.json(
          {
            error: "Database not initialized. Please run database initialization from Settings.",
            needsInit: true,
            details: dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 503 }
        )
      }

      throw dbError
    }
  } catch (error) {
    console.error("[v0] Error saving active indications:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "put-active-indications",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", "PUT /api/settings/connections/[id]/active-indications")

    return NextResponse.json(
      {
        error: "Failed to save active indications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
