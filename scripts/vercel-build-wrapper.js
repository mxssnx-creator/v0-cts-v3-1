#!/usr/bin/env node

console.log("🔨 Starting Next.js build...\n")

const { execSync } = require("child_process")

try {
  // Run next build with full output
  execSync("next build", {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  })

  console.log("\n✅ Build completed successfully!")
  process.exit(0)
} catch (error) {
  console.error("\n❌ Build failed!")
  console.error("Exit code:", error.status)
  console.error("Error:", error.message)

  if (error.stderr) {
    console.error("STDERR:", error.stderr.toString())
  }
  if (error.stdout) {
    console.error("STDOUT:", error.stdout.toString())
  }

  process.exit(error.status || 1)
}
