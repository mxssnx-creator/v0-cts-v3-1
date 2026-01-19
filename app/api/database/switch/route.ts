import { NextRequest, NextResponse } from "next/server"
import { switchDatabase, testConnection, getDatabaseType } from "@/lib/db"
import { loadSettings, saveSettings } from "@/lib/file-storage"
import { DatabaseMigrations } from "@/lib/db-migrations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { database_type, pg_host, pg_port, pg_database, pg_user, pg_password } = body
    
    if (!database_type || !["sqlite", "postgresql", "postgres"].includes(database_type)) {
      return NextResponse.json({
        success: false,
        message: "Invalid database type. Must be 'sqlite' or 'postgresql'"
      }, { status: 400 })
    }
    
    const normalizedType = database_type === "postgres" ? "postgresql" : database_type
    
    console.log(`[v0] ========================================`)
    console.log(`[v0] DATABASE SWITCH REQUEST`)
    console.log(`[v0] Target type: ${normalizedType}`)
    console.log(`[v0] ========================================`)
    
    // Build connection URL for PostgreSQL
    let connectionUrl: string | undefined
    if (normalizedType === "postgresql") {
      if (pg_host && pg_user && pg_password && pg_database) {
        const port = pg_port || 5432
        connectionUrl = `postgresql://${pg_user}:${pg_password}@${pg_host}:${port}/${pg_database}`
        console.log(`[v0] Built PostgreSQL URL: postgresql://${pg_user}:****@${pg_host}:${port}/${pg_database}`)
      } else if (process.env.DATABASE_URL) {
        connectionUrl = process.env.DATABASE_URL
        console.log(`[v0] Using existing DATABASE_URL from environment`)
      } else {
        return NextResponse.json({
          success: false,
          message: "PostgreSQL requires host, user, password, and database name"
        }, { status: 400 })
      }
    }
    
    // Save settings first
    const currentSettings = loadSettings()
    const updatedSettings = {
      ...currentSettings,
      database_type: normalizedType,
      pg_host: pg_host || currentSettings.pg_host,
      pg_port: pg_port || currentSettings.pg_port,
      pg_database: pg_database || currentSettings.pg_database,
      pg_user: pg_user || currentSettings.pg_user,
      pg_password: pg_password || currentSettings.pg_password
    }
    saveSettings(updatedSettings)
    console.log(`[v0] Settings saved with database_type: ${normalizedType}`)
    
    // Switch the database
    const switchResult = await switchDatabase(normalizedType, connectionUrl)
    
    if (!switchResult.success) {
      return NextResponse.json({
        success: false,
        message: switchResult.message,
        error: switchResult.error
      }, { status: 500 })
    }
    
    // Test the new connection
    const connectionTest = await testConnection()
    
    if (!connectionTest.connected) {
      return NextResponse.json({
        success: false,
        message: `Switched to ${normalizedType} but connection test failed: ${connectionTest.message}`,
        connected: false
      }, { status: 500 })
    }
    
    // Run migrations on the new database
    let migrationsApplied = 0
    try {
      console.log(`[v0] Running migrations on ${normalizedType}...`)
      const migrationResult = await DatabaseMigrations.runMigrations()
      migrationsApplied = migrationResult.appliedCount || 0
      console.log(`[v0] Applied ${migrationsApplied} migrations`)
    } catch (migrationError) {
      console.error(`[v0] Migration error (non-fatal):`, migrationError)
    }
    
    const currentType = getDatabaseType()
    
    return NextResponse.json({
      success: true,
      message: `Successfully switched to ${normalizedType}`,
      previousType: currentSettings.database_type || "sqlite",
      currentType,
      connected: true,
      migrationsApplied,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("[v0] Database switch failed:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to switch database"
    }, { status: 500 })
  }
}
