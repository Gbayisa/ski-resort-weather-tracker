import { Router } from 'express';
import { geocodeLocation } from '../services/openMeteo.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }
    const results = await geocodeLocation(q);
    res.json({ results });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

export default router;
