import './env.ts';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { reportsRouter } from './routes/reports.ts';
import { initDb } from './db/index.ts';
import { DEMO_MODE, ANALYSIS_MODEL, GUARD_MODEL } from './ai/gemini.ts';

await initDb();

const app = express();
app.use(cors());
app.use(express.json());

const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: 'Rate limit reached: 10 analyses per hour' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/reports/:id/analyze', analyzeLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demoMode: DEMO_MODE, analysisModel: ANALYSIS_MODEL, guardModel: GUARD_MODEL });
});

app.use('/api/reports', reportsRouter);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`ImpactLens server on http://localhost:${port}`);
  if (DEMO_MODE) {
    console.log('⚠ DEMO MODE — GEMINI_API_KEY not set; analyses return a canned sample report.');
  } else {
    console.log(`Models: analysis=${ANALYSIS_MODEL} guard=${GUARD_MODEL}`);
  }
});
