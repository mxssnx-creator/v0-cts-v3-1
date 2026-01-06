#!/usr/bin/env bun
import { mkdir, readdir, copyFile, writeFile, rm } from "fs/promises"
import { join, relative } from "path"
import { existsSync } from "fs"

const BACKUP_DIR = "backups/latest"
const PROJECT_ROOT = process.cwd()

// Files and directories to exclude from backup
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".next",
  ".vercel",
  ".git",
  "backups",
  ".turbo",
  "dist",
  "build",
  ".env.local",
  "*.log",
]

function shouldExclude(path: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace("*", ".*"))
      return regex.test(path)
    }
    return path.includes(pattern)
  })
}

async function getAllFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = relative(PROJECT_ROOT, fullPath)

    if (shouldExclude(relativePath)) continue

    if (entry.isDirectory()) {
      await getAllFiles(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }

  return files
}

async function createBackup() {
  console.log("🔄 Creating project backup...")

  // Remove old backup
  if (existsSync(BACKUP_DIR)) {
    console.log("🗑️  Removing old backup...")
    await rm(BACKUP_DIR, { recursive: true, force: true })
  }

  // Create backup directory
  await mkdir(BACKUP_DIR, { recursive: true })

  // Get all files
  console.log("📁 Scanning project files...")
  const files = await getAllFiles(PROJECT_ROOT)

  // Copy files
  console.log(`📦 Backing up ${files.length} files...`)
  let backedUp = 0

  for (const file of files) {
    const relativePath = relative(PROJECT_ROOT, file)
    const backupPath = join(BACKUP_DIR, relativePath)

    // Create directory structure
    await mkdir(join(backupPath, ".."), { recursive: true })

    // Copy file
    await copyFile(file, backupPath)
    backedUp++

    if (backedUp % 100 === 0) {
      console.log(`  ${backedUp}/${files.length} files backed up...`)
    }
  }

  // Create metadata
  const metadata = {
    created: new Date().toISOString(),
    totalFiles: files.length,
    excludedPatterns: EXCLUDE_PATTERNS,
    message: "Complete project backup - can be used to restore any file/section",
  }

  await writeFile(join(BACKUP_DIR, "BACKUP_INFO.json"), JSON.stringify(metadata, null, 2))

  console.log(`✅ Backup complete! ${files.length} files backed up to ${BACKUP_DIR}`)
  console.log(`📝 Created at: ${metadata.created}`)
}

createBackup().catch(console.error)
