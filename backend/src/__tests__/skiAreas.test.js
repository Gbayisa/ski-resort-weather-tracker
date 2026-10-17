import { describe, it, expect } from 'vitest';
import { loadSkiAreas, SEED_RESORTS } from '../scripts/seedResorts.js';
import { haversineDistance } from '../services/forecastUtils.js';
import { seasonStatus } from '../data/seasons.js';

const { areas, curatedFill } = loadSkiAreas();
const within = (lat, lon, km) => areas.filter((a) => haversineDistance(lat, lon, a.lat, a.lon) <= km);

describe('OpenSkiMap catalogue', () => {
  it('covers thousands of ski areas, not just the famous resorts', () => {
    expect(areas.length).toBeGreaterThan(3000);
  });

  it('has valid, unique, usable entries', () => {
    const ids = new Set();
    for (const a of areas) {
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.name).toBeTruthy();
      expect(Math.abs(a.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(a.lon)).toBeLessThanOrEqual(180);
      expect(a.country).toMatch(/^[A-Z]{2}$/);
      expect(a.peak).toBeGreaterThanOrEqual(a.base);
      if (a.easy != null) expect(a.easy + a.inter + a.adv).toBe(100);
    }
  });

  it('finds the Apennine resorts near Rome (regression: Rome returned nothing)', () => {
    const names = within(41.8933, 12.4829, 150).map((a) => a.name);
    for (const n of ['Terminillo', 'Campo Felice', 'Ovindoli', 'Livata']) {
      expect(names.some((name) => name.includes(n))).toBe(true);
    }
  });

  it('drops umbrella domains and lift-pass alliances', () => {
    const names = new Set(areas.map((a) => a.name));
    for (const n of ['Dolomiti Superski', 'Ski amadé', 'Les Trois Vallées', 'Les Portes du Soleil', 'Paradiski']) {
      expect(names.has(n)).toBe(false);
    }
  });

  it('does not duplicate curated resorts at the same spot', () => {
    const clashes = areas.filter((a) =>
      SEED_RESORTS.some((r) => haversineDistance(a.lat, a.lon, r.lat, r.lon) < 1 && r.name === a.name)
    );
    expect(clashes).toEqual([]);
  });

  it('fills terrain stats for most curated resorts that lacked them', () => {
    expect(Object.keys(curatedFill).length).toBeGreaterThan(150);
  });

  it('treats imported glaciers as open in autumn', () => {
    const hintertux = areas.find((a) => /hintertux/i.test(a.name));
    const stubai = areas.find((a) => /stubaier gletscher/i.test(a.name));
    expect(seasonStatus({ ...hintertux, osm_id: `osk:${hintertux.id}` }, '2026-10-17')).toMatchObject({
      inSeason: true,
      glacier: true,
    });
    expect(seasonStatus({ ...stubai, osm_id: `osk:${stubai.id}` }, '2026-10-17').inSeason).toBe(true);
  });
});
