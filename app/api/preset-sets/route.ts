import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API disabled in dev preview" })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "API disabled in dev preview" })
}
