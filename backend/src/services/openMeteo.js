const OPEN_METEO_FORECAST_FREE = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_FORECAST_PAID = 'https://customer-api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const USER_AGENT = 'PowderRadar/1.0 (ski resort weather tracker)';

const HOURLY_VARIABLES =
  'snowfall,precipitation,temperature_2m,snow_depth,freezing_level_height,wind_speed_10m,visibility,cloud_cover';

/**
 * Open-Meteo bills a request covering more than 14 days (or more than 10
 * variables) per location as multiple calls, so PAST_DAYS + FORECAST_DAYS
 * must stay <= 14 and HOURLY_VARIABLES <= 10.
 * FORECAST_DAYS = the UI's 7-day date picker + 1 day of timezone slack
 * (a resort ahead of the user's clock) + today.
 * PAST_DAYS = 3 covers D-1/D-2 "recent snowfall" for a date of "today" even
 * when the resort's calendar is behind the user's.
 */
export const PAST_DAYS = 3;
export const FORECAST_DAYS = 9;

/** Locations per HTTP request (Open-Meteo accepts comma-separated coordinate lists). */
export const MAX_LOCATIONS_PER_REQUEST = 50;
const REQUEST_TIMEOUT_MS = 20000;

/**
 * Build the forecast URL for one or more locations.
 * With OPEN_METEO_API_KEY set, uses the commercial endpoint (required once the
 * site is commercial, e.g. shows ads); otherwise the free non-commercial endpoint.
 */
export function buildForecastUrl(locations, apiKey = process.env.OPEN_METEO_API_KEY) {
  const params = new URLSearchParams({
    latitude: locations.map((l) => l.lat).join(','),
    longitude: locations.map((l) => l.lon).join(','),
    hourly: HOURLY_VARIABLES,
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });
  if (apiKey) params.set('apikey', apiKey);
  const base = apiKey ? OPEN_METEO_FORECAST_PAID : OPEN_METEO_FORECAST_FREE;
  return `${base}?${params}`;
}

/**
 * Fetch hourly forecast + recent history for many locations in ONE request.
 * Returns an array aligned with `locations`: [{ hourly, elevation }, ...].
 */
export async function fetchForecastBatch(locations) {
  if (locations.length === 0) return [];
  if (locations.length > MAX_LOCATIONS_PER_REQUEST) {
    throw new Error(`fetchForecastBatch accepts at most ${MAX_LOCATIONS_PER_REQUEST} locations`);
  }

  let res;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(buildForecastUrl(locations), {
      headers: { 'User-Agent': USER_AGENT },
      // A stalled connection must never hang a search
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // 429/503 are Open-Meteo throttling a burst: one patient retry, then give up
    if ((res.status === 429 || res.status === 503) && attempt === 1) {
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }
    break;
  }

  if (!res.ok) {
    throw new Error(`Open-Meteo forecast error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Single-location requests return an object; multi-location return an array
  return Array.isArray(data) ? data : [data];
}

/**
 * Geocode a text query using Open-Meteo's geocoding API.
 */
export async function geocodeLocation(query) {
  if (!query || query.length < 2) return [];

  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  });

  const url = `${OPEN_METEO_GEOCODING}?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo geocoding error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
