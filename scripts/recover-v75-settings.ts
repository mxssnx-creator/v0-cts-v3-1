#!/usr/bin/env bun

/**
 * Recovery script for v75 settings page
 * Fetches from commit: b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958
 */

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

const V75_COMMIT = "b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958"
const REPO = "mxssnx-creator/v0-cts-v3-1"
const FILES_TO_RECOVER = [
  "app/settings/page.tsx",
  "app/settings/layout.tsx",
  "components/settings/exchange-connection-manager.tsx",
  "components/settings/install-manager.tsx",
]

async function downloadFile(filePath: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${REPO}/${V75_COMMIT}/${filePath}`

  try {
    console.log(`Fetching: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Failed to fetch ${filePath}: ${response.status}`)
      return null
    }

    const content = await response.text()
    console.log(`✓ Successfully fetched ${filePath} (${content.length} bytes)`)
    return content
  } catch (error) {
    console.error(`Error fetching ${filePath}:`, error)
    return null
  }
}

async function recoverV75Settings() {
  console.log("\n🔄 Starting v75 Settings Recovery...\n")
  console.log(`Commit: ${V75_COMMIT}`)
  console.log(`Repository: ${REPO}\n`)

  // Create backup directory
  const backupDir = path.join(process.cwd(), "backups", "pre-v75-recovery")
  await fs.mkdir(backupDir, { recursive: true })

  let recoveredCount = 0
  let failedCount = 0

  for (const filePath of FILES_TO_RECOVER) {
    console.log(`\n📥 Recovering: ${filePath}`)

    // Backup current file if it exists
    const fullPath = path.join(process.cwd(), filePath)
    try {
      const currentContent = await fs.readFile(fullPath, "utf-8")
      const backupPath = path.join(backupDir, filePath)
      await fs.mkdir(path.dirname(backupPath), { recursive: true })
      await fs.writeFile(backupPath, currentContent)
      console.log(`  💾 Backed up current file to ${backupPath}`)
    } catch (error) {
      console.log(`  ⚠️  No current file to backup`)
    }

    // Download v75 version
    const v75Content = await downloadFile(filePath)

    if (v75Content) {
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, v75Content)
      console.log(`  ✅ Recovered ${filePath}`)
      recoveredCount++
    } else {
      console.log(`  ❌ Failed to recover ${filePath}`)
      failedCount++
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("📊 Recovery Summary:")
  console.log(`  ✅ Recovered: ${recoveredCount} files`)
  console.log(`  ❌ Failed: ${failedCount} files`)
  console.log(`  💾 Backups saved to: ${backupDir}`)
  console.log("=".repeat(60) + "\n")

  if (recoveredCount > 0) {
    console.log("✨ Recovery complete! Next steps:")
    console.log("  1. Review the recovered files")
    console.log("  2. Integrate threshold management features")
    console.log("  3. Run: bun run build")
  }
}

// Execute recovery
recoverV75Settings().catch(console.error)
