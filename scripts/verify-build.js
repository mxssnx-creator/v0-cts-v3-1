#!/usr/bin/env node

/**
 * Verify build integrity for CTS v3.1
 * Run this before deployment to catch issues
 */

const fs = require("fs")
const path = require("path")

console.log("🔍 Verifying CTS v3.1 build integrity...\n")

let hasErrors = false

// Check critical imports
const filesToCheck = [
  {
    path: "app/api/trade-engine/pause/route.ts",
    mustInclude: ['import { getTradeEngine } from "@/lib/trade-engine"'],
    mustNotInclude: ["@/lib/trade-engine/trade-engine"],
  },
  {
    path: "app/api/trade-engine/resume/route.ts",
    mustInclude: ['import { getTradeEngine } from "@/lib/trade-engine"'],
    mustNotInclude: ["@/lib/trade-engine/trade-engine"],
  },
  {
    path: "lib/trade-engine.ts",
    mustInclude: ["export function getTradeEngine", "export class GlobalTradeEngineCoordinator"],
    mustNotInclude: [],
  },
  {
    path: "hooks/use-toast.ts",
    mustInclude: ["export { useToast, toast }"],
    mustNotInclude: [],
  },
]

console.log("  ✓ Checking critical file imports...")
for (const check of filesToCheck) {
  const filePath = path.join(__dirname, "..", check.path)

  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ ERROR: ${check.path} does not exist!`)
    hasErrors = true
    continue
  }

  const content = fs.readFileSync(filePath, "utf8")

  for (const mustInclude of check.mustInclude) {
    if (!content.includes(mustInclude)) {
      console.error(`  ✗ ERROR: ${check.path} missing required code: ${mustInclude}`)
      hasErrors = true
    }
  }

  for (const mustNotInclude of check.mustNotInclude) {
    if (content.includes(mustNotInclude)) {
      console.error(`  ✗ ERROR: ${check.path} contains invalid import: ${mustNotInclude}`)
      hasErrors = true
    }
  }
}

// Check for stray files that should not exist
const strayFiles = ["lib/configuration-set-manager.ts", "lib/configuration-set-manager.tsx"]

console.log("  ✓ Checking for stray files...")
for (const strayFile of strayFiles) {
  const filePath = path.join(__dirname, "..", strayFile)
  if (fs.existsSync(filePath)) {
    console.error(`  ✗ ERROR: Stray file exists: ${strayFile}`)
    hasErrors = true
  }
}

// Verify environment setup
console.log("  ✓ Checking environment configuration...")
const envExample = path.join(__dirname, "..", ".env.example")
if (!fs.existsSync(envExample)) {
  console.warn("  ⚠ WARNING: .env.example not found")
}

if (hasErrors) {
  console.error("\n❌ Build verification FAILED! Fix errors above before deploying.\n")
  process.exit(1)
} else {
  console.log("\n✅ Build verification PASSED! Ready to deploy.\n")
  process.exit(0)
}
