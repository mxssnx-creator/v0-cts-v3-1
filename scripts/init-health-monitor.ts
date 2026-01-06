#!/usr/bin/env bun
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const HEALTH_DIR = path.join(DATA_DIR, "health")
const LOGS_DIR = path.join(process.cwd(), "logs", "health")

async function initHealthMonitor() {
  console.log("Initializing health monitor file structure...")

  // Create directories
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(HEALTH_DIR, { recursive: true })
  await fs.mkdir(LOGS_DIR, { recursive: true })

  // Create initial data files with default values
  const defaultFiles = [
    {
      path: path.join(DATA_DIR, "connections.json"),
      content: { connections: [], updated: new Date().toISOString() },
    },
    {
      path: path.join(DATA_DIR, "engine-state.json"),
      content: { engines: [], updated: new Date().toISOString() },
    },
    {
      path: path.join(DATA_DIR, "database.json"),
      content: { type: "postgres", status: "operational", updated: new Date().toISOString() },
    },
    {
      path: path.join(DATA_DIR, "position-sync.json"),
      content: { connections: [], updated: new Date().toISOString() },
    },
    {
      path: path.join(HEALTH_DIR, "status.json"),
      content: { checks: [], updated: new Date().toISOString() },
    },
  ]

  for (const file of defaultFiles) {
    try {
      await fs.access(file.path)
      console.log(`✓ ${path.basename(file.path)} already exists`)
    } catch {
      await fs.writeFile(file.path, JSON.stringify(file.content, null, 2))
      console.log(`✓ Created ${path.basename(file.path)}`)
    }
  }

  // Create README in data directory
  const readme = `# Health Monitor Data Directory

This directory contains file-based health monitoring data for the CTS system.

## Files:
- \`connections.json\` - Exchange connection states
- \`engine-state.json\` - Trade engine states
- \`database.json\` - Database health information
- \`position-sync.json\` - Position synchronization status
- \`health/status.json\` - Latest health check results
- \`health/cache.json\` - Cached health check results (auto-generated)

## Logs:
Health logs are stored in \`logs/health/\` directory with daily rotation.

## Updates:
These files are automatically updated by the system health monitor.
Manual editing is not recommended but safe if the system is stopped.
`

  await fs.writeFile(path.join(DATA_DIR, "README.md"), readme)

  console.log("\n✅ Health monitor initialization complete!")
  console.log(`   Data directory: ${DATA_DIR}`)
  console.log(`   Logs directory: ${LOGS_DIR}`)
}

initHealthMonitor().catch(console.error)
