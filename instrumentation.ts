export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("\n" + "=".repeat(60))
    console.log("[v0] CTS v3.1 - SYSTEM INITIALIZATION")
    console.log("=".repeat(60))
    console.log("[v0] Runtime:", process.env.NEXT_RUNTIME)
    const dbUrl = process.env.DATABASE_URL
    const dbType = dbUrl ? (dbUrl.startsWith("postgres") ? "PostgreSQL" : "Unknown") : "SQLite"
    console.log("[v0] Database:", dbType)
    console.log("=".repeat(60))

    // Step 1: Database initialization (non-blocking)
    try {
      console.log("\n[v0] Initializing database...")
      
      const { getClient, getDatabaseType } = await import("./lib/db")
      const actualDbType = getDatabaseType()
      console.log("[v0] Database type:", actualDbType)
      
      const startTime = Date.now()
      
      // Initialize database client (this is now fast and non-blocking)
      const client = getClient()
      
      if (actualDbType === "sqlite") {
        // For SQLite, verify critical tables exist and create if missing
        try {
          const client = getClient() as any
          
          // Check if critical tables exist
          const checkTable = (tableName: string) => {
            try {
              const result = client.prepare(
                "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?"
              ).get(tableName)
              return result.count > 0
            } catch {
              return false
            }
          }
          
          const criticalTables = ['trade_engine_state', 'indications', 'preset_types', 'preset_type_sets']
          const missingTables = criticalTables.filter(table => !checkTable(table))
          
          if (missingTables.length > 0) {
            console.log(`[v0] Missing critical tables: ${missingTables.join(', ')}`)
            console.log("[v0] Running full database initialization...")
            
            const fs = await import("fs")
            const path = await import("path")
            const sqlPath = path.join(process.cwd(), "scripts", "unified_complete_setup.sql")
            
            if (fs.existsSync(sqlPath)) {
              console.log("[v0] Reading unified_complete_setup.sql...")
              let sql = fs.readFileSync(sqlPath, "utf-8")
              
              console.log(`[v0] SQL file loaded: ${(sql.length / 1024).toFixed(1)}KB, ${sql.split('\n').length} lines`)
              
              try {
                // Execute the SQL file - split into statements for better error handling
                const startExec = Date.now()
                console.log("[v0] Executing SQL initialization script...")
                
                // Remove comments and split into statements
                const statements = sql
                  .split('\n')
                  .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
                  .join('\n')
                  .split(';')
                  .map(s => s.trim())
                  .filter(s => s.length > 10) // Filter out tiny fragments
                
                console.log(`[v0] Processing ${statements.length} SQL statements...`)
                
                let executed = 0
                let skipped = 0
                let errors = 0
                
                for (let i = 0; i < statements.length; i++) {
                  const stmt = statements[i]
                  const stmtPreview = stmt.substring(0, 50).replace(/\s+/g, ' ')
                  
                  try {
                    client.prepare(stmt).run()
                    executed++
                    if ((executed + skipped) % 50 === 0) {
                      console.log(`[v0] Progress: ${executed} executed, ${skipped} skipped...`)
                    }
                  } catch (stmtError: any) {
                    const errorMsg = stmtError.message || String(stmtError)
                    
                    // Skip if table/index already exists - this is normal
                    if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                      skipped++
                    } else {
                      errors++
                      if (errors <= 5) { // Only log first 5 errors
                        console.warn(`[v0] Statement ${i + 1} error: ${errorMsg.substring(0, 80)}`)
                        console.warn(`[v0] Statement preview: ${stmtPreview}`)
                      }
                    }
                  }
                }
                
                const execDuration = Date.now() - startExec
                console.log(`[v0] ✅ Database initialized in ${execDuration}ms`)
                console.log(`[v0]   - Executed: ${executed} statements`)
                console.log(`[v0]   - Skipped: ${skipped} (already exists)`)
                console.log(`[v0]   - Errors: ${errors}`)
                console.log()
                
                // Verify tables were actually created
                const allTables = client.prepare(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ).all()
                console.log(`[v0] Database now has ${allTables.length} tables`)
              } catch (execError) {
                console.error("[v0] ❌ SQL execution error:", execError)
                console.error("[v0] Error details:", execError instanceof Error ? execError.message : String(execError))
                console.error("[v0] This will cause missing table errors throughout the application")
              }
              
              // Verify tables were created
              const stillMissing = criticalTables.filter(table => !checkTable(table))
              if (stillMissing.length > 0) {
                console.warn(`[v0] WARNING: Some tables still missing: ${stillMissing.join(', ')}`)
              } else {
                console.log("[v0] All critical tables verified")
                
                // Record migrations in migrations table
                try {
                  // Check if migrations table exists
                  const hasMigrationsTable = checkTable('migrations')
                  
                  if (hasMigrationsTable) {
                    // Record each executed statement as a migration
                    const statements = sql
                      .split(';')
                      .map(s => s.trim())
                      .filter(s => s.length > 0 && !s.startsWith('--'))
                    
                    let recorded = 0
                    for (let i = 0; i < statements.length; i++) {
                      try {
                        const stmt = statements[i]
                        const stmtType = stmt.split(/\s+/)[0].toUpperCase()
                        const stmtPreview = stmt.substring(0, 50).replace(/\s+/g, ' ')
                        const migrationName = `init_${i.toString().padStart(3, '0')}_${stmtType}_${stmtPreview.substring(0, 40)}`
                        
                        // Check if already recorded
                        const exists = client.prepare(
                          "SELECT COUNT(*) as count FROM migrations WHERE name = ?"
                        ).get(migrationName)
                        
                        if (exists.count === 0) {
                          client.prepare(
                            "INSERT INTO migrations (name, executed_at) VALUES (?, CURRENT_TIMESTAMP)"
                          ).run(migrationName)
                          recorded++
                        }
                      } catch (migError) {
                        // Silently skip migration tracking errors
                      }
                    }
                    
                    if (recorded > 0) {
                      console.log(`[v0] Recorded ${recorded} migrations`)
                    }
                  }
                } catch (migError) {
                  console.warn("[v0] Failed to record migrations:", migError)
                }
              }
            } else {
              console.warn("[v0] unified_complete_setup.sql not found")
            }
          } else {
            console.log("[v0] All critical tables exist - skipping initialization")
          }
        } catch (sqlError) {
          console.error("[v0] Database initialization error:", sqlError)
        }
      } else {
        // For PostgreSQL, use migration runner
        const { runAllMigrations } = await import("./lib/db-migration-runner")
        const result = await runAllMigrations()
        console.log(`[v0] Migrations: ${result.applied} applied, ${result.skipped} skipped`)
      }
      
      const duration = Date.now() - startTime
      
      console.log("[v0] Database ready in " + duration + "ms")
      console.log("=".repeat(60))
      console.log("[v0] SYSTEM READY")
      console.log("=".repeat(60) + "\n")
      
      // Start background services (non-blocking)
      setTimeout(async () => {
        // Auto-backup service
        try {
          const { getAutoBackupManager } = await import("./lib/auto-backup")
          const backupManager = getAutoBackupManager()
          backupManager.start(6)
          console.log("[v0] Auto-backup started (6h interval)")
        } catch (err) {
          console.warn("[v0] Auto-backup unavailable")
        }

        // Trade engine auto-start for active connections
        try {
          const { initializeTradeEngineAutoStart } = await import("./lib/trade-engine-auto-start")
          console.log("[v0] Starting trade engine auto-start...")
          await initializeTradeEngineAutoStart()
        } catch (err) {
          console.error("[v0] Trade engine auto-start failed:", err)
        }
      }, 3000) // Wait 3 seconds for full system stabilization
      
    } catch (error) {
      console.error("[v0] Initialization error:", error instanceof Error ? error.message : String(error))
      console.log("[v0] System will use fallback mode")
      console.log("=".repeat(60) + "\n")
    }
  } else {
    console.log("[v0] Skipping initialization (Edge Runtime)")
  }
}
