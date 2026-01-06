#!/usr/bin/env node

/**
 * Pre-build script for CTS v3.1
 * Aggressively clears all caches before build to prevent stale TypeScript errors
 */

const fs = require("fs")
const path = require("path")

const rootDir = process.cwd()

console.log("CTS v3.1 Pre-build Cache Clearing...\n")

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true"
if (isVercel) {
  console.log("  🚀 Vercel optimized build mode enabled")
  console.log("  → Skipping native module rebuilds")
  console.log("  → Using bun for faster script execution\n")
}

const cacheDirs = [
  path.join(rootDir, ".next"),
  path.join(rootDir, ".turbo"),
  path.join(rootDir, "node_modules", ".cache"),
]

console.log("  Clearing all build caches...")
for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`    ✓ Cleared ${path.relative(rootDir, dir)}`)
    } catch (err) {
      console.log(`    ⚠ Could not clear ${path.relative(rootDir, dir)}`)
    }
  }
}

const tsBuildInfoFiles = [path.join(rootDir, "tsconfig.tsbuildinfo")]

console.log("\n  Clearing TypeScript build info...")
for (const file of tsBuildInfoFiles) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file)
      console.log(`    ✓ Cleared ${path.basename(file)}`)
    } catch (err) {
      // Non-fatal
    }
  }
}

console.log("\n✅ Cache cleared successfully! Building...\n")
