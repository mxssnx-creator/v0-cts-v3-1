#!/usr/bin/env node

/**
 * Creates a dummy pg_config to allow libpq build to proceed
 * This is needed because Vercel's build environment doesn't have PostgreSQL dev headers
 * The pg package will fall back to pure JavaScript implementation
 */

const fs = require("fs")
const path = require("path")
const os = require("os")

try {
  // Create a temporary directory for our dummy pg_config
  const tmpDir = path.join(os.tmpdir(), "pg-dummy-bin")

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  // Create a dummy pg_config script that returns minimal valid output
  const pgConfigPath = path.join(tmpDir, "pg_config")
  const pgConfigScript = `#!/bin/sh
# Dummy pg_config for serverless builds
case "$1" in
  --version) echo "PostgreSQL 14.0" ;;
  --includedir) echo "/usr/include/postgresql" ;;
  --libdir) echo "/usr/lib" ;;
  --pkglibdir) echo "/usr/lib/postgresql" ;;
  --bindir) echo "/usr/bin" ;;
  *) echo "" ;;
esac
exit 0
`

  fs.writeFileSync(pgConfigPath, pgConfigScript, { mode: 0o755 })

  // Add to PATH
  process.env.PATH = `${tmpDir}:${process.env.PATH}`

  console.log("[v0] Created dummy pg_config for serverless build")
  console.log("[v0] PATH updated:", tmpDir)
} catch (error) {
  console.warn("[v0] Warning: Could not create dummy pg_config:", error.message)
  console.warn("[v0] Build may fail if libpq tries to compile")
}
