#!/usr/bin/env node

/**
 * Force complete rebuild by clearing all caches
 * Run before deployment to ensure clean module resolution
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("🔨 Forcing complete rebuild...\n")

const cacheDirectories = [".next", ".turbo", "node_modules/.cache", ".vercel/cache"]

const buildFiles = ["tsconfig.tsbuildinfo", ".next/cache", ".next/trace"]

// Clear directories
cacheDirectories.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir)
  if (fs.existsSync(fullPath)) {
    console.log(`  Removing ${dir}...`)
    fs.rmSync(fullPath, { recursive: true, force: true })
  }
})

// Clear files
buildFiles.forEach((file) => {
  const fullPath = path.join(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    console.log(`  Removing ${file}...`)
    fs.rmSync(fullPath, { recursive: true, force: true })
  }
})

// Clear npm cache
console.log("\n  Clearing npm cache...")
try {
  execSync("npm cache clean --force", { stdio: "inherit" })
} catch (error) {
  console.log("  Warning: Could not clear npm cache")
}

console.log("\n✅ Cache cleared. Ready for clean build.\n")
console.log("Run: npm run build")
