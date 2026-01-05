#!/usr/bin/env bun

/**
 * GitHub File Recovery Tool for CTS v3.1
 *
 * This script helps recover specific files from previous GitHub commits
 * without reverting the entire codebase, preserving all TypeScript fixes.
 *
 * Usage:
 *   bun scripts/recover-from-github.ts <commit-hash> <file-path>
 *   bun scripts/recover-from-github.ts --list-commits
 *   bun scripts/recover-from-github.ts --recover-settings
 */

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

interface RecoveryTarget {
  commitHash: string
  filePath: string
  outputPath: string
  description: string
}

// Known good versions from v279 (before the settings page was destroyed)
const RECOVERY_TARGETS: RecoveryTarget[] = [
  {
    commitHash: "9cb416d", // v279 - Last known good version
    filePath: "app/settings/page.tsx",
    outputPath: "app/settings/page.tsx",
    description: "Complete Settings Page with tabbed interface",
  },
  {
    commitHash: "9cb416d",
    filePath: "app/settings/indications/main/page.tsx",
    outputPath: "app/settings/indications/main/page.tsx",
    description: "Main Indications Settings Page",
  },
  {
    commitHash: "9cb416d",
    filePath: "app/settings/indications/auto/page.tsx",
    outputPath: "app/settings/indications/auto/page.tsx",
    description: "Auto Indications Settings Page",
  },
  {
    commitHash: "9cb416d",
    filePath: "app/settings/indications/optimal/page.tsx",
    outputPath: "app/settings/indications/optimal/page.tsx",
    description: "Optimal Indications Settings Page",
  },
  {
    commitHash: "9cb416d",
    filePath: "app/settings/indications/common/page.tsx",
    outputPath: "app/settings/indications/common/page.tsx",
    description: "Common Indications Settings Page",
  },
]

async function listRecentCommits(): Promise<void> {
  console.log("📋 Recent commits:\n")
  try {
    const { stdout } = await execAsync("git log --oneline -20")
    console.log(stdout)
  } catch (error) {
    console.error("❌ Error listing commits:", error)
  }
}

async function fetchFileFromCommit(commitHash: string, filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`git show ${commitHash}:${filePath}`)
    return stdout
  } catch (error) {
    console.error(`❌ Error fetching ${filePath} from commit ${commitHash}:`, error)
    return null
  }
}

async function recoverFile(target: RecoveryTarget): Promise<boolean> {
  console.log(`\n🔄 Recovering: ${target.description}`)
  console.log(`   From: ${target.commitHash}`)
  console.log(`   File: ${target.filePath}`)

  const content = await fetchFileFromCommit(target.commitHash, target.filePath)

  if (!content) {
    console.log(`   ❌ Failed to fetch file`)
    return false
  }

  // Ensure directory exists
  const dir = path.dirname(target.outputPath)
  await fs.mkdir(dir, { recursive: true })

  // Write the recovered file
  await fs.writeFile(target.outputPath, content, "utf-8")

  console.log(`   ✅ Recovered to: ${target.outputPath}`)
  console.log(`   📝 ${content.split("\n").length} lines`)

  return true
}

async function recoverAllSettings(): Promise<void> {
  console.log("🚀 Starting Settings Pages Recovery from v279\n")
  console.log("=".repeat(60))

  let successCount = 0
  let failCount = 0

  for (const target of RECOVERY_TARGETS) {
    const success = await recoverFile(target)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`\n📊 Recovery Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   📁 Total: ${RECOVERY_TARGETS.length}`)

  if (successCount > 0) {
    console.log("\n✨ Recovery complete! Your settings pages have been restored.")
    console.log("   All TypeScript fixes are preserved in other files.")
  }
}

async function recoverCustomFile(commitHash: string, filePath: string): Promise<void> {
  console.log(`\n🔄 Custom file recovery:`)
  console.log(`   Commit: ${commitHash}`)
  console.log(`   File: ${filePath}`)

  const content = await fetchFileFromCommit(commitHash, filePath)

  if (!content) {
    console.log(`   ❌ Failed to fetch file`)
    return
  }

  const outputPath = filePath
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(outputPath, content, "utf-8")

  console.log(`   ✅ Recovered to: ${outputPath}`)
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0 || args[0] === "--help") {
  console.log(`
📦 GitHub File Recovery Tool

Usage:
  bun scripts/recover-from-github.ts [options]

Options:
  --list-commits          List recent commits
  --recover-settings      Recover all settings pages from v279
  <commit> <file>         Recover specific file from commit

Examples:
  bun scripts/recover-from-github.ts --list-commits
  bun scripts/recover-from-github.ts --recover-settings
  bun scripts/recover-from-github.ts 9cb416d app/settings/page.tsx
  `)
  process.exit(0)
}

if (args[0] === "--list-commits") {
  await listRecentCommits()
} else if (args[0] === "--recover-settings") {
  await recoverAllSettings()
} else if (args.length === 2) {
  await recoverCustomFile(args[0], args[1])
} else {
  console.error("❌ Invalid arguments. Use --help for usage information.")
  process.exit(1)
}
