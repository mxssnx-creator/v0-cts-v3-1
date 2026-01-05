"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, PlayCircle, StopCircle, RefreshCw, Database, Activity } from "lucide-react"

interface ThresholdConfig {
  basePositionLimit: number
  mainPositionLimit: number
  realPositionLimit: number
  presetPositionLimit: number
  optimalPositionLimit: number
  autoPositionLimit: number
  adxDatabaseLength: number
  thresholdPercent: number
  maxDatabaseSizeGB: number
}

interface PositionStats {
  tableName: string
  currentCount: number
  limit: number
  storageLimit: number
  utilizationPercent: number
  status: "optimal" | "warning" | "critical"
}

export function ThresholdManagement() {
  const [config, setConfig] = useState<ThresholdConfig>({
    basePositionLimit: 250,
    mainPositionLimit: 250,
    realPositionLimit: 250,
    presetPositionLimit: 500,
    optimalPositionLimit: 300,
    autoPositionLimit: 300,
    adxDatabaseLength: 10000,
    thresholdPercent: 20,
    maxDatabaseSizeGB: 20,
  })

  const [stats, setStats] = useState<PositionStats[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/system/threshold-config")
      const data = await response.json()
      setConfig(data.config)
      setIsMonitoring(data.isMonitoring)
    } catch (error) {
      console.error("Failed to load threshold config:", error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/system/threshold-stats")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  useEffect(() => {
    loadConfig()
    loadStats()
    const interval = setInterval(loadStats, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  const saveConfig = async () => {
    setLoading(true)
    try {
      await fetch("/api/system/threshold-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      await loadConfig()
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMonitoring = async () => {
    setLoading(true)
    try {
      await fetch("/api/system/threshold-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isMonitoring ? "stop" : "start" }),
      })
      await loadConfig()
    } catch (error) {
      console.error("Failed to toggle monitoring:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerCleanup = async () => {
    setLoading(true)
    try {
      await fetch("/api/system/threshold-cleanup", { method: "POST" })
      await loadStats()
    } catch (error) {
      console.error("Failed to trigger cleanup:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Position Threshold Manager
              </CardTitle>
              <CardDescription>
                Automatic database cleanup and position limit management with {config.thresholdPercent}% buffer
              </CardDescription>
            </div>
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Monitoring Active" : "Monitoring Stopped"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={toggleMonitoring} disabled={loading} variant={isMonitoring ? "destructive" : "default"}>
              {isMonitoring ? (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
            <Button onClick={triggerCleanup} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Manual Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Table Statistics</CardTitle>
          <CardDescription>Current utilization across all position types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.tableName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stat.status)}
                    <span className="font-medium">{stat.tableName.replace(/_/g, " ").toUpperCase()}</span>
                  </div>
                  <span className={`text-sm ${getStatusColor(stat.status)}`}>
                    {stat.currentCount} / {stat.storageLimit} ({stat.utilizationPercent}%)
                  </span>
                </div>
                <Progress value={stat.utilizationPercent} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Base Limit: {stat.limit} | Storage Limit: {stat.storageLimit}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Limits Configuration</CardTitle>
          <CardDescription>Set maximum positions per configuration type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="baseLimit">Base Pseudo Positions</Label>
              <Input
                id="baseLimit"
                type="number"
                value={config.basePositionLimit}
                onChange={(e) => setConfig({ ...config, basePositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum base layer positions (default: 250)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainLimit">Main Pseudo Positions</Label>
              <Input
                id="mainLimit"
                type="number"
                value={config.mainPositionLimit}
                onChange={(e) => setConfig({ ...config, mainPositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum main layer positions (default: 250)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="realLimit">Real Pseudo Positions</Label>
              <Input
                id="realLimit"
                type="number"
                value={config.realPositionLimit}
                onChange={(e) => setConfig({ ...config, realPositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum real positions (default: 250)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="presetLimit">Preset Positions</Label>
              <Input
                id="presetLimit"
                type="number"
                value={config.presetPositionLimit}
                onChange={(e) => setConfig({ ...config, presetPositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum preset positions (default: 500)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optimalLimit">Optimal Positions</Label>
              <Input
                id="optimalLimit"
                type="number"
                value={config.optimalPositionLimit}
                onChange={(e) => setConfig({ ...config, optimalPositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum optimal positions (default: 300)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoLimit">Auto Positions</Label>
              <Input
                id="autoLimit"
                type="number"
                value={config.autoPositionLimit}
                onChange={(e) => setConfig({ ...config, autoPositionLimit: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum auto positions (default: 300)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thresholdPercent">Threshold Buffer (%)</Label>
              <Input
                id="thresholdPercent"
                type="number"
                value={config.thresholdPercent}
                onChange={(e) => setConfig({ ...config, thresholdPercent: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Storage buffer before cleanup (default: 20%)
                <br />
                Example: 250 limit + 20% = 300 storage limit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adxLength">ADX Data Retention</Label>
              <Input
                id="adxLength"
                type="number"
                value={config.adxDatabaseLength}
                onChange={(e) => setConfig({ ...config, adxDatabaseLength: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum ADX records (default: 10000)</p>
            </div>
          </div>

          <Button onClick={saveConfig} disabled={loading} className="mt-6">
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { ThresholdManagement as ThresholdManager }
