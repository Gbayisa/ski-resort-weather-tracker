import { Router } from 'express';
import { getRecommendations } from '../services/recommendations.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { lat, lon, date, radius, minSnowfall } = req.query;

    if (!lat || !lon || !date) {
      return res.status(400).json({ error: 'lat, lon, and date are required' });
    }

    const results = await getRecommendations({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      date,
      radiusKm: radius ? parseFloat(radius) : 200,
      minSnowfall: minSnowfall ? parseFloat(minSnowfall) : 0,
    });

    res.json({ results, count: results.length });
  } catch (err) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

export default router;
