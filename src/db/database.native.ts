import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "field_lead_tracker.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return dbPromise;
}

export async function initDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,

      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      status TEXT NOT NULL,
      notes TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT
    );
  `);

  console.log("SQLite database initialized");
}