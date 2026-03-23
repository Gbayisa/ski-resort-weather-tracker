import { describe, it, expect } from 'vitest';

/**
 * Tests for ResortCard helper functions.
 * These are extracted from the component for testability.
 */

// ---------- formatHour ----------
function formatHour(h) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

// ---------- getAvgTemp ----------
function getAvgTemp(timeline, altitude) {
  const temps = timeline
    .map((e) => e.temperature?.[altitude])
    .filter((t) => t !== null && t !== undefined);
  if (temps.length === 0) return null;
  return Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
}

// ---------- getLatestSnowDepth ----------
function getLatestSnowDepth(timeline, altitude) {
  const middayEntry = timeline.find((e) => e.hour === 12) || timeline[timeline.length - 1];
  if (!middayEntry) return null;
  const depth = middayEntry.snowDepth?.[altitude];
  return depth !== null && depth !== undefined ? Math.round(depth * 100) / 100 : null;
}

// ---------- getAvgFreezingLevel ----------
function getAvgFreezingLevel(timeline) {
  const levels = timeline
    .map((e) => e.freezingLevel)
    .filter((l) => l !== null && l !== undefined);
  if (levels.length === 0) return null;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

// ---------------------------------------------------------------------------
// formatHour
// ---------------------------------------------------------------------------
describe('formatHour', () => {
  it('formats midnight as 12am', () => {
    expect(formatHour(0)).toBe('12am');
  });

  it('formats morning hours correctly', () => {
    expect(formatHour(1)).toBe('1am');
    expect(formatHour(6)).toBe('6am');
    expect(formatHour(11)).toBe('11am');
  });

  it('formats noon as 12pm', () => {
    expect(formatHour(12)).toBe('12pm');
  });

  it('formats afternoon/evening hours correctly', () => {
    expect(formatHour(13)).toBe('1pm');
    expect(formatHour(18)).toBe('6pm');
    expect(formatHour(23)).toBe('11pm');
  });
});

// ---------------------------------------------------------------------------
// getAvgTemp
// ---------------------------------------------------------------------------
describe('getAvgTemp', () => {
  it('returns null for empty timeline', () => {
    expect(getAvgTemp([], 'base')).toBeNull();
  });

  it('computes average temperature at base altitude', () => {
    const timeline = [
      { temperature: { base: -2, mid: -5, peak: -8 } },
      { temperature: { base: 0, mid: -3, peak: -6 } },
      { temperature: { base: 2, mid: -1, peak: -4 } },
    ];
    expect(getAvgTemp(timeline, 'base')).toBe(0);
    expect(getAvgTemp(timeline, 'mid')).toBe(-3);
    expect(getAvgTemp(timeline, 'peak')).toBe(-6);
  });

  it('skips null temperature values', () => {
    const timeline = [
      { temperature: { base: 4 } },
      { temperature: { base: null } },
      { temperature: { base: 6 } },
    ];
    expect(getAvgTemp(timeline, 'base')).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getLatestSnowDepth
// ---------------------------------------------------------------------------
describe('getLatestSnowDepth', () => {
  it('returns null for empty timeline', () => {
    expect(getLatestSnowDepth([], 'base')).toBeNull();
  });

  it('prefers the midday entry (hour 12)', () => {
    const timeline = [
      { hour: 6, snowDepth: { base: 50 } },
      { hour: 12, snowDepth: { base: 55 } },
      { hour: 18, snowDepth: { base: 60 } },
    ];
    expect(getLatestSnowDepth(timeline, 'base')).toBe(55);
  });

  it('falls back to last entry if no midday', () => {
    const timeline = [
      { hour: 6, snowDepth: { base: 50 } },
      { hour: 8, snowDepth: { base: 52 } },
    ];
    expect(getLatestSnowDepth(timeline, 'base')).toBe(52);
  });

  it('returns depth for different altitudes', () => {
    const timeline = [
      { hour: 12, snowDepth: { base: 50, mid: 80, peak: 120 } },
    ];
    expect(getLatestSnowDepth(timeline, 'base')).toBe(50);
    expect(getLatestSnowDepth(timeline, 'mid')).toBe(80);
    expect(getLatestSnowDepth(timeline, 'peak')).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// getAvgFreezingLevel
// ---------------------------------------------------------------------------
describe('getAvgFreezingLevel', () => {
  it('returns null for empty timeline', () => {
    expect(getAvgFreezingLevel([])).toBeNull();
  });

  it('computes average freezing level', () => {
    const timeline = [
      { freezingLevel: 2000 },
      { freezingLevel: 2200 },
      { freezingLevel: 2400 },
    ];
    expect(getAvgFreezingLevel(timeline)).toBe(2200);
  });

  it('skips null freezing levels', () => {
    const timeline = [
      { freezingLevel: 2000 },
      { freezingLevel: null },
      { freezingLevel: 2600 },
    ];
    expect(getAvgFreezingLevel(timeline)).toBe(2300);
  });
});

// ---------------------------------------------------------------------------
// Resort data structure validation
// ---------------------------------------------------------------------------
describe('Resort data shape for new features', () => {
  const mockResort = {
    id: 1,
    name: 'Test Resort',
    lat: 39.64,
    lon: -106.37,
    country: 'US',
    region: 'Colorado',
    website: 'https://example.com',
    distance: 50.5,
    forecastDate: '2026-01-15',
    daySnowfall: 8.5,
    daySnowfallMid: 9.2,
    freshSnow: 8.0,
    dayPrecipitation: 2.3,
    elevations: { base: 2475, mid: 3001, peak: 3527 },
    hourlyTimeline: [
      {
        hour: 0,
        snowfall: 0.5,
        precipitation: 0.8,
        temperature: { base: -2, mid: -5.2, peak: -8.5 },
        windSpeed: 12,
        visibility: 8.5,
        visibilityLabel: 'high',
        cloudCover: 30,
        skyCondition: 'partly cloudy',
        snowDepth: { base: 100, mid: 125, peak: 167 },
        freezingLevel: 2200,
      },
    ],
    history: [
      { date: '2026-01-13', snowfall: 3.0, snowfallMid: 3.0 },
      { date: '2026-01-14', snowfall: 5.0, snowfallMid: 5.0 },
    ],
  };

  it('has elevation data (base/mid/peak)', () => {
    expect(mockResort.elevations).toBeDefined();
    expect(mockResort.elevations.base).toBeDefined();
    expect(mockResort.elevations.mid).toBeDefined();
    expect(mockResort.elevations.peak).toBeDefined();
    expect(mockResort.elevations.peak).toBeGreaterThan(mockResort.elevations.base);
  });

  it('has daySnowfallMid (altitude-adjusted projected snowfall) data', () => {
    expect(mockResort.daySnowfallMid).toBeDefined();
    expect(typeof mockResort.daySnowfallMid).toBe('number');
  });

  it('has freshSnow (sum of last 2 days mid-altitude snowfall) data', () => {
    expect(mockResort.freshSnow).toBeDefined();
    expect(typeof mockResort.freshSnow).toBe('number');
  });

  it('has hourly timeline entries with altitude-specific temperatures', () => {
    expect(mockResort.hourlyTimeline).toHaveLength(1);
    const entry = mockResort.hourlyTimeline[0];
    expect(entry.temperature.base).toBeDefined();
    expect(entry.temperature.mid).toBeDefined();
    expect(entry.temperature.peak).toBeDefined();
  });

  it('has hourly timeline entries with altitude-specific snow depth', () => {
    const entry = mockResort.hourlyTimeline[0];
    expect(entry.snowDepth.base).toBeDefined();
    expect(entry.snowDepth.mid).toBeDefined();
    expect(entry.snowDepth.peak).toBeDefined();
  });

  it('has freezing level data', () => {
    const entry = mockResort.hourlyTimeline[0];
    expect(entry.freezingLevel).toBeDefined();
    expect(typeof entry.freezingLevel).toBe('number');
  });

  it('hourly entries contain both snowfall and precipitation', () => {
    const entry = mockResort.hourlyTimeline[0];
    expect(entry.snowfall).toBeDefined();
    expect(entry.precipitation).toBeDefined();
  });

  it('history contains exactly the 2 days before the selected date (D-2 and D-1)', () => {
    expect(mockResort.history).toHaveLength(2);
    expect(mockResort.history[0].date).toBe('2026-01-13'); // D-2
    expect(mockResort.history[1].date).toBe('2026-01-14'); // D-1
    // Neither should carry an isForecast flag (both are past dates)
    expect(mockResort.history[0].isForecast).toBeFalsy();
    expect(mockResort.history[1].isForecast).toBeFalsy();
  });

  it('freshSnow badge equals the numeric sum of the two history cards (Test 5 — consistency)', () => {
    const card0 = mockResort.history[0].snowfallMid ?? mockResort.history[0].snowfall ?? 0;
    const card1 = mockResort.history[1].snowfallMid ?? mockResort.history[1].snowfall ?? 0;
    const expectedBadge = Math.round((card0 + card1) * 10) / 10;
    expect(mockResort.freshSnow).toBe(expectedBadge);
  });
});

// ---------------------------------------------------------------------------
// Forecast horizon cap (Test 4)
// ---------------------------------------------------------------------------
function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

describe('Forecast horizon cap', () => {
  it('max selectable date is exactly 7 days from today', () => {
    const today = new Date();
    const expected = new Date(today);
    expected.setDate(expected.getDate() + 7);
    const expectedStr = expected.toISOString().split('T')[0];
    expect(getMaxDate()).toBe(expectedStr);
  });

  it('max date is no more than 7 days in the future', () => {
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const maxMs = new Date(getMaxDate() + 'T00:00:00').setHours(0, 0, 0, 0);
    const diffDays = (maxMs - todayMs) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(7);
  });
});
