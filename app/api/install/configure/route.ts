import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { databaseType, databaseUrl, databaseName, host, port, username, password } = body

    console.log("[v0] Configuring database:", { databaseType, databaseName })

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Load existing settings or create new
    const settingsPath = path.join(dataDir, "settings.json")
    let settings: any = {}
    
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
      } catch (error) {
        console.warn("[v0] Could not parse existing settings, creating new")
      }
    }

    // Update database settings
    settings.database_type = databaseType
    settings.database_name = databaseName || "Project-Name"
    
    if (databaseType === "postgresql") {
      settings.database_host = host
      settings.database_port = port
      settings.database_username = username
      settings.database_url = databaseUrl
    }

    // Save settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8")
    console.log("[v0] Settings saved to:", settingsPath)

    // Create .env.local file with DATABASE_URL if PostgreSQL
    if (databaseType === "postgresql" && databaseUrl) {
      const envPath = path.join(process.cwd(), ".env.local")
      let envContent = ""
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8")
      }

      // Update or add DATABASE_URL
      const lines = envContent.split("\n")
      let found = false
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("DATABASE_URL=")) {
          lines[i] = `DATABASE_URL="${databaseUrl}"`
          found = true
        }
      }
      
      if (!found) {
        lines.push(`DATABASE_URL="${databaseUrl}"`)
      }
      
      fs.writeFileSync(envPath, lines.filter((l) => l.trim()).join("\n") + "\n", "utf-8")
      console.log("[v0] Environment variables updated")

      // Update process.env for current process
      process.env.DATABASE_URL = databaseUrl
      process.env.DATABASE_TYPE = databaseType
    } else {
      // For SQLite
      process.env.DATABASE_TYPE = "sqlite"
      delete process.env.DATABASE_URL
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Database configured successfully",
        databaseType,
        databaseName,
      },
    })
  } catch (error) {
    console.error("[v0] Configuration failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Configuration failed",
      },
      { status: 500 }
    )
  }
}
