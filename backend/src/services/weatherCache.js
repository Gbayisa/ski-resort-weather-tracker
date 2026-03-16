import { getDb } from '../db/database.js';
import { fetchWeatherData } from './openMeteo.js';
import {
  parseForecastBlocks,
  dayTotalSnowfall,
  historicalSnowfall,
} from './forecastUtils.js';

const CACHE_TTL_HOURS = 3;

/**
 * Get weather data for a resort, using cache when available.
 */
export async function getWeatherForResort(resort, forecastDate) {
  const db = getDb();
  const now = new Date().toISOString();

  // Check cache
  const cached = db
    .prepare(
      `SELECT data FROM weather_cache
       WHERE resort_id = ? AND forecast_date = ? AND expires_at > ?`
    )
    .get(resort.id, forecastDate, now);

  let hourlyData;

  if (cached) {
    const parsed = JSON.parse(cached.data);
    hourlyData = parsed.hourly;
  } else {
    try {
      const weatherResp = await fetchWeatherData(resort.lat, resort.lon, forecastDate);
      hourlyData = weatherResp.hourly;

      // Cache the result
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
      db.prepare(
        `INSERT OR REPLACE INTO weather_cache (resort_id, forecast_date, data, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(resort.id, forecastDate, JSON.stringify(weatherResp), now, expiresAt);
    } catch (err) {
      console.error(`Failed to fetch weather for ${resort.name}:`, err.message);
      return null;
    }
  }

  const { morning, afternoon } = parseForecastBlocks(hourlyData, forecastDate);
  const daySnowfall = dayTotalSnowfall(hourlyData, forecastDate);
  const history = historicalSnowfall(hourlyData, forecastDate, 3);

  return {
    morning,
    afternoon,
    daySnowfall,
    history,
  };
}

/**
 * Warm the cache for a specific resort and date.
 */
export async function warmCache(resortId, forecastDate) {
  const db = getDb();
  const resort = db.prepare('SELECT * FROM resorts WHERE id = ?').get(resortId);
  if (!resort) return;
  await getWeatherForResort(resort, forecastDate);
}
