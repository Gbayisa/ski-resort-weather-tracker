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
const PARALLEL_REQUESTS = 2;
/** Parsed forecasts are ~50 KB each in memory; cap the cache for small instances. */
const PARSED_CACHE_MAX = 1500;

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
    (
      await db.all('SELECT resort_id FROM resort_forecasts WHERE expires_at > ? AND resort_id = ANY(?::int[])', freshUntil, resorts.map((r) => r.id))
    ).map((r) => r.resort_id)
  );
  const missing = resorts.filter((r) => !fresh.has(r.id));
  if (missing.length === 0) return;

  // Upsert (not REPLACE) so a refresh keeps the row's last_used_at
  const UPSERT = `INSERT INTO resort_forecasts (resort_id, data, fetched_at, expires_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (resort_id) DO UPDATE SET
       data = excluded.data, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at`;

  const batches = [];
  for (let i = 0; i < missing.length; i += MAX_LOCATIONS_PER_REQUEST) {
    batches.push(missing.slice(i, i + MAX_LOCATIONS_PER_REQUEST));
  }
  // A few batches in flight at once keeps a cold search near a dense region fast
  const queue = [...batches];
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL_REQUESTS, queue.length) }, async () => {
      while (queue.length) await fetchBatch(queue.shift());
    })
  );

  async function fetchBatch(batch) {
    try {
      const responses = await fetchForecastBatch(batch);
      const fetchedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
      await db.tx(async (t) => {
        for (const [idx, resort] of batch.entries()) {
          const resp = responses[idx];
          if (!resp?.hourly) continue;
          // Store the Open-Meteo grid-cell elevation alongside hourly data (used for lapse rates)
          await t.run(UPSERT, resort.id, JSON.stringify({ hourly: resp.hourly, apiElevation: resp.elevation }), fetchedAt, expiresAt);
        }
      });
    } catch (err) {
      console.error(`Failed to fetch forecasts for ${batch.length} resorts:`, err.message);
    }
  }
}

/**
 * Background warm-up queue: forecasts a search didn't fetch inline (and the
 * scheduler's refreshes) are fetched here, paced under Open-Meteo's free-tier
 * limit of 600 locations/minute: 50 locations every 8 s ≈ 375/minute.
 */
const WARM_INTERVAL_MS = 8000;
const warmQueue = new Map(); // resort id → resort
let warmTimer = null;

/** Ids among `resortIds` whose cached forecast is still fresh. */
export async function freshForecastIds(resortIds) {
  if (resortIds.length === 0) return new Set();
  const rows = await getDb().all(
    'SELECT resort_id FROM resort_forecasts WHERE expires_at > ? AND resort_id = ANY(?::int[])',
    new Date().toISOString(),
    resortIds
  );
  return new Set(rows.map((r) => r.resort_id));
}

export function queueForecasts(resorts) {
  for (const r of resorts) warmQueue.set(r.id, r);
  if (!warmTimer && warmQueue.size > 0) {
    warmTimer = setTimeout(drainWarmQueue, 0);
    warmTimer.unref?.();
  }
}

async function drainWarmQueue() {
  const batch = [...warmQueue.values()].slice(0, MAX_LOCATIONS_PER_REQUEST);
  batch.forEach((r) => warmQueue.delete(r.id));
  await ensureForecasts(batch);
  warmTimer = warmQueue.size > 0 ? setTimeout(drainWarmQueue, WARM_INTERVAL_MS) : null;
  warmTimer?.unref?.();
}

/**
 * Fetch forecasts now, paced like the warm queue, and resolve when done. For the hosted
 * maintenance job: on Cloud Run work only reliably runs while a request is open.
 */
export async function fetchForecastsPaced(resorts) {
  for (let i = 0; i < resorts.length; i += MAX_LOCATIONS_PER_REQUEST) {
    if (i > 0) await new Promise((r) => setTimeout(r, WARM_INTERVAL_MS));
    await ensureForecasts(resorts.slice(i, i + MAX_LOCATIONS_PER_REQUEST));
  }
}

/** Parsed forecasts keyed by resort id; reused while the DB row's fetched_at is unchanged. */
const parsedCache = new Map();

/**
 * Read cached forecasts for many resorts. Returns Map id → { hourly, apiElevation }.
 * Expired rows are still returned (a few-hours-old forecast beats none) — the
 * scheduler keeps them fresh.
 */
export async function readForecasts(resortIds) {
  const result = new Map();
  if (resortIds.length === 0) return result;
  const db = getDb();
  const rows = await db.all('SELECT resort_id, fetched_at FROM resort_forecasts WHERE resort_id = ANY(?::int[])', resortIds);

  const stale = [];
  for (const row of rows) {
    const hit = parsedCache.get(row.resort_id);
    if (hit && hit.fetchedAt === row.fetched_at) result.set(row.resort_id, hit.forecast);
    else stale.push(row.resort_id);
  }
  // One round trip for every forecast the in-memory cache doesn't have yet
  if (stale.length > 0) {
    const fresh = await db.all('SELECT resort_id, fetched_at, data FROM resort_forecasts WHERE resort_id = ANY(?::int[])', stale);
    for (const row of fresh) {
      const parsed = JSON.parse(row.data);
      const forecast = { hourly: parsed.hourly, apiElevation: parsed.apiElevation };
      parsedCache.delete(row.resort_id);
      parsedCache.set(row.resort_id, { fetchedAt: row.fetched_at, forecast });
      if (parsedCache.size > PARSED_CACHE_MAX) parsedCache.delete(parsedCache.keys().next().value);
      result.set(row.resort_id, forecast);
    }
  }
  await db.run('UPDATE resort_forecasts SET last_used_at = ? WHERE resort_id = ANY(?::int[])', new Date().toISOString(), resortIds);
  return result;
}

/**
 * Get weather data for a resort on a given date, using the cached forecast
 * (fetching it if missing). Returns null if no forecast could be obtained.
 */
export async function getWeatherForResort(resort, forecastDate) {
  const db = getDb();
  const readCached = () =>
    db.get('SELECT data FROM resort_forecasts WHERE resort_id = ? AND expires_at > ?', resort.id, new Date().toISOString());

  let cached = await readCached();
  if (!cached) {
    await ensureForecasts([resort]);
    cached = await readCached();
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
