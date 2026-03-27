import { Router, Request, Response } from 'express';
import { getDb } from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// --- Surveys ---
router.get('/surveys', (_req: Request, res: Response) => {
  const db = getDb();
  const surveys = db.prepare(`
    SELECT s.*, (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as response_count
    FROM surveys s ORDER BY s.created_at DESC
  `).all();
  res.json(surveys);
});

router.post('/surveys', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, description } = req.body as { title: string; description?: string };
    if (!title) { res.status(400).json({ error: 'title required' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO surveys (id, title, description, is_active) VALUES (?, ?, ?, 0)')
      .run(id, title, description || '');
    res.json({ id });
  } catch (e) {
    console.error('POST /surveys error:', e);
    res.status(500).json({ error: String(e) });
  }
});

router.put('/surveys/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { title, description } = req.body as { title?: string; description?: string };
  db.prepare('UPDATE surveys SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title || null, description !== undefined ? description : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/surveys/:id', (req: Request, res: Response) => {
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM responses WHERE survey_id = ?').get(req.params.id) as { cnt: number }).cnt;
  if (count > 0) { res.status(400).json({ error: 'Cannot delete survey with responses' }); return; }
  db.prepare('DELETE FROM survey_questions WHERE survey_id = ?').run(req.params.id);
  db.prepare('DELETE FROM surveys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.put('/surveys/:id/activate', (req: Request, res: Response) => {
  const db = getDb();
  const t = db.transaction(() => {
    db.prepare('UPDATE surveys SET is_active = 0').run();
    db.prepare('UPDATE surveys SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  });
  t();
  res.json({ ok: true });
});

// --- Questions ---
router.get('/surveys/:id/questions', (req: Request, res: Response) => {
  const db = getDb();
  const questions = db.prepare('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_index ASC').all(req.params.id);
  res.json(questions);
});

router.post('/surveys/:id/questions', (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body as {
    category: string; question_text: string; question_type: string;
    scale_label_low?: string; scale_label_high?: string;
    choices_json?: string; is_inverted?: number; scoring_map_json?: string;
  };
  const maxOrder = (db.prepare('SELECT MAX(order_index) as m FROM survey_questions WHERE survey_id = ?').get(req.params.id) as { m: number | null }).m || 0;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO survey_questions (id, survey_id, order_index, category, question_text, question_type,
      scale_label_low, scale_label_high, choices_json, is_inverted, scoring_map_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, maxOrder + 1, body.category, body.question_text, body.question_type,
    body.scale_label_low || null, body.scale_label_high || null, body.choices_json || null,
    body.is_inverted || 0, body.scoring_map_json || null);
  res.json({ id });
});

router.put('/questions/:id', (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body as {
    category?: string; question_text?: string; question_type?: string;
    scale_label_low?: string; scale_label_high?: string;
    choices_json?: string; is_inverted?: number; scoring_map_json?: string;
  };
  db.prepare(`
    UPDATE survey_questions SET
      category = COALESCE(?, category),
      question_text = COALESCE(?, question_text),
      question_type = COALESCE(?, question_type),
      scale_label_low = ?,
      scale_label_high = ?,
      choices_json = ?,
      is_inverted = COALESCE(?, is_inverted),
      scoring_map_json = ?
    WHERE id = ?
  `).run(
    body.category || null, body.question_text || null, body.question_type || null,
    body.scale_label_low ?? null, body.scale_label_high ?? null, body.choices_json ?? null,
    body.is_inverted !== undefined ? body.is_inverted : null, body.scoring_map_json ?? null,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/questions/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM survey_questions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.put('/surveys/:id/questions/reorder', (req: Request, res: Response) => {
  const db = getDb();
  const { order } = req.body as { order: string[] };
  const update = db.prepare('UPDATE survey_questions SET order_index = ? WHERE id = ? AND survey_id = ?');
  const t = db.transaction(() => {
    order.forEach((qid, i) => update.run(i + 1, qid, req.params.id));
  });
  t();
  res.json({ ok: true });
});

// --- Responses ---
router.get('/responses', (req: Request, res: Response) => {
  const db = getDb();
  const { page = '1', limit = '50', department, year } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];
  if (department && department !== 'all') { where += ' AND department = ?'; params.push(String(department)); }
  if (year && year !== 'all') { where += ' AND course_year = ?'; params.push(Number(year)); }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM responses ${where}`).get(...params) as { cnt: number }).cnt;
  const rows = db.prepare(`SELECT * FROM responses ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  res.json({ total, rows });
});

router.get('/responses/export', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM responses ORDER BY created_at DESC').all() as Record<string, unknown>[];
  if (rows.length === 0) { res.json([]); return; }
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="responses.csv"');
  res.send(csv);
});

router.delete('/responses/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM response_answers WHERE response_id = ?').run(req.params.id);
  db.prepare('DELETE FROM responses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
