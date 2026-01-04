import { NextResponse } from "next/server"
import { getDiagnosticLogs } from "@/lib/system-diagnostics"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const logs = await getDiagnosticLogs(limit)

    return NextResponse.json({ success: true, logs })
  } catch (error) {
    console.error("Failed to load diagnostic logs:", error)
    return NextResponse.json({ success: false, error: "Failed to load logs" }, { status: 500 })
  }
}
