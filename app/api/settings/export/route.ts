import { NextResponse } from "next/server"
import { loadSettings } from "@/lib/file-storage"

export async function GET() {
  try {
    console.log("[v0] Exporting settings as text file from file storage...")

    // Load settings from file
    const settings = loadSettings()
    
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
    
    // Export all settings
    for (const [key, value] of Object.entries(settings)) {
      // Convert value to string representation
      let valueStr: string
      if (value === null || value === undefined) {
        valueStr = ""
      } else if (Array.isArray(value) || typeof value === "object") {
        valueStr = JSON.stringify(value)
      } else {
        valueStr = String(value)
      }
      
      lines.push(`${key} = ${valueStr}`)
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
