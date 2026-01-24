import { type NextRequest, NextResponse } from "next/server"
import { getClient, getDatabaseType } from "@/lib/db"
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const dbType = getDatabaseType()
    
    if (dbType !== "sqlite") {
      return NextResponse.json(
        { error: "This endpoint only works with SQLite" },
        { status: 400 }
      )
    }

    const scriptPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
    const sql = fs.readFileSync(scriptPath, "utf-8")
    
    const db = getClient() as Database.Database
    
    // Execute the entire SQL file as a batch
    console.log("[v0] Executing unified_complete_setup.sql directly...")
    const startTime = Date.now()
    
    // SQLite's exec method can run multiple statements at once
    db.exec(sql)
    
    const duration = Date.now() - startTime
    console.log(`[v0] Database initialized successfully in ${duration}ms`)
    
    // Verify tables were created
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all()
    
    console.log(`[v0] Found ${tables.length} tables:`, tables.map((t: any) => t.name).join(", "))
    
    return NextResponse.json({
      success: true,
      message: `Database initialized successfully with ${tables.length} tables`,
      tables: tables.map((t: any) => t.name),
      duration,
    })
  } catch (error: any) {
    console.error("[v0] Database initialization error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to initialize database",
        details: error.stack
      },
      { status: 500 }
    )
  }
}
