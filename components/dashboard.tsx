'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Trading Dashboard</h1>
          <p className="text-muted-foreground">Automated Trading System</p>
        </div>

        <Card className="mb-6 p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">System Status</h2>
              <p className="text-sm text-muted-foreground">Status: <span className="font-medium text-green-600">Operational</span></p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500" />
          </div>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Exchange Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 border">
              <h3 className="font-semibold text-foreground">Binance Spot</h3>
              <p className="text-sm text-muted-foreground">binance</p>
              <div className="flex gap-2 pt-3">
                <Button size="sm" variant="outline" className="flex-1">Settings</Button>
                <Button size="sm" variant="ghost" className="flex-1">Test</Button>
              </div>
            </Card>
            <Card className="p-4 border">
              <h3 className="font-semibold text-foreground">Bybit Spot</h3>
              <p className="text-sm text-muted-foreground">bybit</p>
              <div className="flex gap-2 pt-3">
                <Button size="sm" variant="outline" className="flex-1">Settings</Button>
                <Button size="sm" variant="ghost" className="flex-1">Test</Button>
              </div>
            </Card>
            <Card className="p-4 border">
              <h3 className="font-semibold text-foreground">OKX Spot</h3>
              <p className="text-sm text-muted-foreground">okx</p>
              <div className="flex gap-2 pt-3">
                <Button size="sm" variant="outline" className="flex-1">Settings</Button>
                <Button size="sm" variant="ghost" className="flex-1">Test</Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Total</div>
            <div className="text-3xl font-bold text-foreground mt-2">6</div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Active</div>
            <div className="text-3xl font-bold text-foreground mt-2">3</div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Enabled</div>
            <div className="text-3xl font-bold text-foreground mt-2">3</div>
          </Card>
          <Card className="p-4 border">
            <div className="text-xs font-medium text-muted-foreground uppercase">Live</div>
            <div className="text-3xl font-bold text-foreground mt-2">0</div>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <Card className="p-6 border">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">Start Trading</Button>
              <Button variant="outline">View Positions</Button>
              <Button variant="outline">Settings</Button>
              <Button variant="outline">View Logs</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
