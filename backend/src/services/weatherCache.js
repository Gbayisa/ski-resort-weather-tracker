import { getDb } from '../db/database.js';
import { fetchForecastBatch, MAX_LOCATIONS_PER_REQUEST } from './openMeteo.js';
import {
  parseForecastBlocks,
  parseHourlyTimeline,
  dayTotalSnowfall,
  dayTotalPrecipitation,
  historicalSnowfall,
  daySnowfallMidAlt,
  freshSnowfall,
} from './forecastUtils.js';

/** Weather models behind Open-Meteo update every 1–6 hours; 3h keeps data fresh. */
export const CACHE_TTL_HOURS = 3;

/**
 * Make sure every given resort has a fresh cached forecast, fetching the
 * missing ones in multi-location batches (one HTTP request per 50 resorts).
 * Each resort's forecast covers every selectable date, so it is fetched at
 * most once per TTL no matter how many dates or users look at it.
 * Never throws; resorts whose batch fails simply stay uncached.
 * `freshUntil` (ISO string) treats forecasts expiring before it as stale,
 * letting the scheduler refresh ahead of expiry.
 */
export async function ensureForecasts(resorts, { freshUntil = new Date().toISOString() } = {}) {
  if (resorts.length === 0) return;
  const db = getDb();

  const fresh = new Set(
    db
      .prepare('SELECT resort_id FROM resort_forecasts WHERE expires_at > ?')
      .all(freshUntil)
      .map((r) => r.resort_id)
  );
  const missing = resorts.filter((r) => !fresh.has(r.id));
  if (missing.length === 0) return;

  const upsert = db.prepare(
    `INSERT OR REPLACE INTO resort_forecasts (resort_id, data, fetched_at, expires_at)
     VALUES (?, ?, ?, ?)`
  );

  for (let i = 0; i < missing.length; i += MAX_LOCATIONS_PER_REQUEST) {
    const batch = missing.slice(i, i + MAX_LOCATIONS_PER_REQUEST);
    try {
      const responses = await fetchForecastBatch(batch);
      const fetchedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
      db.transaction(() => {
        batch.forEach((resort, idx) => {
          const resp = responses[idx];
          if (!resp?.hourly) return;
          // Store the Open-Meteo grid-cell elevation alongside hourly data (used for lapse rates)
          upsert.run(
            resort.id,
            JSON.stringify({ hourly: resp.hourly, apiElevation: resp.elevation }),
            fetchedAt,
            expiresAt
          );
        });
      })();
    } catch (err) {
      console.error(`Failed to fetch forecasts for ${batch.length} resorts:`, err.message);
    }
  }
}

/** Parsed forecasts keyed by resort id; reused while the DB row's fetched_at is unchanged. */
const parsedCache = new Map();

/**
 * Read cached forecasts for many resorts. Returns Map id → { hourly, apiElevation }.
 * Expired rows are still returned (a few-hours-old forecast beats none) — the
 * scheduler keeps them fresh.
 */
export function readForecasts(resortIds) {
  const result = new Map();
  if (resortIds.length === 0) return result;
  const db = getDb();
  const placeholders = resortIds.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT resort_id, fetched_at FROM resort_forecasts WHERE resort_id IN (${placeholders})`)
    .all(...resortIds);
  const getData = db.prepare('SELECT data FROM resort_forecasts WHERE resort_id = ?');

  for (const row of rows) {
    const hit = parsedCache.get(row.resort_id);
    if (hit && hit.fetchedAt === row.fetched_at) {
      result.set(row.resort_id, hit.forecast);
      continue;
    }
    const parsed = JSON.parse(getData.get(row.resort_id).data);
    const forecast = { hourly: parsed.hourly, apiElevation: parsed.apiElevation };
    parsedCache.set(row.resort_id, { fetchedAt: row.fetched_at, forecast });
    result.set(row.resort_id, forecast);
  }
  return result;
}

/**
 * Get weather data for a resort on a given date, using the cached forecast
 * (fetching it if missing). Returns null if no forecast could be obtained.
 */
export async function getWeatherForResort(resort, forecastDate) {
  const db = getDb();
  const readCached = () =>
    db
      .prepare('SELECT data FROM resort_forecasts WHERE resort_id = ? AND expires_at > ?')
      .get(resort.id, new Date().toISOString());

  let cached = readCached();
  if (!cached) {
    await ensureForecasts([resort]);
    cached = readCached();
  }
  if (!cached) return null;

  const parsed = JSON.parse(cached.data);
  const hourlyData = parsed.hourly;
  if (parsed.apiElevation != null) {
    hourlyData._apiElevation = parsed.apiElevation;
  }

  const elevBase = resort.elevation_base || 0;
  const elevPeak = resort.elevation_peak || 0;
  const elevMid = Math.round((elevBase + elevPeak) / 2);

  const elevations = { base: elevBase, mid: elevMid, peak: elevPeak };

  // Use the Open-Meteo grid-cell elevation (stored on hourlyData) for accurate lapse-rate
  // calculations; fall back to resort base elevation if not available.
  const apiElev = hourlyData?._apiElevation ?? elevBase;

  // Ensure the _apiElevation field is set for parseHourlyTimeline (reads it from the object)
  if (hourlyData) {
    hourlyData._apiElevation = apiElev;
  }

  const { morning, afternoon } = parseForecastBlocks(hourlyData, forecastDate);
  const hourlyTimeline = parseHourlyTimeline(hourlyData, forecastDate, elevations);
  const daySnowfall = dayTotalSnowfall(hourlyData, forecastDate);
  const dayPrecipitation = dayTotalPrecipitation(hourlyData, forecastDate);

  // Total altitude-adjusted projected snowfall for the forecast date at mid altitude.
  // Covers all 24 hours (observed + forecast) so it shows today's projected total.
  const daySnowfallMid = daySnowfallMidAlt(hourlyData, forecastDate, elevations, apiElev);

  // Recent snowfall: the two calendar days immediately before the forecast date (D-2 and D-1).
  // For a future selected date those days may themselves be in the future, so we mark them
  // with isForecast so the UI can show the appropriate "(forecast)" label.
  const today = new Date().toISOString().split('T')[0];
  const history = historicalSnowfall(hourlyData, forecastDate, 2, elevations, apiElev);
  for (const entry of history) {
    if (entry.date >= today) {
      entry.isForecast = true;
    }
  }

  // Fresh snow = sum of the two displayed recent-day values (D-2 + D-1 at mid altitude).
  // Derived from the same historicalSnowfall data so badge and cards are always consistent.
  const freshSnow = freshSnowfall(hourlyData, forecastDate, elevations, apiElev);

  return {
    morning,
    afternoon,
    hourlyTimeline,
    daySnowfall,
    dayPrecipitation,
    daySnowfallMid,
    freshSnow,
    history,
    elevations: {
      base: elevBase,
      mid: elevMid,
      peak: elevPeak,
    },
  };
}
