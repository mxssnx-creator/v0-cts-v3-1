"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Database } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function BackupSettings() {
  const [autoBackup, setAutoBackup] = useState("daily")

  const handleCreateBackup = () => {
    toast.success("Backup created successfully")
  }

  const handleRestore = () => {
    toast.success("Restore completed successfully")
  }

  const handleDownload = (type: string) => {
    toast.success(`Downloading ${type} backup...`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Manage system backups and data restoration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="autoBackup">Automatic Backup Frequency</Label>
            <Select value={autoBackup} onValueChange={setAutoBackup}>
              <SelectTrigger id="autoBackup">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Recent Backups</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Full Backup</p>
                    <p className="text-muted-foreground">2024-01-21 10:30 AM</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload("Full")}>
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Settings Only</p>
                    <p className="text-muted-foreground">2024-01-20 08:15 PM</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload("Settings")}>
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={handleCreateBackup}>
              <Database className="mr-2 h-4 w-4" />
              Create Backup Now
            </Button>
            <Button variant="outline" onClick={handleRestore}>
              <Upload className="mr-2 h-4 w-4" />
              Restore from Backup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
