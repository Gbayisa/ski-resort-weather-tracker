import { Router } from 'express';
import { discover, DRIVE_BUCKETS, TRIPS } from '../services/discover.js';
import { STYLES } from '../services/conditions.js';

const router = Router();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/discover?lat&lon&today=YYYY-MM-DD&dates=YYYY-MM-DD,...&trip=day|weekend|week
 *                   &drive=short|happy|best&style=groomer|allmountain|powder
 * `today` and `dates` come from the client so they follow the user's local calendar.
 */
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const dates = String(req.query.dates || '').split(',').filter(Boolean);
  const { today, trip, drive, style } = req.query;

  const problems = [];
  if (!Number.isFinite(lat) || Math.abs(lat) > 90) problems.push('lat');
  if (!Number.isFinite(lon) || Math.abs(lon) > 180) problems.push('lon');
  if (!ISO_DATE.test(today || '')) problems.push('today');
  if (dates.length < 1 || dates.length > 7 || !dates.every((d) => ISO_DATE.test(d))) problems.push('dates');
  if (!TRIPS.includes(trip)) problems.push('trip');
  if (!DRIVE_BUCKETS[drive]) problems.push('drive');
  if (!STYLES.includes(style)) problems.push('style');
  if (problems.length) return res.status(400).json({ error: `Invalid or missing: ${problems.join(', ')}` });

  try {
    res.json(await discover({ lat, lon, dates, today, trip, drive, style }));
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Failed to find resorts' });
  }
});

export default router;
