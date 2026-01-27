import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"
import { ErrorRecoveryManager } from "@/lib/error-recovery"
import { loadConnections } from "@/lib/file-storage"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    console.log("[v0] Fetching indication settings for connection:", id)

    // Get connection indication settings
    try {
      const result = await sql`
        SELECT 
          indication_type,
          is_enabled,
          range_value,
          timeout_value,
          interval_value,
          created_at,
          updated_at
        FROM connection_indication_settings
        WHERE connection_id = ${id}
        ORDER BY indication_type
      `

      await SystemLogger.logAPI(
        `Retrieved ${result?.length || 0} indication settings`,
        "info",
        "GET /api/settings/connections/[id]/indications",
        { connectionId: id, count: result?.length }
      )

      return NextResponse.json({
        success: true,
        connectionId: id,
        indications: result || [],
        timestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      console.warn("[v0] Database error fetching indications, returning defaults:", dbError)

      // Return default indications if database error
      return NextResponse.json({
        success: false,
        connectionId: id,
        indications: [],
        message: "Could not retrieve from database, returning empty list",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("[v0] Failed to fetch connection indications:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "get-indications",
      connectionId: (await params).id,
    })
    await SystemLogger.logError(error, "api", "GET /api/settings/connections/[id]/indications")

    return NextResponse.json(
      {
        error: "Failed to fetch indications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { indications } = body

    if (!Array.isArray(indications)) {
      return NextResponse.json(
        { error: "Indications must be an array" },
        { status: 400 }
      )
    }

    // Verify connection exists
    const connections = loadConnections()
    const connection = connections.find((c) => c.id === id)

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    console.log("[v0] Updating indication settings for connection:", id, "- Count:", indications.length)

    let updatedCount = 0

    try {
      // Update indication settings in transaction
      for (const ind of indications) {
        try {
          // Validate indication data
          if (!ind.indication_type) {
            console.warn("[v0] Skipping indication without type:", ind)
            continue
          }

          await sql`
            INSERT INTO connection_indication_settings 
              (connection_id, indication_type, is_enabled, range_value, timeout_value, interval_value, updated_at)
            VALUES 
              (${id}, ${ind.indication_type}, ${Boolean(ind.is_enabled)}, 
               ${ind.range_value || null}, ${ind.timeout_value || null}, ${ind.interval_value || null},
               CURRENT_TIMESTAMP)
            ON CONFLICT (connection_id, indication_type) 
            DO UPDATE SET 
              is_enabled = ${Boolean(ind.is_enabled)},
              range_value = ${ind.range_value || null},
              timeout_value = ${ind.timeout_value || null},
              interval_value = ${ind.interval_value || null},
              updated_at = CURRENT_TIMESTAMP
          `
          updatedCount++
        } catch (indError) {
          console.warn(`[v0] Failed to update indication ${ind.indication_type}:`, indError)
          // Continue with next indication
        }
      }

      console.log("[v0] Updated", updatedCount, "indication settings for connection:", id)

      await SystemLogger.logConnection(
        `Updated ${updatedCount} indication settings`,
        id,
        "info",
        { indicationCount: updatedCount }
      )

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedCount} indication settings`,
        connectionId: id,
        updatedCount,
        timestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error("[v0] Database error updating indications:", dbError)
      ErrorRecoveryManager.handleError(dbError, {
        component: "api",
        action: "update-indications",
        connectionId: id,
      })
      throw dbError
    }
  } catch (error) {
    console.error("[v0] Failed to update connection indications:", error)
    await SystemLogger.logError(error, "api", "PUT /api/settings/connections/[id]/indications", {
      connectionId: (await params).id,
    })

    return NextResponse.json(
      {
        error: "Failed to update indications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
