const fs = require("fs")
const path = require("path")

try {
  const libpqPath = path.join(process.cwd(), "node_modules", "libpq")

  if (fs.existsSync(libpqPath)) {
    console.log("[v0] Removing libpq native bindings for serverless compatibility...")
    fs.rmSync(libpqPath, { recursive: true, force: true })
    console.log("[v0] Successfully removed libpq - pg will use pure JavaScript implementation")
  } else {
    console.log("[v0] libpq not found - already using pure JavaScript pg implementation")
  }
} catch (error) {
  console.log("[v0] Note: Could not remove libpq, but pg will still work with pure JavaScript:", error.message)
}
