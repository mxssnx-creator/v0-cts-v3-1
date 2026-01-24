import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("[v0] Reinitializing database with updated schema...")
    
    const { getClient, getDatabaseType } = await import("@/lib/db")
    const fs = await import("fs")
    const path = await import("path")

    const dbType = getDatabaseType()
    
    if (dbType === "sqlite") {
      const client = getClient() as any
      const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
      const sql = fs.readFileSync(sqlPath, "utf-8")

      console.log("[v0] Executing unified_complete_setup.sql...")
      const startTime = Date.now()
      
      // Execute the entire SQL file
      client.exec(sql)
      
      const duration = Date.now() - startTime
      
      // Get table count
      const tables = client.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      ).all()
      
      console.log(`[v0] Database reinitialized in ${duration}ms`)
      console.log(`[v0] Found ${tables.length} tables:`, tables.map((t: any) => t.name).slice(0, 10).join(", "))

      return NextResponse.json({
        success: true,
        tables: tables.length,
        tableNames: tables.map((t: any) => t.name),
        message: `Database reinitialized successfully with ${tables.length} tables`,
      })
    } else {
      return NextResponse.json(
        { success: false, error: "Only SQLite is supported for quick reinit" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("[v0] Reinit failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Reinit failed",
      },
      { status: 500 }
    )
  }
}
