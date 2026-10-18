import cron from 'node-cron';
import { getDb } from '../db/database.js';
import { fetchForecastsPaced, queueForecasts } from '../services/weatherCache.js';
import { cleanExpiredRouteCache } from '../services/driveTime.js';
import { seedDemoCommunity } from '../scripts/seedDemoCommunity.js';

/** Chats are for meeting up on the day; keep them a week, then delete. */
const CHAT_RETENTION_DAYS = 7;

/** Refresh forecasts that expire within this window, so users never hit a cold cache. */
const REFRESH_AHEAD_MINUTES = 20;
/**
 * Only forecasts a search used recently are kept warm; the rest of the ~3,700
 * ski areas are fetched on demand. Cost then follows demand, capped by the
 * resorts actually in season and viewed.
 */
const HOT_HOURS = 24;

/**
 * In-process timers for local development and single-server hosting. On Cloud Run the
 * app can scale to zero or run several copies, so Cloud Scheduler calls runMaintenance()
 * through POST /api/internal/maintenance instead (see index.js).
 */
export function startScheduledJobs() {
  // Every 3 hours (matches CACHE_TTL_HOURS)
  cron.schedule('5 */3 * * *', () => {
    refreshHotForecasts().catch((err) => console.error('[Job] Forecast refresh failed:', err.message));
    seedDemoCommunity().catch((err) => console.error('[Job] Demo riders failed:', err.message)); // no-op in production
  });

  // Clean expired cache entries every 6 hours
  cron.schedule('0 */6 * * *', () => {
    cleanExpiredCache().catch((err) => console.error('[Job] Cleanup failed:', err.message));
  });

  // Warm on startup without blocking the server; only stale, recently used forecasts are fetched
  refreshHotForecasts().catch((err) => console.error('[Job] Startup refresh failed:', err.message));

  console.log('Background jobs scheduled.');
}

/**
 * Re-fetch forecasts that searches used in the last HOT_HOURS and that are about to expire.
 * `wait` fetches before resolving (hosted maintenance job) instead of queueing in the background.
 */
export async function refreshHotForecasts({ aheadMinutes = REFRESH_AHEAD_MINUTES, wait = false } = {}) {
  const threshold = new Date(Date.now() + aheadMinutes * 60 * 1000).toISOString();
  const usedSince = new Date(Date.now() - HOT_HOURS * 3600 * 1000).toISOString();
  const stale = await getDb().all(
    `SELECT r.* FROM resorts r
     JOIN resort_forecasts f ON f.resort_id = r.id
     WHERE f.expires_at < ? AND f.last_used_at > ?`,
    threshold,
    usedSince
  );
  if (stale.length === 0) return 0;

  console.log(`[Job] Refreshing ${stale.length} recently used forecasts`);
  if (wait) await fetchForecastsPaced(stale);
  else queueForecasts(stale);
  return stale.length;
}

/** Remove expired cache entries, finished check-ins and week-old chats. */
export async function cleanExpiredCache() {
  const db = getDb();
  // Forecasts older than a day are useless even as a fallback
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const forecasts = (await db.run('DELETE FROM resort_forecasts WHERE expires_at < ?', dayAgo)).changes;
  const routes = await cleanExpiredRouteCache();
  const checkins = (await db.run('DELETE FROM checkins WHERE expires_at < ?', new Date().toISOString())).changes;
  const chatCutoff = new Date(Date.now() - CHAT_RETENTION_DAYS * 24 * 3600 * 1000).toISOString();
  const chats = (await db.run('DELETE FROM connections WHERE updated_at < ?', chatCutoff)).changes;
  const summary = { forecasts, routes, checkins, chats };
  console.log('[Job] Cleaned', JSON.stringify(summary));
  return summary;
}

/** One pass of everything the timers do; the hosted scheduler runs it hourly. */
export async function runMaintenance() {
  // An hourly run must cover anything expiring before the next run
  const refreshed = await refreshHotForecasts({ aheadMinutes: 75, wait: true });
  const cleaned = await cleanExpiredCache();
  return { refreshed, cleaned };
}
