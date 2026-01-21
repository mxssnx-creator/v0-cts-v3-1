"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"
import { MainSettings } from "@/components/settings/overall/main-settings"
import { ConnectionSettings } from "@/components/settings/overall/connection-settings"
import { MonitoringSettings } from "@/components/settings/overall/monitoring-settings"
import { InstallSettings } from "@/components/settings/overall/install-settings"
import { BackupSettings } from "@/components/settings/overall/backup-settings"

export default function OverallSettingsPage() {
  const [activeTab, setActiveTab] = useState("main")

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Overall Settings</h1>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="install">Install</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-6">
              <MainSettings />
            </TabsContent>

            <TabsContent value="connection" className="mt-6">
              <ConnectionSettings />
            </TabsContent>

            <TabsContent value="monitoring" className="mt-6">
              <MonitoringSettings />
            </TabsContent>

            <TabsContent value="install" className="mt-6">
              <InstallSettings />
            </TabsContent>

            <TabsContent value="backup" className="mt-6">
              <BackupSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
