#!/usr/bin/env node

/**
 * Manual migration runner - executes database migrations immediately
 * Run this with: node scripts/run-migrations-now.js
 */

async function runMigrations() {
  console.log('[Migration] Starting manual migration run...')
  
  try {
    // Import the migration runner
    const { runAllMigrations } = await import('../lib/db-migration-runner.js')
    
    console.log('[Migration] Running all migrations...')
    const result = await runAllMigrations()
    
    console.log('='.repeat(60))
    console.log('[Migration] COMPLETED')
    console.log('='.repeat(60))
    console.log(`[Migration] Success: ${result.success}`)
    console.log(`[Migration] Applied: ${result.applied}`)
    console.log(`[Migration] Skipped: ${result.skipped}`)
    console.log(`[Migration] Failed: ${result.failed}`)
    console.log(`[Migration] Message: ${result.message}`)
    console.log('='.repeat(60))
    
    if (!result.success) {
      console.error('[Migration] Some migrations failed!')
      process.exit(1)
    }
    
    console.log('[Migration] All migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('[Migration] Fatal error:', error)
    process.exit(1)
  }
}

runMigrations()
