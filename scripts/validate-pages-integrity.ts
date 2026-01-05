#!/usr/bin/env bun

/**
 * Page Integrity Validation System
 * Ensures all critical pages remain intact and uncorrupted
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

// Critical pages that must NEVER be corrupted
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

interface ValidationResult {
  file: string
  exists: boolean
  size: number
  hasExportDefault: boolean
  hasPlaceholders: boolean
  isCorrupted: boolean
  issues: string[]
}

/**
 * Check if a file contains placeholder variables indicating corruption
 */
function hasPlaceholderVariables(content: string): boolean {
  const placeholderPatterns = [
    /\$\{[A-Z_]+\}/g, // ${VARIABLE}
    /\{\{[A-Z_]+\}\}/g, // {{VARIABLE}}
    /%%%[A-Z_]+%%%/g, // %%%VARIABLE%%%
    /<PLACEHOLDER>/gi,
    /\[PLACEHOLDER\]/gi,
  ]

  return placeholderPatterns.some((pattern) => pattern.test(content))
}

/**
 * Validate a single page file
 */
function validatePage(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: filePath,
    exists: false,
    size: 0,
    hasExportDefault: false,
    hasPlaceholders: false,
    isCorrupted: false,
    issues: [],
  }

  try {
    const fullPath = resolve(process.cwd(), filePath)

    if (!existsSync(fullPath)) {
      result.issues.push("FILE MISSING")
      result.isCorrupted = true
      return result
    }

    result.exists = true
    const content = readFileSync(fullPath, "utf-8")
    result.size = content.length

    // Check for minimum file size (empty or near-empty files are suspicious)
    if (content.length < 100) {
      result.issues.push("FILE TOO SMALL (< 100 bytes)")
      result.isCorrupted = true
    }

    // Check for export default
    result.hasExportDefault = /export\s+default\s+(function|const)/i.test(content)
    if (!result.hasExportDefault) {
      result.issues.push("MISSING EXPORT DEFAULT")
      result.isCorrupted = true
    }

    // Check for placeholder variables
    result.hasPlaceholders = hasPlaceholderVariables(content)
    if (result.hasPlaceholders) {
      result.issues.push("CONTAINS PLACEHOLDER VARIABLES")
      result.isCorrupted = true
    }

    // Check if file is just comments or whitespace
    const codeContent = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*/g, "") // Remove line comments
      .trim()

    if (codeContent.length < 50) {
      result.issues.push("FILE MOSTLY EMPTY OR COMMENTS")
      result.isCorrupted = true
    }

    // Check for React/Next.js imports (should have at least some)
    if (!content.includes("import") && !content.includes("require")) {
      result.issues.push("NO IMPORTS FOUND")
      result.isCorrupted = true
    }

    // Check for JSX (page should return JSX)
    if (!content.includes("return") || (!content.includes("<") && !content.includes(">"))) {
      result.issues.push("NO JSX CONTENT FOUND")
      result.isCorrupted = true
    }
  } catch (error) {
    result.issues.push(`ERROR READING FILE: ${error}`)
    result.isCorrupted = true
  }

  return result
}

/**
 * Validate all critical pages
 */
function validateAllPages(): ValidationResult[] {
  const results: ValidationResult[] = []

  console.log("🔍 Validating Page Integrity...\n")

  for (const page of CRITICAL_PAGES) {
    const result = validatePage(page)
    results.push(result)

    if (result.isCorrupted) {
      console.error(`❌ ${page}`)
      result.issues.forEach((issue) => console.error(`   - ${issue}`))
    } else {
      console.log(`✅ ${page} (${result.size} bytes)`)
    }
  }

  return results
}

/**
 * Generate integrity report
 */
function generateReport(results: ValidationResult[]): string {
  const timestamp = new Date().toISOString()
  const corrupted = results.filter((r) => r.isCorrupted)
  const intact = results.filter((r) => !r.isCorrupted)

  let report = `# Page Integrity Report
Generated: ${timestamp}

## Summary
- Total Pages: ${results.length}
- ✅ Intact: ${intact.length}
- ❌ Corrupted: ${corrupted.length}

`

  if (corrupted.length > 0) {
    report += `## 🚨 CORRUPTED PAGES\n\n`
    corrupted.forEach((result) => {
      report += `### ${result.file}\n`
      report += `- Exists: ${result.exists}\n`
      report += `- Size: ${result.size} bytes\n`
      report += `- Has Export: ${result.hasExportDefault}\n`
      report += `- Issues:\n`
      result.issues.forEach((issue) => {
        report += `  - ${issue}\n`
      })
      report += `\n`
    })
  }

  if (intact.length > 0) {
    report += `## ✅ INTACT PAGES\n\n`
    intact.forEach((result) => {
      report += `- ${result.file} (${result.size} bytes)\n`
    })
  }

  return report
}

// Main execution
const results = validateAllPages()
const report = generateReport(results)

// Write report
writeFileSync("PAGE_INTEGRITY_REPORT.md", report)
console.log(`\n📄 Report saved to: PAGE_INTEGRITY_REPORT.md`)

// Exit with error code if any pages are corrupted
const corruptedCount = results.filter((r) => r.isCorrupted).length
if (corruptedCount > 0) {
  console.error(`\n❌ ${corruptedCount} corrupted page(s) detected!`)
  process.exit(1)
} else {
  console.log(`\n✅ All pages are intact!`)
  process.exit(0)
}
