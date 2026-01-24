import { NextResponse } from "next/server"
import { getClient, getDatabaseType } from "@/lib/db"
import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"

export async function POST() {
  try {
    const dbType = getDatabaseType()
    
    if (dbType !== "sqlite") {
      return NextResponse.json({
        success: false,
        error: "Force reinit only works with SQLite",
      }, { status: 400 })
    }

    console.log("[v0] ================================================")
    console.log("[v0] FORCE DATABASE REINITIALIZATION")
    console.log("[v0] ================================================")

    const client = getClient() as Database.Database
    
    // Get all existing tables
    const tables = client.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[]
    
    console.log(`[v0] Found ${tables.length} existing tables`)
    
    // Drop all tables in reverse order to handle foreign keys
    for (const table of tables.reverse()) {
      console.log(`[v0] Dropping table: ${table.name}`)
      client.exec(`DROP TABLE IF EXISTS ${table.name}`)
    }
    
    console.log("[v0] All tables dropped")
    
    // Execute the unified setup SQL
    const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
    const sql = fs.readFileSync(sqlPath, "utf-8")
    
    console.log("[v0] Executing unified_complete_setup.sql...")
    const startTime = Date.now()
    
    client.exec(sql)
    
    const duration = Date.now() - startTime
    
    // Count new tables
    const newTables = client.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[]
    
    console.log(`[v0] Created ${newTables.length} tables in ${duration}ms`)
    console.log("[v0] Tables:", newTables.map(t => t.name).join(", "))
    
    console.log("[v0] ================================================")
    console.log("[v0] REINITIALIZATION COMPLETE")
    console.log("[v0] ================================================")
    
    return NextResponse.json({
      success: true,
      tablesDropped: tables.length,
      tablesCreated: newTables.length,
      tables: newTables.map(t => t.name),
      duration,
      message: `Database reinitialized: ${newTables.length} tables created`,
    })
  } catch (error) {
    console.error("[v0] Force reinit failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Reinitialization failed",
    }, { status: 500 })
  }
}
