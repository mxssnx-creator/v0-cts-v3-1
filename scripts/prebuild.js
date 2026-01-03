#!/usr/bin/env node

/**
 * Pre-build script for CTS v3.1
 * Aggressively clears all caches and validates environment before build
 */

const fs = require("fs")
const path = require("path")

console.log("🔧 CTS v3.1 Pre-build Validation...\n")

const cacheDirs = [
  path.join(__dirname, "..", ".next"),
  path.join(__dirname, "..", "node_modules", ".cache"),
  path.join(__dirname, "..", ".turbo"),
]

console.log("  ✓ Clearing build caches...")
for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`    - Cleared ${path.basename(dir)}`)
    } catch (err) {
      console.warn(`    ! Warning: Could not clear ${path.basename(dir)}`)
    }
  }
}

const tsBuildInfo = path.join(__dirname, "..", "tsconfig.tsbuildinfo")
if (fs.existsSync(tsBuildInfo)) {
  fs.unlinkSync(tsBuildInfo)
  console.log("  ✓ Cleared TypeScript build info")
}

console.log("\n  ✓ Validating critical files...")
const criticalFiles = [
  "lib/trade-engine.ts",
  "lib/trade-engine/index.ts",
  "lib/trade-engine/trade-engine.tsx",
  "hooks/use-toast.ts",
  "lib/db.ts",
  "lib/types.ts",
]

let hasErrors = false
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, "..", file)
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ ERROR: Missing critical file: ${file}`)
    hasErrors = true
  } else {
    console.log(`    ✓ ${file}`)
  }
}

const strayFiles = [
  path.join(__dirname, "..", "lib", "configuration-set-manager.ts"),
  path.join(__dirname, "..", "lib", "configuration-set-manager.tsx"),
]

for (const strayFile of strayFiles) {
  if (fs.existsSync(strayFile)) {
    console.log(`  ✓ Removing stray file: ${path.basename(strayFile)}`)
    fs.unlinkSync(strayFile)
  }
}

console.log("\n  ✓ Verifying module exports...")
try {
  const tradeEngineContent = fs.readFileSync(path.join(__dirname, "..", "lib", "trade-engine.ts"), "utf8")

  if (!tradeEngineContent.includes("export function getTradeEngine")) {
    console.error("  ✗ ERROR: lib/trade-engine.ts missing getTradeEngine export!")
    hasErrors = true
  } else {
    console.log("    ✓ getTradeEngine export verified")
  }

  const useToastContent = fs.readFileSync(path.join(__dirname, "..", "hooks", "use-toast.ts"), "utf8")

  if (!useToastContent.includes("export") || useToastContent.trim().length < 100) {
    console.error("  ✗ ERROR: hooks/use-toast.ts appears invalid!")
    hasErrors = true
  } else {
    console.log("    ✓ use-toast hook verified")
  }
} catch (err) {
  console.error(`  ✗ ERROR: Failed to verify exports: ${err.message}`)
  hasErrors = true
}

if (hasErrors) {
  console.error("\n❌ Pre-build validation failed!\n")
  process.exit(1)
}

console.log("\n✅ Pre-build validation passed! Ready to build.\n")
