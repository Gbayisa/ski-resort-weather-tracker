import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const resortCount = await db.get('SELECT COUNT(*) AS count FROM resorts');
    const cacheCount = await db.get('SELECT COUNT(*) AS count FROM resort_forecasts WHERE expires_at > ?', new Date().toISOString());
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      resorts: resortCount.count,
      cachedForecasts: cacheCount.count,
    });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ status: 'error' });
  }
});

export default router;
