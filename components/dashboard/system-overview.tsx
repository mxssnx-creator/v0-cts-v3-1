"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Zap,
  Database,
  type LucideIcon,
} from "lucide-react"

interface SystemOverviewProps {
  stats: {
    activeConnections: number
    totalPositions: number
    dailyPnL: number
    totalBalance: number
    indicationsActive: number
    strategiesActive: number
    systemLoad: number
    databaseSize: number
  }
}

const iconMap: Record<string, LucideIcon> = {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Zap,
  Database,
}

export function SystemOverview({ stats }: SystemOverviewProps) {
  const compactStats = [
    {
      title: "Connections",
      value: stats.activeConnections,
      icon: "Activity",
      color: "text-blue-600",
    },
    {
      title: "Positions",
      value: stats.totalPositions,
      icon: "BarChart3",
      color: "text-green-600",
    },
    {
      title: "Daily P&L",
      value: `$${stats.dailyPnL.toFixed(2)}`,
      icon: stats.dailyPnL >= 0 ? "TrendingUp" : "TrendingDown",
      color: stats.dailyPnL >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Balance",
      value: `$${stats.totalBalance.toFixed(2)}`,
      icon: "DollarSign",
      color: "text-purple-600",
    },
    {
      title: "Indications",
      value: stats.indicationsActive,
      icon: "Zap",
      color: "text-orange-600",
    },
    {
      title: "Strategies",
      value: stats.strategiesActive,
      icon: "BarChart3",
      color: "text-cyan-600",
    },
    {
      title: "Load",
      value: `${stats.systemLoad}%`,
      icon: "Activity",
      color: stats.systemLoad > 80 ? "text-red-600" : "text-yellow-600",
    },
    {
      title: "DB",
      value: `${stats.databaseSize}MB`,
      icon: "Database",
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="space-y-3">
      {/* Trading Overview */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Trading</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {compactStats.slice(0, 4).map((stat, index) => {
            const Icon = iconMap[stat.icon]
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-base font-bold truncate">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* System Status */}
      <div>
        <h3 className="text-sm font-semibold mb-2">System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {compactStats.slice(4, 8).map((stat, index) => {
            const Icon = iconMap[stat.icon]
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-base font-bold truncate">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>CPU</span>
              <span>{stats.systemLoad}%</span>
            </div>
            <Progress value={stats.systemLoad} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Memory</span>
              <span>65%</span>
            </div>
            <Progress value={65} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Database</span>
              <span>42%</span>
            </div>
            <Progress value={42} className="h-1" />
          </div>

          <div className="flex gap-1 pt-1 flex-wrap">
            <Badge variant="outline" className="text-green-600 text-xs py-1">
              Trade: Online
            </Badge>
            <Badge variant="outline" className="text-green-600 text-xs py-1">
              Web: Online
            </Badge>
            <Badge variant="outline" className="text-blue-600 text-xs py-1">
              DB: Healthy
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
