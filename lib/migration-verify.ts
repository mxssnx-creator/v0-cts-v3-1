import Database from 'better-sqlite3';
import path from 'path';

interface MigrationCheck {
  table: string;
  exists: boolean;
  columnCount?: number;
}

export function verifyAllMigrations(): MigrationCheck[] {
  try {
    const dbPath = path.join(process.cwd(), 'crypto_trading.db');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    const requiredTables = [
      'users',
      'trading_presets',
      'portfolio_items',
      'market_data',
      'trading_history',
      'risk_profiles',
      'alerts',
    ];

    const results: MigrationCheck[] = [];

    for (const table of requiredTables) {
      try {
        const result = db.prepare(
          `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`
        ).get(table) as any;

        const exists = result.count > 0;

        if (exists) {
          const columns = db.prepare(`PRAGMA table_info(${table})`).all();
          results.push({
            table,
            exists: true,
            columnCount: columns.length,
          });
        } else {
          results.push({
            table,
            exists: false,
          });
        }
      } catch (error) {
        results.push({
          table,
          exists: false,
        });
      }
    }

    db.close();
    return results;
  } catch (error) {
    console.error('[v0] Migration verification error:', error);
    return [];
  }
}

export function getMigrationStatus(): {
  allComplete: boolean;
  missingTables: string[];
  completedTables: string[];
} {
  const checks = verifyAllMigrations();
  const completedTables = checks.filter((c) => c.exists).map((c) => c.table);
  const missingTables = checks.filter((c) => !c.exists).map((c) => c.table);

  return {
    allComplete: missingTables.length === 0,
    missingTables,
    completedTables,
  };
}
