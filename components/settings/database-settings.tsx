"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Database, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface DatabaseSettingsProps {
  settings: any
  onSettingsChange: (updates: any) => void
}

export function DatabaseSettings({ settings, onSettingsChange }: DatabaseSettingsProps) {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [migrations, setMigrations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/status")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      toast.error("Failed to check database status")
    } finally {
      setIsLoading(false)
    }
  }

  const runMigrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/migrate", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast.success(`Applied ${data.appliedCount || 0} migrations`)
        setMigrations(data.migrations || [])
        checkDatabaseStatus()
      } else {
        toast.error(data.message || "Migration failed")
      }
    } catch (error) {
      toast.error("Failed to run migrations")
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/init", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast.success("Database initialized successfully")
        checkDatabaseStatus()
      } else {
        toast.error(data.message || "Initialization failed")
      }
    } catch (error) {
      toast.error("Failed to initialize database")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Type</CardTitle>
          <CardDescription>Select the database system to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database_type">Database System</Label>
            <Select
              value={settings.database_type || "sqlite"}
              onValueChange={(value) => onSettingsChange({ database_type: value })}
            >
              <SelectTrigger id="database_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqlite">SQLite (Default)</SelectItem>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dbStatus && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              {dbStatus.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">{dbStatus.connected ? `Connected to ${dbStatus.type}` : "Not connected"}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {settings.database_type === "postgres" && (
        <Card>
          <CardHeader>
            <CardTitle>PostgreSQL Configuration</CardTitle>
            <CardDescription>Configure PostgreSQL connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pg_host">Host</Label>
              <Input
                id="pg_host"
                placeholder="localhost"
                value={settings.pg_host || ""}
                onChange={(e) => onSettingsChange({ pg_host: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg_port">Port</Label>
              <Input
                id="pg_port"
                type="number"
                placeholder="5432"
                value={settings.pg_port || ""}
                onChange={(e) => onSettingsChange({ pg_port: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg_database">Database Name</Label>
              <Input
                id="pg_database"
                placeholder="trading_system"
                value={settings.pg_database || ""}
                onChange={(e) => onSettingsChange({ pg_database: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg_user">Username</Label>
              <Input
                id="pg_user"
                placeholder="postgres"
                value={settings.pg_user || ""}
                onChange={(e) => onSettingsChange({ pg_user: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg_password">Password</Label>
              <Input
                id="pg_password"
                type="password"
                placeholder="********"
                value={settings.pg_password || ""}
                onChange={(e) => onSettingsChange({ pg_password: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>Initialize database and run migrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkDatabaseStatus} variant="outline" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Check Status
            </Button>

            <Button onClick={initializeDatabase} variant="outline" disabled={isLoading}>
              <Database className="mr-2 h-4 w-4" />
              Initialize
            </Button>

            <Button onClick={runMigrations} disabled={isLoading}>
              <Database className="mr-2 h-4 w-4" />
              Run Migrations
            </Button>
          </div>

          {migrations.length > 0 && (
            <div className="space-y-2">
              <Label>Applied Migrations ({migrations.length})</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {migrations.map((migration, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="flex-1">{migration.name || migration}</span>
                    <Badge variant="secondary" className="text-xs">
                      {migration.version || index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Settings</CardTitle>
          <CardDescription>Configure database performance parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxPseudoPositions">Max Pseudo Positions per Connection</Label>
            <Input
              id="maxPseudoPositions"
              type="number"
              value={settings.maxPseudoPositions || 1000}
              onChange={(e) => onSettingsChange({ maxPseudoPositions: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketDataRetention">Market Data Retention (days)</Label>
            <Input
              id="marketDataRetention"
              type="number"
              value={settings.marketDataRetention || 30}
              onChange={(e) => onSettingsChange({ marketDataRetention: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metricsRetention">Metrics Retention (days)</Label>
            <Input
              id="metricsRetention"
              type="number"
              value={settings.metricsRetention || 7}
              onChange={(e) => onSettingsChange({ metricsRetention: Number.parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
