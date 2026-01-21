"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import AuthGuard from "@/components/auth-guard"
import MainStrategySettings from "@/components/settings/strategy/main-strategy-settings"
import BaseStrategySettings from "@/components/settings/strategy/base-strategy-settings"
import RealStrategySettings from "@/components/settings/strategy/real-strategy-settings"

export default function StrategySettingsPage() {
  const [activeTab, setActiveTab] = useState("main")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    // Strategy settings with defaults
    tradeMode: "both",
    stepRelationMinRatio: 0.5,
    stepRelationMaxRatio: 2.0,
    baseStopLossPercentage: 5,
    baseTakeProfitPercentage: 10,
    mainStopLossPercentage: 3,
    mainTakeProfitPercentage: 8,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/strategy")
      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved", {
          description: "Strategy settings have been saved successfully.",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Strategy Settings</h1>
                <p className="text-xs text-muted-foreground">Configure trading strategy parameters</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="real">Real</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-6">
              <MainStrategySettings settings={settings} handleSettingChange={handleSettingChange} />
            </TabsContent>

            <TabsContent value="base" className="mt-6">
              <BaseStrategySettings settings={settings} handleSettingChange={handleSettingChange} />
            </TabsContent>

            <TabsContent value="real" className="mt-6">
              <RealStrategySettings settings={settings} handleSettingChange={handleSettingChange} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
