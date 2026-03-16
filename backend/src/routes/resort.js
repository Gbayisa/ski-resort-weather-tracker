import { Router } from 'express';
import { getDb } from '../db/database.js';
import { getWeatherForResort } from '../services/weatherCache.js';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const db = getDb();
    const resort = db.prepare('SELECT * FROM resorts WHERE id = ?').get(id);

    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' });
    }

    const weather = await getWeatherForResort(resort, date);

    res.json({
      id: resort.id,
      name: resort.name,
      lat: resort.lat,
      lon: resort.lon,
      country: resort.country,
      region: resort.region,
      website: resort.website,
      forecastDate: date,
      ...(weather || {}),
    });
  } catch (err) {
    console.error('Resort detail error:', err.message);
    res.status(500).json({ error: 'Failed to get resort detail' });
  }
});

export default router;
