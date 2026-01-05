#!/usr/bin/env node

const { Pool } = require("pg")
const fs = require("fs").promises
const path = require("path")

/**
 * Migration Runner with Prefix Support
 *
 * Runs all SQL migrations and applies table prefix from configuration
 */

async function loadPrefixConfig() {
  try {
    const configPath = path.join(process.cwd(), "data", "db-prefix-config.json")
    const data = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(data)
    return config.prefix
  } catch (error) {
    console.warn("No prefix config found, using default: cts_v3_1_")
    return "cts_v3_1_"
  }
}

function applyPrefixToSQL(sql, prefix) {
  return (
    sql
      // CREATE TABLE statements
      .replace(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `CREATE TABLE IF NOT EXISTS ${prefix}${tableName}`
      })
      .replace(/CREATE TABLE\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `CREATE TABLE ${prefix}${tableName}`
      })
      // ALTER TABLE statements
      .replace(/ALTER TABLE\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `ALTER TABLE ${prefix}${tableName}`
      })
      // FOREIGN KEY references
      .replace(/REFERENCES\s+([a-z_]+)\s*\(/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `REFERENCES ${prefix}${tableName}(`
      })
      // CREATE INDEX statements
      .replace(/CREATE INDEX\s+([a-z_]+)\s+ON\s+([a-z_]+)/gi, (match, indexName, tableName) => {
        if (indexName.startsWith(prefix) && tableName.startsWith(prefix)) return match
        return `CREATE INDEX ${prefix}${indexName} ON ${prefix}${tableName}`
      })
      // INSERT INTO statements
      .replace(/INSERT INTO\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `INSERT INTO ${prefix}${tableName}`
      })
      // UPDATE statements
      .replace(/UPDATE\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `UPDATE ${prefix}${tableName}`
      })
      // DELETE FROM statements
      .replace(/DELETE FROM\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `DELETE FROM ${prefix}${tableName}`
      })
      // SELECT FROM statements
      .replace(/FROM\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `FROM ${prefix}${tableName}`
      })
      // JOIN statements
      .replace(/JOIN\s+([a-z_]+)/gi, (match, tableName) => {
        if (tableName.startsWith(prefix)) return match
        return `JOIN ${prefix}${tableName}`
      })
  )
}

async function runMigrations() {
  console.log("=".repeat(60))
  console.log("CTS v3.1 Database Migrations with Prefix")
  console.log("=".repeat(60))
  console.log()

  const prefix = await loadPrefixConfig()
  console.log(`Using table prefix: ${prefix}`)
  console.log()

  const databaseUrl = process.env.DATABASE_URL || process.env.REMOTE_POSTGRES_URL
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL not configured")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applied_by VARCHAR(255) DEFAULT CURRENT_USER,
        prefix VARCHAR(255) DEFAULT '${prefix}'
      )
    `)

    const scriptsDir = path.join(process.cwd(), "scripts")
    const files = await fs.readdir(scriptsDir)
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort()

    console.log(`Found ${sqlFiles.length} migration files`)
    console.log()

    for (const file of sqlFiles) {
      const version = file.replace(".sql", "")

      const { rows } = await pool.query(`SELECT version FROM ${prefix}schema_migrations WHERE version = $1`, [version])

      if (rows.length > 0) {
        console.log(`⊘ Skipping ${file} (already applied)`)
        continue
      }

      console.log(`→ Applying ${file}...`)

      const sqlPath = path.join(scriptsDir, file)
      let sql = await fs.readFile(sqlPath, "utf-8")

      sql = applyPrefixToSQL(sql, prefix)

      try {
        await pool.query(sql)

        await pool.query(`INSERT INTO ${prefix}schema_migrations (version, prefix) VALUES ($1, $2)`, [version, prefix])

        console.log(`✓ Applied ${file}`)
      } catch (error) {
        console.error(`✗ Error applying ${file}:`, error.message)
        throw error
      }
    }

    console.log()
    console.log("✓ All migrations completed successfully")
    console.log()

    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM ${prefix}schema_migrations`)
    console.log(`Total migrations applied: ${rows[0].count}`)
  } catch (error) {
    console.error("Migration error:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations().catch(console.error)
