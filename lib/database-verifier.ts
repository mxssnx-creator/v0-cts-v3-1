import { sql, getDatabaseType } from "@/lib/db"
import { SystemLogger } from "@/lib/system-logger"

export class DatabaseVerifier {
  /**
   * Verify and repair database state
   */
  static async verifyAndRepairDatabase(): Promise<{ healthy: boolean; issues: string[] }> {
    console.log("[v0] Starting comprehensive database verification...")

    const issues: string[] = []
    const dbType = getDatabaseType()
    const isSQLite = dbType === "sqlite"

    try {
      // 1. Verify critical tables exist
      console.log("[v0] Verifying critical tables...")
      const criticalTables = [
        "exchange_connections",
        "indications",
        "pseudo_positions",
        "preset_strategies",
        "market_data",
        "trade_engine_state",
      ]

      for (const table of criticalTables) {
        try {
          const query = isSQLite
            ? `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${table}'`
            : `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name='${table}'`

          const result = await sql<any>`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = ${table}
            ) as table_exists
          `

          if (!result?.[0]?.table_exists) {
            issues.push(`Missing table: ${table}`)
            console.warn(`[v0] Missing table: ${table}`)
          }
        } catch (error) {
          console.warn(`[v0] Could not verify table ${table}:`, error)
        }
      }

      // 2. Verify trade_engine_state records exist for all connections
      console.log("[v0] Verifying trade engine states...")
      try {
        const connections = await sql<any>`
          SELECT id FROM exchange_connections WHERE is_active = true
        `

        for (const conn of connections || []) {
          try {
            const stateResult = await sql<any>`
              SELECT COUNT(*) as count FROM trade_engine_state 
              WHERE connection_id = ${conn.id}
            `

            const stateCount = stateResult?.[0]?.count || 0

            if (stateCount === 0) {
              // Create missing state record
              await sql`
                INSERT INTO trade_engine_state (
                  connection_id, status, created_at, updated_at
                ) VALUES (
                  ${conn.id}, 'idle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
              `

              console.log(`[v0] Created missing trade_engine_state for ${conn.id}`)
            }
          } catch (stateError) {
            console.warn(`[v0] Failed to verify state for ${conn.id}:`, stateError)
          }
        }
      } catch (error) {
        console.warn("[v0] Error verifying trade engine states:", error)
      }

      // 3. Check for orphaned records
      console.log("[v0] Checking for orphaned records...")
      try {
        // Check for indications with invalid connection references
        const orphanedIndications = await sql<any>`
          SELECT COUNT(*) as count FROM indications i
          WHERE NOT EXISTS (
            SELECT 1 FROM exchange_connections ec 
            WHERE ec.id = i.connection_id
          )
        `

        const orphanedCount = orphanedIndications?.[0]?.count || 0
        if (orphanedCount > 0) {
          issues.push(`Found ${orphanedCount} orphaned indication records`)
          console.warn(`[v0] Found ${orphanedCount} orphaned indications`)
        }
      } catch (error) {
        console.warn("[v0] Error checking orphaned records:", error)
      }

      // 4. Verify data integrity
      console.log("[v0] Verifying data integrity...")
      try {
        // Check for positions with null critical fields
        const invalidPositions = await sql<any>`
          SELECT COUNT(*) as count FROM pseudo_positions 
          WHERE entry_price IS NULL OR volume IS NULL OR symbol IS NULL
        `

        const invalidCount = invalidPositions?.[0]?.count || 0
        if (invalidCount > 0) {
          issues.push(`Found ${invalidCount} invalid position records`)
          console.warn(`[v0] Found ${invalidCount} invalid positions`)
        }
      } catch (error) {
        console.warn("[v0] Error verifying position data:", error)
      }

      // 5. Check connection status and prepare state tables
      console.log("[v0] Preparing connection state tables...")
      try {
        const connections = await sql<any>`
          SELECT id FROM exchange_connections WHERE is_active = true LIMIT 10
        `

        for (const conn of connections || []) {
          try {
            // Ensure engine state record exists
            const stateCount = await sql<any>`
              SELECT COUNT(*) as count FROM trade_engine_state 
              WHERE connection_id = ${conn.id}
            `

            if (!stateCount?.[0]?.count) {
              await sql`
                INSERT INTO trade_engine_state (
                  connection_id, 
                  status, 
                  created_at, 
                  updated_at,
                  prehistoric_data_loaded,
                  indication_cycle_count,
                  strategy_cycle_count,
                  realtime_cycle_count
                ) VALUES (
                  ${conn.id},
                  'idle',
                  CURRENT_TIMESTAMP,
                  CURRENT_TIMESTAMP,
                  false,
                  0,
                  0,
                  0
                )
              `

              console.log(`[v0] Created engine state record for ${conn.id}`)
            }
          } catch (error) {
            console.warn(`[v0] Error preparing state for ${conn.id}:`, error)
          }
        }
      } catch (error) {
        console.warn("[v0] Error preparing connection states:", error)
      }

      const isHealthy = issues.length === 0

      if (isHealthy) {
        console.log("[v0] Database verification passed - all systems healthy")
        await SystemLogger.logAPI("Database verification passed", "info", "DatabaseVerifier.verify")
      } else {
        console.warn("[v0] Database verification found issues:", issues)
        await SystemLogger.logAPI(`Database issues found: ${issues.join(", ")}`, "warn", "DatabaseVerifier.verify")
      }

      return { healthy: isHealthy, issues }
    } catch (error) {
      console.error("[v0] Fatal database verification error:", error)
      await SystemLogger.logError(error, "system", "DatabaseVerifier.verify")

      return {
        healthy: false,
        issues: [
          `Database verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      }
    }
  }

  /**
   * Repair common database issues
   */
  static async repairDatabase(): Promise<void> {
    console.log("[v0] Starting database repair...")

    try {
      // Clean up orphaned records
      try {
        await sql`
          DELETE FROM indications 
          WHERE connection_id NOT IN (SELECT id FROM exchange_connections)
        `

        console.log("[v0] Cleaned up orphaned indications")
      } catch (error) {
        console.warn("[v0] Could not clean orphaned indications:", error)
      }

      // Fix invalid positions
      try {
        await sql`
          DELETE FROM pseudo_positions 
          WHERE entry_price IS NULL OR volume IS NULL OR symbol IS NULL
        `

        console.log("[v0] Cleaned up invalid positions")
      } catch (error) {
        console.warn("[v0] Could not clean invalid positions:", error)
      }

      // Ensure all active connections have engine state
      try {
        const connections = await sql<any>`
          SELECT id FROM exchange_connections WHERE is_active = true
        `

        for (const conn of connections || []) {
          try {
            const exists = await sql<any>`
              SELECT COUNT(*) as count FROM trade_engine_state 
              WHERE connection_id = ${conn.id}
            `

            if (!exists?.[0]?.count) {
              await sql`
                INSERT INTO trade_engine_state (
                  connection_id, status, created_at, updated_at
                ) VALUES (
                  ${conn.id}, 'idle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
              `
            }
          } catch (error) {
            console.warn(`[v0] Error ensuring state for ${conn.id}:`, error)
          }
        }

        console.log("[v0] Ensured all connections have engine state")
      } catch (error) {
        console.warn("[v0] Error ensuring engine states:", error)
      }

      console.log("[v0] Database repair completed")
      await SystemLogger.logAPI("Database repair completed", "info", "DatabaseVerifier.repair")
    } catch (error) {
      console.error("[v0] Database repair error:", error)
      await SystemLogger.logError(error, "system", "DatabaseVerifier.repair")
    }
  }
}
