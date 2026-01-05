#!/usr/bin/env bun

/**
 * Page Backup System
 * Creates timestamped backups of all critical pages
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"

const CRITICAL_PAGES = [
  "app/page.tsx",
  "app/monitoring/page.tsx",
  "app/indications/page.tsx",
  "app/strategies/page.tsx",
  "app/settings/page.tsx",
  "app/settings/indications/main/page.tsx",
  "app/settings/indications/auto/page.tsx",
  "app/settings/indications/common/page.tsx",
  "app/settings/indications/optimal/page.tsx",
  "app/analysis/page.tsx",
  "app/logistics/page.tsx",
  "app/structure/page.tsx",
  "app/presets/page.tsx",
  "app/sets/page.tsx",
  "app/alerts/page.tsx",
  "app/statistics/page.tsx",
  "app/live-trading/page.tsx",
] as const

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupDir = resolve(process.cwd(), `backups/pages-${timestamp}`)

  console.log(`📦 Creating backup: ${backupDir}\n`)

  let backed = 0
  let failed = 0

  for (const page of CRITICAL_PAGES) {
    try {
      const sourcePath = resolve(process.cwd(), page)

      if (!existsSync(sourcePath)) {
        console.error(`❌ ${page} - FILE NOT FOUND`)
        failed++
        continue
      }

      const content = readFileSync(sourcePath, "utf-8")
      const backupPath = resolve(backupDir, page)
      const backupDirPath = dirname(backupPath)

      mkdirSync(backupDirPath, { recursive: true })
      writeFileSync(backupPath, content)

      console.log(`✅ ${page} (${content.length} bytes)`)
      backed++
    } catch (error) {
      console.error(`❌ ${page} - ERROR: ${error}`)
      failed++
    }
  }

  console.log(`\n📊 Backup Summary:`)
  console.log(`   ✅ Backed up: ${backed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`\n📁 Backup location: ${backupDir}`)

  return { backed, failed }
}

// Main execution
const result = createBackup()
process.exit(result.failed > 0 ? 1 : 0)
