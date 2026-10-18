import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Isolated in-memory database for this file — must be set before the db module loads
process.env.DB_PATH = ':memory:';
const { initDb, getDb, closeDb } = await import('../db/database.js');
const { invalidateResorts } = await import('../db/resortCatalog.js');
const c = await import('../services/community.js');

const ZERMATT = { lat: 46.0207, lon: 7.7491 };
let zermattId;
let verbierId;

const profile = (over = {}) => ({ name: 'Alex', age: 30, sport: 'ski', gender: 'man', level: 'advanced', ...over });
const create = (over) => c.saveProfile(null, profile(over));
const row = (id) => getDb().get('SELECT * FROM riders WHERE id = ?', id);
const riderOf = async (over) => row((await create(over)).rider.id);

beforeAll(async () => {
  const db = await initDb();
  const insert = (...v) => db.insert('INSERT INTO resorts (name, lat, lon, country, osm_id) VALUES (?, ?, ?, ?, ?)', ...v);
  zermattId = await insert('Zermatt', ZERMATT.lat, ZERMATT.lon, 'CH', 'osm_zermatt');
  verbierId = await insert('Verbier', 46.0964, 7.2283, 'CH', 'osm_verbier');
  invalidateResorts();
});

afterAll(() => closeDb());

describe('profiles', () => {
  it('rejects anyone under 18', async () => {
    await expect(create({ age: 17 })).rejects.toThrow(/18 or older/);
  });

  it('creates a profile with a token, storing only its hash', async () => {
    const { rider, token } = await create();
    expect(token).toMatch(/^[\w-]{40,}$/);
    expect((await row(rider.id)).token_hash).toBe(c.hashToken(token));
    expect((await c.riderFromToken(token)).id).toBe(rider.id);
    expect(await c.riderFromToken('wrong')).toBeNull();
  });

  it('only lets women choose women-only visibility', async () => {
    expect((await create({ gender: 'man', visibility: 'women' })).rider.visibility).toBe('everyone');
    expect((await create({ gender: 'woman', visibility: 'women' })).rider.visibility).toBe('women');
  });

  it('hides undisclosed gender from other riders', async () => {
    const { rider } = await create({ gender: 'undisclosed' });
    expect((await c.publicProfile(await row(rider.id))).gender).toBeNull();
  });
});

describe('check-in (resort-level location only)', () => {
  it('refuses when not near a resort, and names the closest one', async () => {
    const r = await riderOf();
    try {
      await c.checkIn(r, { lat: 46.2, lon: 6.15 }); // Geneva
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.code).toBe('not_at_resort');
      expect(e.extra.nearest.name).toBeDefined();
    }
  });

  it('checks in at the nearby resort without storing coordinates', async () => {
    const r = await riderOf();
    const checkin = await c.checkIn(r, { lat: ZERMATT.lat + 0.01, lon: ZERMATT.lon, intents: ['coffee', 'bogus'] });
    expect(checkin.resort.name).toBe('Zermatt');
    expect(checkin.intents).toEqual(['coffee']);
    const cols = (await getDb().all("SELECT column_name AS name FROM information_schema.columns WHERE table_name = 'checkins'")).map((x) => x.name);
    expect(cols.some((name) => /lat|lon/.test(name))).toBe(false);
  });

  it("only shows riders to people checked in at the same resort", async () => {
    const viewer = await riderOf();
    await expect(c.ridersAt(viewer, zermattId)).rejects.toThrow(/Check in/);
    await c.checkIn(viewer, { devResortId: verbierId });
    await expect(c.ridersAt(viewer, zermattId)).rejects.toThrow(/Check in/);
  });
});

describe('meeting up', () => {
  it('runs request → accept → chat, and hides women-only riders from men', async () => {
    const alex = await riderOf({ name: 'Alex' });
    const sam = await riderOf({ name: 'Sam', gender: 'woman' });
    const kim = await riderOf({ name: 'Kim', gender: 'woman', visibility: 'women' });
    for (const r of [alex, sam, kim]) await c.checkIn(r, { devResortId: zermattId });

    const seenByAlex = (await c.ridersAt(alex, zermattId)).map((r) => r.name);
    expect(seenByAlex).toContain('Sam');
    expect(seenByAlex).not.toContain('Kim');
    expect((await c.ridersAt(sam, zermattId)).map((r) => r.name)).toContain('Kim');
    await expect(c.requestConnection(alex, { toRiderId: kim.id, intent: 'ride' })).rejects.toThrow();

    const conn = await c.requestConnection(alex, { toRiderId: sam.id, intent: 'ride' });
    expect(conn.status).toBe('pending');
    await expect(c.sendMessage(alex, conn.id, 'hi')).rejects.toThrow(/accepted/);
    await expect(c.respondConnection(alex, conn.id, true)).rejects.toThrow(); // only the recipient answers

    await c.respondConnection(sam, conn.id, true);
    await c.sendMessage(alex, conn.id, '  Top of the gondola at 10?  ');
    const msgs = await c.listMessages(sam, conn.id);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ body: 'Top of the gondola at 10?', mine: false });
  });

  it('blocking hides riders both ways and closes the chat', async () => {
    const a = await riderOf({ name: 'Ana' });
    const b = await riderOf({ name: 'Ben' });
    await c.checkIn(a, { devResortId: zermattId });
    await c.checkIn(b, { devResortId: zermattId });
    const conn = await c.requestConnection(a, { toRiderId: b.id, intent: 'coffee' });
    await c.respondConnection(b, conn.id, true);

    await c.reportRider(b, a.id, 'Rude');
    expect((await c.ridersAt(a, zermattId)).map((r) => r.name)).not.toContain('Ben');
    expect((await c.ridersAt(b, zermattId)).map((r) => r.name)).not.toContain('Ana');
    await expect(c.sendMessage(a, conn.id, 'hello?')).rejects.toThrow();
  });

  it('deleting a profile removes check-ins and conversations', async () => {
    const a = await riderOf({ name: 'Del' });
    const b = await riderOf({ name: 'Eve' });
    await c.checkIn(a, { devResortId: zermattId });
    await c.checkIn(b, { devResortId: zermattId });
    await c.requestConnection(a, { toRiderId: b.id, intent: 'apres' });
    await c.deleteRider(a.id);
    const db = getDb();
    expect((await db.get('SELECT COUNT(*) AS n FROM checkins WHERE rider_id = ?', a.id)).n).toBe(0);
    expect((await db.get('SELECT COUNT(*) AS n FROM connections WHERE from_rider = ?', a.id)).n).toBe(0);
  });
});

describe('profile customisation & season', () => {
  const avatar = {
    skin: 7, expression: 'stoked', marks: 'freckles', facialHair: 'none', hair: 'braids', hairLength: 'long',
    hairColor: 'auburn', headwear: 'pom', hat: 'sun', eyewear: 'goggles-up', lens: 'rose', outfit: 'puffer',
    pattern: 'chevron', jacket: 'night', accent: 'coral', pants: 'sand', gear: 'board', graphic: 'flame',
    gearColor: 'teal', backdrop: 'aurora',
  };

  it('stores a valid avatar and rejects unknown parts', async () => {
    const { rider } = await create({ name: 'Ava', avatar });
    expect(rider.avatarConfig).toEqual(avatar);
    await expect(create({ avatar: { ...avatar, hat: 'plaid' } })).rejects.toThrow(/Avatar hat/);
  });

  it('gives new riders a valid random avatar when they skip the builder', async () => {
    const { rider } = await create({ name: 'Rio', sport: 'snowboard' });
    for (const [key, allowed] of Object.entries(c.AVATAR_OPTIONS)) {
      expect(allowed).toContain(rider.avatarConfig[key]);
    }
    expect(rider.avatarConfig.gear).toBe('board');
  });

  it('rejects avatars with missing parts', async () => {
    const partial = { ...avatar };
    delete partial.gear;
    await expect(create({ avatar: partial })).rejects.toThrow(/Avatar gear/);
  });

  it('keeps at most three known vibe tags', async () => {
    const { rider } = await create({ tags: ['powder-hound', 'nonsense', 'park-rat', 'apres', 'touring'] });
    expect(rider.tags).toEqual(['powder-hound', 'park-rat', 'apres']);
  });

  it('validates the home mountain', async () => {
    expect((await create({ homeResortId: zermattId })).rider.home).toEqual({ id: zermattId, name: 'Zermatt' });
    await expect(create({ homeResortId: 999999 })).rejects.toThrow(/Home mountain/);
  });

  it('counts days, resorts, riders met and unlocks badges', async () => {
    const a = await riderOf({ name: 'Una', homeResortId: zermattId });
    const b = await riderOf({ name: 'Vik' });
    await c.checkIn(a, { devResortId: zermattId });
    await c.checkIn(a, { devResortId: zermattId }); // same day twice counts once
    await c.checkIn(b, { devResortId: zermattId });
    const conn = await c.requestConnection(a, { toRiderId: b.id, intent: 'ride' });
    await c.respondConnection(b, conn.id, true);

    const { season, badges } = await c.me(await row(a.id));
    expect(season).toMatchObject({ days: 1, resorts: 1, ridersMet: 1, glacierDays: 1, homeDays: 1 });
    const byKey = Object.fromEntries(badges.map((x) => [x.key, x]));
    expect(byKey['first-tracks'].unlocked).toBe(true);
    expect(byKey.glacier.unlocked).toBe(true); // Zermatt is a glacier resort
    expect(byKey.explorer).toMatchObject({ unlocked: false, current: 1, target: 3 });
    expect((await c.publicProfile(await row(b.id))).seasonDays).toBe(1);
  });

  it('starts the season on 1 August', async () => {
    expect(c.seasonStart('2026-10-17')).toBe('2026-08-01');
    expect(c.seasonStart('2027-03-01')).toBe('2026-08-01');
  });
});

describe('instagram', () => {
  it('accepts usernames, @usernames and profile links', async () => {
    expect(c.cleanInstagram('@Lea.Skis')).toBe('lea.skis');
    expect(c.cleanInstagram('https://www.instagram.com/lea_skis/?igsh=abc')).toBe('lea_skis');
    expect(c.cleanInstagram('  ')).toBeNull();
    for (const bad of ['lea skis', 'a'.repeat(31), '.lea', 'lea.', 'le..a', 'instagram.com/p/xyz']) {
      expect(() => c.cleanInstagram(bad)).toThrow(/Instagram/);
    }
  });

  it('lets the owner see their handle and who it is shared with', async () => {
    const { rider } = await create({ name: 'Kit', instagram: '@kit.rides' });
    expect(rider).toMatchObject({ instagram: 'kit.rides', instagramVisibility: 'connections' });
  });

  it('shows the handle only once a connection is accepted', async () => {
    const a = await riderOf({ name: 'Ines', instagram: 'ines.rides' });
    const b = await riderOf({ name: 'Bo' });
    await c.checkIn(a, { devResortId: zermattId });
    await c.checkIn(b, { devResortId: zermattId });
    const seen = async () => (await c.ridersAt(await row(b.id), zermattId)).find((r) => r.id === a.id);

    expect((await seen()).instagram).toBeNull();
    const conn = await c.requestConnection(await row(b.id), { toRiderId: a.id, intent: 'coffee' });
    expect((await c.listConnections(await row(b.id)))[0].rider.instagram).toBeNull();
    await c.respondConnection(await row(a.id), conn.id, true);
    expect((await seen()).instagram).toBe('ines.rides');
    expect((await c.listConnections(await row(b.id)))[0].rider.instagram).toBe('ines.rides');
  });

  it('can be shared with everyone at the resort', async () => {
    const a = await riderOf({ name: 'Oli', instagram: 'oli.shreds', instagramVisibility: 'everyone' });
    const b = await riderOf({ name: 'Pia' });
    await c.checkIn(a, { devResortId: zermattId });
    await c.checkIn(b, { devResortId: zermattId });
    expect((await c.ridersAt(await row(b.id), zermattId)).find((r) => r.id === a.id).instagram).toBe('oli.shreds');
    await expect(create({ instagram: 'x', instagramVisibility: 'world' })).rejects.toThrow(/instagramVisibility/);
  });
});
