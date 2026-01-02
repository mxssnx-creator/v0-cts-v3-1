import { NextResponse } from "next/server"
import { loadConnections, loadSettings } from "@/lib/file-storage"

export async function GET() {
  try {
    console.log("[v0] Exporting current data to downloadable file...")

    const connections = loadConnections()
    const settings = loadSettings()

    const exportData = {
      exported_at: new Date().toISOString(),
      connections,
      settings,
      version: "1.0",
    }

    const jsonData = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cts-export-${Date.now()}.json"`,
        "Content-Length": Buffer.byteLength(jsonData).toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting data:", error)
    return NextResponse.json(
      {
        error: "Failed to export data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
