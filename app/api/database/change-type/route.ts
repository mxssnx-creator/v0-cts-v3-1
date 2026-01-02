import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { type } = await request.json()

    if (!["sqlite", "postgresql", "remote"].includes(type)) {
      return NextResponse.json({ error: "Invalid database type" }, { status: 400 })
    }

    // Write database type preference to config file
    const configPath = path.join(process.cwd(), "data", "db-config.json")
    const configDir = path.dirname(configPath)

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    fs.writeFileSync(configPath, JSON.stringify({ type, updated_at: new Date().toISOString() }, null, 2))

    return NextResponse.json({
      success: true,
      type,
      message: "Database type preference saved. Restart required to apply changes.",
    })
  } catch (error) {
    console.error("[v0] Failed to change database type:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to change database type"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
