import cron from 'node-cron';
import { getDb } from '../db/database.js';
import { ensureForecasts } from '../services/weatherCache.js';
import { cleanExpiredRouteCache } from '../services/driveTime.js';

/** Refresh forecasts that expire within this window, so users never hit a cold cache. */
const REFRESH_AHEAD_MINUTES = 20;

/**
 * Background job scheduler for:
 * 1. Keeping every resort's forecast fresh (batched; cost is fixed, independent of traffic)
 * 2. Cleaning expired cache entries
 */
export function startScheduledJobs() {
  // Every 3 hours (matches CACHE_TTL_HOURS): ~297 resorts × 8 runs ≈ 2.4k Open-Meteo calls/day
  cron.schedule('5 */3 * * *', () => {
    refreshAllForecasts().catch((err) => console.error('[Job] Forecast refresh failed:', err.message));
  });

  // Clean expired cache entries every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('[Job] Cleaning expired cache...');
    cleanExpiredCache();
  });

  // Warm on startup without blocking the server; only stale/missing resorts are fetched
  refreshAllForecasts().catch((err) => console.error('[Job] Startup refresh failed:', err.message));

  console.log('Background jobs scheduled.');
}

/**
 * Re-fetch forecasts for all resorts whose cached forecast is missing or about to expire.
 */
export async function refreshAllForecasts() {
  const db = getDb();
  const threshold = new Date(Date.now() + REFRESH_AHEAD_MINUTES * 60 * 1000).toISOString();
  const stale = db
    .prepare(
      `SELECT r.* FROM resorts r
       LEFT JOIN resort_forecasts f ON f.resort_id = r.id
       WHERE f.resort_id IS NULL OR f.expires_at < ?`
    )
    .all(threshold);

  if (stale.length === 0) return;

  console.log(`[Job] Refreshing forecasts for ${stale.length} resorts...`);
  await ensureForecasts(stale, { freshUntil: threshold });
  const fresh = db
    .prepare('SELECT COUNT(*) AS count FROM resort_forecasts WHERE expires_at > ?')
    .get(new Date().toISOString()).count;
  console.log(`[Job] Forecast refresh done: ${fresh} resorts cached.`);
}

/**
 * Remove expired cache entries.
 */
function cleanExpiredCache() {
  const db = getDb();
  // Forecasts older than a day are useless even as a fallback
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const forecastChanges = db.prepare('DELETE FROM resort_forecasts WHERE expires_at < ?').run(dayAgo).changes;
  const routeChanges = cleanExpiredRouteCache();
  console.log(`[Job] Cleaned ${forecastChanges} stale forecasts + ${routeChanges} route cache entries.`);
}
