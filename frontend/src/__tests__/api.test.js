import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// vi.stubEnv is used by some tests to simulate a deployed VITE_API_BASE_URL

// Snapshot the original fetch so we can restore it
const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Provide a mock fetch that records calls and returns a successful response
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.resetModules();
});

describe('api.js – searchLocation', () => {
  it('uses the default /api base when VITE_API_BASE_URL is not set', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ name: 'Zermatt', latitude: 46.02, longitude: 7.75 }] }),
    });

    const { searchLocation } = await import('../api.js');
    const results = await searchLocation('Zermatt');

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/geocoding/search');
    expect(calledUrl).toContain('q=Zermatt');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Zermatt');
  });

  it('encodes special characters in the query string', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const { searchLocation } = await import('../api.js');
    await searchLocation('Val d\'Isère');

    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain(encodeURIComponent("Val d'Isère"));
  });

  it('throws when the response is not ok', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { searchLocation } = await import('../api.js');
    await expect(searchLocation('error-town')).rejects.toThrow('Geocoding failed');
  });

  it('returns an empty array when results key is absent', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { searchLocation } = await import('../api.js');
    const results = await searchLocation('nowhere');
    expect(results).toEqual([]);
  });
});

describe('api.js – getRecommendations', () => {
  it('calls the recommend endpoint with all required query parameters', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], count: 0 }),
    });

    const { getRecommendations } = await import('../api.js');
    await getRecommendations({ lat: 46.02, lon: 7.75, date: '2026-01-15', radius: 100, minSnowfall: 5 });

    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/recommend');
    expect(calledUrl).toContain('lat=46.02');
    expect(calledUrl).toContain('lon=7.75');
    expect(calledUrl).toContain('date=2026-01-15');
    expect(calledUrl).toContain('radius=100');
    expect(calledUrl).toContain('minSnowfall=5');
  });

  it('throws when the recommend endpoint returns an error', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { getRecommendations } = await import('../api.js');
    await expect(
      getRecommendations({ lat: 0, lon: 0, date: '2026-01-01', radius: 50, minSnowfall: 0 }),
    ).rejects.toThrow('Failed to get recommendations');
  });
});

describe('api.js – getResortDetail', () => {
  it('calls the resort endpoint with id and date', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'Vail' }),
    });

    const { getResortDetail } = await import('../api.js');
    const data = await getResortDetail(1, '2026-01-15');

    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/resort/1');
    expect(calledUrl).toContain('date=2026-01-15');
    expect(data.name).toBe('Vail');
  });
});

describe('api.js – getHealth', () => {
  it('calls the health endpoint', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const { getHealth } = await import('../api.js');
    const data = await getHealth();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/health');
    expect(data.status).toBe('ok');
  });
});

describe('api.js – VITE_API_BASE_URL override', () => {
  it('uses the configured base URL when VITE_API_BASE_URL is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://example.onrender.com/api');
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const { searchLocation } = await import('../api.js');
    await searchLocation('Verbier');

    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('https://example.onrender.com/api/geocoding/search');
    vi.unstubAllEnvs();
  });
});
