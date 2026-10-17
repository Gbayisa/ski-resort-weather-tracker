import { describe, it, expect, beforeAll } from 'vitest';

// Isolated database for this file — must be set before the db module loads
process.env.DB_PATH = ':memory:';
const { initDb, getDb } = await import('../db/database.js');
const c = await import('../services/community.js');

const ZERMATT = { lat: 46.0207, lon: 7.7491 };
let zermattId;
let verbierId;

const profile = (over = {}) => ({ name: 'Alex', age: 30, sport: 'ski', gender: 'man', level: 'advanced', ...over });
const create = (over) => c.saveProfile(null, profile(over));
const row = (id) => getDb().prepare('SELECT * FROM riders WHERE id = ?').get(id);

beforeAll(() => {
  initDb();
  const insert = getDb().prepare('INSERT INTO resorts (name, lat, lon, country, osm_id) VALUES (?, ?, ?, ?, ?)');
  zermattId = insert.run('Zermatt', ZERMATT.lat, ZERMATT.lon, 'CH', 'osm_zermatt').lastInsertRowid;
  verbierId = insert.run('Verbier', 46.0964, 7.2283, 'CH', 'osm_verbier').lastInsertRowid;
});

describe('profiles', () => {
  it('rejects anyone under 18', () => {
    expect(() => create({ age: 17 })).toThrow(/18 or older/);
  });

  it('creates a profile with a token, storing only its hash', () => {
    const { rider, token } = create();
    expect(token).toMatch(/^[\w-]{40,}$/);
    expect(row(rider.id).token_hash).toBe(c.hashToken(token));
    expect(c.riderFromToken(token).id).toBe(rider.id);
    expect(c.riderFromToken('wrong')).toBeNull();
  });

  it('only lets women choose women-only visibility', () => {
    expect(create({ gender: 'man', visibility: 'women' }).rider.visibility).toBe('everyone');
    expect(create({ gender: 'woman', visibility: 'women' }).rider.visibility).toBe('women');
  });

  it('hides undisclosed gender from other riders', () => {
    const { rider } = create({ gender: 'undisclosed' });
    expect(c.publicProfile(row(rider.id)).gender).toBeNull();
  });
});

describe('check-in (resort-level location only)', () => {
  it('refuses when not near a resort, and names the closest one', () => {
    const r = row(create().rider.id);
    try {
      c.checkIn(r, { lat: 46.2, lon: 6.15 }); // Geneva
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.code).toBe('not_at_resort');
      expect(e.extra.nearest.name).toBeDefined();
    }
  });

  it('checks in at the nearby resort without storing coordinates', () => {
    const r = row(create().rider.id);
    const checkin = c.checkIn(r, { lat: ZERMATT.lat + 0.01, lon: ZERMATT.lon, intents: ['coffee', 'bogus'] });
    expect(checkin.resort.name).toBe('Zermatt');
    expect(checkin.intents).toEqual(['coffee']);
    const cols = getDb().prepare('PRAGMA table_info(checkins)').all().map((x) => x.name);
    expect(cols.some((name) => /lat|lon/.test(name))).toBe(false);
  });

  it("only shows riders to people checked in at the same resort", () => {
    const viewer = row(create().rider.id);
    expect(() => c.ridersAt(viewer, zermattId)).toThrow(/Check in/);
    c.checkIn(viewer, { devResortId: verbierId });
    expect(() => c.ridersAt(viewer, zermattId)).toThrow(/Check in/);
  });
});

describe('meeting up', () => {
  it('runs request → accept → chat, and hides women-only riders from men', () => {
    const alex = row(create({ name: 'Alex' }).rider.id);
    const sam = row(create({ name: 'Sam', gender: 'woman' }).rider.id);
    const kim = row(create({ name: 'Kim', gender: 'woman', visibility: 'women' }).rider.id);
    for (const r of [alex, sam, kim]) c.checkIn(r, { devResortId: zermattId });

    const seenByAlex = c.ridersAt(alex, zermattId).map((r) => r.name);
    expect(seenByAlex).toContain('Sam');
    expect(seenByAlex).not.toContain('Kim');
    expect(c.ridersAt(sam, zermattId).map((r) => r.name)).toContain('Kim');
    expect(() => c.requestConnection(alex, { toRiderId: kim.id, intent: 'ride' })).toThrow();

    const conn = c.requestConnection(alex, { toRiderId: sam.id, intent: 'ride' });
    expect(conn.status).toBe('pending');
    expect(() => c.sendMessage(alex, conn.id, 'hi')).toThrow(/accepted/);
    expect(() => c.respondConnection(alex, conn.id, true)).toThrow(); // only the recipient answers

    c.respondConnection(sam, conn.id, true);
    c.sendMessage(alex, conn.id, '  Top of the gondola at 10?  ');
    const msgs = c.listMessages(sam, conn.id);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ body: 'Top of the gondola at 10?', mine: false });
  });

  it('blocking hides riders both ways and closes the chat', () => {
    const a = row(create({ name: 'Ana' }).rider.id);
    const b = row(create({ name: 'Ben' }).rider.id);
    c.checkIn(a, { devResortId: zermattId });
    c.checkIn(b, { devResortId: zermattId });
    const conn = c.requestConnection(a, { toRiderId: b.id, intent: 'coffee' });
    c.respondConnection(b, conn.id, true);

    c.reportRider(b, a.id, 'Rude');
    expect(c.ridersAt(a, zermattId).map((r) => r.name)).not.toContain('Ben');
    expect(c.ridersAt(b, zermattId).map((r) => r.name)).not.toContain('Ana');
    expect(() => c.sendMessage(a, conn.id, 'hello?')).toThrow();
  });

  it('deleting a profile removes check-ins and conversations', () => {
    const a = row(create({ name: 'Del' }).rider.id);
    const b = row(create({ name: 'Eve' }).rider.id);
    c.checkIn(a, { devResortId: zermattId });
    c.checkIn(b, { devResortId: zermattId });
    c.requestConnection(a, { toRiderId: b.id, intent: 'apres' });
    c.deleteRider(a.id);
    const db = getDb();
    expect(db.prepare('SELECT COUNT(*) n FROM checkins WHERE rider_id = ?').get(a.id).n).toBe(0);
    expect(db.prepare('SELECT COUNT(*) n FROM connections WHERE from_rider = ?').get(a.id).n).toBe(0);
  });
});

describe('profile customisation & season', () => {
  const avatar = {
    skin: 7, expression: 'stoked', marks: 'freckles', facialHair: 'none', hair: 'braids', hairLength: 'long',
    hairColor: 'auburn', headwear: 'pom', hat: 'sun', eyewear: 'goggles-up', lens: 'rose', outfit: 'puffer',
    pattern: 'chevron', jacket: 'night', accent: 'coral', pants: 'sand', gear: 'board', graphic: 'flame',
    gearColor: 'teal', backdrop: 'aurora',
  };

  it('stores a valid avatar and rejects unknown parts', () => {
    const { rider } = create({ name: 'Ava', avatar });
    expect(rider.avatarConfig).toEqual(avatar);
    expect(() => create({ avatar: { ...avatar, hat: 'plaid' } })).toThrow(/Avatar hat/);
  });

  it('gives new riders a valid random avatar when they skip the builder', () => {
    const { rider } = create({ name: 'Rio', sport: 'snowboard' });
    for (const [key, allowed] of Object.entries(c.AVATAR_OPTIONS)) {
      expect(allowed).toContain(rider.avatarConfig[key]);
    }
    expect(rider.avatarConfig.gear).toBe('board');
  });

  it('rejects avatars with missing parts', () => {
    const partial = { ...avatar };
    delete partial.gear;
    expect(() => create({ avatar: partial })).toThrow(/Avatar gear/);
  });

  it('keeps at most three known vibe tags', () => {
    const { rider } = create({ tags: ['powder-hound', 'nonsense', 'park-rat', 'apres', 'touring'] });
    expect(rider.tags).toEqual(['powder-hound', 'park-rat', 'apres']);
  });

  it('validates the home mountain', () => {
    expect(create({ homeResortId: zermattId }).rider.home).toEqual({ id: zermattId, name: 'Zermatt' });
    expect(() => create({ homeResortId: 999999 })).toThrow(/Home mountain/);
  });

  it('counts days, resorts, riders met and unlocks badges', () => {
    const a = row(create({ name: 'Una', homeResortId: zermattId }).rider.id);
    const b = row(create({ name: 'Vik' }).rider.id);
    c.checkIn(a, { devResortId: zermattId });
    c.checkIn(a, { devResortId: zermattId }); // same day twice counts once
    c.checkIn(b, { devResortId: zermattId });
    const conn = c.requestConnection(a, { toRiderId: b.id, intent: 'ride' });
    c.respondConnection(b, conn.id, true);

    const { season, badges } = c.me(row(a.id));
    expect(season).toMatchObject({ days: 1, resorts: 1, ridersMet: 1, glacierDays: 1, homeDays: 1 });
    const byKey = Object.fromEntries(badges.map((x) => [x.key, x]));
    expect(byKey['first-tracks'].unlocked).toBe(true);
    expect(byKey.glacier.unlocked).toBe(true); // Zermatt is a glacier resort
    expect(byKey.explorer).toMatchObject({ unlocked: false, current: 1, target: 3 });
    expect(c.publicProfile(row(b.id)).seasonDays).toBe(1);
  });

  it('starts the season on 1 August', () => {
    expect(c.seasonStart('2026-10-17')).toBe('2026-08-01');
    expect(c.seasonStart('2027-03-01')).toBe('2026-08-01');
  });
});

describe('instagram', () => {
  it('accepts usernames, @usernames and profile links', () => {
    expect(c.cleanInstagram('@Lea.Skis')).toBe('lea.skis');
    expect(c.cleanInstagram('https://www.instagram.com/lea_skis/?igsh=abc')).toBe('lea_skis');
    expect(c.cleanInstagram('  ')).toBeNull();
    for (const bad of ['lea skis', 'a'.repeat(31), '.lea', 'lea.', 'le..a', 'instagram.com/p/xyz']) {
      expect(() => c.cleanInstagram(bad)).toThrow(/Instagram/);
    }
  });

  it('lets the owner see their handle and who it is shared with', () => {
    const { rider } = create({ name: 'Kit', instagram: '@kit.rides' });
    expect(rider).toMatchObject({ instagram: 'kit.rides', instagramVisibility: 'connections' });
  });

  it('shows the handle only once a connection is accepted', () => {
    const a = row(create({ name: 'Ines', instagram: 'ines.rides' }).rider.id);
    const b = row(create({ name: 'Bo' }).rider.id);
    c.checkIn(a, { devResortId: zermattId });
    c.checkIn(b, { devResortId: zermattId });
    const seen = () => c.ridersAt(row(b.id), zermattId).find((r) => r.id === a.id);

    expect(seen().instagram).toBeNull();
    const conn = c.requestConnection(row(b.id), { toRiderId: a.id, intent: 'coffee' });
    expect(c.listConnections(row(b.id))[0].rider.instagram).toBeNull();
    c.respondConnection(row(a.id), conn.id, true);
    expect(seen().instagram).toBe('ines.rides');
    expect(c.listConnections(row(b.id))[0].rider.instagram).toBe('ines.rides');
  });

  it('can be shared with everyone at the resort', () => {
    const a = row(create({ name: 'Oli', instagram: 'oli.shreds', instagramVisibility: 'everyone' }).rider.id);
    const b = row(create({ name: 'Pia' }).rider.id);
    c.checkIn(a, { devResortId: zermattId });
    c.checkIn(b, { devResortId: zermattId });
    expect(c.ridersAt(row(b.id), zermattId).find((r) => r.id === a.id).instagram).toBe('oli.shreds');
    expect(() => create({ instagram: 'x', instagramVisibility: 'world' })).toThrow(/instagramVisibility/);
  });
});
