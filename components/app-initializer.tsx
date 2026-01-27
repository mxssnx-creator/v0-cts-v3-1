"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * App Initialization Component
 * Runs on app startup to ensure all systems are initialized
 */
export function AppInitializer() {
  const router = useRouter()
  const [initStatus, setInitStatus] = useState<{
    status: "initializing" | "success" | "error"
    message: string
    details?: any
  }>({
    status: "initializing",
    message: "Initializing application...",
  })

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("[v0] Starting app initialization...")

        // Step 1: Check system health
        console.log("[v0] Checking system health...")
        const healthResponse = await fetch("/api/system/health")

        if (!healthResponse.ok) {
          throw new Error(`System health check failed: ${healthResponse.statusText}`)
        }

        const healthReport = await healthResponse.json()
        console.log("[v0] System health report:", healthReport)

        // Step 2: Initialize database if needed
        if (!healthReport.database.healthy) {
          console.log("[v0] Initializing database...")

          const initResponse = await fetch("/api/system/health", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "init" }),
          })

          if (!initResponse.ok) {
            throw new Error(`Database initialization failed: ${initResponse.statusText}`)
          }

          const initResult = await initResponse.json()
          console.log("[v0] Database initialization result:", initResult)

          if (!initResult.success) {
            throw new Error("Database initialization incomplete: " + JSON.stringify(initResult.integrity?.errors || []))
          }
        }

        console.log("[v0] App initialization completed successfully")

        setInitStatus({
          status: "success",
          message: "Application initialized successfully",
          details: healthReport,
        })

        // Continue with app
      } catch (error) {
        console.error("[v0] App initialization failed:", error)

        setInitStatus({
          status: "error",
          message: "Failed to initialize application",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Run initialization
    initializeApp()
  }, [])

  // If initialization fails, show error
  if (initStatus.status === "error") {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-gray-700 mb-4">{initStatus.message}</p>
          {initStatus.details && (
            <div className="bg-gray-100 rounded p-3 text-sm text-gray-600 mb-4 overflow-auto max-h-48">
              <code>{initStatus.details}</code>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // If initializing, show loading state
  if (initStatus.status === "initializing") {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-700">{initStatus.message}</p>
        </div>
      </div>
    )
  }

  // If success, return null (children will render)
  return null
}
