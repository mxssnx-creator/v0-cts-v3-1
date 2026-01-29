import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function ensureDatabaseReady(): Promise<{
  ready: boolean;
  message: string;
  details: string[];
}> {
  const details: string[] = [];
  
  try {
    const dbPath = path.join(process.cwd(), 'crypto_trading.db');
    const dbExists = fs.existsSync(dbPath);

    if (!dbExists) {
      details.push('Database file does not exist, will be created on first access');
    } else {
      details.push('Database file exists');
    }

    // Try to open/create database
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Create all required tables if they don't exist
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trading_presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        preset_name TEXT NOT NULL,
        preset_type TEXT,
        buy_threshold REAL,
        sell_threshold REAL,
        stop_loss REAL,
        take_profit REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS portfolio_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        quantity REAL,
        buy_price REAL,
        current_price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        price REAL,
        volume REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trading_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT,
        action TEXT,
        quantity REAL,
        price REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS risk_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        profile_name TEXT,
        risk_level TEXT,
        max_loss_percent REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT,
        alert_type TEXT,
        threshold REAL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `;

    schema.split(';').forEach(statement => {
      if (statement.trim()) {
        try {
          db.exec(statement);
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    });

    details.push('All database tables created/verified');

    // Verify tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as Array<{ name: string }>;

    details.push(`Database has ${tables.length} tables`);

    // Check admin user
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('Admin') as any;

    if (!adminUser) {
      const adminPassword = hashPassword('00998877');
      db.prepare(`
        INSERT INTO users (username, email, password, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `).run('Admin', 'mxssnx@gmail.com', adminPassword, 'admin', 1);
      details.push('Default admin user created');
    } else {
      details.push('Default admin user verified');
    }

    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    details.push(`Total users in database: ${userCount}`);

    db.close();

    return {
      ready: true,
      message: 'Database is ready',
      details,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    details.push(`Error: ${errorMessage}`);
    console.error('[v0] Database startup error:', error);

    return {
      ready: false,
      message: 'Database initialization failed',
      details,
    };
  }
}

// Run on server startup
if (typeof window === 'undefined') {
  ensureDatabaseReady().then((result) => {
    console.log('[v0]', result.message);
    result.details.forEach((detail) => console.log('[v0]', detail));
  });
}
