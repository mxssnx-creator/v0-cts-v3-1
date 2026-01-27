import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const connections = [
      { id: 'binance-spot', name: 'Binance Spot', exchange: 'binance', is_active: true, is_enabled: true },
      { id: 'bybit-spot', name: 'Bybit Spot', exchange: 'bybit', is_active: true, is_enabled: true },
      { id: 'okx-spot', name: 'OKX Spot', exchange: 'okx', is_active: true, is_enabled: true },
    ]
    return NextResponse.json(connections)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}
