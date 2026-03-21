import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDb } from './db/database.js';
import healthRoutes from './routes/health.js';
import geocodingRoutes from './routes/geocoding.js';
import recommendRoutes from './routes/recommend.js';
import resortRoutes from './routes/resort.js';
import { startScheduledJobs } from './jobs/scheduler.js';
import { seed } from './scripts/seedResorts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/recommend', recommendRoutes);
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
  initDb();
  await seed();
  startScheduledJobs();
  app.listen(PORT, () => {
    console.log(`Ski Resort Weather Tracker API running on http://localhost:${PORT}`);
  });
}

start();
