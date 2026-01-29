"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Download, RotateCcw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InstallPage() {
  const [isInstalling, setIsInstalling] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [installSteps, setInstallSteps] = useState<Array<{
    name: string
    completed: boolean
  }>>([
    { name: "Database initialization", completed: false },
    { name: "Tables creation", completed: false },
    { name: "Migrations execution", completed: false },
    { name: "System verification", completed: false },
  ])

  const handleCompleteInstall = async () => {
    setIsInstalling(true)
    setStatus("idle")
    const steps = [...installSteps]

    try {
      // Step 1: Initialize
      console.log("[v0] Starting installation...")
      steps[0].completed = true
      setInstallSteps([...steps])

      const initResponse = await fetch("/api/install/initialize", { method: "POST" })
      if (!initResponse.ok) {
        throw new Error("Failed to initialize database")
      }

      steps[1].completed = true
      setInstallSteps([...steps])

      // Step 2: Run migrations
      const migResponse = await fetch("/api/install/migrate", { method: "POST" })
      if (!migResponse.ok) {
        throw new Error("Failed to run migrations")
      }

      steps[2].completed = true
      steps[3].completed = true
      setInstallSteps([...steps])

      setStatus("success")
      setMessage("Installation completed successfully!")
      console.log("[v0] Installation complete")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Installation failed")
      console.error("[v0] Installation error:", error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDirectInit = async () => {
    setIsInstalling(true)
    setStatus("idle")
    try {
      console.log("[v0] Direct initialization...")
      const response = await fetch("/api/install/initialize", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Database initialized directly")
      } else {
        setStatus("error")
        setMessage(data.error || "Direct init failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error")
      console.error("[v0] Direct init error:", error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDirectReset = async () => {
    if (!confirm("This will delete all data. Are you sure?")) return

    setIsResetting(true)
    setStatus("idle")
    try {
      console.log("[v0] Direct reset...")
      const response = await fetch("/api/install/reset", { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Database reset successfully")
        setInstallSteps(installSteps.map(s => ({ ...s, completed: false })))
      } else {
        setStatus("error")
        setMessage(data.error || "Reset failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error")
      console.error("[v0] Reset error:", error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Installation & Setup</h1>
        <p className="text-muted-foreground mt-2">Initialize database and configure system</p>
      </div>

      {status !== "idle" && (
        <Alert variant={status === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{status === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quick-install" className="w-full">
        <TabsList>
          <TabsTrigger value="quick-install">Quick Install</TabsTrigger>
          <TabsTrigger value="direct-options">Direct Options</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-install" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Installation</CardTitle>
              <CardDescription>Set up everything in one go</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {installSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={step.completed ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleCompleteInstall}
                disabled={isInstalling || isMigrating}
                size="lg"
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Run Complete Installation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct-options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Control Options</CardTitle>
              <CardDescription>Execute specific initialization or reset commands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleDirectInit}
                disabled={isInstalling || isResetting}
                variant="default"
                size="lg"
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Direct Initialize
                  </>
                )}
              </Button>

              <Button
                onClick={handleDirectReset}
                disabled={isInstalling || isResetting}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Direct Reset
                  </>
                )}
              </Button>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Use with caution</AlertTitle>
                <AlertDescription>
                  Direct reset will delete all data. Only use if you understand the implications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>For experienced users only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Advanced migration and verification tools will appear here. Use direct options for now.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
