"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Database, 
  Play, 
  RefreshCw,
  AlertCircle,
  Server,
  Settings as SettingsIcon
} from "lucide-react"
import { toast } from "@/lib/simple-toast"

interface InstallStatus {
  isInstalled: boolean
  databaseConnected: boolean
  databaseType: string
  tableCount: number
  migrationsApplied: number
  error: string | null
}

export default function InstallManager() {
  const [status, setStatus] = useState<InstallStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installLog, setInstallLog] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("status")
  
  // Database configuration state
  const [dbType, setDbType] = useState<string>("sqlite")
  const [dbName, setDbName] = useState<string>("cts-v3-1")
  const [dbHost, setDbHost] = useState<string>("localhost")
  const [dbPort, setDbPort] = useState<string>("5432")
  const [dbUser, setDbUser] = useState<string>("postgres")
  const [dbPassword, setDbPassword] = useState<string>("")

  const loadStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/install/status")
      const data = await response.json()
      
      setStatus(data)
      
      // Set form defaults from current config
      if (data.databaseType) {
        setDbType(data.databaseType)
      }
    } catch (error) {
      console.error("[v0] Error loading install status:", error)
      toast.error("Failed to check installation status")
    } finally {
      setLoading(false)
    }
  }
  
  const testConnection = async () => {
    try {
      let databaseUrl = ""
      
      if (dbType === "postgresql") {
        databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
      }

      const response = await fetch("/api/install/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType: dbType,
          databaseUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Connection test failed")
      }

      toast.success("Database connection successful!")
    } catch (error) {
      console.error("Connection test error:", error)
      toast.error(error instanceof Error ? error.message : "Connection failed")
    }
  }
  
  const configureDatabase = async () => {
    try {
      let databaseUrl = ""
      
      if (dbType === "postgresql") {
        databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
      }

      const response = await fetch("/api/install/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseType: dbType,
          databaseUrl,
          databaseName: dbName,
          host: dbHost,
          port: parseInt(dbPort),
          username: dbUser,
          password: dbPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Configuration failed")
      }

      toast.success("Database configured successfully!")
      await loadStatus()
      setActiveTab("status")
    } catch (error) {
      console.error("Configure error:", error)
      toast.error(error instanceof Error ? error.message : "Configuration failed")
    }
  }

  const runInstallation = async () => {
    setInstalling(true)
    setInstallLog([])
    
    try {
      setInstallLog(prev => [...prev, "Starting database installation..."])
      
      const response = await fetch("/api/install/initialize", {
        method: "POST",
      })
      
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [
          ...prev,
          `✓ Migrations: ${data.applied} applied, ${data.skipped} skipped`,
          "✓ Database initialized successfully",
          "✓ System ready for use"
        ])
        toast.success("Database installed successfully!")
        
        // Reload status after 1 second
        setTimeout(() => {
          loadStatus()
        }, 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Installation failed")
      }
    } catch (error) {
      console.error("[v0] Installation error:", error)
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Installation failed"}`])
      toast.error("Installation failed")
    } finally {
      setInstalling(false)
    }
  }

  const forceReinitialize = async () => {
    if (!confirm("⚠️ WARNING: This will DROP ALL TABLES and recreate them. All data will be permanently lost. Are you absolutely sure?")) {
      return
    }
    
    setInstalling(true)
    setInstallLog([])
    
    try {
      setInstallLog(prev => [...prev, "⚠️ Dropping all existing tables..."])
      
      const response = await fetch("/api/admin/force-reinit", {
        method: "POST",
      })
      
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [
          ...prev,
          `✓ Dropped ${data.tablesDropped} tables`,
          `✓ Created ${data.tablesCreated} tables`,
          `✓ Duration: ${data.duration}ms`,
          "✓ Database fully reinitialized",
          "✓ System ready for use"
        ])
        toast.success(`Database reinitialized: ${data.tablesCreated} tables created`)
        
        // Reload status after 1 second
        setTimeout(() => {
          loadStatus()
        }, 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Reinitialization failed")
      }
    } catch (error) {
      console.error("[v0] Reinit error:", error)
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Reinitialization failed"}`])
      toast.error("Reinitialization failed")
    } finally {
      setInstalling(false)
    }
  }

  const quickReinit = async () => {
    setInstalling(true)
    setInstallLog(["Starting quick reinitialization..."])
    
    try {
      const response = await fetch("/api/admin/reinit-db", { method: "POST" })
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [...prev, `✓ Tables: ${data.tables}`, `✓ ${data.message}`])
        toast.success("Database updated successfully")
        setTimeout(() => loadStatus(), 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Quick reinit failed")
      }
    } catch (error) {
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Failed"}`])
      toast.error("Quick reinit failed")
    } finally {
      setInstalling(false)
    }
  }

  const runMigrations = async () => {
    setInstalling(true)
    setInstallLog(["Running migrations..."])
    
    try {
      const response = await fetch("/api/admin/run-migrations", { method: "POST" })
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [
          ...prev,
          `✓ Applied: ${data.applied}`,
          `✓ Skipped: ${data.skipped}`,
          `✓ Failed: ${data.failed}`,
          `✓ ${data.message}`
        ])
        toast.success(`Migrations complete: ${data.applied} applied`)
        setTimeout(() => loadStatus(), 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Migrations failed")
      }
    } catch (error) {
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Failed"}`])
      toast.error("Migrations failed")
    } finally {
      setInstalling(false)
    }
  }

  const directInit = async () => {
    if (!confirm("This will execute the SQL file directly. Continue?")) return
    
    setInstalling(true)
    setInstallLog(["Executing direct initialization..."])
    
    try {
      const response = await fetch("/api/admin/init-database-direct", { method: "POST" })
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [...prev, `✓ Tables: ${data.tables}`, `✓ ${data.message}`])
        toast.success("Direct initialization complete")
        setTimeout(() => loadStatus(), 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Direct init failed")
      }
    } catch (error) {
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Failed"}`])
      toast.error("Direct init failed")
    } finally {
      setInstalling(false)
    }
  }

  const resetAndInit = async () => {
    if (!confirm("⚠️ This will DROP ALL TABLES and recreate them. All data will be lost. Continue?")) return
    
    setInstalling(true)
    setInstallLog(["⚠️ Resetting database..."])
    
    try {
      const response = await fetch("/api/admin/reset-and-init", { method: "POST" })
      const data = await response.json()
      
      if (data.success) {
        setInstallLog(prev => [...prev, `✓ ${data.message}`])
        toast.success("Database reset complete")
        setTimeout(() => loadStatus(), 1000)
      } else {
        setInstallLog(prev => [...prev, `✗ Error: ${data.error}`])
        toast.error(data.error || "Reset failed")
      }
    } catch (error) {
      setInstallLog(prev => [...prev, `✗ Error: ${error instanceof Error ? error.message : "Failed"}`])
      toast.error("Reset failed")
    } finally {
      setInstalling(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Installation</CardTitle>
          <CardDescription>Checking installation status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Installation</CardTitle>
          <CardDescription>Unable to check status</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to check installation status. Please try refreshing the page.
            </AlertDescription>
          </Alert>
          <Button onClick={loadStatus} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Status & Install</TabsTrigger>
          <TabsTrigger value="configure">Database Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Database Installation</CardTitle>
                  <CardDescription>Initialize and configure the database system</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading || installing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  {status.isInstalled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Installation Status</p>
                    <p className="text-sm text-muted-foreground">
                      {status.isInstalled ? "Installed" : "Not Installed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  {status.databaseConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Database Connection</p>
                    <p className="text-sm text-muted-foreground">
                      {status.databaseConnected ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Database Type</p>
                    <p className="text-sm text-muted-foreground capitalize">{status.databaseType}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span>Tables Created</span>
                    <Badge variant={status.tableCount > 0 ? "default" : "secondary"}>
                      {status.tableCount} tables
                    </Badge>
                  </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>Migrations Applied</span>
                <Badge variant={status.migrationsApplied > 0 ? "default" : "secondary"}>
                  {status.migrationsApplied} migrations
                </Badge>
              </div>
                </div>
              </div>

              {/* Error Display */}
              {status.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              )}

          {/* Installation Action */}
          {!status.isInstalled && (
            <Alert>
              <Server className="h-4 w-4" />
              <AlertDescription>
                The database is not installed. Click the button below to initialize the database with all required
                tables, indexes, and migrations.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Primary Installation */}
            <div className="flex gap-2">
              <Button
                onClick={runInstallation}
                disabled={installing || (status.isInstalled && status.databaseConnected)}
                className="flex-1"
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : status.isInstalled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Already Installed
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Initialize Database
                  </>
                )}
              </Button>
              
              {status.isInstalled && (
                <>
                  <Button onClick={runMigrations} variant="default" disabled={installing}>
                    {installing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Run Migrations
                      </>
                    )}
                  </Button>
                  <Button onClick={runInstallation} variant="outline" disabled={installing}>
                    {installing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reinstalling...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reinstall
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Migration Tools - Only show when installed */}
            {status.isInstalled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Migration Tools</h4>
                  <Badge variant="secondary" className="text-xs">Advanced</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={quickReinit} disabled={installing} size="sm" variant="default">
                    {installing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                    Quick Reinit
                  </Button>
                  <Button onClick={runMigrations} disabled={installing} size="sm" variant="outline">
                    {installing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Play className="h-3 w-3 mr-1.5" />}
                    Run Migrations
                  </Button>
                  <Button onClick={directInit} disabled={installing} size="sm" variant="secondary">
                    {installing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Database className="h-3 w-3 mr-1.5" />}
                    Direct Init
                  </Button>
                  <Button onClick={resetAndInit} disabled={installing} size="sm" variant="destructive">
                    {installing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <AlertCircle className="h-3 w-3 mr-1.5" />}
                    Reset All
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                  <p><strong>Quick Reinit:</strong> Re-executes SQL file to add missing tables (recommended)</p>
                  <p><strong>Run Migrations:</strong> Executes migrations with tracking</p>
                  <p><strong>Direct Init:</strong> Full SQLite batch initialization</p>
                  <p><strong>Reset All:</strong> Drops all tables then recreates (⚠️ loses data)</p>
                </div>
              </div>
            )}
          </div>

              {/* Installation Log */}
              {installLog.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Installation Log</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-1 text-sm font-mono max-h-48 overflow-y-auto">
                    {installLog.map((log, i) => (
                      <div key={i} className={log.startsWith("✓") ? "text-green-600" : log.startsWith("✗") ? "text-red-600" : ""}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Configure your database connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Database Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <Select value={dbType} onValueChange={setDbType}>
                  <SelectTrigger id="db-type">
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlite">SQLite (Local Development)</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL (Production)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {dbType === "sqlite" 
                    ? "SQLite stores data locally in a file. Perfect for development and single-server deployments."
                    : "PostgreSQL is recommended for production environments with multiple servers or high traffic."}
                </p>
              </div>

              {/* PostgreSQL Configuration */}
              {dbType === "postgresql" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input
                        id="db-host"
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-port">Port</Label>
                      <Input
                        id="db-port"
                        type="text"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="5432"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-name">Database Name</Label>
                    <Input
                      id="db-name"
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="cts-v3-1"
                    />
                    <p className="text-sm text-muted-foreground">
                      The database must already exist. Create it using: CREATE DATABASE "{dbName}";
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-user">Username</Label>
                    <Input
                      id="db-user"
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="postgres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-password">Password</Label>
                    <Input
                      id="db-password"
                      type="password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      placeholder="Enter database password"
                    />
                  </div>

                  {/* Connection String Preview */}
                  <div className="space-y-2">
                    <Label>Connection String</Label>
                    <div className="p-3 bg-muted/50 rounded-md text-sm font-mono break-all">
                      {dbPassword 
                        ? `postgresql://${dbUser}:****@${dbHost}:${dbPort}/${dbName}`
                        : `postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName}`
                      }
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <Button variant="outline" onClick={testConnection} className="w-full bg-transparent">
                    <Database className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              )}

              {/* SQLite Info */}
              {dbType === "sqlite" && (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    SQLite will automatically create a database file at <code className="text-xs bg-muted px-1 py-0.5 rounded">./data/cts.db</code>
                    <br />
                    No additional configuration is needed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Save Configuration */}
              <div className="flex gap-2">
                <Button onClick={configureDatabase} className="flex-1">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("status")}>
                  Cancel
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Note:</strong> After changing the database configuration, you'll need to run the installation process to create all tables and apply migrations.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Installation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Guide</CardTitle>
          <CardDescription>What happens during database initialization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium">Create Database Schema</p>
              <p className="text-muted-foreground">All 25+ tables with proper indexes and constraints</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium">Run Migrations</p>
              <p className="text-muted-foreground">Apply all database migrations and updates</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium">Initialize Defaults</p>
              <p className="text-muted-foreground">Set up default settings and configurations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              4
            </div>
            <div>
              <p className="font-medium">Verify Installation</p>
              <p className="text-muted-foreground">Check all tables and indexes are created correctly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
