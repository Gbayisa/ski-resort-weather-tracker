import crypto from 'crypto';
import { getDb } from '../db/database.js';
import { haversineDistance } from './forecastUtils.js';
import { seasonFor } from '../data/seasons.js';

/**
 * "Meet riders" — solo skiers and boarders find people to ride with, grab a
 * coffee or après with, while they're at the same resort.
 *
 * Safety model (enforced here, not just in the UI):
 * - 18+ only.
 * - Location is resort-level: coordinates are used once to find the resort
 *   and are never stored or shared.
 * - You only see riders at a resort while you're checked in there yourself;
 *   check-ins expire automatically.
 * - Riders can limit visibility to women only.
 * - Chat opens only after the other rider accepts; block/report everywhere.
 * - An Instagram handle is optional and shown only to accepted connections,
 *   unless the rider chooses to share it with everyone at their resort.
 */

export const SPORTS = ['ski', 'snowboard', 'both'];
export const GENDERS = ['woman', 'man', 'nonbinary', 'undisclosed'];
export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
export const INTENTS = ['ride', 'coffee', 'apres'];
export const VISIBILITIES = ['everyone', 'women'];
/** Who sees a rider's Instagram: only riders they've connected with, or everyone at their resort. */
export const INSTAGRAM_VISIBILITIES = ['connections', 'everyone'];
const AVATARS = ['🦊', '🐻', '🐺', '🦉', '🐧', '🦅', '🐼', '🦌', '🐯', '🐨', '🦁', '🐸'];

/** Avatar builder parts. The frontend draws them; the server only accepts known values. */
const AVATAR_COLORS = [
  'snow', 'ice', 'sky', 'navy', 'teal', 'mint', 'lime', 'forest', 'sun',
  'orange', 'red', 'coral', 'pink', 'violet', 'lilac', 'sand', 'charcoal', 'night',
];
export const AVATAR_OPTIONS = {
  skin: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  expression: ['smile', 'grin', 'stoked', 'wink', 'cheeky'],
  marks: ['none', 'rosy', 'freckles'],
  facialHair: ['none', 'stubble', 'moustache', 'beard'],
  hair: [
    'buzz', 'crop', 'sweep', 'straight', 'wavy', 'curly', 'afro',
    'braids', 'ponytail', 'pigtails', 'bun', 'mohawk', 'bald',
  ],
  hairLength: ['short', 'medium', 'long'],
  hairColor: [
    'black', 'espresso', 'brown', 'auburn', 'ginger', 'honey', 'blonde',
    'platinum', 'silver', 'pink', 'blue', 'teal', 'purple',
  ],
  headwear: ['helmet', 'beanie', 'pom', 'critter', 'trapper', 'cap', 'headband', 'none'],
  hat: AVATAR_COLORS,
  eyewear: ['goggles', 'goggles-up', 'shades', 'none'],
  lens: ['gold', 'fire', 'rose', 'violet', 'blue', 'emerald', 'smoke', 'chrome'],
  outfit: ['shell', 'puffer', 'anorak', 'hoodie', 'retro'],
  pattern: ['solid', 'stripe', 'two-tone', 'chevron', 'camo'],
  jacket: AVATAR_COLORS,
  accent: AVATAR_COLORS,
  pants: AVATAR_COLORS,
  gear: ['ski', 'board'],
  graphic: ['clean', 'stripes', 'peak', 'flame', 'stars'],
  gearColor: AVATAR_COLORS,
  backdrop: ['bluebird', 'dawn', 'alpenglow', 'gold', 'glacier', 'night', 'aurora', 'storm'],
};
export const RIDER_TAGS = [
  'first-chair', 'powder-hound', 'park-rat', 'tree-runs', 'groomers', 'steeps',
  'bumps', 'touring', 'apres', 'photos', 'chill-pace', 'send-it',
];
const MAX_TAGS = 3;

export function randomAvatar(sport) {
  const avatar = Object.fromEntries(
    Object.entries(AVATAR_OPTIONS).map(([k, opts]) => [k, opts[crypto.randomInt(opts.length)]])
  );
  if (sport === 'ski' || sport === 'snowboard') avatar.gear = sport === 'ski' ? 'ski' : 'board';
  return avatar;
}

/** Resort coordinates are the village/base; ski areas sprawl a few km around it. */
export const CHECKIN_RADIUS_KM = 6;
export const CHECKIN_HOURS = 9;
const MAX_REQUESTS_PER_DAY = 20;
const LIMITS = { name: 24, bio: 140, note: 80, message: 500 };

const isDev = () => process.env.NODE_ENV !== 'production';
const nowIso = () => new Date().toISOString();

export class CommunityError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

// ---------- tokens ----------

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');

export function riderFromToken(token) {
  if (!token) return null;
  return getDb().prepare('SELECT * FROM riders WHERE token_hash = ?').get(hashToken(token)) || null;
}

// ---------- validation ----------

const cleanText = (s, max) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new CommunityError(400, 'invalid_profile', `${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function validateAvatar(avatar) {
  if (avatar == null) return null;
  if (typeof avatar !== 'object') throw new CommunityError(400, 'invalid_profile', 'Avatar is not valid');
  const out = {};
  for (const [key, allowed] of Object.entries(AVATAR_OPTIONS)) {
    if (!allowed.includes(avatar[key])) throw new CommunityError(400, 'invalid_profile', `Avatar ${key} is not valid`);
    out[key] = avatar[key];
  }
  return out;
}

const cleanTags = (tags) =>
  Array.isArray(tags) ? [...new Set(tags.filter((t) => RIDER_TAGS.includes(t)))].slice(0, MAX_TAGS) : [];

// Instagram paths that look like usernames but aren't profiles
const INSTAGRAM_RESERVED = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'tv', 'direct']);

/** Accepts "@name", "name" or a profile URL; returns the lowercase username, or null when left empty. */
export function cleanInstagram(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const handle = raw
    .replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
    .toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(handle) || /^\.|\.$|\.\./.test(handle) || INSTAGRAM_RESERVED.has(handle)) {
    throw new CommunityError(400, 'invalid_profile', 'That doesn’t look like an Instagram username');
  }
  return handle;
}

export function validateProfile(input = {}) {
  const name = cleanText(input.name, LIMITS.name);
  if (name.length < 2) throw new CommunityError(400, 'invalid_profile', 'Name needs at least 2 characters');

  const age = Number(input.age);
  if (!Number.isInteger(age) || age > 99) throw new CommunityError(400, 'invalid_profile', 'Enter a valid age');
  if (age < 18) throw new CommunityError(403, 'under_18', 'You need to be 18 or older to meet riders');

  const gender = oneOf(input.gender, GENDERS, 'gender');
  // Women-only visibility protects women; for anyone else it would just hide them
  const visibility =
    gender === 'woman' ? oneOf(input.visibility ?? 'everyone', VISIBILITIES, 'visibility') : 'everyone';

  return {
    name,
    age,
    sport: oneOf(input.sport, SPORTS, 'sport'),
    gender,
    level: oneOf(input.level, LEVELS, 'level'),
    bio: cleanText(input.bio, LIMITS.bio),
    visibility,
    avatar: validateAvatar(input.avatar),
    tags: cleanTags(input.tags),
    homeResortId: Number.isInteger(input.homeResortId) ? input.homeResortId : null,
    instagram: cleanInstagram(input.instagram),
    instagramVisibility: oneOf(input.instagramVisibility ?? 'connections', INSTAGRAM_VISIBILITIES, 'instagramVisibility'),
  };
}

// ---------- profile ----------

/** What other riders see. Instagram stays hidden until connected, unless the rider shares it with everyone. */
export function publicProfile(r, { connected = false } = {}) {
  const home = r.home_resort_id
    ? getDb().prepare('SELECT id, name FROM resorts WHERE id = ?').get(r.home_resort_id) || null
    : null;
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    sport: r.sport,
    gender: r.gender === 'undisclosed' ? null : r.gender,
    level: r.level,
    bio: r.bio,
    avatar: r.avatar,
    avatarConfig: r.avatar_config ? JSON.parse(r.avatar_config) : null,
    tags: JSON.parse(r.tags || '[]'),
    home,
    instagram: connected || r.instagram_visibility === 'everyone' ? r.instagram : null,
    seasonDays: seasonStats(r).days,
    isDemo: !!r.is_demo,
  };
}

// ---------- season stats & badges ----------

/** Ski seasons are counted from 1 August (northern-hemisphere season year). */
export function seasonStart(today = new Date().toISOString().slice(0, 10)) {
  const year = Number(today.slice(0, 4));
  return today.slice(5) >= '08-01' ? `${year}-08-01` : `${year - 1}-08-01`;
}

export function seasonStats(rider) {
  const db = getDb();
  const since = seasonStart();
  const days = db.prepare('SELECT DISTINCT day, resort_id FROM rider_days WHERE rider_id = ? AND day >= ?').all(rider.id, since);
  const resortIds = [...new Set(days.map((d) => d.resort_id))];
  const resorts = resortIds.length
    ? db.prepare(`SELECT id, osm_id, name, country, lat FROM resorts WHERE id IN (${resortIds.map(() => '?').join(',')})`).all(...resortIds)
    : [];
  const glacierIds = new Set(resorts.filter((r) => seasonFor(r).glacier).map((r) => r.id));
  return {
    days: new Set(days.map((d) => d.day)).size,
    resorts: resortIds.length,
    ridersMet: rider.riders_met || 0,
    glacierDays: new Set(days.filter((d) => glacierIds.has(d.resort_id)).map((d) => d.day)).size,
    homeDays: rider.home_resort_id ? new Set(days.filter((d) => d.resort_id === rider.home_resort_id).map((d) => d.day)).size : 0,
  };
}

const BADGES = [
  { key: 'first-tracks', label: 'First tracks', description: 'Check in for your first day', target: 1, stat: 'days' },
  { key: 'five-days', label: 'Five days deep', description: 'Ski five days this season', target: 5, stat: 'days' },
  { key: 'explorer', label: 'Explorer', description: 'Ski three different resorts', target: 3, stat: 'resorts' },
  { key: 'social', label: 'Social rider', description: 'Meet five riders', target: 5, stat: 'ridersMet' },
  { key: 'glacier', label: 'Glacier hunter', description: 'Ski a glacier', target: 1, stat: 'glacierDays' },
  { key: 'local', label: 'Local legend', description: 'Five days at your home mountain', target: 5, stat: 'homeDays' },
];

export function badgesFor(stats) {
  return BADGES.map(({ stat, ...b }) => ({
    ...b,
    current: Math.min(b.target, stats[stat]),
    unlocked: stats[stat] >= b.target,
  }));
}

const privateProfile = (r) => ({
  ...publicProfile(r, { connected: true }),
  gender: r.gender,
  visibility: r.visibility,
  instagramVisibility: r.instagram_visibility,
});

/** Create (no current rider) or update a profile. Returns { rider, token? }. */
export function saveProfile(current, input) {
  const p = validateProfile(input);
  const db = getDb();
  if (p.homeResortId != null && !db.prepare('SELECT 1 FROM resorts WHERE id = ?').get(p.homeResortId)) {
    throw new CommunityError(400, 'invalid_profile', 'Home mountain not found');
  }
  const avatarConfig = JSON.stringify(p.avatar ?? (current?.avatar_config ? JSON.parse(current.avatar_config) : randomAvatar(p.sport)));
  const tags = JSON.stringify(p.tags);
  if (current) {
    db.prepare(
      `UPDATE riders SET name=?, age=?, sport=?, gender=?, level=?, bio=?, visibility=?, avatar_config=?, tags=?,
       home_resort_id=?, instagram=?, instagram_visibility=?, updated_at=datetime('now') WHERE id=?`
    ).run(
      p.name, p.age, p.sport, p.gender, p.level, p.bio, p.visibility, avatarConfig, tags, p.homeResortId,
      p.instagram, p.instagramVisibility, current.id
    );
    return { rider: privateProfile(db.prepare('SELECT * FROM riders WHERE id=?').get(current.id)) };
  }
  const token = newToken();
  const avatar = AVATARS[crypto.randomInt(AVATARS.length)];
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO riders (token_hash, name, age, sport, gender, level, bio, visibility, avatar, avatar_config, tags,
       home_resort_id, instagram, instagram_visibility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      hashToken(token), p.name, p.age, p.sport, p.gender, p.level, p.bio, p.visibility, avatar, avatarConfig, tags,
      p.homeResortId, p.instagram, p.instagramVisibility
    );
  return { rider: privateProfile(db.prepare('SELECT * FROM riders WHERE id=?').get(lastInsertRowid)), token };
}

export const riderById = (id) => getDb().prepare('SELECT * FROM riders WHERE id = ?').get(id);

export function deleteRider(riderId) {
  const db = getDb();
  db.transaction(() => {
    db.prepare('UPDATE reports SET reporter = NULL WHERE reporter = ?').run(riderId);
    db.prepare('DELETE FROM riders WHERE id = ?').run(riderId);
  })();
}

export function me(rider) {
  const stats = seasonStats(rider);
  return { rider: privateProfile(rider), checkin: currentCheckin(rider.id), season: stats, badges: badgesFor(stats) };
}

// ---------- check-ins ----------

export function nearestResort(lat, lon) {
  let best = null;
  for (const r of getDb().prepare('SELECT id, name, region, country, lat, lon FROM resorts').all()) {
    const d = haversineDistance(lat, lon, r.lat, r.lon);
    if (!best || d < best.distanceKm) best = { resort: r, distanceKm: d };
  }
  return best;
}

const cleanIntents = (intents) => {
  const list = Array.isArray(intents) ? intents.filter((i) => INTENTS.includes(i)) : [];
  return list.length ? [...new Set(list)] : ['ride'];
};

export function currentCheckin(riderId) {
  const row = getDb()
    .prepare(
      `SELECT c.*, r.name AS resort_name, r.region, r.country FROM checkins c
       JOIN resorts r ON r.id = c.resort_id
       WHERE c.rider_id = ? AND c.expires_at > ?`
    )
    .get(riderId, nowIso());
  if (!row) return null;
  return {
    resort: { id: row.resort_id, name: row.resort_name, region: row.region, country: row.country },
    intents: JSON.parse(row.intents),
    note: row.note,
    expiresAt: row.expires_at,
  };
}

/**
 * Check in at the resort the rider is physically at. lat/lon are only used to
 * find the resort and are discarded. In development, devResortId simulates it.
 */
export function checkIn(rider, { lat, lon, intents, note, devResortId } = {}) {
  const db = getDb();
  let resort;
  if (devResortId != null && isDev()) {
    resort = db.prepare('SELECT id, name FROM resorts WHERE id = ?').get(devResortId);
    if (!resort) throw new CommunityError(404, 'resort_not_found', 'Resort not found');
  } else {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new CommunityError(400, 'location_required', 'Location is needed to confirm your resort');
    }
    const nearest = nearestResort(lat, lon);
    if (!nearest || nearest.distanceKm > CHECKIN_RADIUS_KM) {
      throw new CommunityError(422, 'not_at_resort', "You don't seem to be at a ski resort right now", {
        nearest: nearest && { name: nearest.resort.name, distanceKm: Math.round(nearest.distanceKm) },
      });
    }
    resort = nearest.resort;
  }

  const expiresAt = new Date(Date.now() + CHECKIN_HOURS * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT OR REPLACE INTO checkins (rider_id, resort_id, intents, note, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(rider.id, resort.id, JSON.stringify(cleanIntents(intents)), cleanText(note, LIMITS.note), nowIso(), expiresAt);
  db.prepare('INSERT OR IGNORE INTO rider_days (rider_id, resort_id, day) VALUES (?, ?, ?)').run(
    rider.id,
    resort.id,
    nowIso().slice(0, 10)
  );
  return currentCheckin(rider.id);
}

export function updateCheckin(rider, { intents, note }) {
  if (!currentCheckin(rider.id)) throw new CommunityError(409, 'not_checked_in', 'Check in first');
  getDb()
    .prepare('UPDATE checkins SET intents = ?, note = ? WHERE rider_id = ?')
    .run(JSON.stringify(cleanIntents(intents)), cleanText(note, LIMITS.note), rider.id);
  return currentCheckin(rider.id);
}

export function checkOut(riderId) {
  getDb().prepare('DELETE FROM checkins WHERE rider_id = ?').run(riderId);
}

/** Riders checked in per resort right now — aggregate counts only, safe to show publicly. */
export function activeCheckinCounts() {
  const rows = getDb()
    .prepare('SELECT resort_id, COUNT(*) AS n FROM checkins WHERE expires_at > ? GROUP BY resort_id')
    .all(nowIso());
  return new Map(rows.map((r) => [r.resort_id, r.n]));
}

// ---------- discovery of riders ----------

function blockedEitherWay(a, b) {
  return !!getDb()
    .prepare('SELECT 1 FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)')
    .get(a, b, b, a);
}

const visibleTo = (viewer, target) => target.visibility === 'everyone' || viewer.gender === 'woman';

function requireCheckedInAt(viewer, resortId) {
  const c = currentCheckin(viewer.id);
  if (!c || c.resort.id !== Number(resortId)) {
    throw new CommunityError(403, 'not_checked_in', "Check in at this resort to see who's riding here");
  }
  return c;
}

const todayCutoff = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

function connectionBetween(a, b, resortId) {
  return getDb()
    .prepare(
      `SELECT * FROM connections
       WHERE ((from_rider=? AND to_rider=?) OR (from_rider=? AND to_rider=?))
         AND resort_id=? AND created_at > ? AND status != 'declined'
       ORDER BY id DESC LIMIT 1`
    )
    .get(a, b, b, a, resortId, todayCutoff());
}

export function ridersAt(viewer, resortId) {
  requireCheckedInAt(viewer, resortId);
  const rows = getDb()
    .prepare(
      `SELECT r.*, c.intents, c.note, c.created_at AS checked_in_at FROM checkins c
       JOIN riders r ON r.id = c.rider_id
       WHERE c.resort_id = ? AND c.expires_at > ? AND r.id != ?
       ORDER BY r.is_demo ASC, c.created_at DESC`
    )
    .all(resortId, nowIso(), viewer.id);

  return rows
    .filter((r) => visibleTo(viewer, r) && !blockedEitherWay(viewer.id, r.id))
    .map((r) => {
      const conn = connectionBetween(viewer.id, r.id, Number(resortId));
      return {
        ...publicProfile(r, { connected: conn?.status === 'accepted' }),
        intents: JSON.parse(r.intents),
        note: r.note,
        checkedInAt: r.checked_in_at,
        connection: conn
          ? { id: conn.id, status: conn.status, direction: conn.from_rider === viewer.id ? 'outgoing' : 'incoming' }
          : null,
      };
    });
}

// ---------- connections & chat ----------

const DEMO_REPLIES = {
  ride: "Hey! Yes, let's ride 🙌 Meet at the top of the main lift in 20?",
  coffee: 'Coffee sounds great ☕ Main lodge terrace around 11?',
  apres: "Après it is 🍻 We'll be at the bar by the gondola base from 4.",
};

export function requestConnection(viewer, { toRiderId, intent }) {
  const db = getDb();
  const mine = currentCheckin(viewer.id);
  if (!mine) throw new CommunityError(409, 'not_checked_in', 'Check in first');
  const target = db.prepare('SELECT * FROM riders WHERE id = ?').get(toRiderId);
  const theirs = target && currentCheckin(target.id);
  if (!target || !theirs || theirs.resort.id !== mine.resort.id || !visibleTo(viewer, target)) {
    throw new CommunityError(404, 'rider_unavailable', "This rider isn't on the mountain anymore");
  }
  if (target.id === viewer.id || blockedEitherWay(viewer.id, target.id)) {
    throw new CommunityError(403, 'not_allowed', "You can't connect with this rider");
  }
  oneOf(intent, INTENTS, 'intent');

  const existing = connectionBetween(viewer.id, target.id, mine.resort.id);
  if (existing) return connectionView(viewer, existing);

  const sentToday = db
    .prepare('SELECT COUNT(*) AS n FROM connections WHERE from_rider = ? AND created_at > ?')
    .get(viewer.id, todayCutoff()).n;
  if (sentToday >= MAX_REQUESTS_PER_DAY) {
    throw new CommunityError(429, 'too_many_requests', 'Daily request limit reached — try again tomorrow');
  }

  const ts = nowIso();
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO connections (from_rider, to_rider, resort_id, intent, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(viewer.id, target.id, mine.resort.id, intent, ts, ts);

  // Development only: demo riders accept and reply so the flow can be tried end to end
  if (target.is_demo && isDev()) {
    db.prepare("UPDATE connections SET status = 'accepted', updated_at = ? WHERE id = ?").run(ts, lastInsertRowid);
    db.prepare('UPDATE riders SET riders_met = riders_met + 1 WHERE id IN (?, ?)').run(viewer.id, target.id);
    db.prepare('INSERT INTO messages (connection_id, from_rider, body, created_at) VALUES (?, ?, ?, ?)').run(
      lastInsertRowid,
      target.id,
      DEMO_REPLIES[intent],
      ts
    );
  }
  return connectionView(viewer, db.prepare('SELECT * FROM connections WHERE id = ?').get(lastInsertRowid));
}

function connectionView(viewer, c) {
  const db = getDb();
  const otherId = c.from_rider === viewer.id ? c.to_rider : c.from_rider;
  const other = db.prepare('SELECT * FROM riders WHERE id = ?').get(otherId);
  const last = db
    .prepare('SELECT body, from_rider, created_at FROM messages WHERE connection_id = ? ORDER BY id DESC LIMIT 1')
    .get(c.id);
  return {
    id: c.id,
    status: c.status,
    intent: c.intent,
    direction: c.from_rider === viewer.id ? 'outgoing' : 'incoming',
    createdAt: c.created_at,
    rider: other ? publicProfile(other, { connected: c.status === 'accepted' }) : null,
    lastMessage: last ? { body: last.body, mine: last.from_rider === viewer.id, at: last.created_at } : null,
  };
}

export function listConnections(viewer) {
  return getDb()
    .prepare(
      `SELECT * FROM connections WHERE (from_rider = ? OR to_rider = ?) AND created_at > ?
       AND status != 'declined' ORDER BY updated_at DESC`
    )
    .all(viewer.id, viewer.id, todayCutoff())
    .filter((c) => !blockedEitherWay(c.from_rider, c.to_rider))
    .map((c) => connectionView(viewer, c));
}

function connectionFor(viewer, id) {
  const c = getDb().prepare('SELECT * FROM connections WHERE id = ?').get(id);
  if (!c || (c.from_rider !== viewer.id && c.to_rider !== viewer.id)) {
    throw new CommunityError(404, 'not_found', 'Conversation not found');
  }
  if (blockedEitherWay(c.from_rider, c.to_rider)) throw new CommunityError(403, 'not_allowed', 'Not available');
  return c;
}

export function respondConnection(viewer, id, accept) {
  const c = connectionFor(viewer, id);
  if (c.to_rider !== viewer.id || c.status !== 'pending') {
    throw new CommunityError(409, 'not_pending', 'This request was already answered');
  }
  getDb()
    .prepare('UPDATE connections SET status = ?, updated_at = ? WHERE id = ?')
    .run(accept ? 'accepted' : 'declined', nowIso(), id);
  if (accept) {
    getDb().prepare('UPDATE riders SET riders_met = riders_met + 1 WHERE id IN (?, ?)').run(c.from_rider, c.to_rider);
  }
  return connectionView(viewer, getDb().prepare('SELECT * FROM connections WHERE id = ?').get(id));
}

function requireAccepted(c) {
  if (c.status !== 'accepted') throw new CommunityError(409, 'not_accepted', 'Chat opens once the request is accepted');
}

export function listMessages(viewer, id, afterId = 0) {
  const c = connectionFor(viewer, id);
  requireAccepted(c);
  return getDb()
    .prepare('SELECT id, from_rider, body, created_at FROM messages WHERE connection_id = ? AND id > ? ORDER BY id')
    .all(id, afterId)
    .map((m) => ({ id: m.id, body: m.body, mine: m.from_rider === viewer.id, at: m.created_at }));
}

export function sendMessage(viewer, id, body) {
  const c = connectionFor(viewer, id);
  requireAccepted(c);
  const text = cleanText(body, LIMITS.message);
  if (!text) throw new CommunityError(400, 'empty_message', 'Message is empty');
  const ts = nowIso();
  const { lastInsertRowid } = getDb()
    .prepare('INSERT INTO messages (connection_id, from_rider, body, created_at) VALUES (?, ?, ?, ?)')
    .run(id, viewer.id, text, ts);
  getDb().prepare('UPDATE connections SET updated_at = ? WHERE id = ?').run(ts, id);
  return { id: lastInsertRowid, body: text, mine: true, at: ts };
}

// ---------- safety ----------

export function blockRider(viewer, otherId) {
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM riders WHERE id = ?').get(otherId) || otherId === viewer.id) {
    throw new CommunityError(404, 'not_found', 'Rider not found');
  }
  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO blocks (blocker, blocked) VALUES (?, ?)').run(viewer.id, otherId);
    db.prepare(
      `UPDATE connections SET status = 'declined', updated_at = ?
       WHERE (from_rider=? AND to_rider=?) OR (from_rider=? AND to_rider=?)`
    ).run(nowIso(), viewer.id, otherId, otherId, viewer.id);
  })();
}

/** Reporting also blocks, so the reporter never sees that rider again. */
export function reportRider(viewer, otherId, reason) {
  const text = cleanText(reason, 300) || 'No reason given';
  blockRider(viewer, otherId);
  getDb().prepare('INSERT INTO reports (reporter, reported, reason) VALUES (?, ?, ?)').run(viewer.id, otherId, text);
}

/** Development helper: resorts to simulate a check-in at (in-season ones first). */
export function devCheckinOptions(isInSeason) {
  const counts = activeCheckinCounts();
  return getDb()
    .prepare('SELECT id, name, country, osm_id, lat FROM resorts ORDER BY name')
    .all()
    .map((r) => ({ id: r.id, name: r.name, country: r.country, inSeason: isInSeason(r), riders: counts.get(r.id) || 0 }))
    .sort((a, b) => b.inSeason - a.inSeason || b.riders - a.riders || a.name.localeCompare(b.name));
}
