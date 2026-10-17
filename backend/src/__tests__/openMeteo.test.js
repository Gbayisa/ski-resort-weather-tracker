import { describe, it, expect } from 'vitest';
import {
  buildForecastUrl,
  PAST_DAYS,
  FORECAST_DAYS,
  MAX_LOCATIONS_PER_REQUEST,
} from '../services/openMeteo.js';

const params = (url) => new URL(url).searchParams;

describe('Open-Meteo request shape (billing)', () => {
  it('stays within 14 days per location so each location bills as one call', () => {
    expect(PAST_DAYS + FORECAST_DAYS).toBeLessThanOrEqual(14);
  });

  it('requests at most 10 variables so each location bills as one call', () => {
    const vars = params(buildForecastUrl([{ lat: 1, lon: 2 }], '')).get('hourly').split(',');
    expect(vars.length).toBeLessThanOrEqual(10);
  });

  it('covers the 7-day date picker plus timezone slack', () => {
    // Day 0 (today) + 7 selectable days + 1 day for resorts ahead of the user's clock
    expect(FORECAST_DAYS).toBeGreaterThanOrEqual(9);
  });

  it('batches many locations into one request', () => {
    const url = buildForecastUrl(
      [
        { lat: 45.9237, lon: 6.8694 },
        { lat: 39.6403, lon: -106.3742 },
      ],
      ''
    );
    expect(params(url).get('latitude')).toBe('45.9237,39.6403');
    expect(params(url).get('longitude')).toBe('6.8694,-106.3742');
    expect(MAX_LOCATIONS_PER_REQUEST).toBeGreaterThan(1);
  });

  it('uses the free endpoint without an API key', () => {
    const url = buildForecastUrl([{ lat: 1, lon: 2 }], '');
    expect(url.startsWith('https://api.open-meteo.com/')).toBe(true);
    expect(params(url).has('apikey')).toBe(false);
  });

  it('switches to the commercial endpoint when an API key is configured', () => {
    const url = buildForecastUrl([{ lat: 1, lon: 2 }], 'test-key');
    expect(url.startsWith('https://customer-api.open-meteo.com/')).toBe(true);
    expect(params(url).get('apikey')).toBe('test-key');
  });
});
