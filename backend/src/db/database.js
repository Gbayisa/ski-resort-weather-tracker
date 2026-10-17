import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DB_PATH=':memory:' gives tests an isolated database
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'ski-tracker.db');

let db;

export function getDb() {
  if (!db) {
    if (DB_PATH !== ':memory:') {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
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

    -- Superseded by resort_forecasts: one cached forecast per resort covers every date
    DROP TABLE IF EXISTS weather_cache;

    CREATE TABLE IF NOT EXISTS resort_forecasts (
      resort_id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (resort_id) REFERENCES resorts(id)
    );

    CREATE TABLE IF NOT EXISTS route_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_key TEXT NOT NULL,
      resort_id INTEGER NOT NULL,
      distance_km REAL,
      duration_min REAL,
      source TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      UNIQUE(origin_key, resort_id),
      FOREIGN KEY (resort_id) REFERENCES resorts(id)
    );

    -- ===== Community (meet riders on the mountain) =====
    -- Accounts are device tokens (only the SHA-256 hash is stored).
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age >= 18),
      sport TEXT NOT NULL,
      gender TEXT NOT NULL,
      level TEXT NOT NULL,
      bio TEXT DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'everyone',
      avatar TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Resort-level presence only: no coordinates are ever stored.
    CREATE TABLE IF NOT EXISTS checkins (
      rider_id INTEGER PRIMARY KEY REFERENCES riders(id) ON DELETE CASCADE,
      resort_id INTEGER NOT NULL REFERENCES resorts(id),
      intents TEXT NOT NULL DEFAULT '[]',
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_checkins_resort ON checkins(resort_id, expires_at);

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_rider INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      to_rider INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      resort_id INTEGER NOT NULL REFERENCES resorts(id),
      intent TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_connections_riders ON connections(from_rider, to_rider);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      from_rider INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_connection ON messages(connection_id, id);

    CREATE TABLE IF NOT EXISTS blocks (
      blocker INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      blocked INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (blocker, blocked)
    );

    -- One row per rider per resort per day checked in: powers season stats and badges.
    -- Resort-level and deleted with the profile, like everything else.
    CREATE TABLE IF NOT EXISTS rider_days (
      rider_id INTEGER NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
      resort_id INTEGER NOT NULL REFERENCES resorts(id),
      day TEXT NOT NULL,
      PRIMARY KEY (rider_id, day, resort_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter INTEGER REFERENCES riders(id) ON DELETE SET NULL,
      reported INTEGER REFERENCES riders(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_resorts_lat_lon ON resorts(lat, lon);
    CREATE INDEX IF NOT EXISTS idx_resort_forecasts_expires ON resort_forecasts(expires_at);
    CREATE INDEX IF NOT EXISTS idx_route_cache_origin ON route_cache(origin_key, resort_id);
    CREATE INDEX IF NOT EXISTS idx_route_cache_expires ON route_cache(expires_at);
  `);

  // Additive migrations for databases created before terrain stats existed
  const existingCols = db.prepare('PRAGMA table_info(resorts)').all().map((c) => c.name);
  const terrainCols = [
    ['piste_km', 'piste_km REAL'],
    ['lifts', 'lifts INTEGER'],
    ['snowparks', 'snowparks INTEGER'],
    ['pct_easy', 'pct_easy INTEGER'],
    ['pct_intermediate', 'pct_intermediate INTEGER'],
    ['pct_advanced', 'pct_advanced INTEGER'],
  ];
  for (const [name, ddl] of terrainCols) {
    if (!existingCols.includes(name)) db.exec(`ALTER TABLE resorts ADD COLUMN ${ddl}`);
  }

  // Profile customisation (avatar builder, vibe tags, home mountain) and a durable riders-met count
  const riderCols = db.prepare('PRAGMA table_info(riders)').all().map((c) => c.name);
  const riderAdditions = [
    ['avatar_config', 'avatar_config TEXT'],
    ['tags', "tags TEXT NOT NULL DEFAULT '[]'"],
    ['home_resort_id', 'home_resort_id INTEGER REFERENCES resorts(id)'],
    ['riders_met', 'riders_met INTEGER NOT NULL DEFAULT 0'],
    ['instagram', 'instagram TEXT'],
    ['instagram_visibility', "instagram_visibility TEXT NOT NULL DEFAULT 'connections'"],
  ];
  for (const [name, ddl] of riderAdditions) {
    if (!riderCols.includes(name)) db.exec(`ALTER TABLE riders ADD COLUMN ${ddl}`);
  }

  // Forecasts track when a search last used them, so the scheduler only keeps hot ones fresh
  const forecastCols = db.prepare('PRAGMA table_info(resort_forecasts)').all().map((c) => c.name);
  if (!forecastCols.includes('last_used_at')) db.exec('ALTER TABLE resort_forecasts ADD COLUMN last_used_at TEXT');

  console.log('Database initialized at', DB_PATH);
}
