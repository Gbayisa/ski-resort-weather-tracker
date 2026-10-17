import { getDb } from '../db/database.js';
import { haversineDistance } from './forecastUtils.js';

/**
 * Drive time / road distance service.
 *
 * Primary source: OSRM public demo server's `table` API — one batched request
 * returns durations + road distances from the origin to every candidate resort.
 * Free, no API key, but rate-limited and best-effort, so results are cached in
 * SQLite for 7 days (roads don't change often) and any failure falls back to a
 * clearly-labeled estimate (haversine × winding factor / blended average speed).
 */
const OSRM_TABLE_URL = 'https://router.project-osrm.org/table/v1/driving';
const OSRM_TIMEOUT_MS = 6000;
const OSRM_MAX_LOCATIONS = 80; // demo server caps table requests at 100 coords
const ROUTE_CACHE_TTL_DAYS = 7;

/** Mountain roads wind: road distance is typically ~1.3–1.4× the straight line. */
const ROAD_WINDING_FACTOR = 1.35;

/** Origins within ~1 km share cached routes. */
function originKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

/**
 * Fallback estimate when routing is unavailable.
 * Blended average speed rises with trip length (more highway share).
 */
export function estimateDrive(crowKm) {
  const distanceKm = Math.round(crowKm * ROAD_WINDING_FACTOR * 10) / 10;
  const avgSpeedKmh = distanceKm < 30 ? 50 : distanceKm < 120 ? 65 : 75;
  return {
    distanceKm,
    durationMin: Math.round((distanceKm / avgSpeedKmh) * 60),
    source: 'estimate',
  };
}

/**
 * Get drive info for many resorts at once.
 * Returns a Map of resort id → { distanceKm, durationMin, source }.
 * Never throws; every resort always gets a value (OSRM, cache, or estimate).
 */
export async function getDriveInfoBatch(originLat, originLon, resorts) {
  const db = getDb();
  const key = originKey(originLat, originLon);
  const result = new Map();

  const cachedRows = db
    .prepare(
      `SELECT resort_id, distance_km, duration_min, source FROM route_cache
       WHERE origin_key = ? AND expires_at > datetime('now')`
    )
    .all(key);
  const cached = new Map(cachedRows.map((r) => [r.resort_id, r]));

  const missing = [];
  for (const resort of resorts) {
    const hit = cached.get(resort.id);
    // Cached estimates are retried against OSRM; cached OSRM routes are final.
    if (hit && hit.source === 'osrm') {
      result.set(resort.id, {
        distanceKm: hit.distance_km,
        durationMin: hit.duration_min,
        source: 'osrm',
      });
    } else {
      missing.push(resort);
    }
  }

  if (missing.length > 0) {
    const routed = await fetchOsrmTable(originLat, originLon, missing);
    const expiresAt = new Date(Date.now() + ROUTE_CACHE_TTL_DAYS * 24 * 3600 * 1000).toISOString();
    const upsert = db.prepare(
      `INSERT OR REPLACE INTO route_cache (origin_key, resort_id, distance_km, duration_min, source, fetched_at, expires_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
    );

    for (const resort of missing) {
      const info =
        routed.get(resort.id) ||
        estimateDrive(haversineDistance(originLat, originLon, resort.lat, resort.lon));
      result.set(resort.id, info);
      upsert.run(key, resort.id, info.distanceKm, info.durationMin, info.source, expiresAt);
    }
  }

  return result;
}

/**
 * One OSRM `table` call per chunk of resorts: origin as source, resorts as
 * destinations. Returns a Map of resort id → drive info; empty Map on failure.
 */
async function fetchOsrmTable(originLat, originLon, resorts) {
  const routed = new Map();

  for (let i = 0; i < resorts.length; i += OSRM_MAX_LOCATIONS) {
    const chunk = resorts.slice(i, i + OSRM_MAX_LOCATIONS);
    const coords = [
      `${originLon},${originLat}`,
      ...chunk.map((r) => `${r.lon},${r.lat}`),
    ].join(';');
    const url = `${OSRM_TABLE_URL}/${coords}?sources=0&annotations=duration,distance`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

      const data = await res.json();
      if (data.code !== 'Ok' || !data.durations?.[0]) throw new Error(`OSRM code ${data.code}`);

      const durations = data.durations[0];
      const distances = data.distances?.[0];
      chunk.forEach((resort, idx) => {
        const durationSec = durations[idx + 1]; // index 0 is the origin itself
        const distanceM = distances?.[idx + 1];
        if (durationSec !== null && durationSec !== undefined) {
          routed.set(resort.id, {
            distanceKm:
              distanceM != null
                ? Math.round(distanceM / 100) / 10
                : estimateDrive(haversineDistance(originLat, originLon, resort.lat, resort.lon)).distanceKm,
            durationMin: Math.round(durationSec / 60),
            source: 'osrm',
          });
        }
      });
    } catch (err) {
      console.warn(`[driveTime] OSRM unavailable, using estimates: ${err.message}`);
      // leave this chunk unrouted; caller falls back to estimates
    }
  }

  return routed;
}

/** Remove expired route cache entries (called by the scheduled cleanup job). */
export function cleanExpiredRouteCache() {
  const db = getDb();
  const result = db.prepare("DELETE FROM route_cache WHERE expires_at < datetime('now')").run();
  return result.changes;
}
