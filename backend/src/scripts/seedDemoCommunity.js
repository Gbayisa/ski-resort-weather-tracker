import crypto from 'crypto';
import { getDb } from '../db/database.js';
import { hashToken, CHECKIN_HOURS, AVATAR_OPTIONS, RIDER_TAGS } from '../services/community.js';
import { seasonStatus } from '../data/seasons.js';

/**
 * Development-only demo riders so the "Meet riders" feature can be tried
 * locally. They are flagged is_demo (shown with a "Demo" badge), have
 * unguessable tokens nobody holds, and are never created in production
 * or when DEMO_COMMUNITY=off.
 */
const DEMO_RIDERS = [
  ['Léa', 27, 'ski', 'woman', 'advanced', 'Off-piste addict, always first chair.', '🦊'],
  ['Marco', 34, 'snowboard', 'man', 'expert', 'Park laps in the morning, powder in the afternoon.', '🐺'],
  ['Sofia', 29, 'ski', 'woman', 'intermediate', 'Cruising reds and long lunches.', '🦉'],
  ['Jonas', 41, 'ski', 'man', 'advanced', 'Here for the week, happy to show the best runs.', '🦅'],
  ['Aiko', 25, 'snowboard', 'woman', 'intermediate', 'Learning to ride switch — come laugh with me.', '🐧'],
  ['Tom', 31, 'both', 'man', 'expert', 'Ski patrol on my days off, safety first.', '🐻'],
  ['Camille', 38, 'ski', 'woman', 'expert', 'Steep and deep. Avalanche gear always on.', '🦌'],
  ['Noah', 23, 'snowboard', 'nonbinary', 'advanced', 'Looking for a crew for tree runs.', '🐼'],
  ['Elena', 45, 'ski', 'woman', 'intermediate', 'Solo trip, would love a coffee buddy.', '🐨'],
  ['Lukas', 28, 'ski', 'man', 'beginner', 'Second week ever on skis — patient people welcome!', '🐸'],
  ['Maya', 33, 'snowboard', 'woman', 'advanced', 'Après is my cardio.', '🦁'],
  ['Felix', 36, 'ski', 'undisclosed', 'advanced', 'Touring early, lifts after 10.', '🐯'],
];

const DEMO_HAIR = {
  woman: [['ponytail', 'long'], ['braids', 'long'], ['wavy', 'medium'], ['straight', 'long'], ['pigtails', 'medium'], ['curly', 'medium'], ['bun', 'short']],
  man: [['crop', 'short'], ['sweep', 'short'], ['curly', 'short'], ['buzz', 'short'], ['afro', 'medium'], ['wavy', 'medium'], ['mohawk', 'short']],
  other: [['wavy', 'short'], ['curly', 'medium'], ['crop', 'short'], ['straight', 'medium']],
};

/** Deterministic avatar per demo rider, so they look the same on every restart. */
function demoAvatar(i, sport, gender) {
  const base = Object.fromEntries(Object.entries(AVATAR_OPTIONS).map(([k, opts], j) => [k, opts[(i * 7 + j * 3) % opts.length]]));
  const styles = DEMO_HAIR[gender] ?? DEMO_HAIR.other;
  const [hair, hairLength] = styles[i % styles.length];
  return {
    ...base,
    hair,
    hairLength,
    facialHair: gender === 'man' ? ['stubble', 'none', 'beard', 'none', 'moustache'][i % 5] : 'none',
    eyewear: ['goggles-up', 'shades', 'none', 'goggles'][i % 4],
    gear: sport === 'snowboard' ? 'board' : 'ski',
    accent: base.accent === base.jacket ? 'snow' : base.accent,
  };
}
const demoTags = (i) => [RIDER_TAGS[i % RIDER_TAGS.length], RIDER_TAGS[(i * 5 + 3) % RIDER_TAGS.length]];

const INTENT_SETS = [['ride'], ['ride', 'coffee'], ['coffee'], ['ride', 'apres'], ['apres'], ['ride', 'coffee', 'apres']];
const NOTES = ['Top of the main gondola at 10', 'Blue jacket, orange helmet', 'Around the summit café', '', 'Heading up at 9:30', ''];

export function seedDemoCommunity() {
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_COMMUNITY === 'off') return;
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // Demo riders gather where people can actually ski today
  const openResorts = db
    .prepare('SELECT * FROM resorts ORDER BY piste_km DESC NULLS LAST')
    .all()
    .filter((r) => seasonStatus(r, today).inSeason)
    .slice(0, 3);
  if (openResorts.length === 0) return;

  const insert = db.prepare(
    `INSERT INTO riders (token_hash, name, age, sport, gender, level, bio, visibility, avatar, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'everyone', ?, 1)`
  );
  const existing = db.prepare('SELECT id FROM riders WHERE is_demo = 1 ORDER BY id').all();
  const ids = existing.map((r) => r.id);
  db.transaction(() => {
    for (let i = ids.length; i < DEMO_RIDERS.length; i++) {
      const [name, age, sport, gender, level, bio, avatar] = DEMO_RIDERS[i];
      const token = crypto.randomBytes(32).toString('base64url');
      ids.push(insert.run(hashToken(token), name, age, sport, gender, level, bio, avatar).lastInsertRowid);
    }

    const checkin = db.prepare(
      `INSERT OR REPLACE INTO checkins (rider_id, resort_id, intents, note, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const now = Date.now();
    const profile = db.prepare('UPDATE riders SET avatar_config = ?, tags = ?, home_resort_id = ?, riders_met = ? WHERE id = ?');
    const day = db.prepare('INSERT OR IGNORE INTO rider_days (rider_id, resort_id, day) VALUES (?, ?, ?)');
    ids.forEach((riderId, i) => {
      const home = openResorts[i % openResorts.length];
      const [, , sport, gender] = DEMO_RIDERS[i];
      profile.run(JSON.stringify(demoAvatar(i, sport, gender)), JSON.stringify([...new Set(demoTags(i))]), home.id, i % 7, riderId);
      // A little season history (dev only) so stats and badges have something to show
      for (let d = 0; d < (i % 6) + 1; d++) {
        const date = new Date(now - (d * 9 + i) * 24 * 3600 * 1000).toISOString().slice(0, 10);
        day.run(riderId, openResorts[(i + d) % openResorts.length].id, date);
      }
    });
    ids.forEach((riderId, i) => {
      // Consecutive riders (a woman/man pair in DEMO_RIDERS) share a resort, cycling the biggest open ones
      const resort = openResorts[Math.floor(i / 2) % openResorts.length];
      const createdAt = new Date(now - (i * 7 + 3) * 60 * 1000).toISOString();
      const expiresAt = new Date(now + CHECKIN_HOURS * 3600 * 1000).toISOString();
      checkin.run(riderId, resort.id, JSON.stringify(INTENT_SETS[i % INTENT_SETS.length]), NOTES[i % NOTES.length], createdAt, expiresAt);
    });
  })();
  console.log(`[Demo] ${ids.length} demo riders checked in at ${openResorts.map((r) => r.name).join(', ')}`);
}
