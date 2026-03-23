import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  skyCondition,
  visibilityLabel,
  adjustTemperatureForElevation,
  parseForecastBlocks,
  parseHourlyTimeline,
  dayTotalSnowfall,
  dayTotalPrecipitation,
  historicalSnowfall,
  snowfallLast24Hours,
  daySnowfallMidAlt,
  freshSnowfall,
} from '../services/forecastUtils.js';

// ---------------------------------------------------------------------------
// Helpers to build mock hourly data
// ---------------------------------------------------------------------------
function makeHourlyData(forecastDate, overrides = {}) {
  const times = [];
  const snowfall = [];
  const precipitation = [];
  const temperature_2m = [];
  const snow_depth = [];
  const freezing_level_height = [];
  const wind_speed_10m = [];
  const visibility = [];
  const cloud_cover = [];

  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    times.push(`${forecastDate}T${hh}:00`);
    snowfall.push(overrides.snowfall?.[h] ?? 0);
    precipitation.push(overrides.precipitation?.[h] ?? 0);
    temperature_2m.push(overrides.temperature_2m?.[h] ?? -5);
    snow_depth.push(overrides.snow_depth?.[h] ?? 100);
    freezing_level_height.push(overrides.freezing_level_height?.[h] ?? 2000);
    wind_speed_10m.push(overrides.wind_speed_10m?.[h] ?? 15);
    visibility.push(overrides.visibility?.[h] ?? 10000);
    cloud_cover.push(overrides.cloud_cover?.[h] ?? 30);
  }

  return {
    time: times,
    snowfall,
    precipitation,
    temperature_2m,
    snow_depth,
    freezing_level_height,
    wind_speed_10m,
    visibility,
    cloud_cover,
    _apiElevation: overrides._apiElevation ?? 2500,
  };
}

// ---------------------------------------------------------------------------
// haversineDistance
// ---------------------------------------------------------------------------
describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(39.64, -106.37, 39.64, -106.37)).toBe(0);
  });

  it('returns roughly correct distance between Denver and Vail (~155 km)', () => {
    const dist = haversineDistance(39.7392, -104.9903, 39.6403, -106.3742);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// skyCondition
// ---------------------------------------------------------------------------
describe('skyCondition', () => {
  it('returns sunny for low cloud cover', () => {
    expect(skyCondition(10)).toBe('sunny');
    expect(skyCondition(0)).toBe('sunny');
    expect(skyCondition(24)).toBe('sunny');
  });

  it('returns partly cloudy for moderate cloud cover', () => {
    expect(skyCondition(25)).toBe('partly cloudy');
    expect(skyCondition(50)).toBe('partly cloudy');
    expect(skyCondition(70)).toBe('partly cloudy');
  });

  it('returns cloudy for high cloud cover', () => {
    expect(skyCondition(71)).toBe('cloudy');
    expect(skyCondition(100)).toBe('cloudy');
  });
});

// ---------------------------------------------------------------------------
// visibilityLabel
// ---------------------------------------------------------------------------
describe('visibilityLabel', () => {
  it('returns low for under 1km', () => {
    expect(visibilityLabel(0.5)).toBe('low');
    expect(visibilityLabel(0)).toBe('low');
  });

  it('returns medium for 1-5km', () => {
    expect(visibilityLabel(1)).toBe('medium');
    expect(visibilityLabel(5)).toBe('medium');
  });

  it('returns high for over 5km', () => {
    expect(visibilityLabel(5.1)).toBe('high');
    expect(visibilityLabel(10)).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// adjustTemperatureForElevation
// ---------------------------------------------------------------------------
describe('adjustTemperatureForElevation', () => {
  it('returns the same temperature when elevations are equal', () => {
    expect(adjustTemperatureForElevation(-5, 2500, 2500)).toBe(-5);
  });

  it('decreases temperature at higher elevation (lapse rate ~6.5°C/1000m)', () => {
    // From 2500m to 3500m = +1000m → -6.5°C
    const result = adjustTemperatureForElevation(0, 2500, 3500);
    expect(result).toBe(-6.5);
  });

  it('increases temperature at lower elevation', () => {
    // From 2500m to 1500m = -1000m → +6.5°C
    const result = adjustTemperatureForElevation(0, 2500, 1500);
    expect(result).toBe(6.5);
  });

  it('handles fractional elevation differences', () => {
    // From 2000m to 2500m = +500m → -3.25°C
    const result = adjustTemperatureForElevation(10, 2000, 2500);
    expect(result).toBe(6.8); // 10 - 3.25 = 6.75 → rounded to 6.8
  });
});

// ---------------------------------------------------------------------------
// parseForecastBlocks
// ---------------------------------------------------------------------------
describe('parseForecastBlocks', () => {
  it('returns null blocks for missing data', () => {
    const result = parseForecastBlocks(null, '2026-01-15');
    expect(result.morning).toBeNull();
    expect(result.afternoon).toBeNull();
  });

  it('returns null blocks when no data for the forecast date', () => {
    const hourlyData = makeHourlyData('2026-01-14');
    const result = parseForecastBlocks(hourlyData, '2026-01-15');
    expect(result.morning).toBeNull();
    expect(result.afternoon).toBeNull();
  });

  it('correctly summarizes morning and afternoon blocks', () => {
    const snowfallArr = new Array(24).fill(0);
    snowfallArr[6] = 1.0; // 6am
    snowfallArr[7] = 0.5; // 7am
    snowfallArr[12] = 2.0; // 12pm
    snowfallArr[13] = 1.5; // 1pm

    const hourlyData = makeHourlyData('2026-01-15', { snowfall: snowfallArr });
    const result = parseForecastBlocks(hourlyData, '2026-01-15');

    expect(result.morning).not.toBeNull();
    expect(result.morning.snowfall).toBe(1.5); // 1.0 + 0.5
    expect(result.afternoon).not.toBeNull();
    expect(result.afternoon.snowfall).toBe(3.5); // 2.0 + 1.5
  });

  it('includes wind speed, visibility label, and sky condition', () => {
    const hourlyData = makeHourlyData('2026-01-15');
    const result = parseForecastBlocks(hourlyData, '2026-01-15');

    expect(result.morning).not.toBeNull();
    expect(result.morning.windSpeed).toBeDefined();
    expect(result.morning.visibilityLabel).toBeDefined();
    expect(result.morning.skyCondition).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// parseHourlyTimeline
// ---------------------------------------------------------------------------
describe('parseHourlyTimeline', () => {
  it('returns empty array for null data', () => {
    expect(parseHourlyTimeline(null, '2026-01-15', {})).toEqual([]);
  });

  it('returns 24 entries for a full day', () => {
    const hourlyData = makeHourlyData('2026-01-15');
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2500,
      mid: 3000,
      peak: 3500,
    });

    expect(timeline).toHaveLength(24);
  });

  it('each entry has the required fields', () => {
    const hourlyData = makeHourlyData('2026-01-15');
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2500,
      mid: 3000,
      peak: 3500,
    });

    const entry = timeline[0];
    expect(entry.hour).toBe(0);
    // snowfall is now an altitude-specific object
    expect(entry.snowfall).toBeDefined();
    expect(entry.snowfall.base).toBeDefined();
    expect(entry.snowfall.mid).toBeDefined();
    expect(entry.snowfall.peak).toBeDefined();
    expect(entry.precipitation).toBeDefined();
    expect(entry.temperature).toBeDefined();
    expect(entry.temperature.base).toBeDefined();
    expect(entry.temperature.mid).toBeDefined();
    expect(entry.temperature.peak).toBeDefined();
    expect(entry.windSpeed).toBeDefined();
    expect(entry.visibility).toBeDefined();
    expect(entry.visibilityLabel).toBeDefined();
    expect(entry.cloudCover).toBeDefined();
    expect(entry.skyCondition).toBeDefined();
    expect(entry.snowDepth).toBeDefined();
    expect(entry.snowDepth.base).toBeDefined();
    expect(entry.snowDepth.mid).toBeDefined();
    expect(entry.snowDepth.peak).toBeDefined();
    expect(entry.freezingLevel).toBeDefined();
  });

  it('computes altitude-specific temperatures correctly', () => {
    const hourlyData = makeHourlyData('2026-01-15', {
      temperature_2m: new Array(24).fill(0),
      _apiElevation: 2500,
    });
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2500,
      mid: 3000,
      peak: 3500,
    });

    const entry = timeline[0];
    // At base (same as API elevation 2500): 0°C
    expect(entry.temperature.base).toBe(0);
    // At mid (3000m, +500m): 0 - (500/1000 * 6.5) = -3.25 → rounded -3.2
    expect(entry.temperature.mid).toBe(-3.2);
    // At peak (3500m, +1000m): 0 - (1000/1000 * 6.5) = -6.5
    expect(entry.temperature.peak).toBe(-6.5);
  });

  it('snow depth scales with altitude and is in cm', () => {
    // Open-Meteo returns snow_depth in meters; mock 1.0 m = 100 cm
    const hourlyData = makeHourlyData('2026-01-15', {
      snow_depth: new Array(24).fill(1.0),
    });
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2000,
      mid: 2500,
      peak: 3000,
    });

    const entry = timeline[0];
    // Base: 1.0 m × 100 = 100 cm
    expect(entry.snowDepth.base).toBe(100);
    // Mid should be > base (higher altitude → more snow)
    expect(entry.snowDepth.mid).toBeGreaterThan(entry.snowDepth.base);
    // Peak should be > mid
    expect(entry.snowDepth.peak).toBeGreaterThan(entry.snowDepth.mid);
  });

  it('returns empty array for wrong date', () => {
    const hourlyData = makeHourlyData('2026-01-14');
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2500,
      mid: 3000,
      peak: 3500,
    });
    expect(timeline).toHaveLength(0);
  });

  it('altitude-specific snowfall: converts precipitation to snow above freezing level', () => {
    // At base (API elevation): 5°C, so snowfall=0 (raining). At peak (3500m): well below 0°C.
    const hourlyData = makeHourlyData('2026-01-15', {
      snowfall: new Array(24).fill(0),
      precipitation: new Array(24).fill(1.0), // 1mm rain at base
      temperature_2m: new Array(24).fill(5),  // 5°C at API elevation (2500m)
      _apiElevation: 2500,
    });
    const timeline = parseHourlyTimeline(hourlyData, '2026-01-15', {
      base: 2500,
      mid: 3000,
      peak: 3500,
    });

    const entry = timeline[0];
    // Base (same as API elevation): 5°C → rain, snowfall = 0
    expect(entry.snowfall.base).toBe(0);
    // Mid (3000m, +500m): 5 - 3.25 = 1.75°C → above 1°C → rain, snowfall = 0
    expect(entry.snowfall.mid).toBe(0);
    // Peak (3500m, +1000m): 5 - 6.5 = -1.5°C → snow, 1mm × 1 = 1cm (standard 10:1 ratio)
    expect(entry.snowfall.peak).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// dayTotalSnowfall
// ---------------------------------------------------------------------------
describe('dayTotalSnowfall', () => {
  it('returns 0 for null data', () => {
    expect(dayTotalSnowfall(null, '2026-01-15')).toBe(0);
  });

  it('sums snowfall for the specified date only', () => {
    const snowfallArr = new Array(24).fill(0);
    snowfallArr[8] = 1.2;
    snowfallArr[9] = 0.8;
    snowfallArr[14] = 2.0;

    const hourlyData = makeHourlyData('2026-01-15', { snowfall: snowfallArr });
    expect(dayTotalSnowfall(hourlyData, '2026-01-15')).toBe(4);
  });

  it('returns 0 when no data matches the date', () => {
    const hourlyData = makeHourlyData('2026-01-14');
    expect(dayTotalSnowfall(hourlyData, '2026-01-15')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// dayTotalPrecipitation
// ---------------------------------------------------------------------------
describe('dayTotalPrecipitation', () => {
  it('returns 0 for null data', () => {
    expect(dayTotalPrecipitation(null, '2026-01-15')).toBe(0);
  });

  it('sums precipitation for the specified date', () => {
    const precipArr = new Array(24).fill(0);
    precipArr[6] = 1.5;
    precipArr[7] = 2.5;
    precipArr[14] = 3.0;

    const hourlyData = makeHourlyData('2026-01-15', { precipitation: precipArr });
    expect(dayTotalPrecipitation(hourlyData, '2026-01-15')).toBe(7);
  });

  it('returns 0 when no data matches the date', () => {
    const hourlyData = makeHourlyData('2026-01-14');
    expect(dayTotalPrecipitation(hourlyData, '2026-01-15')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// historicalSnowfall
// ---------------------------------------------------------------------------
describe('historicalSnowfall', () => {
  it('returns 3 days of history by default', () => {
    const times = [];
    const snowfall = [];
    // Build 4 days of data: Jan 12-15
    for (let d = 12; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        snowfall.push(d === 13 ? 1.0 : 0); // Only Jan 13 has snowfall
      }
    }

    const hourlyData = { time: times, snowfall };
    const result = historicalSnowfall(hourlyData, '2026-01-15', 3);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-01-12');
    expect(result[1].date).toBe('2026-01-13');
    expect(result[1].snowfall).toBe(24); // 24 hours * 1.0 cm
    expect(result[2].date).toBe('2026-01-14');
  });

  it('includes snowfallMid for altitude-adjusted historical totals', () => {
    const times = [];
    const snowfall = [];
    const precipitation = [];
    const temperature_2m = [];
    for (let d = 12; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        snowfall.push(d === 13 ? 1.0 : 0);
        precipitation.push(d === 13 ? 1.0 : 0);
        temperature_2m.push(-5); // well below freezing
      }
    }

    const hourlyData = { time: times, snowfall, precipitation, temperature_2m };
    const result = historicalSnowfall(hourlyData, '2026-01-15', 3, { base: 1000, mid: 2000, peak: 3000 }, 1000);

    expect(result[1].snowfallMid).toBe(24); // same as snowfall because temp is well below 1°C
  });
});

// ---------------------------------------------------------------------------
// daySnowfallMidAlt
// ---------------------------------------------------------------------------
describe('daySnowfallMidAlt', () => {
  it('returns 0 for null data', () => {
    expect(daySnowfallMidAlt(null, '2026-01-15', {}, 0)).toBe(0);
  });

  it('sums mid-altitude snowfall for the specified date only', () => {
    const snowfallArr = new Array(24).fill(0);
    snowfallArr[8] = 1.0;
    snowfallArr[14] = 2.0;

    // Temperature well below freezing → snowfall used directly
    const hourlyData = makeHourlyData('2026-01-15', { snowfall: snowfallArr });
    const result = daySnowfallMidAlt(hourlyData, '2026-01-15', { base: 1000, mid: 1500, peak: 2000 }, 1000);
    expect(result).toBe(3.0);
  });

  it('converts precipitation to snow at mid when cold enough (1mm → 1cm)', () => {
    // No snowfall at grid level, but 2mm rain and cold mid-altitude temperature
    const hourlyData = makeHourlyData('2026-01-15', {
      snowfall: new Array(24).fill(0),
      precipitation: new Array(24).fill(2.0), // 2mm/hr rain at base
      temperature_2m: new Array(24).fill(8),  // 8°C at API elevation (1000m)
      _apiElevation: 1000,
    });
    // At mid (2500m, +1500m): 8 - (1500/1000 * 6.5) = 8 - 9.75 = -1.75°C → snow
    // Each hour: 2mm × 1 = 2cm; 24 hours × 2cm = 48cm total
    const result = daySnowfallMidAlt(hourlyData, '2026-01-15', { base: 1000, mid: 2500, peak: 3000 }, 1000);
    expect(result).toBe(48.0);
  });

  it('returns 0 when no data matches the date', () => {
    const hourlyData = makeHourlyData('2026-01-14');
    expect(daySnowfallMidAlt(hourlyData, '2026-01-15', { base: 1000, mid: 1500, peak: 2000 }, 1000)).toBe(0);
  });

  it('includes future forecast hours (projections) in the total', () => {
    // Simulate a day where morning has 0 snowfall but afternoon is forecast with 1cm/hr
    const snowfallArr = new Array(24).fill(0);
    // Future hours (12–17) have projected snowfall
    for (let h = 12; h <= 17; h++) snowfallArr[h] = 1.0;

    const hourlyData = makeHourlyData('2026-01-15', { snowfall: snowfallArr });
    const result = daySnowfallMidAlt(hourlyData, '2026-01-15', { base: 1000, mid: 1500, peak: 2000 }, 1000);
    // 6 hours × 1cm = 6cm total projected (morning 0cm + afternoon 6cm)
    expect(result).toBe(6.0);
  });
});


describe('snowfallLast24Hours', () => {
  it('returns zeros for null data', () => {
    const result = snowfallLast24Hours(null, '2026-01-15T12:00:00Z', {}, 0);
    expect(result.base).toBe(0);
    expect(result.mid).toBe(0);
    expect(result.peak).toBe(0);
  });

  it('sums snowfall for exactly the past 24 hours (UTC)', () => {
    // Build data for Jan 14 and Jan 15 (UTC)
    const times = [];
    const snowfall = [];
    const precipitation = [];
    const temperature_2m = [];
    for (let d = 14; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        // 1cm/h on Jan 14, 0 on Jan 15
        snowfall.push(d === 14 ? 1.0 : 0);
        precipitation.push(0);
        temperature_2m.push(-5);
      }
    }

    const hourlyData = { time: times, snowfall, precipitation, temperature_2m };

    // Current time is Jan 15 at 12:00 UTC — 24h window is Jan 14 13:00 to Jan 15 12:00
    const result = snowfallLast24Hours(
      hourlyData,
      '2026-01-15T12:00:00Z',
      { base: 1000, mid: 2000, peak: 3000 },
      1000,
    );

    // Hours included: Jan 14 T13, T14, ..., T23 = 11 hours → 11 cm
    expect(result.base).toBe(11);
    expect(result.mid).toBe(11); // temp -5°C < 1°C so same as base
  });

  it('converts rain-at-base to snow-at-peak when altitude is above freezing', () => {
    // 1 hour with 1mm precipitation but snowfall=0 (raining at base)
    // API elevation = base (1000m), peak = 3000m → well below freezing
    const hourlyData = {
      time: ['2026-01-15T06:00'],
      snowfall: [0],
      precipitation: [1.0], // 1mm rain at base
      temperature_2m: [5],  // 5°C at API elevation (base 1000m)
    };
    hourlyData._apiElevation = 1000;

    // At peak (3000m): temp = 5 - (2000/1000 * 6.5) = 5 - 13 = -8°C → snowing
    // snowfallAtPeak = 1mm × 1 = 1cm (standard 10:1 ratio)
    const result = snowfallLast24Hours(
      hourlyData,
      '2026-01-15T12:00:00Z',
      { base: 1000, mid: 2000, peak: 3000 },
      1000,
    );

    expect(result.base).toBe(0);   // raining at base
    expect(result.peak).toBe(1.0); // snowing at peak: 1mm × 1 = 1cm
  });
});

// ---------------------------------------------------------------------------
// freshSnowfall
// ---------------------------------------------------------------------------
describe('freshSnowfall', () => {
  it('returns 0 for null data', () => {
    expect(freshSnowfall(null, '2026-01-15', {}, 0)).toBe(0);
  });

  it('sums mid-altitude snowfall for the two days before the forecast date', () => {
    const times = [];
    const snowfall = [];
    const temperature_2m = [];
    // Build 4 days of data: Jan 12-15 (forecastDate = Jan 15)
    for (let d = 12; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        // Jan 13: 1 cm/h, Jan 14: 2 cm/h, others 0
        snowfall.push(d === 13 ? 1.0 : d === 14 ? 2.0 : 0);
        temperature_2m.push(-5); // well below freezing
      }
    }

    const hourlyData = { time: times, snowfall, temperature_2m };
    // Last 2 days before Jan 15 = Jan 13 (24 cm) + Jan 14 (48 cm) = 72 cm
    const result = freshSnowfall(
      hourlyData,
      '2026-01-15',
      { base: 1000, mid: 2000, peak: 3000 },
      1000,
    );
    expect(result).toBe(72);
  });

  it('returns 0 when there is no snowfall in the last 2 days', () => {
    const times = [];
    const snowfall = [];
    for (let d = 12; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        snowfall.push(0);
      }
    }
    const hourlyData = { time: times, snowfall };
    expect(freshSnowfall(hourlyData, '2026-01-15', { base: 1000, mid: 2000, peak: 3000 }, 1000)).toBe(0);
  });

  it('does not include the forecast date itself or days older than 2 days', () => {
    const times = [];
    const snowfall = [];
    const temperature_2m = [];
    // Jan 12 (3 days before): 5 cm/h — should NOT be included
    // Jan 13 (2 days before): 1 cm/h — should be included
    // Jan 14 (1 day before):  2 cm/h — should be included
    // Jan 15 (forecast date): 3 cm/h — should NOT be included
    for (let d = 12; d <= 15; d++) {
      for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, '0');
        times.push(`2026-01-${d}T${hh}:00`);
        snowfall.push(d === 12 ? 5.0 : d === 13 ? 1.0 : d === 14 ? 2.0 : 3.0);
        temperature_2m.push(-5);
      }
    }
    const hourlyData = { time: times, snowfall, temperature_2m };
    // Expected: Jan 13 (24 cm) + Jan 14 (48 cm) = 72 cm
    const result = freshSnowfall(
      hourlyData,
      '2026-01-15',
      { base: 1000, mid: 2000, peak: 3000 },
      1000,
    );
    expect(result).toBe(72);
  });
});
