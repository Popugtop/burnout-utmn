import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getDb } from './database';
import surveyRouter from './routes/survey';
import statsRouter from './routes/stats';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import analyticsRouter from './routes/analytics';
import backupsRouter from './routes/backups';
import contentRouter from './routes/content';
import cmsRouter from './routes/cms';
import { authAdmin } from './middleware/auth';
import { startScheduler } from './services/scheduler';
import { createBackup, ensureBackupDir } from './services/backup';

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiters
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Try again later.' },
});

const statsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Try again later.' },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Try again later.' },
});

// Initialize DB on startup
getDb();

// Apply login rate limiter only to the login endpoint
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);

app.use('/api/survey/submit', submitLimiter);
app.use('/api/survey', surveyRouter);

app.use('/api/stats', statsLimiter, statsRouter);

app.use('/api/content', contentRouter);
app.use('/api/admin/cms', adminLimiter, authAdmin, cmsRouter);

app.use('/api/admin/analytics', adminLimiter, authAdmin, analyticsRouter);
app.use('/api/admin/backups', adminLimiter, authAdmin, backupsRouter);
app.use('/api/admin', adminLimiter, authAdmin, adminRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Burnout backend running on port ${PORT}`);

  // Startup backup
  try {
    ensureBackupDir();
    await createBackup('burnout-backup');
    console.log('Startup backup created');
  } catch (e) {
    console.warn('Startup backup failed:', e);
  }

  // Start scheduler
  startScheduler();
});
