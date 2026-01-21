"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function InstallSettingsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Installation & Setup</h1>
                <p className="text-xs text-muted-foreground">System installation and configuration tools</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation Wizard</CardTitle>
              <CardDescription>Run the setup wizard to configure your trading system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The installation wizard will guide you through the initial setup process, including exchange
                  connections, strategy configuration, and system preferences.
                </p>
                <Button variant="outline">Run Installation Wizard</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>View current system configuration and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Version:</span>
                  <span className="font-medium">v3.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installation Date:</span>
                  <span className="font-medium">January 21, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Configuration Status:</span>
                  <span className="font-medium text-green-600">Complete</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
