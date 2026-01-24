#!/usr/bin/env node

/**
 * Database Reset Script
 * Deletes the SQLite database file to allow fresh initialization
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'cts.db');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('[v0] ✅ Database file deleted:', dbPath);
    console.log('[v0] The database will be recreated on next startup with the correct schema');
  } else {
    console.log('[v0] No database file found at:', dbPath);
  }
} catch (error) {
  console.error('[v0] Failed to delete database:', error);
  process.exit(1);
}
