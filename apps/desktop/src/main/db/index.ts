import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import log from 'electron-log';
import * as schema from './schema';

let sqlite: SqliteDatabase | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

// Get database path in user data directory
function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  
  // Ensure directory exists
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true });
  }
  
  return join(userDataPath, 'file-manager.db');
}

// Initialize the database
export async function initDatabase(): Promise<void> {
  const dbPath = getDbPath();
  log.info(`📁 Database path: ${dbPath}`);

  try {
    // Create database connection
    sqlite = new Database(dbPath);
    
    // Enable WAL mode for better concurrent performance
    sqlite.pragma('journal_mode = WAL');
    
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    
    // Create Drizzle instance
    db = drizzle(sqlite, { schema });
    
    // Run migrations
    await runMigrations();
    
    log.info('✅ Database initialized successfully');
  } catch (error) {
    log.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Run database migrations
async function runMigrations(): Promise<void> {
  if (!sqlite) throw new Error('Database not initialized');

  // Create tables if they don't exist
  sqlite.exec(`
    -- Files table
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      original_path TEXT NOT NULL,
      current_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      extension TEXT NOT NULL,
      category TEXT,
      hash TEXT,
      scanned_at INTEGER NOT NULL DEFAULT (unixepoch()),
      organized_at INTEGER,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    
    CREATE INDEX IF NOT EXISTS hash_idx ON files(hash);
    CREATE INDEX IF NOT EXISTS category_idx ON files(category);
    
    -- Logs table
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      file_id INTEGER REFERENCES files(id),
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      metadata TEXT
    );
    
    CREATE INDEX IF NOT EXISTS action_idx ON logs(action);
    CREATE INDEX IF NOT EXISTS timestamp_idx ON logs(timestamp);
    
    -- Jobs table
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      data TEXT,
      result TEXT,
      error TEXT,
      logs TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      started_at INTEGER,
      completed_at INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS job_status_idx ON jobs(status);
    CREATE INDEX IF NOT EXISTS job_type_idx ON jobs(type);
    
    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  
  log.info('✅ Database migrations completed');
}

// Get database instance
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Get raw SQLite instance
export function getSqlite(): SqliteDatabase {
  if (!sqlite) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sqlite;
}

// Close database connection
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    log.info('✅ Database connection closed');
  }
}

// Export for convenience
export { db, sqlite };
