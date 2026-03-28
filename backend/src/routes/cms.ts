import { Router, Request, Response } from 'express';
import { getDb } from '../database';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { addAuditLog } from '../utils/audit';

const router = Router();

// ── TIPS ─────────────────────────────────────────────────────────────────

// GET /api/admin/cms/tips
router.get('/tips', (_req: Request, res: Response) => {
  const db = getDb();
  const tips = db.prepare('SELECT * FROM tips ORDER BY order_index ASC').all();
  res.json(tips);
});

// POST /api/admin/cms/tips
router.post('/tips', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { category, title, body, source } = req.body as {
    category: string; title: string; body: string; source?: string;
  };
  if (!category || !title || !body) {
    res.status(400).json({ error: 'category, title, body required' });
    return;
  }
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), 0) as m FROM tips').get() as { m: number }).m;
  const id = uuidv4();
  db.prepare('INSERT INTO tips (id, category, title, body, source, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)')
    .run(id, category, title, body, source || null, maxOrder + 1);
  if (req.adminId) addAuditLog(req.adminId, 'create_tip', { id, title }, req.ip || '');
  res.json({ id });
});

// PUT /api/admin/cms/tips/:id
router.put('/tips/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { category, title, body, source, is_active, order_index } = req.body as {
    category?: string; title?: string; body?: string; source?: string | null;
    is_active?: number; order_index?: number;
  };

  const current = db.prepare('SELECT * FROM tips WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!current) { res.status(404).json({ error: 'Not found' }); return; }

  db.prepare(`
    UPDATE tips SET
      category = ?,
      title = ?,
      body = ?,
      source = ?,
      is_active = ?,
      order_index = ?
    WHERE id = ?
  `).run(
    category ?? current.category,
    title ?? current.title,
    body ?? current.body,
    source !== undefined ? (source || null) : current.source,
    is_active !== undefined ? is_active : current.is_active,
    order_index !== undefined ? order_index : current.order_index,
    req.params.id
  );
  res.json({ ok: true });
});

// DELETE /api/admin/cms/tips/:id
router.delete('/tips/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM tips WHERE id = ?').run(req.params.id);
  if (req.adminId) addAuditLog(req.adminId, 'delete_tip', { tip_id: req.params.id }, req.ip || '');
  res.json({ ok: true });
});

// PUT /api/admin/cms/tips-reorder
router.put('/tips-reorder', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { order } = req.body as { order: string[] };
  const update = db.prepare('UPDATE tips SET order_index = ? WHERE id = ?');
  const t = db.transaction(() => {
    order.forEach((id, i) => update.run(i + 1, id));
  });
  t();
  res.json({ ok: true });
});

// ── ABOUT SECTIONS ───────────────────────────────────────────────────────

// GET /api/admin/cms/about
router.get('/about', (_req: Request, res: Response) => {
  const db = getDb();
  const sections = db.prepare('SELECT * FROM about_sections ORDER BY order_index ASC').all();
  const sources = db.prepare('SELECT * FROM about_sources ORDER BY order_index ASC').all();
  res.json({ sections, sources });
});

// PUT /api/admin/cms/about/sections/:key
router.put('/about/sections/:key', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { title, body, meta_json } = req.body as { title?: string; body?: string; meta_json?: string };
  db.prepare(`
    UPDATE about_sections SET
      title = COALESCE(?, title),
      body = COALESCE(?, body),
      meta_json = COALESCE(?, meta_json),
      updated_at = CURRENT_TIMESTAMP
    WHERE section_key = ?
  `).run(title || null, body || null, meta_json || null, req.params.key);
  if (req.adminId) addAuditLog(req.adminId, 'update_about_section', { section: req.params.key }, req.ip || '');
  res.json({ ok: true });
});

// ── SOURCES ──────────────────────────────────────────────────────────────

// POST /api/admin/cms/sources
router.post('/sources', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { author, year, title, publication } = req.body as {
    author: string; year?: number; title: string; publication?: string;
  };
  if (!author || !title) { res.status(400).json({ error: 'author and title required' }); return; }
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), 0) as m FROM about_sources').get() as { m: number }).m;
  const id = uuidv4();
  db.prepare('INSERT INTO about_sources (id, author, year, title, publication, order_index) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, author, year || null, title, publication || null, maxOrder + 1);
  res.json({ id });
});

// PUT /api/admin/cms/sources/:id
router.put('/sources/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { author, year, title, publication, order_index } = req.body as {
    author?: string; year?: number; title?: string; publication?: string; order_index?: number;
  };
  db.prepare(`
    UPDATE about_sources SET
      author = COALESCE(?, author),
      year = COALESCE(?, year),
      title = COALESCE(?, title),
      publication = COALESCE(?, publication),
      order_index = COALESCE(?, order_index)
    WHERE id = ?
  `).run(author || null, year || null, title || null, publication || null,
    order_index !== undefined ? order_index : null, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/cms/sources/:id
router.delete('/sources/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM about_sources WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
