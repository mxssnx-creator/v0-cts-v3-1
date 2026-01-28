"use server"

import { runMigrations } from "@/lib/db-migrations"

let initialized = false

/**
 * Initialize database on first load
 * This is called from the root layout to ensure migrations run once
 */
export async function initializeDatabase() {
  if (initialized) return

  try {
    console.log("[v0] Database initialization starting...")
    await runMigrations()
    
    initialized = true
    console.log("[v0] Database initialization complete")
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
  }
}
