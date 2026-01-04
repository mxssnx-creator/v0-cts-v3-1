"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StrategyBar } from "@/components/strategies/strategy-bar"
import { StrategyFilters } from "@/components/strategies/strategy-filters"
import type { StrategyResult } from "@/lib/strategies"
import { Activity, TrendingUp, BarChart3, Settings, RefreshCw, Target } from "lucide-react"
import { toast } from "@/lib/simple-toast"

export default function StrategiesPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [minimalProfitFactor, setMinimalProfitFactor] = useState(0.4)
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [filters, setFilters] = useState({
    mainStrategyType: [] as string[],
    adjustmentType: [] as string[],
    validationState: [] as string[],
    profitFactorMin: 0.4,
    volumeFactorMin: 1,
    volumeFactorMax: 5,
    trailingOnly: false,
    activeOnly: false,
    minTradesPerDay: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await fetch("/api/strategies")
        if (response.ok) {
          const data = await response.json()
          setStrategies(data.strategies || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load strategies:", error)
        toast.error("Failed to load strategies")
      } finally {
        setIsLoading(false)
      }
    }

    loadStrategies()
  }, [])

  const handleToggleStrategy = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })

      if (response.ok) {
        setStrategies((prev) =>
          prev.map((strategy) => (strategy.id === id ? { ...strategy, isActive: active } : strategy)),
        )
        toast.success(`Strategy ${active ? "activated" : "deactivated"}`)
      } else {
        toast.error("Failed to update strategy")
      }
    } catch (error) {
      console.error("[v0] Failed to toggle strategy:", error)
      toast.error("Failed to update strategy")
    }
  }

  const handleVolumeFactorChange = async (id: string, factor: number) => {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume_factor: factor }),
      })

      if (response.ok) {
        setStrategies((prev) =>
          prev.map((strategy) => (strategy.id === id ? { ...strategy, volume_factor: factor } : strategy)),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to update volume factor:", error)
    }
  }

  const filteredStrategies = strategies.filter((strategy) => {
    if (
      filters.mainStrategyType.length > 0 &&
      !filters.mainStrategyType.some((type) => strategy.mainType === type.toLowerCase())
    )
      return false

    if (
      filters.adjustmentType.length > 0 &&
      !filters.adjustmentType.some((type) => strategy.adjustments.includes(type.toLowerCase() as any))
    )
      return false

    if (filters.validationState.length > 0 && !filters.validationState.includes(strategy.validation_state)) return false
    if (strategy.avg_profit_factor < filters.profitFactorMin) return false
    if (strategy.volume_factor < filters.volumeFactorMin || strategy.volume_factor > filters.volumeFactorMax)
      return false
    if (filters.trailingOnly && !strategy.config.trailing_enabled) return false
    if (filters.activeOnly && !strategy.isActive) return false
    if (strategy.stats.positions_per_day * 5 < filters.minTradesPerDay) return false

    return true
  })

  const activeStrategies = strategies.filter((strategy) => strategy.isActive)
  const validStrategies = strategies.filter((strategy) => strategy.validation_state === "valid")
  const profitableStrategies = strategies.filter((strategy) => strategy.avg_profit_factor >= minimalProfitFactor)

  const stats = {
    total: strategies.length,
    active: activeStrategies.length,
    valid: validStrategies.length,
    profitable: profitableStrategies.length,
    avgProfitFactor: strategies.reduce((sum, s) => sum + s.avg_profit_factor, 0) / strategies.length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading strategies...</div>
        </div>
      </div>
    )
  }

  if (strategies.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Strategies Available</h3>
          <p className="text-muted-foreground mb-4">
            Enable connections and generate pseudo-positions to create strategies.
          </p>
          <Button onClick={() => (window.location.href = "/settings")}>Go to Settings</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategies</h1>
          <p className="text-muted-foreground">Manage and optimize trading strategies</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Strategies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.valid}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.profitable}</div>
                <div className="text-sm text-muted-foreground">Profitable</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgProfitFactor.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Avg Profit Factor</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <StrategyFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="active">Active ({activeStrategies.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredStrategies.length} of {strategies.length} strategies
                  </span>
                  <Badge variant="outline">Min Profit Factor: {minimalProfitFactor}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {filteredStrategies.map((strategy) => (
                  <StrategyBar
                    key={strategy.id}
                    strategy={strategy}
                    onToggle={handleToggleStrategy}
                    onVolumeFactorChange={handleVolumeFactorChange}
                    minimalProfitFactor={minimalProfitFactor}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="space-y-3">
                {activeStrategies.map((strategy) => (
                  <StrategyBar
                    key={strategy.id}
                    strategy={strategy}
                    onToggle={handleToggleStrategy}
                    onVolumeFactorChange={handleVolumeFactorChange}
                    minimalProfitFactor={minimalProfitFactor}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
