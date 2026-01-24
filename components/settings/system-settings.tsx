"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database, Server, HardDrive, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface SystemInfo {
  databaseType: string
  databaseConnected: boolean
  tableCount: number
  migrationsApplied: number
  isInstalled: boolean
}

interface SystemSettingsProps {
  systemInfo: SystemInfo
  onRefresh: () => void
  onRunMigrations: () => void
}

export function SystemSettings({ systemInfo, onRefresh, onRunMigrations }: SystemSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Status</h3>
        <p className="text-xs text-muted-foreground">
          View database status and run migrations if needed
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Database Type</p>
              <p className="text-2xl font-bold">{systemInfo.databaseType || "Unknown"}</p>
              <Badge variant={systemInfo.databaseConnected ? "default" : "destructive"}>
                {systemInfo.databaseConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Tables Created</p>
              <p className="text-2xl font-bold">{systemInfo.tableCount}</p>
              <p className="text-xs text-muted-foreground">Database tables</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Migrations Applied</p>
              <p className="text-2xl font-bold">{systemInfo.migrationsApplied}</p>
              <p className="text-xs text-muted-foreground">SQL migrations</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Installation Status</p>
              <p className="text-2xl font-bold">{systemInfo.isInstalled ? "Ready" : "Pending"}</p>
              <Badge variant={systemInfo.isInstalled ? "default" : "secondary"}>
                {systemInfo.isInstalled ? "Installed" : "Not Installed"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Database Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button variant="outline" onClick={onRunMigrations}>
            <Database className="h-4 w-4 mr-2" />
            Run Migrations
          </Button>
        </div>
      </div>
    </div>
  )
}
