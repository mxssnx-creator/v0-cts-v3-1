"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[v0] Global Error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle className="text-2xl">Application Error</CardTitle>
                  <CardDescription>A critical error occurred</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{error.message}</p>
              <div className="flex gap-2">
                <Button onClick={reset}>Try Again</Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline">Go Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
