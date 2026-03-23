import { getDb } from '../db/database.js';
import { haversineDistance } from './forecastUtils.js';
import { getWeatherForResort } from './weatherCache.js';

/**
 * Find nearby resorts within radius that meet snowfall threshold, sorted by distance.
 */
export async function getRecommendations({ lat, lon, date, radiusKm = 200, minSnowfall = 0 }) {
  const db = getDb();
  const allResorts = db.prepare('SELECT * FROM resorts').all();

  // Pre-filter by rough bounding box
  const latDeg = radiusKm / 111;
  const lonDeg = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const candidates = allResorts.filter(
    (r) =>
      r.lat >= lat - latDeg &&
      r.lat <= lat + latDeg &&
      r.lon >= lon - lonDeg &&
      r.lon <= lon + lonDeg
  );

  // Compute actual distances
  const withDistance = candidates.map((r) => ({
    ...r,
    distance: Math.round(haversineDistance(lat, lon, r.lat, r.lon) * 10) / 10,
  }));

  // Filter by actual radius
  const inRadius = withDistance.filter((r) => r.distance <= radiusKm);

  // Sort by distance
  inRadius.sort((a, b) => a.distance - b.distance);

  // Limit to top 50 to avoid excessive API calls
  const topCandidates = inRadius.slice(0, 50);

  // Fetch weather for each and filter by snowfall
  const results = [];
  for (const resort of topCandidates) {
    const weather = await getWeatherForResort(resort, date);
    if (!weather) continue;

    if (weather.daySnowfall >= minSnowfall) {
      results.push({
        id: resort.id,
        name: resort.name,
        lat: resort.lat,
        lon: resort.lon,
        country: resort.country,
        region: resort.region,
        website: resort.website,
        distance: resort.distance,
        forecastDate: date,
        daySnowfall: weather.daySnowfall,
        dayPrecipitation: weather.dayPrecipitation,
        morning: weather.morning,
        afternoon: weather.afternoon,
        hourlyTimeline: weather.hourlyTimeline,
        history: weather.history,
        elevations: weather.elevations,
      });
    }
  }

  // Sort by distance, then snowfall as tiebreaker
  results.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.daySnowfall - a.daySnowfall;
  });

  return results;
}
