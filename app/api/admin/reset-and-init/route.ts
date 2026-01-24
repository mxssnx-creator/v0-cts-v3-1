import { NextResponse } from "next/server"
import { execute, getDatabaseType } from "@/lib/db"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("[v0] === DROPPING ALL TABLES ===")
    
    const dbType = getDatabaseType()
    
    // Drop all tables in reverse dependency order
    const tablesToDrop = [
      "archived_market_data",
      "data_cleanup_log", 
      "performance_metrics",
      "pseudo_positions",
      "base_pseudo_positions",
      "indications_active",
      "trades",
      "indications_direction",
      "indications",
      "market_data",
      "trade_engine_state",
      "exchange_connections",
      "connection_presets",
      "preset_types",
      "site_logs",
      "system_settings",
      "migrations",
      "users"
    ]
    
    for (const table of tablesToDrop) {
      try {
        await execute(`DROP TABLE IF EXISTS ${table}`, [])
        console.log(`[v0] Dropped table: ${table}`)
      } catch (error) {
        console.log(`[v0] Could not drop ${table}:`, error)
      }
    }
    
    console.log("[v0] === RUNNING FRESH MIGRATIONS ===")
    
    // Now run migrations fresh
    const { runAllMigrations } = await import("@/lib/db-migration-runner")
    const result = await runAllMigrations()
    
    return NextResponse.json({
      success: true,
      message: "Database reset and initialized successfully",
      result,
    })
  } catch (error: any) {
    console.error("[v0] Reset and init failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
