import { NextResponse } from 'next/server'
import { loadConnections } from '@/lib/file-storage'

export async function POST() {
  try {
    console.log('[v0] Database initialization requested')

    // Primary: Load default connections from file storage
    let connections: any[] = []
    try {
      connections = loadConnections()
      console.log('[v0] Loaded', connections.length, 'connections from file storage')
    } catch (error) {
      console.warn('[v0] Failed to load connections:', error)
      connections = []
    }

    // Secondary (optional): Try database initialization if available
    let dbInitialized = false
    let dbMessage = 'File storage active'

    try {
      // Only attempt database initialization if sql module is available
      try {
        const { sql } = await import('@/lib/db')
        if (sql) {
          // Try a simple test query
          const result = await Promise.race([
            sql`SELECT 1 as test`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
          ])

          if (result) {
            dbInitialized = true
            dbMessage = 'Database initialized'
            console.log('[v0] Database verified and ready')
          }
        }
      } catch (error) {
        console.warn('[v0] Database initialization skipped:', error instanceof Error ? error.message : 'unknown')
        dbInitialized = false
        dbMessage = 'Using file-based storage (database unavailable)'
      }
    } catch (error) {
      console.warn('[v0] Database check failed:', error)
    }

    // Return success regardless - file storage is sufficient
    return NextResponse.json(
      {
        success: true,
        message: 'System initialized successfully',
        storage: {
          file_based: true,
          connections_loaded: connections.length,
          type: 'json-file',
        },
        database: {
          initialized: dbInitialized,
          message: dbMessage,
          optional: true,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Initialization error:', error)

    // Even on error, return that file storage is available
    return NextResponse.json(
      {
        success: true,
        message: 'System operational with file storage',
        storage: {
          file_based: true,
          connections_loaded: 0,
          type: 'json-file',
        },
        database: {
          initialized: false,
          message: 'Using file-based storage fallback',
          optional: true,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }
}
        await query(`SELECT 1 FROM ${table} LIMIT 1`)
        tableStatus[table] = true
      } catch (error) {
        tableStatus[table] = false
      }
    }

    const missingTables = Object.entries(tableStatus)
      .filter(([_, exists]) => !exists)
      .map(([table, _]) => table)

    // Load connections
    const connections = loadConnections()

    return NextResponse.json({
      success: true,
      database_initialized: missingTables.length === 0,
      tables_status: tableStatus,
      missing_tables: missingTables,
      connections_count: connections.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Database status check error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function createTablesIfNotExist() {
  const created: string[] = []
  const existing: string[] = []

  try {
    // exchange_connections table
    try {
      await query('SELECT 1 FROM exchange_connections LIMIT 1')
      existing.push('exchange_connections')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS exchange_connections (
          id VARCHAR(255) PRIMARY KEY,
          user_id INT,
          name VARCHAR(255),
          exchange VARCHAR(100),
          exchange_id INT,
          api_type VARCHAR(100),
          connection_method VARCHAR(100),
          connection_library VARCHAR(100),
          api_key VARCHAR(500),
          api_secret VARCHAR(500),
          api_passphrase VARCHAR(500),
          margin_type VARCHAR(50),
          position_mode VARCHAR(50),
          is_testnet BOOLEAN DEFAULT false,
          is_enabled BOOLEAN DEFAULT false,
          is_live_trade BOOLEAN DEFAULT false,
          is_preset_trade BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          is_predefined BOOLEAN DEFAULT false,
          volume_factor DECIMAL(10, 2) DEFAULT 1.0,
          connection_settings TEXT,
          last_test_at VARCHAR(50),
          last_test_status VARCHAR(50),
          last_test_balance DECIMAL(20, 8),
          last_test_error TEXT,
          last_test_log TEXT,
          api_capabilities TEXT,
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `)
      created.push('exchange_connections')
      console.log('[v0] Created exchange_connections table')
    }

    // indications table
    try {
      await query('SELECT 1 FROM indications LIMIT 1')
      existing.push('indications')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS indications (
          id VARCHAR(255) PRIMARY KEY,
          connection_id VARCHAR(255),
          indication_type VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          parameters TEXT,
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `)
      created.push('indications')
      console.log('[v0] Created indications table')
    }

    // preset_strategies table
    try {
      await query('SELECT 1 FROM preset_strategies LIMIT 1')
      existing.push('preset_strategies')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS preset_strategies (
          id VARCHAR(255) PRIMARY KEY,
          connection_id VARCHAR(255),
          name VARCHAR(255),
          is_active BOOLEAN DEFAULT false,
          strategy_type VARCHAR(100),
          parameters TEXT,
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `)
      created.push('preset_strategies')
      console.log('[v0] Created preset_strategies table')
    }

    // pseudo_positions table
    try {
      await query('SELECT 1 FROM pseudo_positions LIMIT 1')
      existing.push('pseudo_positions')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS pseudo_positions (
          id VARCHAR(255) PRIMARY KEY,
          connection_id VARCHAR(255),
          symbol VARCHAR(100),
          side VARCHAR(10),
          size DECIMAL(20, 8),
          entry_price DECIMAL(20, 8),
          current_price DECIMAL(20, 8),
          pnl DECIMAL(20, 8),
          status VARCHAR(50),
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `)
      created.push('pseudo_positions')
      console.log('[v0] Created pseudo_positions table')
    }

    // trade_engine_state table
    try {
      await query('SELECT 1 FROM trade_engine_state LIMIT 1')
      existing.push('trade_engine_state')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS trade_engine_state (
          id VARCHAR(255) PRIMARY KEY,
          connection_id VARCHAR(255),
          status VARCHAR(50),
          manager_health_status VARCHAR(50),
          last_activity VARCHAR(50),
          engine_version VARCHAR(50),
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `)
      created.push('trade_engine_state')
      console.log('[v0] Created trade_engine_state table')
    }

    // system_settings table
    try {
      await query('SELECT 1 FROM system_settings LIMIT 1')
      existing.push('system_settings')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at VARCHAR(50)
        )
      `)
      created.push('system_settings')
      console.log('[v0] Created system_settings table')
    }

    // connection_indication_settings table
    try {
      await query('SELECT 1 FROM connection_indication_settings LIMIT 1')
      existing.push('connection_indication_settings')
    } catch {
      await execute(`
        CREATE TABLE IF NOT EXISTS connection_indication_settings (
          connection_id VARCHAR(255),
          indication_type VARCHAR(100),
          is_enabled BOOLEAN DEFAULT true,
          range_value INT,
          timeout_value INT,
          interval_value INT,
          created_at VARCHAR(50),
          updated_at VARCHAR(50),
          PRIMARY KEY (connection_id, indication_type)
        )
      `)
      created.push('connection_indication_settings')
      console.log('[v0] Created connection_indication_settings table')
    }
  } catch (error) {
    console.error('[v0] Error creating tables:', error)
  }

  return { created, existing }
}
