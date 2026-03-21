import { describe, it, expect } from 'vitest';
import { SEED_RESORTS } from '../scripts/seedResorts.js';

const REQUIRED_FIELDS = ['name', 'lat', 'lon', 'country', 'region', 'website', 'osm_id'];

describe('SEED_RESORTS data integrity', () => {
  it('contains at least 150 resorts', () => {
    expect(SEED_RESORTS.length).toBeGreaterThanOrEqual(150);
  });

  it('every resort has all required fields', () => {
    const missing = [];
    for (const resort of SEED_RESORTS) {
      for (const field of REQUIRED_FIELDS) {
        if (resort[field] === undefined || resort[field] === null || resort[field] === '') {
          missing.push(`${resort.name || '(unnamed)'} is missing field: ${field}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('all osm_id values are unique', () => {
    const ids = SEED_RESORTS.map((r) => r.osm_id);
    const unique = new Set(ids);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
    expect(unique.size).toBe(SEED_RESORTS.length);
  });

  it('all resort names are unique', () => {
    const names = SEED_RESORTS.map((r) => r.name);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    expect(duplicates).toEqual([]);
  });

  it('all latitude values are within valid range (-90 to 90)', () => {
    const invalid = SEED_RESORTS.filter((r) => r.lat < -90 || r.lat > 90);
    expect(invalid.map((r) => r.name)).toEqual([]);
  });

  it('all longitude values are within valid range (-180 to 180)', () => {
    const invalid = SEED_RESORTS.filter((r) => r.lon < -180 || r.lon > 180);
    expect(invalid.map((r) => r.name)).toEqual([]);
  });

  it('covers multiple countries (at least 15 distinct country codes)', () => {
    const countries = new Set(SEED_RESORTS.map((r) => r.country));
    expect(countries.size).toBeGreaterThanOrEqual(15);
  });

  it('all website URLs start with https://', () => {
    const invalid = SEED_RESORTS.filter((r) => !r.website.startsWith('https://'));
    expect(invalid.map((r) => r.name)).toEqual([]);
  });
});
