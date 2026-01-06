#!/usr/bin/env node

/**
 * Conditional rebuild script
 * Only rebuilds better-sqlite3 and sharp when necessary (local development)
 * Skips rebuild on Vercel since we use PostgreSQL in production
 */

const { execSync } = require("child_process")

// Check if we're on Vercel
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true"
const isProduction = process.env.NODE_ENV === "production"
const hasRemoteDB = !!process.env.REMOTE_POSTGRES_URL

console.log("\n🔍 Checking if native module rebuild is needed...")
console.log(`  Environment: ${isProduction ? "Production" : "Development"}`)
console.log(`  Platform: ${isVercel ? "Vercel" : "Local"}`)
console.log(`  Database: ${hasRemoteDB ? "PostgreSQL (Remote)" : "SQLite (Local)"}`)

if (isVercel || isProduction || hasRemoteDB) {
  console.log("\n✅ Skipping native module rebuild")
  console.log("   Using PostgreSQL - better-sqlite3 not needed")
  console.log("   This saves ~90 seconds in build time!\n")
  process.exit(0)
}

console.log("\n📦 Rebuilding native modules for local development...")

try {
  console.log("  → Rebuilding better-sqlite3...")
  execSync("npm rebuild better-sqlite3", { stdio: "inherit" })
  console.log("\n✅ Native modules rebuilt successfully!\n")
} catch (error) {
  console.warn("\n⚠️  Warning: Native module rebuild failed")
  console.warn("   Continuing anyway - this is normal on Vercel.\n")
  process.exit(0)
}
