import { NextRequest, NextResponse } from "next/server"
import { loadSettings, saveSettings } from "@/lib/file-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    const content = await file.text()
    const lines = content.split("\n")
    
    // Load existing settings
    const existingSettings = loadSettings()
    const updatedSettings = { ...existingSettings }
    
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
      const valueStr = match[2].trim()
      
      try {
        // Parse the value
        let value: any = valueStr
        
        // Try to parse JSON arrays/objects
        if (valueStr && (valueStr.startsWith("[") || valueStr.startsWith("{"))) {
          try {
            value = JSON.parse(valueStr)
          } catch (e) {
            // Keep as string if JSON parse fails
          }
        } else if (valueStr === "true" || valueStr === "false") {
          // Parse booleans
          value = valueStr === "true"
        } else if (valueStr && !isNaN(Number(valueStr)) && valueStr !== "") {
          // Parse numbers
          value = Number(valueStr)
        }
        
        // Update setting
        updatedSettings[key] = value
        imported++
      } catch (error) {
        console.error(`[v0] Failed to import setting ${key}:`, error)
        errors++
      }
    }
    
    // Save all settings to file
    saveSettings(updatedSettings)
    
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
