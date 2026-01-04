import { NextResponse } from "next/server"
import { executeAction } from "@/lib/system-diagnostics"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const { diagnosticId, actionId } = await request.json()

    if (!diagnosticId || !actionId) {
      return NextResponse.json({ success: false, error: "Missing diagnosticId or actionId" }, { status: 400 })
    }

    const result = await executeAction(diagnosticId, actionId, session?.user?.username)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to execute action:", error)
    return NextResponse.json({ success: false, error: "Failed to execute action" }, { status: 500 })
  }
}
