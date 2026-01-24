import { NextRequest, NextResponse } from "next/server"
import { execute } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    const content = await file.text()
    const lines = content.split("\n")
    
    let imported = 0
    let skipped = 0
    let errors = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        skipped++
        continue
      }
      
      // Parse key = value format
      const match = trimmed.match(/^([^=]+)\s*=\s*(.+)$/)
      if (!match) {
        console.warn(`[v0] Invalid line format: ${trimmed}`)
        errors++
        continue
      }
      
      const key = match[1].trim()
      const value = match[2].trim()
      
      try {
        // Update or insert setting
        await execute(
          `INSERT INTO system_settings (key, value, updated_at) 
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
          [key, value, value]
        )
        imported++
      } catch (error) {
        console.error(`[v0] Failed to import setting ${key}:`, error)
        errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      message: `Imported ${imported} settings, skipped ${skipped}, ${errors} errors`
    })
  } catch (error) {
    console.error("[v0] Failed to import settings:", error)
    return NextResponse.json(
      { error: "Failed to import settings" },
      { status: 500 }
    )
  }
}
