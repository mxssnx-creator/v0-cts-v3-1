#!/usr/bin/env node

/**
 * Pre-build script for CTS v3.1
 * Clears caches and validates environment before build
 */

const fs = require("fs")
const path = require("path")

console.log("🔧 Running pre-build checks...\n")

// Clear TypeScript incremental cache
const tsBuildInfo = path.join(__dirname, "..", "tsconfig.tsbuildinfo")
if (fs.existsSync(tsBuildInfo)) {
  console.log("  ✓ Clearing TypeScript build cache")
  fs.unlinkSync(tsBuildInfo)
}

// Validate critical files exist
const criticalFiles = ["lib/trade-engine.ts", "lib/trade-engine/index.ts", "lib/trade-engine/trade-engine.tsx"]

console.log("  ✓ Validating critical files...")
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, "..", file)
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ ERROR: Critical file missing: ${file}`)
    process.exit(1)
  }
}

// Check for stray configuration-set-manager in lib/
const strayFile = path.join(__dirname, "..", "lib", "configuration-set-manager.ts")
if (fs.existsSync(strayFile)) {
  console.log("  ✓ Removing stray configuration-set-manager.ts")
  fs.unlinkSync(strayFile)
}

console.log("\n✅ Pre-build checks complete!\n")
