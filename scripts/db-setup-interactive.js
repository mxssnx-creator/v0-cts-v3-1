#!/usr/bin/env node

/**
 * Interactive Database Setup
 * Prompts for project name and creates custom database configuration
 */

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve))

function generateSetupSQL(projectName, version) {
  const dbPrefix = `${projectName}_${version.replace(/\./g, "_")}`
  const adminUser = `${dbPrefix}_admin`
  const appUser = `${dbPrefix}_app`

  return `-- ${projectName.toUpperCase()} ${version} - Initial Database Setup Script
-- Generated on: ${new Date().toISOString()}
-- Project: ${projectName}
-- Database Prefix: ${dbPrefix}

-- =============================================================================
-- 1. CREATE DEDICATED DATABASE USERS
-- =============================================================================

DROP USER IF EXISTS ${adminUser};
DROP USER IF EXISTS ${appUser};

CREATE USER ${adminUser} WITH
  PASSWORD '${projectName}_Admin_Pass_2025!'
  CREATEDB
  CREATEROLE
  LOGIN;

CREATE USER ${appUser} WITH
  PASSWORD '${projectName}_App_Pass_2025!'
  LOGIN;

COMMENT ON ROLE ${adminUser} IS '${projectName} ${version} administrative user';
COMMENT ON ROLE ${appUser} IS '${projectName} ${version} application user';

-- =============================================================================
-- 2. CREATE DATABASES WITH PROJECT PREFIX
-- =============================================================================

DROP DATABASE IF EXISTS ${dbPrefix}_main;
DROP DATABASE IF EXISTS ${dbPrefix}_indication_active;
DROP DATABASE IF EXISTS ${dbPrefix}_indication_direction;
DROP DATABASE IF EXISTS ${dbPrefix}_indication_move;
DROP DATABASE IF EXISTS ${dbPrefix}_strategy_simple;
DROP DATABASE IF EXISTS ${dbPrefix}_strategy_advanced;
DROP DATABASE IF EXISTS ${dbPrefix}_strategy_step;

-- Main database
CREATE DATABASE ${dbPrefix}_main
  WITH
  OWNER = ${adminUser}
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Indication-specific databases
CREATE DATABASE ${dbPrefix}_indication_active WITH OWNER = ${adminUser} ENCODING = 'UTF8';
CREATE DATABASE ${dbPrefix}_indication_direction WITH OWNER = ${adminUser} ENCODING = 'UTF8';
CREATE DATABASE ${dbPrefix}_indication_move WITH OWNER = ${adminUser} ENCODING = 'UTF8';

-- Strategy-specific databases
CREATE DATABASE ${dbPrefix}_strategy_simple WITH OWNER = ${adminUser} ENCODING = 'UTF8';
CREATE DATABASE ${dbPrefix}_strategy_advanced WITH OWNER = ${adminUser} ENCODING = 'UTF8';
CREATE DATABASE ${dbPrefix}_strategy_step WITH OWNER = ${adminUser} ENCODING = 'UTF8';

-- =============================================================================
-- 3. GRANT PERMISSIONS
-- =============================================================================

GRANT CONNECT ON DATABASE ${dbPrefix}_main TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_indication_active TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_indication_direction TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_indication_move TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_strategy_simple TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_strategy_advanced TO ${appUser};
GRANT CONNECT ON DATABASE ${dbPrefix}_strategy_step TO ${appUser};

\\c ${dbPrefix}_main;
GRANT USAGE ON SCHEMA public TO ${appUser};
ALTER DEFAULT PRIVILEGES FOR ROLE ${adminUser} IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser};
ALTER DEFAULT PRIVILEGES FOR ROLE ${adminUser} IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${appUser};

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

SELECT 'Setup Complete!' as status,
       '${adminUser}' as admin_user,
       '${appUser}' as app_user,
       '7 databases created' as info;
`
}

function generateMigrationSQL(projectName, version, migrationNumber, tableName, tableDefinition) {
  const dbPrefix = `${projectName}_${version.replace(/\./g, "_")}`
  const fullTableName = `${dbPrefix}_${tableName}`

  return `-- Migration ${migrationNumber}: Create ${fullTableName}
-- Project: ${projectName} ${version}

CREATE TABLE IF NOT EXISTS ${fullTableName} (
  ${tableDefinition}
);

-- Indexes for ${fullTableName}
CREATE INDEX IF NOT EXISTS idx_${fullTableName}_created_at ON ${fullTableName}(created_at);
`
}

async function runPsqlScript(scriptPath, connectionString, dbName = "postgres") {
  return new Promise((resolve, reject) => {
    console.log(`\n   → Running: ${path.basename(scriptPath)}`)

    const url = new URL(connectionString.replace("postgresql://", "postgres://"))
    const psqlArgs = [
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      scriptPath,
      "-h",
      url.hostname,
      "-p",
      url.port || "5432",
      "-U",
      url.username,
      "-d",
      dbName,
    ]

    const proc = spawn("psql", psqlArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PGPASSWORD: url.password,
      },
    })

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
      process.stdout.write("      " + data.toString())
    })

    proc.stderr.on("data", (data) => {
      stderr += data.toString()
      if (data.toString().includes("ERROR")) {
        process.stderr.write("      " + data.toString())
      }
    })

    proc.on("exit", (code) => {
      if (code === 0) {
        console.log(`   ✅ Completed: ${path.basename(scriptPath)}`)
        resolve({ code, stdout, stderr })
      } else {
        console.error(`   ❌ Failed: ${path.basename(scriptPath)}`)
        reject(new Error(`Script failed with code ${code}\n${stderr}`))
      }
    })

    proc.on("error", reject)
  })
}

async function main() {
  console.log("=".repeat(70))
  console.log("🚀 Interactive Database Setup")
  console.log("=".repeat(70))
  console.log()

  // Get project information
  const projectName = (await askQuestion("Project Name (default: cts): ")) || "cts"
  const version = (await askQuestion("Version (default: v3.1): ")) || "v3.1"

  const dbPrefix = `${projectName}_${version.replace(/\./g, "_")}`

  console.log()
  console.log("📋 Configuration Summary:")
  console.log(`   Project: ${projectName}`)
  console.log(`   Version: ${version}`)
  console.log(`   Database Prefix: ${dbPrefix}`)
  console.log(`   Main Database: ${dbPrefix}_main`)
  console.log(`   Admin User: ${dbPrefix}_admin`)
  console.log(`   App User: ${dbPrefix}_app`)
  console.log()

  const confirm = await askQuestion("Proceed with this configuration? (yes/no): ")
  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("Setup cancelled.")
    process.exit(0)
  }

  // Save configuration
  const config = {
    projectName,
    version,
    dbPrefix,
    databases: {
      main: `${dbPrefix}_main`,
      indicationActive: `${dbPrefix}_indication_active`,
      indicationDirection: `${dbPrefix}_indication_direction`,
      indicationMove: `${dbPrefix}_indication_move`,
      strategySimple: `${dbPrefix}_strategy_simple`,
      strategyAdvanced: `${dbPrefix}_strategy_advanced`,
      strategyStep: `${dbPrefix}_strategy_step`,
    },
    users: {
      admin: `${dbPrefix}_admin`,
      app: `${dbPrefix}_app`,
    },
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(path.join(process.cwd(), "db-config.json"), JSON.stringify(config, null, 2))
  console.log("\n✅ Configuration saved to db-config.json")

  // Get PostgreSQL connection info
  console.log()
  console.log("📝 PostgreSQL Superuser Connection")
  const pgHost = (await askQuestion("Host (default: localhost): ")) || "localhost"
  const pgPort = (await askQuestion("Port (default: 5432): ")) || "5432"
  const pgUser = (await askQuestion("Superuser (default: postgres): ")) || "postgres"
  const pgPass = await askQuestion("Password: ")

  if (!pgPass) {
    console.error("\n❌ Password required")
    process.exit(1)
  }

  const connectionString = `postgresql://${pgUser}:${encodeURIComponent(pgPass)}@${pgHost}:${pgPort}/postgres`

  // Generate and run setup script
  console.log()
  console.log("🗄️  Creating Database Infrastructure...")

  const setupSQL = generateSetupSQL(projectName, version.replace(/\./g, "_"))
  const setupScriptPath = path.join(__dirname, `${dbPrefix}_setup.sql`)
  fs.writeFileSync(setupScriptPath, setupSQL)

  try {
    await runPsqlScript(setupScriptPath, connectionString, "postgres")
    console.log("\n✅ Database setup complete!")
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message)
    process.exit(1)
  }

  // Update .env.local with connection strings
  const envContent = `
# Database Configuration - ${projectName} ${version}
# Generated: ${new Date().toISOString()}

DATABASE_URL=postgresql://${dbPrefix}_app:${projectName}_App_Pass_2025!@${pgHost}:${pgPort}/${dbPrefix}_main
REMOTE_POSTGRES_URL=postgresql://${dbPrefix}_admin:${projectName}_Admin_Pass_2025!@${pgHost}:${pgPort}/${dbPrefix}_main

PROJECT_NAME=${projectName}
PROJECT_VERSION=${version.replace(/\./g, "_")}
`

  fs.writeFileSync(path.join(process.cwd(), ".env.local"), envContent)
  console.log("✅ .env.local updated with connection strings")

  console.log()
  console.log("=".repeat(70))
  console.log("✅ Setup Complete!")
  console.log("=".repeat(70))
  console.log()
  console.log("Next steps:")
  console.log("  1. Review db-config.json")
  console.log("  2. Run migrations: npm run db:migrate")
  console.log("  3. Start application: npm run dev")
  console.log()

  rl.close()
}

main().catch((error) => {
  console.error("Setup failed:", error)
  process.exit(1)
})
