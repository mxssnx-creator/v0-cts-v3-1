"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Package } from "lucide-react"
import { toast } from "sonner"

export function InstallSettings() {
  const handleCheckUpdates = () => {
    toast.info("Checking for updates...")
    setTimeout(() => {
      toast.success("You are running the latest version")
    }, 1000)
  }

  const handleViewLog = () => {
    toast.info("Opening installation log...")
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Installation & Updates</CardTitle>
          <CardDescription>Manage system installation and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Current Version</h3>
                <p className="text-sm text-muted-foreground">CTS v3.1.0</p>
              </div>
              <Button variant="outline" onClick={handleCheckUpdates}>
                <Download className="mr-2 h-4 w-4" />
                Check for Updates
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Package Information</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Release Date:</span>
                  <span>2024-01-15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build:</span>
                  <span>production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dependencies:</span>
                  <span>Up to date</span>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={handleViewLog}>
            <Package className="mr-2 h-4 w-4" />
            View Installation Log
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
