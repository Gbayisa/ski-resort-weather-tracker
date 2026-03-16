import cron from 'node-cron';
import { getDb } from '../db/database.js';
import { fetchWeatherData } from '../services/openMeteo.js';

/**
 * Background job scheduler for:
 * 1. Warming weather cache for resorts with stale/missing data
 * 2. Cleaning expired cache entries
 */
export function startScheduledJobs() {
  // Warm cache every 2 hours for tomorrow's date for all resorts
  cron.schedule('0 */2 * * *', async () => {
    console.log('[Job] Cache warming started...');
    await warmCacheForTopResorts();
  });

  // Clean expired cache entries every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('[Job] Cleaning expired cache...');
    cleanExpiredCache();
  });

  console.log('Background jobs scheduled.');
}

/**
 * Warm cache for all resorts for tomorrow's forecast.
 * Limits to 20 resorts per run to avoid hammering the API.
 */
async function warmCacheForTopResorts() {
  const db = getDb();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const resorts = db
    .prepare(
      `SELECT r.* FROM resorts r
       LEFT JOIN weather_cache wc ON r.id = wc.resort_id AND wc.forecast_date = ?
       WHERE wc.id IS NULL OR wc.expires_at < datetime('now')
       LIMIT 20`
    )
    .all(dateStr);

  let warmed = 0;
  for (const resort of resorts) {
    try {
      const data = await fetchWeatherData(resort.lat, resort.lon, dateStr);
      const expiresAt = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
      db.prepare(
        `INSERT OR REPLACE INTO weather_cache (resort_id, forecast_date, data, fetched_at, expires_at)
         VALUES (?, ?, ?, datetime('now'), ?)`
      ).run(resort.id, dateStr, JSON.stringify(data), expiresAt);
      warmed++;
      // Respectful delay between API calls
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[Job] Failed to warm cache for ${resort.name}:`, err.message);
    }
  }

  console.log(`[Job] Warmed cache for ${warmed} resorts.`);
}

/**
 * Remove expired cache entries.
 */
function cleanExpiredCache() {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM weather_cache WHERE expires_at < datetime('now')")
    .run();
  console.log(`[Job] Cleaned ${result.changes} expired cache entries.`);
}
