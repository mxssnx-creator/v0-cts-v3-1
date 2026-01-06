"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Activity, Clock, Zap } from "lucide-react"
import { toast } from "sonner"

interface EngineStatus {
  running: boolean
  paused: boolean
  connectedExchanges: number
  activePositions: number
  totalProfit: number
  uptime: number
  lastUpdate: Date
  cycleStats?: {
    mainEngineCycleCount: number
    presetEngineCycleCount: number
    activeOrderCycleCount: number
    avgMainCycleDuration: number
    avgPresetCycleDuration: number
    avgOrderCycleDuration: number
  }
}

export function GlobalTradeEngineControls() {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/trade-engine/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load engine status:", error)
    }
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const response = await fetch("/api/trade-engine/start", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success("Global Trade Engine started successfully")
        await loadStatus()
      } else {
        toast.error(data.error || "Failed to start engine")
      }
    } catch (error) {
      toast.error("Failed to start engine")
      console.error("[v0] Error starting engine:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const handlePause = async () => {
    setIsPausing(true)
    try {
      const response = await fetch("/api/trade-engine/pause", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success("Global Trade Engine paused")
        await loadStatus()
      } else {
        toast.error(data.error || "Failed to pause engine")
      }
    } catch (error) {
      toast.error("Failed to pause engine")
      console.error("[v0] Error pausing engine:", error)
    } finally {
      setIsPausing(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const response = await fetch("/api/trade-engine/resume", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success("Global Trade Engine resumed")
        await loadStatus()
      } else {
        toast.error(data.error || "Failed to resume engine")
      }
    } catch (error) {
      toast.error("Failed to resume engine")
      console.error("[v0] Error resuming engine:", error)
    } finally {
      setIsResuming(false)
    }
  }

  const handleStop = async () => {
    setIsStopping(true)
    try {
      const response = await fetch("/api/trade-engine/stop", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success("Global Trade Engine stopped")
        await loadStatus()
      } else {
        toast.error(data.error || "Failed to stop engine")
      }
    } catch (error) {
      toast.error("Failed to stop engine")
      console.error("[v0] Error stopping engine:", error)
    } finally {
      setIsStopping(false)
    }
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusBadge = () => {
    if (!status) return <Badge variant="outline">Unknown</Badge>
    if (!status.running) return <Badge variant="secondary">Stopped</Badge>
    if (status.paused)
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
          Paused
        </Badge>
      )
    return (
      <Badge variant="default" className="bg-green-500/10 text-green-600">
        Running
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Global Trade Engine
            </CardTitle>
            <CardDescription>Coordinate all trading operations</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Connected Exchanges</p>
            <p className="text-2xl font-bold">{status?.connectedExchanges || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Active Positions</p>
            <p className="text-2xl font-bold">{status?.activePositions || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold">${status?.totalProfit?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{status?.uptime ? formatUptime(status.uptime) : "0s"}</p>
          </div>
        </div>

        {/* Cycle Statistics */}
        {status?.cycleStats && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Cycle Performance
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Main Engine</p>
                <p className="text-sm font-medium">{status.cycleStats.mainEngineCycleCount} cycles</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {status.cycleStats.avgMainCycleDuration.toFixed(0)}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preset Engine</p>
                <p className="text-sm font-medium">{status.cycleStats.presetEngineCycleCount} cycles</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {status.cycleStats.avgPresetCycleDuration.toFixed(0)}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Order Handler</p>
                <p className="text-sm font-medium">{status.cycleStats.activeOrderCycleCount} cycles</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {status.cycleStats.avgOrderCycleDuration.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {!status?.running && (
            <Button onClick={handleStart} disabled={isStarting} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {isStarting ? "Starting..." : "Start Engine"}
            </Button>
          )}

          {status?.running && !status?.paused && (
            <Button onClick={handlePause} disabled={isPausing} variant="outline" className="flex-1 bg-transparent">
              <Pause className="h-4 w-4 mr-2" />
              {isPausing ? "Pausing..." : "Pause"}
            </Button>
          )}

          {status?.running && status?.paused && (
            <Button onClick={handleResume} disabled={isResuming} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {isResuming ? "Resuming..." : "Resume"}
            </Button>
          )}

          {status?.running && (
            <Button onClick={handleStop} disabled={isStopping} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              {isStopping ? "Stopping..." : "Stop"}
            </Button>
          )}
        </div>

        {/* Last Update */}
        {status?.lastUpdate && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center pt-2">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(status.lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
