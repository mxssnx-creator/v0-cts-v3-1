import { type NextRequest, NextResponse } from "next/server"
import { successResponse, errorResponse } from "@/lib/api-toast"
import { loadSettings, saveSettings } from "@/lib/file-storage"
import { resetDatabaseClients } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const settings = loadSettings()

    console.log("[v0] Loaded settings from file:", Object.keys(settings).length, "keys")
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] Failed to fetch system settings:", error)
    return NextResponse.json({})
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Updating system settings:", Object.keys(body))

    const currentSettings = loadSettings()
    const oldDbType = currentSettings.database_type
    const newDbType = body.database_type

    if (newDbType && newDbType !== oldDbType) {
      console.log(`[v0] ========================================`)
      console.log(`[v0] DATABASE TYPE CHANGE DETECTED`)
      console.log(`[v0] Old type: ${oldDbType}`)
      console.log(`[v0] New type: ${newDbType}`)
      console.log(`[v0] ========================================`)
    }

    if (body.postgres_ssl_cert_file) {
      try {
        const certDir = path.join(process.cwd(), "certs")
        if (!fs.existsSync(certDir)) {
          fs.mkdirSync(certDir, { recursive: true })
        }

        const certPath = path.join(certDir, "postgres-ca.crt")

        // If it's base64 encoded, decode it
        let certContent = body.postgres_ssl_cert_file
        if (certContent.includes("base64,")) {
          const base64Data = certContent.split("base64,")[1]
          certContent = Buffer.from(base64Data, "base64").toString("utf-8")
        }

        fs.writeFileSync(certPath, certContent)
        console.log("[v0] SSL certificate saved to:", certPath)

        // Store the path, not the content
        body.postgres_ssl_cert_path = certPath
        delete body.postgres_ssl_cert_file
      } catch (error) {
        console.error("[v0] Failed to save SSL certificate:", error)
      }
    }

    const updatedSettings = { ...currentSettings, ...body }
    saveSettings(updatedSettings)
    console.log("[v0] Settings saved to file successfully")

    // Reset database connections if type changed
    if (newDbType && newDbType !== oldDbType) {
      console.log("[v0] Resetting database clients...")
      resetDatabaseClients()
      console.log("[v0] Database clients reset successfully")
      console.log("[v0] System will reconnect using new database type on next query")

      // Also update environment variable for current process
      process.env.DATABASE_TYPE = newDbType
      console.log("[v0] Environment variable DATABASE_TYPE updated to:", newDbType)
    }

    const updatedCount = Object.keys(body).length

    return successResponse(
      { success: true, updated: updatedCount, dbTypeChanged: newDbType !== oldDbType },
      `Successfully updated ${updatedCount} setting(s)${newDbType !== oldDbType ? ". Database type changed - system will reconnect." : ""}`,
    )
  } catch (error) {
    console.error("[v0] Failed to update system settings:", error)
    return errorResponse("Failed to update settings", "Settings Save Failed", "Could not save settings to file", 500)
  }
}
