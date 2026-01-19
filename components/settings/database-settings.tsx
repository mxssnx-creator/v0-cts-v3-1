"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DatabaseSettingsProps {
  settings: any
  onSettingsChange: (updates: any) => void
}

export function DatabaseSettings({ settings, onSettingsChange }: DatabaseSettingsProps) {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [migrations, setMigrations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [pendingDbType, setPendingDbType] = useState<string | null>(null)

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/status")
      const data = await response.json()
      setDbStatus(data)
      
      // Check if configured type doesn't match actual type
      if (data.configuredType && data.type && data.configuredType !== data.type) {
        toast.warning(`Database mismatch: Configured as ${data.configuredType} but running ${data.type}`)
      }
    } catch (error) {
      toast.error("Failed to check database status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDatabaseTypeChange = (newType: string) => {
    const currentType = dbStatus?.type || settings.database_type || "sqlite"
    
    if (newType !== currentType) {
      setPendingDbType(newType)
      setShowSwitchDialog(true)
    } else {
      onSettingsChange({ database_type: newType })
    }
  }

  const confirmDatabaseSwitch = async () => {
    if (!pendingDbType) return
    
    setIsSwitching(true)
    setShowSwitchDialog(false)
    
    try {
      toast.info(`Switching to ${pendingDbType}...`)
      
      const response = await fetch("/api/database/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          database_type: pendingDbType,
          pg_host: settings.pg_host,
          pg_port: settings.pg_port,
          pg_database: settings.pg_database,
          pg_user: settings.pg_user,
          pg_password: settings.pg_password
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Successfully switched to ${pendingDbType}. ${data.migrationsApplied} migrations applied.`)
        onSettingsChange({ database_type: pendingDbType })
        checkDatabaseStatus()
      } else {
        toast.error(data.message || "Failed to switch database")
      }
    } catch (error) {
      toast.error("Failed to switch database")
    } finally {
      setIsSwitching(false)
      setPendingDbType(null)
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
      {/* Database Switch Confirmation Dialog */}
      <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Database?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to switch from <strong>{dbStatus?.type || settings.database_type || "sqlite"}</strong> to{" "}
              <strong>{pendingDbType}</strong>. This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Close existing database connections</li>
                <li>Connect to the new database</li>
                <li>Run pending migrations</li>
                <li>May cause brief service interruption</li>
              </ul>
              {pendingDbType === "postgresql" && !settings.pg_host && (
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-yellow-800 dark:text-yellow-200 text-sm">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  PostgreSQL connection details not configured. Please fill in the connection settings below first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDatabaseSwitch} disabled={pendingDbType === "postgresql" && !settings.pg_host}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Switch Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Database Type</CardTitle>
          <CardDescription>Select and switch database system (changes take effect immediately)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database_type">Database System</Label>
            <Select
              value={settings.database_type || "sqlite"}
              onValueChange={handleDatabaseTypeChange}
              disabled={isSwitching}
            >
              <SelectTrigger id="database_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqlite">SQLite (Local)</SelectItem>
                <SelectItem value="postgresql">PostgreSQL (Remote)</SelectItem>
              </SelectContent>
            </Select>
            {isSwitching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Switching database...
              </div>
            )}
          </div>

          {dbStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              dbStatus.connected 
                ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" 
                : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
            }`}>
              {dbStatus.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {dbStatus.connected ? `Connected to ${dbStatus.type?.toUpperCase()}` : "Not connected"}
                </span>
                {dbStatus.details?.path && (
                  <p className="text-xs text-muted-foreground">Path: {dbStatus.details.path}</p>
                )}
                {dbStatus.details?.host && (
                  <p className="text-xs text-muted-foreground">Host: {dbStatus.details.host}/{dbStatus.details.database}</p>
                )}
              </div>
              <Badge variant={dbStatus.connected ? "default" : "destructive"}>
                {dbStatus.type?.toUpperCase() || "Unknown"}
              </Badge>
            </div>
          )}
          
          {dbStatus && !dbStatus.typeMatch && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">
                Configured as <strong>{dbStatus.configuredType}</strong> but running <strong>{dbStatus.type}</strong>.
                Click the database type above to switch.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(settings.database_type === "postgresql" || settings.database_type === "postgres") && (
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
