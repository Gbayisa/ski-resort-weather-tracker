import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { closeDb, initDb } from './db/database.js';
import healthRoutes from './routes/health.js';
import geocodingRoutes from './routes/geocoding.js';
import discoverRoutes from './routes/discover.js';
import communityRoutes from './routes/community.js';
import resortRoutes from './routes/resort.js';
import { runMaintenance, startScheduledJobs } from './jobs/scheduler.js';
import { seed } from './scripts/seedResorts.js';
import { seedDemoCommunity } from './scripts/seedDemoCommunity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
/** Cloud Run sets K_SERVICE; there the app may run as several copies or none, so jobs come from Cloud Scheduler. */
const ON_CLOUD_RUN = Boolean(process.env.K_SERVICE);

// Behind Cloud Run's front end (or any one proxy), the client's address is the last X-Forwarded-For hop.
// Without this every visitor shares the proxy's address, and one rate-limit bucket.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (ON_CLOUD_RUN || process.env.NODE_ENV === 'production' ? 1 : 0)));

app.use(cors());
app.use(express.json({ limit: '20kb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

/** Hourly maintenance, called by Cloud Scheduler with the shared key; hidden when no key is configured. */
app.post('/api/internal/maintenance', async (req, res) => {
  const key = process.env.MAINTENANCE_KEY || '';
  const given = req.get('x-maintenance-key') || '';
  if (!key || given.length !== key.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(key))) {
    return res.status(404).end();
  }
  try {
    res.json(await runMaintenance());
  } catch (err) {
    console.error('Maintenance failed:', err);
    res.status(500).json({ error: 'maintenance_failed' });
  }
});

app.use('/api/health', healthRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/resort', resortRoutes);

// Serve the pre-built frontend in production (single-service deployment).
// When VITE_API_BASE_URL is left blank the frontend defaults to the relative
// "/api" prefix which hits these routes above, so no env var is needed.
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // SPA fallback – return index.html for every non-API route
  app.get('*', apiLimiter, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function start() {
  await initDb();
  await seed();
  await seedDemoCommunity();
  if (!ON_CLOUD_RUN) startScheduledJobs();
  const server = app.listen(PORT, () => {
    console.log(`First Lift API running on http://localhost:${PORT}`);
  });

  // Cloud Run sends SIGTERM before stopping an instance: finish requests, then close the database
  process.on('SIGTERM', () => {
    server.close(() => closeDb().finally(() => process.exit(0)));
  });
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
