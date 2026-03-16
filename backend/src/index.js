import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb } from './db/database.js';
import healthRoutes from './routes/health.js';
import geocodingRoutes from './routes/geocoding.js';
import recommendRoutes from './routes/recommend.js';
import resortRoutes from './routes/resort.js';
import { startScheduledJobs } from './jobs/scheduler.js';

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

async function start() {
  initDb();
  startScheduledJobs();
  app.listen(PORT, () => {
    console.log(`Ski Resort Weather Tracker API running on http://localhost:${PORT}`);
  });
}

start();
