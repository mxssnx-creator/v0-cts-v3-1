"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Database, Download, CheckCircle2, AlertCircle } from "lucide-react"

interface PrehistoricDataLoaderProps {
  connectionId: string
  symbol: string
  onComplete?: () => void
}

export function PrehistoricDataLoader({ connectionId, symbol, onComplete }: PrehistoricDataLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [detailsText, setDetailsText] = useState<string>("")
  const [recordsLoaded, setRecordsLoaded] = useState(0)
  const [rangesProcessed, setRangesProcessed] = useState(0)
  const [totalRanges, setTotalRanges] = useState(0)

  const loadPrehistoricData = async () => {
    setLoading(true)
    setProgress(0)
    setStatus("Analyzing data gaps...")
    setDetailsText("Checking existing data coverage and identifying missing time ranges...")

    try {
      // Check current coverage
      const coverageResponse = await fetch(`/api/prehistoric-data/load?connectionId=${connectionId}&symbol=${symbol}`)
      const coverageData = await coverageResponse.json()

      // Calculate date range (last 90 days)
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)

      setStatus("Loading historical data...")
      setDetailsText(`Loading data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}...`)

      const response = await fetch("/api/prehistoric-data/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          symbol,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          interval: "1h",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to load prehistoric data")
      }

      const data = await response.json()

      setRecordsLoaded(data.recordsLoaded || 0)
      setRangesProcessed(data.rangesProcessed || 0)
      setTotalRanges(data.missingRanges || 0)
      setProgress(100)
      setStatus("Complete!")
      setDetailsText(
        `Successfully loaded ${data.recordsLoaded} historical records across ${data.rangesProcessed} time ranges`,
      )

      toast.success(`Prehistoric data loaded: ${data.recordsLoaded} records`)
      onComplete?.()
    } catch (error) {
      console.error("[v0] Prehistoric data loading failed:", error)
      setStatus("Failed")
      setDetailsText(error instanceof Error ? error.message : "Unknown error occurred")
      toast.error("Failed to load prehistoric data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Prehistoric Data Loader
            </CardTitle>
            <CardDescription>Load historical market data for {symbol}</CardDescription>
          </div>
          <Badge variant={loading ? "default" : "outline"}>{loading ? "Loading..." : status || "Ready"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground text-center">{progress}% complete</div>
          </div>
        )}

        {/* Details Text - Additional info line under progress bar */}
        {detailsText && (
          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="text-muted-foreground">{detailsText}</p>
            {recordsLoaded > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-medium">Records:</span> {recordsLoaded.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Ranges:</span> {rangesProcessed}/{totalRanges}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {status === "Complete!" ? (
                    <CheckCircle2 className="inline h-4 w-4 text-green-500" />
                  ) : status === "Failed" ? (
                    <AlertCircle className="inline h-4 w-4 text-red-500" />
                  ) : (
                    "In Progress"
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Load Button */}
        <Button onClick={loadPrehistoricData} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-pulse" />
              Loading Data...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Load Historical Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
