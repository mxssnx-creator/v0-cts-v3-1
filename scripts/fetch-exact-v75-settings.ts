#!/usr/bin/env bun

/**
 * Fetch the exact settings page from v75 commit
 * Commit: b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958
 */

import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import Bun from "bun" // Declare Bun variable

const COMMIT_HASH = "b8c8a3ce27ff6169ed0c2e1a096cd1aa5063e958"
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-1/${COMMIT_HASH}/app/settings/page.tsx`

async function fetchV75Settings() {
  console.log("🔄 Fetching v75 settings page from GitHub...")
  console.log(`📍 URL: ${GITHUB_RAW_URL}`)

  try {
    const response = await fetch(GITHUB_RAW_URL, {
      headers: {
        "User-Agent": "CTS-Build-System",
        Accept: "text/plain",
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}: ${response.statusText}`)
    }

    const content = await response.text()

    if (!content || content.length < 100) {
      throw new Error("Fetched content is empty or too short")
    }

    console.log(`✅ Fetched ${content.length} characters from v75`)

    const settingsDir = join(process.cwd(), "app", "settings")
    if (!existsSync(settingsDir)) {
      mkdirSync(settingsDir, { recursive: true })
    }

    const settingsPath = join(settingsDir, "page.tsx")
    if (existsSync(settingsPath)) {
      const backupPath = join(process.cwd(), "backups", "latest", "app", "settings")
      if (!existsSync(backupPath)) {
        mkdirSync(backupPath, { recursive: true })
      }
      const currentContent = await Bun.file(settingsPath).text()
      await Bun.write(join(backupPath, "page.tsx"), currentContent)
      console.log("📦 Backed up current settings to backups/latest/")
    }

    // Write the exact original file
    await Bun.write(settingsPath, content)

    console.log("✅ Successfully restored v75 settings page")
    console.log("📁 File: app/settings/page.tsx")
    console.log("🎯 Next build will use the original v75 design")
  } catch (error) {
    console.error("❌ Failed to fetch v75 settings:", error)
    console.log("⚠️  Build will continue with current settings page")
    process.exit(0)
  }
}

fetchV75Settings()
