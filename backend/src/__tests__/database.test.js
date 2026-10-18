import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Isolated in-memory database for this file — must be set before the db module loads
process.env.DB_PATH = ':memory:';

// No network in tests: every resort gets a tiny fake forecast
vi.mock('../services/openMeteo.js', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchForecastBatch: vi.fn(async (resorts) => resorts.map((r) => ({ hourly: { time: [], fake: r.id }, elevation: 1500 }))),
}));

const { initDb, getDb, closeDb } = await import('../db/database.js');
const { allResorts } = await import('../db/resortCatalog.js');
const { seed, SEED_RESORTS } = await import('../scripts/seedResorts.js');
const { ensureForecasts, readForecasts, freshForecastIds } = await import('../services/weatherCache.js');
const { getDriveInfoBatch } = await import('../services/driveTime.js');
const { cleanExpiredCache } = await import('../jobs/scheduler.js');
const { fetchForecastBatch } = await import('../services/openMeteo.js');

beforeAll(async () => {
  await initDb();
  await seed();
});

afterAll(() => closeDb());

describe('resort catalogue seeding', () => {
  it('loads every curated resort and the OpenSkiMap catalogue in bulk', async () => {
    const resorts = await allResorts();
    expect(resorts.length).toBeGreaterThan(3000);
    const zermatt = resorts.find((r) => r.osm_id === 'osm_zermatt');
    expect(zermatt).toMatchObject({ name: 'Zermatt', country: 'CH' });
    expect(zermatt.piste_km).toBeGreaterThan(100);
    const curated = new Set(SEED_RESORTS.map((r) => r.osm_id));
    expect(resorts.filter((r) => curated.has(r.osm_id))).toHaveLength(SEED_RESORTS.length);
  });

  it('skips re-seeding an unchanged catalogue, and can be forced', async () => {
    const db = getDb();
    await db.run("UPDATE resorts SET name = 'Renamed' WHERE osm_id = 'osm_zermatt'");
    await seed();
    expect((await db.get("SELECT name FROM resorts WHERE osm_id = 'osm_zermatt'")).name).toBe('Renamed');
    await db.run("UPDATE resorts SET name = 'Zermatt' WHERE osm_id = 'osm_zermatt'");
    await seed({ force: true });
    expect((await db.get('SELECT COUNT(*) AS n FROM resorts')).n).toBe((await allResorts()).length);
  });
});

describe('forecast cache', () => {
  it('fetches only missing forecasts and reads them back in one go', async () => {
    const resorts = (await allResorts()).slice(0, 60);
    fetchForecastBatch.mockClear();
    await ensureForecasts(resorts);
    expect(fetchForecastBatch).toHaveBeenCalledTimes(2); // 50 + 10 locations

    const ids = resorts.map((r) => r.id);
    expect((await freshForecastIds(ids)).size).toBe(60);
    const forecasts = await readForecasts(ids);
    expect(forecasts.get(ids[0])).toEqual({ hourly: { time: [], fake: ids[0] }, apiElevation: 1500 });

    fetchForecastBatch.mockClear();
    await ensureForecasts(resorts);
    expect(fetchForecastBatch).not.toHaveBeenCalled();
    const used = await getDb().get('SELECT last_used_at FROM resort_forecasts WHERE resort_id = ?', ids[0]);
    expect(used.last_used_at).toMatch(/^\d{4}-\d\d-\d\dT/);
  });
});

describe('route cache', () => {
  it('stores a whole batch of drive times and serves OSRM routes from cache', async () => {
    const resorts = (await allResorts()).slice(0, 5);
    const realFetch = global.fetch;
    global.fetch = vi.fn(async () => {
      throw new Error('offline');
    });
    try {
      const first = await getDriveInfoBatch(46.2, 6.15, resorts);
      expect([...first.values()].every((i) => i.source === 'estimate')).toBe(true);
      const rows = await getDb().all('SELECT * FROM route_cache WHERE resort_id = ANY(?::int[])', resorts.map((r) => r.id));
      expect(rows).toHaveLength(5);

      // Estimates are retried; once OSRM answers, the cached route is final
      await getDb().run("UPDATE route_cache SET source = 'osrm', duration_min = 42 WHERE resort_id = ?", resorts[0].id);
      const second = await getDriveInfoBatch(46.2, 6.15, resorts);
      expect(second.get(resorts[0].id)).toMatchObject({ source: 'osrm', durationMin: 42 });
    } finally {
      global.fetch = realFetch;
    }
  });
});

describe('maintenance', () => {
  it('removes stale forecasts, routes, finished check-ins and old chats', async () => {
    const db = getDb();
    const longAgo = '2020-01-01T00:00:00.000Z';
    const [resort] = await allResorts();
    await db.run('UPDATE resort_forecasts SET expires_at = ? WHERE resort_id = ?', longAgo, resort.id);
    await db.run('UPDATE route_cache SET expires_at = ?', longAgo);
    const summary = await cleanExpiredCache();
    expect(summary.forecasts).toBe(1);
    expect(summary.routes).toBeGreaterThanOrEqual(5);
    expect((await db.get('SELECT COUNT(*) AS n FROM route_cache')).n).toBe(0);
  });
});
