"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Globe,
  Settings2,
  TrendingUp,
  Activity,
  FileText,
  ArrowRight,
  BarChart3,
  Network,
  Shield,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: "Exchange Connections",
      description: "Manage API connections to exchanges",
      icon: Globe,
      href: "/settings/overall/connection",
      badge: "Essential",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Main Indications",
      description: "Configure primary indication types and parameters",
      icon: TrendingUp,
      href: "/settings/indications/main",
      badge: "Core",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Common Indications",
      description: "Shared indication settings across strategies",
      icon: Settings2,
      href: "/settings/indications/common",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Auto Indications",
      description: "Automated indication generation and management",
      icon: Activity,
      href: "/settings/indications/auto",
      badge: "Advanced",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Optimal Settings",
      description: "Optimized parameters for maximum performance",
      icon: BarChart3,
      href: "/settings/indications/optimal",
      badge: "Pro",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Database Settings",
      description: "Configure database connection and optimization",
      icon: Database,
      href: "/settings/database",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "System Logs",
      description: "View and manage system logs and monitoring",
      icon: FileText,
      href: "/monitoring",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Network Config",
      description: "Configure network and API settings",
      icon: Network,
      href: "/settings/network",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Security",
      description: "Manage authentication and security settings",
      icon: Shield,
      href: "/settings/security",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings, exchange connections, and trading parameters
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Status</CardDescription>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <CardTitle className="text-xl">Online</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Connections</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Running Strategies</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-xl text-green-600">Good</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Settings Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          return (
            <Link key={category.href} href={category.href}>
              <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${category.bgColor}`}>
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    {category.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {category.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 flex items-center justify-between">
                    {category.title}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common configuration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/settings/overall/connection">
                <Globe className="mr-2 h-4 w-4" />
                Add Connection
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/monitoring">
                <FileText className="mr-2 h-4 w-4" />
                View Logs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/indications/main">
                <Settings2 className="mr-2 h-4 w-4" />
                Configure Indications
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/api/system/integrity-check">
                <Activity className="mr-2 h-4 w-4" />
                System Health Check
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current configuration and environment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Environment</p>
              <p className="font-medium">{process.env.NODE_ENV || "production"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Database Type</p>
              <p className="font-medium">PostgreSQL</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Version</p>
              <p className="font-medium">v3.1</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Build</p>
              <p className="font-medium">Production</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
