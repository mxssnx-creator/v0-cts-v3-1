export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Automated Trading System</h1>
        <p className="text-muted-foreground mb-8">Professional crypto trading dashboard</p>
        
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">System Status</h2>
            <p className="text-green-600 font-medium">Operational</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Exchange Connections</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold text-foreground">Binance Spot</h3>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold text-foreground">Bybit Spot</h3>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold text-foreground">OKX Spot</h3>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
