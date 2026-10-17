import cron from 'node-cron';
import { getDb } from '../db/database.js';
import { queueForecasts } from '../services/weatherCache.js';
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
 * Background job scheduler for:
 * 1. Keeping recently used forecasts fresh (others are fetched on demand)
 * 2. Cleaning expired cache entries
 */
export function startScheduledJobs() {
  // Every 3 hours (matches CACHE_TTL_HOURS)
  cron.schedule('5 */3 * * *', () => {
    refreshHotForecasts().catch((err) => console.error('[Job] Forecast refresh failed:', err.message));
    seedDemoCommunity(); // no-op in production
  });

  // Clean expired cache entries every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('[Job] Cleaning expired cache...');
    cleanExpiredCache();
  });

  // Warm on startup without blocking the server; only stale, recently used forecasts are fetched
  refreshHotForecasts().catch((err) => console.error('[Job] Startup refresh failed:', err.message));

  console.log('Background jobs scheduled.');
}

/**
 * Re-fetch forecasts that searches used in the last HOT_HOURS and that are about to expire.
 */
export async function refreshHotForecasts() {
  const db = getDb();
  const threshold = new Date(Date.now() + REFRESH_AHEAD_MINUTES * 60 * 1000).toISOString();
  const usedSince = new Date(Date.now() - HOT_HOURS * 3600 * 1000).toISOString();
  const stale = db
    .prepare(
      `SELECT r.* FROM resorts r
       JOIN resort_forecasts f ON f.resort_id = r.id
       WHERE f.expires_at < ? AND f.last_used_at > ?`
    )
    .all(threshold, usedSince);

  if (stale.length === 0) return;

  console.log(`[Job] Queued ${stale.length} recently used forecasts for refresh`);
  queueForecasts(stale);
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
  const now = new Date().toISOString();
  const checkins = db.prepare('DELETE FROM checkins WHERE expires_at < ?').run(now).changes;
  const chatCutoff = new Date(Date.now() - CHAT_RETENTION_DAYS * 24 * 3600 * 1000).toISOString();
  const chats = db.prepare('DELETE FROM connections WHERE updated_at < ?').run(chatCutoff).changes;
  console.log(
    `[Job] Cleaned ${forecastChanges} stale forecasts, ${routeChanges} routes, ${checkins} check-ins, ${chats} old chats.`
  );
}
