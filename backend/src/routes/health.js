import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const resortCount = db.prepare('SELECT COUNT(*) as count FROM resorts').get();
  const cacheCount = db
    .prepare('SELECT COUNT(*) as count FROM resort_forecasts WHERE expires_at > ?')
    .get(new Date().toISOString());

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    resorts: resortCount.count,
    cachedForecasts: cacheCount.count,
  });
});

export default router;
