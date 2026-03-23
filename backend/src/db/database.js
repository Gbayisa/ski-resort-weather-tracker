import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'ski-tracker.db');

let db;

export function getDb() {
  if (!db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS resorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      country TEXT,
      region TEXT,
      website TEXT,
      osm_id TEXT UNIQUE,
      elevation_base INTEGER DEFAULT 0,
      elevation_peak INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resort_id INTEGER NOT NULL,
      forecast_date TEXT NOT NULL,
      data TEXT NOT NULL,
      fetched_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      UNIQUE(resort_id, forecast_date),
      FOREIGN KEY (resort_id) REFERENCES resorts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_resorts_lat_lon ON resorts(lat, lon);
    CREATE INDEX IF NOT EXISTS idx_weather_cache_resort_date ON weather_cache(resort_id, forecast_date);
    CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);
  `);

  console.log('Database initialized at', DB_PATH);
}
