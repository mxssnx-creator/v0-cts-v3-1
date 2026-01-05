#!/usr/bin/env node

/**
 * Migration Generator with Dynamic Table Prefix Support
 * Creates new migration files with proper project-specific naming
 */

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

function loadDatabaseConfig() {
  try {
    const configPath = path.join(process.cwd(), "db-config.json")
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"))
    }
  } catch (error) {
    console.warn("Could not load db-config.json, using defaults")
  }

  // Fallback to environment variables or defaults
  const projectName = process.env.PROJECT_NAME || "cts"
  const version = process.env.PROJECT_VERSION || "v3_1"

  return {
    projectName,
    version,
    dbPrefix: `${projectName}_${version}`,
  }
}

function getNextMigrationNumber() {
  const scriptsDir = path.join(process.cwd(), "scripts")
  const files = fs.readdirSync(scriptsDir)

  const migrationNumbers = files
    .filter((f) => f.match(/^\d{3}_.*\.sql$/))
    .map((f) => Number.parseInt(f.slice(0, 3)))
    .sort((a, b) => a - b)

  const lastNumber = migrationNumbers.length > 0 ? migrationNumbers[migrationNumbers.length - 1] : 0
  return String(lastNumber + 1).padStart(3, "0")
}

function generateMigrationTemplate(migrationNumber, tableName, config) {
  const fullTableName = `${config.dbPrefix}_${tableName}`
  const date = new Date().toISOString().split("T")[0]

  return `-- Migration ${migrationNumber}: Create ${fullTableName}
-- Project: ${config.projectName} ${config.version}
-- Created: ${date}
-- Description: Creates the ${tableName} table with project prefix

-- =============================================================================
-- CREATE TABLE: ${fullTableName}
-- =============================================================================

CREATE TABLE IF NOT EXISTS ${fullTableName} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- Add your columns here
);

-- =============================================================================
-- INDEXES FOR: ${fullTableName}
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_${fullTableName}_created_at 
  ON ${fullTableName}(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_${fullTableName}_updated_at 
  ON ${fullTableName}(updated_at DESC);

-- Add additional indexes as needed

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE ${fullTableName} IS 'Table for ${tableName} - ${config.projectName} ${config.version}';
COMMENT ON COLUMN ${fullTableName}.id IS 'Primary key';
COMMENT ON COLUMN ${fullTableName}.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN ${fullTableName}.updated_at IS 'Record last update timestamp';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
`
}

async function main() {
  console.log("=".repeat(70))
  console.log("📝 Migration Generator")
  console.log("=".repeat(70))
  console.log()

  const config = loadDatabaseConfig()
  console.log(`Project: ${config.projectName} ${config.version}`)
  console.log(`Database Prefix: ${config.dbPrefix}`)
  console.log()

  const tableName = await askQuestion("Table name (without prefix): ")
  if (!tableName) {
    console.error("Table name is required")
    process.exit(1)
  }

  const migrationNumber = getNextMigrationNumber()
  const fileName = `${migrationNumber}_create_${tableName}_table.sql`
  const filePath = path.join(process.cwd(), "scripts", fileName)

  if (fs.existsSync(filePath)) {
    console.error(`Migration ${fileName} already exists!`)
    process.exit(1)
  }

  const migrationContent = generateMigrationTemplate(migrationNumber, tableName, config)
  fs.writeFileSync(filePath, migrationContent)

  console.log()
  console.log("✅ Migration created successfully!")
  console.log()
  console.log(`   File: ${fileName}`)
  console.log(`   Table: ${config.dbPrefix}_${tableName}`)
  console.log()
  console.log("Next steps:")
  console.log(`   1. Edit the migration file: scripts/${fileName}`)
  console.log("   2. Add your table columns and constraints")
  console.log("   3. Run migrations: npm run db:migrate")
  console.log()

  rl.close()
}

main().catch((error) => {
  console.error("Failed to create migration:", error)
  process.exit(1)
})
