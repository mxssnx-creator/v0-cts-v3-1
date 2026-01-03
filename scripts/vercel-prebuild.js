#!/usr/bin/env node

/**
 * Vercel-specific pre-build script
 * Ensures clean state before Vercel builds
 */

const fs = require("fs")
const path = require("path")

console.log("🚀 Vercel Pre-build Clean...\n")

// Remove all cache directories
const dirsToRemove = [".next", ".turbo", "node_modules/.cache"]

for (const dir of dirsToRemove) {
  const dirPath = path.join(process.cwd(), dir)
  if (fs.existsSync(dirPath)) {
    console.log(`  Removing ${dir}...`)
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

// Remove TypeScript build info
const tsBuildInfo = path.join(process.cwd(), "tsconfig.tsbuildinfo")
if (fs.existsSync(tsBuildInfo)) {
  fs.unlinkSync(tsBuildInfo)
}

console.log("\n✅ Vercel cache cleared!\n")
