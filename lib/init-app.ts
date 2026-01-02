"use server"

import { DatabaseMigrations } from "@/lib/db-migrations"
import { runAutoMigrations } from "@/lib/auto-migrate"

let initializationComplete = false
let initializationInProgress = false

export async function initializeApplication() {
  if (initializationComplete) {
    return { success: true, message: "Application already initialized" }
  }

  if (initializationInProgress) {
    console.log("[v0] Initialization already in progress, waiting...")
    // Wait for initialization to complete
    while (initializationInProgress) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return { success: true, message: "Application initialized by another process" }
  }

  initializationInProgress = true

  try {
    console.log("[v0] Starting application initialization...")

    // Step 1: Run main database migrations
    console.log("[v0] Running database migrations...")
    await DatabaseMigrations.runPendingMigrations()

    // Step 2: Run auto-migrations for schema updates
    console.log("[v0] Running auto-migrations...")
    await runAutoMigrations()

    initializationComplete = true
    initializationInProgress = false

    console.log("[v0] Application initialization complete!")
    return { success: true, message: "Application initialized successfully" }
  } catch (error) {
    initializationInProgress = false
    console.error("[v0] Application initialization failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
