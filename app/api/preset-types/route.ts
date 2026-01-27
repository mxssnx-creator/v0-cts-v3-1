import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"
import { ErrorRecoveryManager } from "@/lib/error-recovery"
import { nanoid } from "nanoid"

// GET /api/preset-types - Get all preset types with related set counts
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/preset-types - Fetching preset types...")

    const types = await sql`
      SELECT 
        pt.*,
        COUNT(DISTINCT pts.configuration_set_id) as sets_count
      FROM preset_types pt
      LEFT JOIN preset_type_sets pts ON pt.id = pts.preset_type_id AND pts.is_active = true
      GROUP BY pt.id
      ORDER BY pt.created_at DESC
    `

    console.log("[v0] Successfully fetched", types?.length || 0, "preset types")
    await SystemLogger.logAPI(
      `Retrieved ${types?.length || 0} preset types`,
      "info",
      "GET /api/preset-types",
      { count: types?.length || 0 }
    )

    return NextResponse.json({
      success: true,
      count: types?.length || 0,
      preset_types: types || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to fetch preset types:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "get-preset-types",
    })
    await SystemLogger.logError(error, "api", "GET /api/preset-types")

    return NextResponse.json(
      {
        error: "Failed to fetch preset types",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST /api/preset-types - Create new preset type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: "Preset type name is required" }, { status: 400 })
    }

    const id = nanoid()

    console.log("[v0] Creating preset type:", body.name)

    const result = await sql`
      INSERT INTO preset_types (
        id, name, description, preset_trade_type,
        max_positions_per_indication, max_positions_per_direction, max_positions_per_range,
        timeout_per_indication, timeout_after_position,
        block_enabled, block_only, dca_enabled, dca_only,
        auto_evaluate, evaluation_interval_hours,
        is_active, created_at, updated_at
      ) VALUES (
        ${id}, 
        ${body.name}, 
        ${body.description || null}, 
        ${body.preset_trade_type || "main"},
        ${body.max_positions_per_indication || 10},
        ${body.max_positions_per_direction || 20},
        ${body.max_positions_per_range || 5},
        ${body.timeout_per_indication || 60},
        ${body.timeout_after_position || 120},
        ${body.block_enabled !== false},
        ${body.block_only || false},
        ${body.dca_enabled !== false},
        ${body.dca_only || false},
        ${body.auto_evaluate !== false},
        ${body.evaluation_interval_hours || 1},
        ${body.is_active !== false},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    const createdPreset = result?.[0] || { id, name: body.name }

    console.log("[v0] Preset type created successfully:", id)
    await SystemLogger.logAPI(
      `Created preset type: ${body.name}`,
      "info",
      "POST /api/preset-types",
      { presetTypeId: id, name: body.name }
    )

    return NextResponse.json({
      success: true,
      message: "Preset type created",
      preset_type: createdPreset,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to create preset type:", error)
    ErrorRecoveryManager.handleError(error, {
      component: "api",
      action: "create-preset-type",
      data: body,
    })
    await SystemLogger.logError(error, "api", "POST /api/preset-types")

    return NextResponse.json(
      {
        error: "Failed to create preset type",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

        id,
        body.name,
        body.description || null,
        body.preset_trade_type || "automatic",
        body.max_positions_per_indication || 1,
        body.max_positions_per_direction || 1,
        body.max_positions_per_range || 1,
        body.timeout_per_indication || 5,
        body.timeout_after_position || 10,
        body.block_enabled || false,
        body.block_only || false,
        body.dca_enabled || false,
        body.dca_only || false,
        body.auto_evaluate !== false,
        body.evaluation_interval_hours || 3,
        body.is_active !== false,
      ],
    )

    const presetType = await queryOne("SELECT * FROM preset_types WHERE id = $1", [id])

    console.log("[v0] Preset type created successfully:", id)
    return NextResponse.json(presetType, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create preset type:", error)
    return NextResponse.json(
      { error: "Failed to create preset type", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
