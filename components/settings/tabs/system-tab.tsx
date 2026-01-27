"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Info } from "lucide-react"
import { StatisticsOverview } from "@/components/settings/statistics-overview"

interface SystemTabProps {
  settings: any
  handleSettingChange: (key: string, value: any) => void
  databaseChanged: boolean
}

export function SystemTab({ settings, handleSettingChange, databaseChanged }: SystemTabProps) {
  return (
    <Tabs defaultValue="system" className="space-y-4">
      <TabsContent value="system" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Core system settings, database management, and application logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Database Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Select database type and configuration. Changes require system restart.
              </p>

              {databaseChanged && (
                <div className="p-3 border border-orange-500 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Database type change detected. Click "Save Changes" to apply and restart system.
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select
                    value={settings.database_type}
                    onValueChange={(value) => handleSettingChange("database_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select database type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqlite">
                        <div className="flex flex-col">
                          <span>SQLite (Local)</span>
                          <span className="text-xs text-muted-foreground">File-based, no setup required</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="postgresql">
                        <div className="flex flex-col">
                          <span>PostgreSQL (Local)</span>
                          <span className="text-xs text-muted-foreground">Local PostgreSQL server</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="remote">
                        <div className="flex flex-col">
                          <span>PostgreSQL (Remote)</span>
                          <span className="text-xs text-muted-foreground">Remote PostgreSQL server</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>SQLite:</strong> Default, perfect for development and single server deployments.
                    <br />
                    <strong>Local PostgreSQL:</strong> For production use with local PostgreSQL installation.
                    <br />
                    <strong>Remote PostgreSQL:</strong> For production use with remote database (e.g., Vercel Postgres).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Database Status</Label>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-sm">
                      <strong>Current Type:</strong> {settings.database_type || "sqlite"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings.database_type === "sqlite" &&
                        "Using local SQLite database. No additional configuration required."}
                      {settings.database_type === "postgresql" &&
                        "Using local PostgreSQL. Ensure PostgreSQL service is running."}
                      {settings.database_type === "remote" &&
                        "Using remote PostgreSQL. Ensure REMOTE_POSTGRES_URL environment variable is set."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Data Retention Settings</h3>
              <p className="text-xs text-muted-foreground">Configure automatic cleanup of old data</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Market Data Retention (Days)</Label>
                  <Select
                    value={String(settings.market_data_retention_days || 30)}
                    onValueChange={(value) => handleSettingChange("market_data_retention_days", Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Historical market data older than this will be removed</p>
                </div>

                <div className="space-y-2">
                  <Label>Indication State Retention (Hours)</Label>
                  <Select
                    value={String(settings.indication_state_retention_hours || 48)}
                    onValueChange={(value) =>
                      handleSettingChange("indication_state_retention_hours", Number.parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Old indication states older than this will be removed</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Database Statistics</h3>
              <StatisticsOverview settings={settings} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
