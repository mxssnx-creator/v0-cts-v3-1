#!/usr/bin/env bun

/**
 * Complete V75 Settings Restoration Script
 * Fetches ALL settings-related files from v75 commit
 */

const V75_COMMIT = "b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958"
const GITHUB_REPO = "mxssnx-creator/v0-cts-v3-1"
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${V75_COMMIT}`

const FILES_TO_RESTORE = [
  // Main page
  "app/settings/page.tsx",

  // Settings components
  "components/settings/exchange-connection-manager.tsx",
  "components/settings/install-manager.tsx",
  "components/settings/preset-connection-manager.tsx",
  "components/settings/logs-viewer.tsx",
  "components/settings/auto-indication-settings.tsx",
  "components/settings/active-advanced-indication-settings.tsx",
  "components/settings/statistics-overview.tsx",
  "components/settings/exchange-config.tsx",
  "components/settings/connection-settings-dialog.tsx",
  "components/settings/connection-info-dialog.tsx",
  "components/settings/connection-log-dialog.tsx",
  "components/settings/exchange-connection-dialog.tsx",
  "components/settings/exchange-connection-settings-dialog.tsx",
  "components/settings/connection-predefinition-selector.tsx",

  // Sub-pages
  "app/settings/overall/connection/page.tsx",
  "app/settings/indications/main/page.tsx",
  "app/settings/indications/auto/page.tsx",
  "app/settings/indications/common/page.tsx",
  "app/settings/indications/optimal/page.tsx",
]

async function fetchFileFromV75(filePath: string): Promise<string | null> {
  const url = `${GITHUB_RAW_BASE}/${filePath}`
  console.log(`Fetching: ${url}`)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
      },
    })

    if (response.ok) {
      return await response.text()
    } else {
      console.warn(`File not found: ${filePath} (${response.status})`)
      return null
    }
  } catch (error) {
    console.error(`Error fetching ${filePath}:`, error)
    return null
  }
}

async function writeFile(filePath: string, content: string) {
  const fs = await import("fs/promises")
  const path = await import("path")

  const fullPath = path.join(process.cwd(), filePath)
  const dir = path.dirname(fullPath)

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(fullPath, content, "utf-8")
  console.log(`✓ Restored: ${filePath}`)
}

async function backupCurrentFile(filePath: string) {
  const fs = await import("fs/promises")
  const path = await import("path")

  const fullPath = path.join(process.cwd(), filePath)
  const backupPath = path.join(process.cwd(), "backups/latest", filePath)
  const backupDir = path.dirname(backupPath)

  try {
    await fs.mkdir(backupDir, { recursive: true })
    await fs.copyFile(fullPath, backupPath)
    console.log(`✓ Backed up: ${filePath}`)
  } catch (error) {
    // File doesn't exist, no backup needed
  }
}

async function main() {
  console.log("Starting complete v75 settings restoration...")
  console.log(`Commit: ${V75_COMMIT}\n`)

  let restoredCount = 0
  let skippedCount = 0

  for (const filePath of FILES_TO_RESTORE) {
    console.log(`\nProcessing: ${filePath}`)

    // Backup current file
    await backupCurrentFile(filePath)

    // Fetch from v75
    const content = await fetchFileFromV75(filePath)

    if (content) {
      await writeFile(filePath, content)
      restoredCount++
    } else {
      skippedCount++
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log(`Restoration complete!`)
  console.log(`✓ Restored: ${restoredCount} files`)
  console.log(`⊘ Skipped: ${skippedCount} files (not found in v75)`)
  console.log("=".repeat(60))
  console.log("\nBackups saved to: backups/latest/")
  console.log("\nNext steps:")
  console.log("1. Review restored files")
  console.log("2. Add threshold-management.tsx and auto-recovery-control.tsx to settings")
  console.log("3. Test the settings page")
}

main().catch(console.error)
