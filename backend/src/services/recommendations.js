import { getDb } from '../db/database.js';
import { haversineDistance } from './forecastUtils.js';
import { getWeatherForResort, ensureForecasts } from './weatherCache.js';
import { getDriveInfoBatch, buildGoogleMapsUrl } from './driveTime.js';

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

  // Fetch any uncached forecasts in one batched request, then filter by snowfall
  await ensureForecasts(topCandidates);
  const results = [];
  for (const resort of topCandidates) {
    const weather = await getWeatherForResort(resort, date);
    if (!weather) continue;

    const snowfallForFilter = weather.daySnowfallMid ?? weather.daySnowfall ?? 0;
    if (snowfallForFilter >= minSnowfall) {
      results.push({
        id: resort.id,
        name: resort.name,
        lat: resort.lat,
        lon: resort.lon,
        country: resort.country,
        region: resort.region,
        website: resort.website,
        distance: resort.distance,
        terrain: buildTerrain(resort),
        googleMapsUrl: buildGoogleMapsUrl(lat, lon, resort.lat, resort.lon),
        forecastDate: date,
        daySnowfall: weather.daySnowfall,
        daySnowfallMid: weather.daySnowfallMid,
        dayPrecipitation: weather.dayPrecipitation,
        freshSnow: weather.freshSnow,
        morning: weather.morning,
        afternoon: weather.afternoon,
        hourlyTimeline: weather.hourlyTimeline,
        history: weather.history,
        elevations: weather.elevations,
      });
    }
  }

  // Attach real drive times/road distances in one batched routing call
  const driveInfo = await getDriveInfoBatch(lat, lon, results);
  for (const r of results) {
    const drive = driveInfo.get(r.id);
    r.driveDistanceKm = drive.distanceKm;
    r.driveTimeMin = drive.durationMin;
    r.driveSource = drive.source;
  }

  // Sort by drive time (what actually matters when heading out), snowfall as tiebreaker
  results.sort((a, b) => {
    if (a.driveTimeMin !== b.driveTimeMin) return a.driveTimeMin - b.driveTimeMin;
    return b.daySnowfall - a.daySnowfall;
  });

  return results;
}

/** Assemble terrain stats from resort columns; null when the resort has no data. */
export function buildTerrain(resort) {
  if (resort.pct_easy == null && resort.piste_km == null && resort.lifts == null) return null;
  return {
    pisteKm: resort.piste_km,
    lifts: resort.lifts,
    snowparks: resort.snowparks,
    pctEasy: resort.pct_easy,
    pctIntermediate: resort.pct_intermediate,
    pctAdvanced: resort.pct_advanced,
  };
}
