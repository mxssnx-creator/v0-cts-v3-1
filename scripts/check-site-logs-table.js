const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'cts.db');

if (!fs.existsSync(dbPath)) {
  console.log('Database file does not exist yet');
  process.exit(0);
}

const db = new Database(dbPath);

try {
  // Get table info
  const tableInfo = db.prepare("PRAGMA table_info(site_logs)").all();
  
  console.log('\n=== site_logs table structure ===');
  console.log(JSON.stringify(tableInfo, null, 2));
  
  // Count columns
  console.log(`\nTotal columns: ${tableInfo.length}`);
  console.log('Column names:', tableInfo.map(c => c.name).join(', '));
  
  // Check if it matches expected schema
  const expectedColumns = [
    'id', 'timestamp', 'level', 'category', 'message', 'context',
    'user_id', 'connection_id', 'error_message', 'error_stack', 'metadata', 'created_at'
  ];
  
  const actualColumns = tableInfo.map(c => c.name);
  const missing = expectedColumns.filter(c => !actualColumns.includes(c));
  const extra = actualColumns.filter(c => !expectedColumns.includes(c));
  
  if (missing.length > 0) {
    console.log('\n❌ Missing columns:', missing.join(', '));
  }
  if (extra.length > 0) {
    console.log('\n❌ Extra columns:', extra.join(', '));
  }
  if (missing.length === 0 && extra.length === 0) {
    console.log('\n✅ Table schema matches expected structure');
  }
  
} catch (error) {
  console.error('Error checking table:', error.message);
} finally {
  db.close();
}
