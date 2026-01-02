import { type NextRequest, NextResponse } from "next/server"
import { execute, queryOne } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

// POST - Toggle active status for connections
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    console.log("[v0] [Connection] Toggling active status for connection:", id, "to:", is_active)

    const connection = await queryOne(`SELECT id, name, exchange FROM exchange_connections WHERE id = $1`, [id])

    if (!connection) {
      console.error("[v0] [Connection] Connection not found:", id)
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    await execute(
      `
      UPDATE exchange_connections
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [is_active, id],
    )

    if (is_active) {
      try {
        await execute(
          `
          INSERT INTO trade_engine_state (connection_id, status, last_updated)
          VALUES ($1, 'stopped', CURRENT_TIMESTAMP)
          ON CONFLICT (connection_id) DO UPDATE SET status = 'stopped', last_updated = CURRENT_TIMESTAMP
        `,
          [id],
        )
        console.log("[v0] [Connection] Trade engine state initialized for connection:", id)
      } catch (engineError) {
        console.error("[v0] [Connection] Failed to initialize trade engine state:", engineError)
        // Continue anyway - this is not critical for activation
      }
    } else {
      try {
        const engineState = await queryOne(`SELECT status FROM trade_engine_state WHERE connection_id = $1`, [id])

        if (engineState?.status === "running") {
          console.log("[v0] [Connection] Stopping trade engine for deactivated connection:", id)

          const port = process.env.PORT || "3000"
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : `http://localhost:${port}`

          try {
            const response = await fetch(`${appUrl}/api/trade-engine/stop`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ connectionId: id }),
              signal: AbortSignal.timeout(5000), // 5 second timeout
            })

            if (!response.ok) {
              console.error("[v0] [Connection] Failed to stop trade engine via API, forcing stop")
              throw new Error("API call failed")
            }
          } catch (apiError) {
            console.error("[v0] [Connection] Error calling stop API, forcing database update:", apiError)
            // Force stop in database if API call fails
            await execute(
              `
              UPDATE trade_engine_state
              SET status = 'stopped', stopped_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
              WHERE connection_id = $1
            `,
              [id],
            )
          }
        }
      } catch (engineError) {
        console.error("[v0] [Connection] Error handling trade engine shutdown:", engineError)
        // Continue anyway - connection will be deactivated
      }
    }

    await SystemLogger.logConnection(
      `Connection ${is_active ? "activated" : "deactivated"}: ${connection.name}`,
      id,
      "info",
      { is_active },
    )

    console.log("[v0] [Connection] Active status updated successfully")

    return NextResponse.json({
      success: true,
      message: is_active ? "Connection activated" : "Connection deactivated",
    })
  } catch (error) {
    console.error("[v0] [Connection] Failed to toggle active status:", error)
    await SystemLogger.logError(error, "api", "POST /api/settings/connections/[id]/active")

    return NextResponse.json(
      {
        error: "Failed to toggle active status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
