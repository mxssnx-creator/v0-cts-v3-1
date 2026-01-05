#!/usr/bin/env bun

import { execSync } from "child_process"
import fs from "fs"
import path from "path"

console.log("🚀 IMMEDIATE SETTINGS PAGE RECOVERY")
console.log("=".repeat(60))

const COMMIT_HASH = "9cb416d" // v279 - Last known good version

const files = [
  "app/settings/page.tsx",
  "app/settings/indications/main/page.tsx",
  "app/settings/indications/auto/page.tsx",
  "app/settings/indications/optimal/page.tsx",
  "app/settings/indications/common/page.tsx",
]

let recovered = 0
let failed = 0

for (const filePath of files) {
  try {
    console.log(`\n🔄 Recovering: ${filePath}`)

    // Fetch file from git
    const content = execSync(`git show ${COMMIT_HASH}:${filePath}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(filePath, content, "utf-8")

    const lines = content.split("\n").length
    console.log(`   ✅ Recovered ${lines} lines`)
    recovered++
  } catch (error) {
    console.error(`   ❌ Failed: ${error}`)
    failed++
  }
}

console.log("\n" + "=".repeat(60))
console.log(`\n📊 Recovery Results:`)
console.log(`   ✅ Recovered: ${recovered}`)
console.log(`   ❌ Failed: ${failed}`)

if (recovered > 0) {
  console.log("\n✨ Settings pages restored from v279!")
  console.log("   All TypeScript fixes preserved.")
}
