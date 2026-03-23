import { getDb } from '../db/database.js';
import { fetchWeatherData } from './openMeteo.js';
import {
  parseForecastBlocks,
  parseHourlyTimeline,
  dayTotalSnowfall,
  dayTotalPrecipitation,
  historicalSnowfall,
  daySnowfallMidAlt,
  freshSnowfall,
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
    // Restore the API elevation stored alongside the hourly data
    if (parsed.apiElevation != null) {
      hourlyData._apiElevation = parsed.apiElevation;
    }
  } else {
    try {
      const weatherResp = await fetchWeatherData(resort.lat, resort.lon, forecastDate);
      hourlyData = weatherResp.hourly;

      // Cache the result — store the Open-Meteo grid-cell elevation alongside hourly data
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
      db.prepare(
        `INSERT OR REPLACE INTO weather_cache (resort_id, forecast_date, data, fetched_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        resort.id,
        forecastDate,
        JSON.stringify({ hourly: weatherResp.hourly, apiElevation: weatherResp.elevation }),
        now,
        expiresAt,
      );
    } catch (err) {
      console.error(`Failed to fetch weather for ${resort.name}:`, err.message);
      return null;
    }
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

/**
 * Warm the cache for a specific resort and date.
 */
export async function warmCache(resortId, forecastDate) {
  const db = getDb();
  const resort = db.prepare('SELECT * FROM resorts WHERE id = ?').get(resortId);
  if (!resort) return;
  await getWeatherForResort(resort, forecastDate);
}
