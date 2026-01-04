#!/usr/bin/env node

/**
 * Pre-build script for CTS v3.1
 * Aggressively clears all caches before build to prevent stale TypeScript errors
 */

const fs = require("fs")
const path = require("path")

const rootDir = process.cwd()

console.log("CTS v3.1 Pre-build Cache Clearing...\n")

const cacheDirs = [
  path.join(rootDir, ".next"),
  path.join(rootDir, "node_modules", ".cache"),
  path.join(rootDir, ".turbo"),
  path.join(rootDir, "node_modules", ".vite"),
  path.join(rootDir, ".tsbuildinfo"),
  path.join(rootDir, "node_modules", ".cache", "typescript"),
  path.join(rootDir, ".vercel"),
]

console.log("  Clearing all build caches...")
for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`    ✓ Cleared ${path.relative(rootDir, dir)}`)
    } catch (err) {
      // Non-fatal - continue
      console.log(`    ⚠ Could not clear ${path.relative(rootDir, dir)}`)
    }
  }
}

const tsBuildInfoFiles = [
  path.join(rootDir, "tsconfig.tsbuildinfo"),
  path.join(rootDir, ".tsbuildinfo"),
  path.join(rootDir, "tsconfig.build.tsbuildinfo"),
  path.join(rootDir, "app", "tsconfig.tsbuildinfo"),
  path.join(rootDir, "lib", "tsconfig.tsbuildinfo"),
]

console.log("\n  Clearing TypeScript build info files...")
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

const strayFiles = [
  path.join(rootDir, "lib", "configuration-set-manager.ts"),
  path.join(rootDir, "lib", "configuration-set-manager.tsx"),
]

console.log("\n  Checking for stray files...")
let foundStray = false
for (const strayFile of strayFiles) {
  if (fs.existsSync(strayFile)) {
    console.log(`    ✓ Removed stray file: ${path.basename(strayFile)}`)
    fs.unlinkSync(strayFile)
    foundStray = true
  }
}
if (!foundStray) {
  console.log(`    ✓ No stray files found`)
}

console.log("\n✅ Cache cleared successfully! Building...\n")
