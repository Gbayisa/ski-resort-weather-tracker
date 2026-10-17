import { describe, it, expect } from 'vitest';
import { estimateDrive, buildGoogleMapsUrl } from '../services/driveTime.js';
import { RESORT_STATS } from '../data/resortStats.js';
import { SEED_RESORTS } from '../scripts/seedResorts.js';

describe('estimateDrive', () => {
  it('applies road winding factor to straight-line distance', () => {
    const { distanceKm } = estimateDrive(100);
    expect(distanceKm).toBe(135);
  });

  it('returns longer durations for longer distances', () => {
    expect(estimateDrive(150).durationMin).toBeGreaterThan(estimateDrive(50).durationMin);
  });

  it('uses slower average speeds for short trips', () => {
    // 10 crow km -> 13.5 road km at 50 km/h ≈ 16 min
    expect(estimateDrive(10).durationMin).toBe(16);
    // 200 crow km -> 270 road km at 75 km/h = 216 min
    expect(estimateDrive(200).durationMin).toBe(216);
  });

  it('is labeled as an estimate', () => {
    expect(estimateDrive(42).source).toBe('estimate');
  });
});

describe('buildGoogleMapsUrl', () => {
  it('builds a driving directions deep link', () => {
    const url = buildGoogleMapsUrl(46.2, 6.15, 45.9237, 6.8694);
    expect(url).toContain('https://www.google.com/maps/dir/?api=1');
    expect(url).toContain('origin=46.2,6.15');
    expect(url).toContain('destination=45.9237,6.8694');
    expect(url).toContain('travelmode=driving');
  });
});

describe('RESORT_STATS data integrity', () => {
  const seedOsmIds = new Set(SEED_RESORTS.map((r) => r.osm_id));

  it('every stats key matches a seeded resort osm_id', () => {
    const orphans = Object.keys(RESORT_STATS).filter((id) => !seedOsmIds.has(id));
    expect(orphans).toEqual([]);
  });

  it('difficulty percentages sum to 100', () => {
    const bad = Object.entries(RESORT_STATS)
      .filter(([, s]) => s.easy != null && s.easy + s.inter + s.adv !== 100)
      .map(([id]) => id);
    expect(bad).toEqual([]);
  });

  it('covers a meaningful share of major resorts', () => {
    expect(Object.keys(RESORT_STATS).length).toBeGreaterThanOrEqual(60);
  });
});
