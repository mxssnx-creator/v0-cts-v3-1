import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Exporting settings as text file...")

    // Fetch all settings from database
    const settings = await query("SELECT key, value, description, category FROM system_settings ORDER BY category, key", [])
    
    // Format as readable text file
    const timestamp = new Date().toISOString()
    const lines = [
      "# CTS v3.1 - System Settings Export",
      `# Exported: ${timestamp}`,
      "#",
      "# Format: key = value",
      "#",
      ""
    ]
    
    let currentCategory = ""
    
    for (const setting of settings as any[]) {
      // Add category header when it changes
      if (setting.category !== currentCategory) {
        currentCategory = setting.category
        lines.push("")
        lines.push(`# ========== ${currentCategory.toUpperCase()} ==========`)
        lines.push("")
      }
      
      // Add description as comment if available
      if (setting.description) {
        lines.push(`# ${setting.description}`)
      }
      
      // Add the setting
      lines.push(`${setting.key} = ${setting.value}`)
      lines.push("")
    }
    
    const textContent = lines.join("\n")
    
    // Return as downloadable text file
    return new NextResponse(textContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="cts-settings-${new Date().toISOString().split('T')[0]}.txt"`,
        "Content-Length": Buffer.byteLength(textContent).toString(),
      }
    })
  } catch (error) {
    console.error("[v0] Error exporting settings:", error)
    return NextResponse.json(
      {
        error: "Failed to export settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
