#!/usr/bin/env node

/**
 * Conditional rebuild script
 * Only rebuilds better-sqlite3 and sharp when necessary (local development)
 * Skips rebuild on Vercel since we use PostgreSQL in production
 */

const { execSync } = require("child_process")

// Check if we're on Vercel
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true"

// Check if we're using PostgreSQL (production mode)
const isProduction = process.env.NODE_ENV === "production"
const hasRemoteDB = !!process.env.REMOTE_POSTGRES_URL

console.log("\n🔍 Checking if native module rebuild is needed...")
console.log(`  Environment: ${isProduction ? "Production" : "Development"}`)
console.log(`  Platform: ${isVercel ? "Vercel" : "Local"}`)
console.log(`  Database: ${hasRemoteDB ? "PostgreSQL (Remote)" : "SQLite (Local)"}`)

if (isVercel || (isProduction && hasRemoteDB)) {
  console.log("\n✅ Skipping native module rebuild (using PostgreSQL)")
  console.log("   This saves ~60 seconds in build time!\n")
  process.exit(0)
}

console.log("\n📦 Rebuilding native modules for local development...")

try {
  // Only rebuild better-sqlite3 if we're using SQLite
  if (!hasRemoteDB) {
    console.log("  → Rebuilding better-sqlite3...")
    execSync("npm rebuild better-sqlite3", { stdio: "inherit" })
  }

  // Only rebuild sharp if the package is actually used
  const packageJson = require("../package.json")
  if (packageJson.dependencies.sharp || packageJson.devDependencies.sharp) {
    console.log("  → Rebuilding sharp...")
    execSync("npm rebuild sharp", { stdio: "inherit" })
  }

  console.log("\n✅ Native modules rebuilt successfully!\n")
} catch (error) {
  console.warn("\n⚠️  Warning: Native module rebuild failed, but continuing anyway...")
  console.warn("   This is normal on Vercel or when using PostgreSQL only.\n")
  // Don't fail the build if rebuild fails
  process.exit(0)
}
