"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IndicationBar } from "@/components/indications/indication-bar"
import { IndicationFilters as Filters } from "@/components/indications/indication-filters"
import { Activity, TrendingUp, BarChart3, Settings, RefreshCw } from "lucide-react"
import { toast } from "@/lib/simple-toast"

interface Indication {
  id: string
  symbol: string
  type: string
  range: number
  profitFactor: number
  isActive: boolean
  subConfigurations?: Array<{
    trailingEnabled: boolean
    blockEnabled: boolean
    dcaEnabled: boolean
  }>
}

interface IndicationFilters {
  type: string[]
  rangeMin: number
  rangeMax: number
  profitFactorMin: number
  symbolFilter: string
  trailingFilter: "no" | "yes" | "only"
  adjustBlock: "no" | "yes" | "only"
  adjustDca: "no" | "yes" | "only"
  activeOnly: boolean
}

export default function IndicationsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [minimalProfitFactor, setMinimalProfitFactor] = useState(0.5)
  const [filters, setFilters] = useState<IndicationFilters>({
    type: [],
    rangeMin: 3,
    rangeMax: 30,
    profitFactorMin: 0.5,
    symbolFilter: "",
    trailingFilter: "no",
    adjustBlock: "no",
    adjustDca: "no",
    activeOnly: false,
  })

  const [indications, setIndications] = useState<Indication[]>([])

  useEffect(() => {
    const loadIndications = async () => {
      try {
        const response = await fetch("/api/indications")
        if (response.ok) {
          const data = await response.json()
          setIndications(data.indications || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load indications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadIndications()
  }, [])

  const handleToggleIndication = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/indications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })

      if (response.ok) {
        setIndications((prev) => prev.map((ind) => (ind.id === id ? { ...ind, isActive: active } : ind)))
        toast.success(`Indication ${active ? "activated" : "deactivated"}`)
      } else {
        toast.error("Failed to update indication")
      }
    } catch (error) {
      console.error("[v0] Failed to toggle indication:", error)
      toast.error("Failed to update indication")
    }
  }

  const filteredIndications = indications.filter((indication) => {
    if (filters.type.length > 0 && !filters.type.includes(indication.type)) return false
    if (indication.range < filters.rangeMin || indication.range > filters.rangeMax) return false
    if (indication.profitFactor < filters.profitFactorMin) return false
    if (filters.symbolFilter && !indication.symbol.toLowerCase().includes(filters.symbolFilter.toLowerCase()))
      return false
    if (filters.activeOnly && !indication.isActive) return false

    const hasTrailing = indication.subConfigurations?.some((sub: { trailingEnabled: boolean }) => sub.trailingEnabled)
    const hasBlock = indication.subConfigurations?.some((sub: { blockEnabled: boolean }) => sub.blockEnabled)
    const hasDca = indication.subConfigurations?.some((sub: { dcaEnabled: boolean }) => sub.dcaEnabled)

    if (filters.trailingFilter === "only" && !hasTrailing) return false
    if (filters.trailingFilter === "yes" && hasTrailing) return true
    if (filters.trailingFilter === "no" && hasTrailing) return false

    if (filters.adjustBlock === "only" && !hasBlock) return false
    if (filters.adjustBlock === "yes" && hasBlock) return true
    if (filters.adjustBlock === "no" && hasBlock) return false

    if (filters.adjustDca === "only" && !hasDca) return false
    if (filters.adjustDca === "yes" && hasDca) return true
    if (filters.adjustDca === "no" && hasDca) return false

    return true
  })

  const activeIndications = indications.filter((ind) => ind.isActive)
  const profitableIndications = indications.filter((ind) => ind.profitFactor >= minimalProfitFactor)

  const stats = {
    total: indications.length,
    active: activeIndications.length,
    profitable: profitableIndications.length,
    avgProfitFactor: indications.reduce((sum, ind) => sum + ind.profitFactor, 0) / indications.length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading indications...</div>
        </div>
      </div>
    )
  }

  if (indications.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Indications Available</h3>
          <p className="text-muted-foreground mb-4">Configure indications in Settings to start trading.</p>
          <Button onClick={() => (window.location.href = "/settings")}>Go to Settings</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Indications</h1>
          <p className="text-muted-foreground">Configure and monitor trading indications</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Indications</div>
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
              <TrendingUp className="h-5 w-5 text-purple-500" />
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
              <Settings className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgProfitFactor.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Avg Profit Factor</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Filters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Indications List */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="active">Active ({activeIndications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredIndications.length} of {indications.length} indications
                  </span>
                  <Badge variant="outline">Min Profit Factor: {minimalProfitFactor}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {filteredIndications.map((indication) => (
                  <IndicationBar
                    key={indication.id}
                    indication={indication}
                    onToggle={handleToggleIndication}
                    minimalProfitFactor={minimalProfitFactor}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="space-y-3">
                {activeIndications.map((indication) => (
                  <IndicationBar
                    key={indication.id}
                    indication={indication}
                    onToggle={handleToggleIndication}
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
