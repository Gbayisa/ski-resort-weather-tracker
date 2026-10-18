import { Router } from 'express';
import { getDb } from '../db/database.js';
import { getWeatherForResort } from '../services/weatherCache.js';
import { terrainOf } from '../services/discover.js';
import { getDriveInfoBatch } from '../services/driveTime.js';

const router = Router();

/** GET /api/resort/search?q= — name search for pickers (home mountain). Declared before /:id. */
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ results: [] });
  const like = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  try {
    const results = await getDb().all(
      `SELECT id, name, region, country FROM resorts WHERE name ILIKE ?
       ORDER BY (name ILIKE ?) DESC, piste_km DESC NULLS LAST, name LIMIT 8`,
      `%${like}%`,
      `${like}%`
    );
    res.json({ results });
  } catch (err) {
    console.error('Resort search error:', err.message);
    res.status(500).json({ error: 'Resort search failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, lat, lon } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const resort = Number.isInteger(Number(id)) ? await getDb().get('SELECT * FROM resorts WHERE id = ?', Number(id)) : null;

    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' });
    }

    const weather = await getWeatherForResort(resort, date);

    // Optional drive info when the client provides its origin
    let drive = {};
    if (lat && lon) {
      const originLat = parseFloat(lat);
      const originLon = parseFloat(lon);
      const info = (await getDriveInfoBatch(originLat, originLon, [resort])).get(resort.id);
      drive = {
        driveDistanceKm: info.distanceKm,
        driveTimeMin: info.durationMin,
        driveSource: info.source,
      };
    }

    res.json({
      id: resort.id,
      name: resort.name,
      lat: resort.lat,
      lon: resort.lon,
      country: resort.country,
      region: resort.region,
      website: resort.website,
      terrain: terrainOf(resort),
      forecastDate: date,
      ...drive,
      ...(weather || {}),
    });
  } catch (err) {
    console.error('Resort detail error:', err.message);
    res.status(500).json({ error: 'Failed to get resort detail' });
  }
});

export default router;
