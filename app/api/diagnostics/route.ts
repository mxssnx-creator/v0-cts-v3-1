import { NextResponse } from "next/server"
import { loadDiagnostics } from "@/lib/system-diagnostics"

export async function GET() {
  try {
    const diagnostics = await loadDiagnostics()

    // Filter to show only unresolved or recently resolved
    const recent = diagnostics.filter((d) => {
      if (!d.resolved) return true

      if (d.resolvedAt) {
        const resolvedDate = new Date(d.resolvedAt)
        const daysSinceResolved = (Date.now() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceResolved < 7
      }

      return false
    })

    return NextResponse.json({ success: true, diagnostics: recent })
  } catch (error) {
    console.error("Failed to load diagnostics:", error)
    return NextResponse.json({ success: false, error: "Failed to load diagnostics" }, { status: 500 })
  }
}
