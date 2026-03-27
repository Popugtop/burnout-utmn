import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './database';
import surveyRouter from './routes/survey';
import statsRouter from './routes/stats';
import adminRouter from './routes/admin';
import { authAdmin } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB on startup
getDb();

app.use('/api/survey', surveyRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', authAdmin, adminRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Burnout backend running on port ${PORT}`);
});
