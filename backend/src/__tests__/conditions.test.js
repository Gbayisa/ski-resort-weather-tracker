import { describe, it, expect } from 'vitest';
import { dayConditions, scoreDay, aggregateTrip, confidenceFor, tagsFor, coverLabel } from '../services/conditions.js';
import { matchScore } from '../services/discover.js';
import { seasonStatus } from '../data/seasons.js';

const resort = {
  elevation_base: 1500,
  elevation_peak: 2500, // mid = 2000
  pct_easy: 30,
  pct_intermediate: 40,
  pct_advanced: 30,
  piste_km: 150,
  country: 'FR',
};

/**
 * Build a synthetic hourly forecast starting 2026-01-10T00:00 for `days` days.
 * `at(dateStr, hour)` returns per-hour overrides.
 */
function forecast(at = () => ({}), days = 6) {
  const h = { time: [], snowfall: [], precipitation: [], temperature_2m: [], snow_depth: [], wind_speed_10m: [], visibility: [], cloud_cover: [], freezing_level_height: [] };
  for (let d = 0; d < days; d++) {
    const date = `2026-01-${String(10 + d).padStart(2, '0')}`;
    for (let hr = 0; hr < 24; hr++) {
      const o = { snowfall: 0, precipitation: 0, temp: -6, depth: 0.8, wind: 10, vis: 20000, cloud: 10, ...at(date, hr) };
      h.time.push(`${date}T${String(hr).padStart(2, '0')}:00`);
      h.snowfall.push(o.snowfall);
      h.precipitation.push(o.precipitation);
      h.temperature_2m.push(o.temp);
      h.snow_depth.push(o.depth);
      h.wind_speed_10m.push(o.wind);
      h.visibility.push(o.vis);
      h.cloud_cover.push(o.cloud);
      h.freezing_level_height.push(1200);
    }
  }
  return { hourly: h, apiElevation: 2000 }; // grid at mid → no lapse adjustment at mid
}

describe('dayConditions windows', () => {
  // 1 cm/h of snow from 2026-01-12 00:00 to 07:00 (8 h) and 2 cm/h 10:00–11:00 on the 12th
  const fc = forecast((date, hr) => {
    if (date === '2026-01-12' && hr < 8) return { snowfall: 1, precipitation: 1, cloud: 100 };
    if (date === '2026-01-12' && (hr === 10 || hr === 11)) return { snowfall: 2, precipitation: 2, cloud: 100 };
    return {};
  });

  it('counts fresh snow in the 24 h before lifts open (08:00)', () => {
    const c = dayConditions(fc, resort, '2026-01-12');
    expect(c.fresh24).toBe(8);
    expect(c.fresh48).toBe(8);
  });

  it('counts snow falling during ski hours separately', () => {
    expect(dayConditions(fc, resort, '2026-01-12').snowDuring).toBe(4);
  });

  it("does not count the day's own snowfall as the next day's 48 h only once", () => {
    const next = dayConditions(fc, resort, '2026-01-13');
    expect(next.fresh24).toBe(4); // 10:00–11:00 on the 12th falls inside 08:00→08:00
    expect(next.fresh48).toBe(12);
  });

  it('returns null outside the forecast', () => {
    expect(dayConditions(fc, resort, '2027-01-01')).toBeNull();
  });

  it('estimates depth from recent snowfall when the model grid shows none', () => {
    const bare = forecast((date, hr) =>
      date === '2026-01-12' && hr < 8 ? { snowfall: 5, precipitation: 5, depth: 0 } : { depth: 0 }
    );
    const c = dayConditions(bare, resort, '2026-01-12');
    expect(c.depthMid).toBe(28); // 40 cm fell × 0.7 settling
  });
});

describe('style scoring', () => {
  const powderDay = dayConditions(
    forecast((date, hr) =>
      date === '2026-01-12' && hr < 8 ? { snowfall: 3, precipitation: 3, temp: -9 } : { temp: -9, cloud: 70 }
    ),
    resort,
    '2026-01-12'
  );
  const bluebird = dayConditions(forecast(() => ({ temp: -5, cloud: 5, wind: 5 })), resort, '2026-01-12');

  it('Powder Day favours 24 cm of fresh snow over a sunny day with none', () => {
    expect(scoreDay(powderDay, resort, 'powder')).toBeGreaterThan(scoreDay(bluebird, resort, 'powder') + 25);
  });

  it('Groomer Day favours sunshine and calm over a grey powder day', () => {
    expect(scoreDay(bluebird, resort, 'groomer')).toBeGreaterThan(scoreDay(powderDay, resort, 'groomer'));
  });

  it('penalises rain at mid-mountain', () => {
    const rainy = dayConditions(
      forecast(() => ({ temp: 4, precipitation: 1.5, cloud: 100 })),
      resort,
      '2026-01-12'
    );
    expect(rainy.rainHours).toBe(8);
    expect(scoreDay(rainy, resort, 'allmountain')).toBeLessThan(scoreDay(bluebird, resort, 'allmountain') - 20);
    expect(tagsFor(rainy)).toContain('rain');
  });

  it('keeps glacier cover from scoring as thin', () => {
    const thin = { ...bluebird, depthMid: 0 };
    expect(scoreDay(thin, resort, 'allmountain', { glacier: true })).toBeGreaterThan(scoreDay(thin, resort, 'allmountain'));
    expect(coverLabel(0, true)).toBe('glacier');
  });

  it('tags a powder day and a bluebird day', () => {
    expect(tagsFor(powderDay)).toContain('powder');
    expect(tagsFor(bluebird)).toContain('bluebird');
  });
});

describe('trip aggregation & ranking', () => {
  it('weekend blends the average with the best day', () => {
    expect(aggregateTrip([40, 80], 'weekend', resort)).toBe(68);
  });

  it('week rewards consistency and bigger ski areas', () => {
    const big = aggregateTrip([60, 60, 60, 60, 60, 60, 60], 'week', { ...resort, piste_km: 300 });
    const small = aggregateTrip([60, 60, 60, 60, 60, 60, 60], 'week', { ...resort, piste_km: 20 });
    expect(big).toBeGreaterThan(small);
  });

  it('a long drive costs more in "Short drive" than in "I want the best"', () => {
    expect(matchScore(80, 85, 'short')).toBeLessThan(matchScore(80, 85, 'best'));
    expect(matchScore(80, 0, 'short')).toBe(80);
  });

  it('confidence drops with days ahead', () => {
    expect(confidenceFor(['2026-01-11'], '2026-01-10')).toBe('high');
    expect(confidenceFor(['2026-01-13', '2026-01-14'], '2026-01-10')).toBe('medium');
    expect(confidenceFor(['2026-01-17'], '2026-01-10')).toBe('low');
  });
});

describe('season status', () => {
  const at = (osm_id, country, lat = 46) => ({ osm_id, country, lat });

  it('treats Zermatt as open year-round (glacier)', () => {
    const s = seasonStatus(at('osm_zermatt', 'CH'), '2026-08-15');
    expect(s.inSeason).toBe(true);
    expect(s.glacier).toBe(true);
  });

  it('knows a regular Alpine resort is closed in October and when it opens', () => {
    const s = seasonStatus(at('osm_verbier', 'CH'), '2026-10-17');
    expect(s.inSeason).toBe(false);
    expect(s.opensOn).toBe('2026-12-01');
  });

  it('handles seasons that wrap the new year', () => {
    expect(seasonStatus(at('osm_verbier', 'CH'), '2027-02-01').inSeason).toBe(true);
    expect(seasonStatus(at('osm_saasfee', 'CH'), '2027-01-10').inSeason).toBe(true);
    expect(seasonStatus(at('osm_saasfee', 'CH'), '2027-06-10').inSeason).toBe(false);
  });

  it('uses southern-hemisphere seasons', () => {
    expect(seasonStatus(at('osm_thredbo', 'AU', -36), '2026-07-20').inSeason).toBe(true);
    expect(seasonStatus(at('osm_thredbo', 'AU', -36), '2026-12-20').inSeason).toBe(false);
  });
});
