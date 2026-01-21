"use server"

import { ProductionMigrationRunner } from "@/lib/db-migration-runner"
import { runAutoMigrations } from "@/lib/auto-migrate"

let initializationComplete = false
let initializationInProgress = false
let initializationPromise: Promise<any> | null = null

export async function initializeApplication() {
  // If already complete, return immediately
  if (initializationComplete) {
    return { success: true, message: "Application already initialized" }
  }

  // If in progress, wait for the same promise
  if (initializationInProgress && initializationPromise) {
    console.log("[v0] Initialization already in progress, waiting for completion...")
    return await initializationPromise
  }

  initializationInProgress = true

  // Create and store the initialization promise
  initializationPromise = (async () => {
    try {
      console.log("[v0] ================================================")
      console.log("[v0] CTS v3.1 - Production Database Initialization")
      console.log("[v0] ================================================")
      console.log("[v0]")

      // Step 1: Run production migration system
      console.log("[v0] Running Production Migration System...")
      const migrationResult = await ProductionMigrationRunner.runAllMigrations()
      
      if (!migrationResult.success) {
        throw new Error(migrationResult.message)
      }

      console.log("[v0]")
      console.log(`[v0] ✓ Database migrations complete`)
      console.log(`[v0]   - Applied: ${migrationResult.applied}`)
      console.log(`[v0]   - Skipped: ${migrationResult.skipped}`)
      
      // Step 2: Run auto-migrations for dynamic schema updates
      console.log("[v0]")
      console.log("[v0] Running Auto-Migrations...")
      try {
        await runAutoMigrations()
        console.log("[v0] ✓ Auto-migrations complete")
      } catch (error) {
        console.warn("[v0] ⚠ Auto-migrations warning:", error instanceof Error ? error.message : String(error))
        // Non-critical, continue
      }

      initializationComplete = true
      initializationInProgress = false

      console.log("[v0]")
      console.log("[v0] ================================================")
      console.log("[v0] ✓ Application Ready for Production")
      console.log("[v0] ================================================")
      
      return { 
        success: true, 
        message: "Application initialized successfully",
        migrationResult
      }
    } catch (error) {
      initializationInProgress = false
      initializationComplete = false
      initializationPromise = null
      
      console.error("[v0] ================================================")
      console.error("[v0] ✗ Application initialization failed")
      console.error("[v0] ================================================")
      console.error("[v0] Error:", error instanceof Error ? error.message : String(error))
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  })()

  return await initializationPromise
}
