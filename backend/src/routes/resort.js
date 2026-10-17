import { Router } from 'express';
import { getDb } from '../db/database.js';
import { getWeatherForResort } from '../services/weatherCache.js';
import { terrainOf } from '../services/discover.js';
import { getDriveInfoBatch } from '../services/driveTime.js';

const router = Router();

/** GET /api/resort/search?q= — name search for pickers (home mountain). Declared before /:id. */
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });
  const results = getDb()
    .prepare(
      `SELECT id, name, region, country FROM resorts WHERE name LIKE ?
       ORDER BY (name LIKE ?) DESC, piste_km DESC NULLS LAST, name LIMIT 8`
    )
    .all(`%${q}%`, `${q}%`);
  res.json({ results });
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, lat, lon } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const db = getDb();
    const resort = db.prepare('SELECT * FROM resorts WHERE id = ?').get(id);

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
