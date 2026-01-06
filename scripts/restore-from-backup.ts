#!/usr/bin/env bun
import { copyFile, readFile } from "fs/promises"
import { join, dirname } from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"

const BACKUP_DIR = "backups/latest"
const PROJECT_ROOT = process.cwd()

async function restoreFile(filePath: string) {
  const backupPath = join(BACKUP_DIR, filePath)
  const targetPath = join(PROJECT_ROOT, filePath)

  if (!existsSync(backupPath)) {
    console.error(`❌ File not found in backup: ${filePath}`)
    return false
  }

  // Create directory if needed
  await mkdir(dirname(targetPath), { recursive: true })

  // Copy file
  await copyFile(backupPath, targetPath)
  console.log(`✅ Restored: ${filePath}`)
  return true
}

async function listBackupFiles(pattern?: string) {
  const metadataPath = join(BACKUP_DIR, "BACKUP_INFO.json")

  if (!existsSync(metadataPath)) {
    console.error("❌ No backup found")
    return
  }

  const metadata = JSON.parse(await readFile(metadataPath, "utf-8"))
  console.log(`\n📦 Backup created: ${metadata.created}`)
  console.log(`📁 Total files: ${metadata.totalFiles}`)
  console.log(`\nUse: bun scripts/restore-from-backup.ts <file-path>`)
}

async function main() {
  const filePath = process.argv[2]

  if (!filePath) {
    await listBackupFiles()
    return
  }

  await restoreFile(filePath)
}

main().catch(console.error)
