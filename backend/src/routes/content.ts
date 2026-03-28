import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/content/tips — public, active tips
router.get('/tips', (_req: Request, res: Response) => {
  const db = getDb();
  const tips = db.prepare(
    'SELECT id, category, title, body, source, order_index FROM tips WHERE is_active = 1 ORDER BY order_index ASC'
  ).all();
  res.json(tips);
});

// GET /api/content/about — public about sections + sources
router.get('/about', (_req: Request, res: Response) => {
  const db = getDb();
  const sections = db.prepare(
    'SELECT section_key, title, body, meta_json FROM about_sections ORDER BY order_index ASC'
  ).all() as Array<{ section_key: string; title: string; body: string; meta_json: string | null }>;
  const sources = db.prepare(
    'SELECT id, author, year, title, publication FROM about_sources ORDER BY order_index ASC'
  ).all();
  res.json({ sections, sources });
});

export default router;
