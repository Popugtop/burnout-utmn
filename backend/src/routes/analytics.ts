import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

function buildWhere(query: Record<string, unknown>): { where: string; params: (string | number)[] } {
  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  const { date_from, date_to, course_years, departments, exclude_suspicious } = query;

  if (date_from) { where += ' AND date(created_at) >= ?'; params.push(String(date_from)); }
  if (date_to) { where += ' AND date(created_at) <= ?'; params.push(String(date_to)); }

  if (course_years) {
    const vals = String(course_years).split(',').map(Number).filter(n => !isNaN(n));
    if (vals.length > 0) {
      where += ` AND course_year IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }
  }

  if (departments) {
    const vals = String(departments).split(',').map(s => s.trim()).filter(Boolean);
    if (vals.length > 0) {
      where += ` AND department IN (${vals.map(() => '?').join(',')})`;
      params.push(...vals);
    }
  }

  if (exclude_suspicious === 'true') {
    where += ' AND (is_suspicious = 0 OR is_suspicious IS NULL)';
  }

  return { where, params };
}

// GET /api/admin/analytics/summary
router.get('/summary', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);
  const { survey_id } = req.query;

  let surveyWhere = where;
  const surveyParams = [...params];
  if (survey_id) {
    surveyWhere += ' AND r.survey_id = ?';
    surveyParams.push(String(survey_id));
  }

  const questions = db.prepare(`
    SELECT sq.id, sq.question_text, sq.question_type, sq.choices_json, sq.category
    FROM survey_questions sq
    WHERE sq.survey_id = (SELECT id FROM surveys WHERE is_active = 1 LIMIT 1)
    ORDER BY sq.order_index ASC
  `).all() as Array<{ id: string; question_text: string; question_type: string; choices_json: string | null; category: string }>;

  const result = questions.map(q => {
    if (q.question_type === 'scale_1_5') {
      const dist = db.prepare(`
        SELECT
          SUM(CASE WHEN CAST(ra.answer_value AS INTEGER) = 1 THEN 1 ELSE 0 END) as v1,
          SUM(CASE WHEN CAST(ra.answer_value AS INTEGER) = 2 THEN 1 ELSE 0 END) as v2,
          SUM(CASE WHEN CAST(ra.answer_value AS INTEGER) = 3 THEN 1 ELSE 0 END) as v3,
          SUM(CASE WHEN CAST(ra.answer_value AS INTEGER) = 4 THEN 1 ELSE 0 END) as v4,
          SUM(CASE WHEN CAST(ra.answer_value AS INTEGER) = 5 THEN 1 ELSE 0 END) as v5,
          AVG(CAST(ra.answer_value AS REAL)) as mean,
          COUNT(*) as count
        FROM response_answers ra
        JOIN responses r ON ra.response_id = r.id
        WHERE ra.question_id = ? ${surveyWhere.replace('WHERE 1=1', 'AND 1=1')}
      `).get(q.id, ...surveyParams) as { v1: number; v2: number; v3: number; v4: number; v5: number; mean: number; count: number };

      const total = dist.count || 1;
      return {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        category: q.category,
        distribution: {
          1: dist.v1 || 0, 2: dist.v2 || 0, 3: dist.v3 || 0, 4: dist.v4 || 0, 5: dist.v5 || 0,
        },
        distribution_pct: {
          1: Math.round(((dist.v1 || 0) / total) * 100),
          2: Math.round(((dist.v2 || 0) / total) * 100),
          3: Math.round(((dist.v3 || 0) / total) * 100),
          4: Math.round(((dist.v4 || 0) / total) * 100),
          5: Math.round(((dist.v5 || 0) / total) * 100),
        },
        mean: dist.mean || 0,
        count: dist.count || 0,
      };
    } else {
      // choice question
      const choices = q.choices_json ? JSON.parse(q.choices_json) as string[] : [];
      const rows = db.prepare(`
        SELECT ra.answer_value, COUNT(*) as count
        FROM response_answers ra
        JOIN responses r ON ra.response_id = r.id
        WHERE ra.question_id = ? ${surveyWhere.replace('WHERE 1=1', 'AND 1=1')}
        GROUP BY ra.answer_value
      `).all(q.id, ...surveyParams) as Array<{ answer_value: string; count: number }>;

      const total = rows.reduce((s, r) => s + r.count, 0) || 1;
      const distMap: Record<string, number> = {};
      const distPctMap: Record<string, number> = {};
      for (const c of choices) {
        const found = rows.find(r => r.answer_value === c);
        distMap[c] = found?.count || 0;
        distPctMap[c] = Math.round(((found?.count || 0) / total) * 100);
      }

      return {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        category: q.category,
        choices,
        distribution: distMap,
        distribution_pct: distPctMap,
        count: rows.reduce((s, r) => s + r.count, 0),
      };
    }
  });

  res.json(result);
});

// GET /api/admin/analytics/categories
router.get('/categories', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);

  const cats = db.prepare(`
    SELECT
      COALESCE(AVG(score_academic), 0) as academic_mean,
      COALESCE(AVG(score_sleep), 0) as sleep_mean,
      COALESCE(AVG(score_emotional), 0) as emotional_mean,
      COALESCE(AVG(score_social), 0) as social_mean,
      COALESCE(AVG(score_total), 0) as total_mean,
      COUNT(*) as count
    FROM responses ${where}
  `).get(...params) as { academic_mean: number; sleep_mean: number; emotional_mean: number; social_mean: number; total_mean: number; count: number };

  const distribution = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN score_total <= 20 THEN 1 ELSE 0 END), 0) as low,
      COALESCE(SUM(CASE WHEN score_total > 20 AND score_total <= 40 THEN 1 ELSE 0 END), 0) as mild,
      COALESCE(SUM(CASE WHEN score_total > 40 AND score_total <= 60 THEN 1 ELSE 0 END), 0) as moderate,
      COALESCE(SUM(CASE WHEN score_total > 60 AND score_total <= 80 THEN 1 ELSE 0 END), 0) as high,
      COALESCE(SUM(CASE WHEN score_total > 80 THEN 1 ELSE 0 END), 0) as critical
    FROM responses ${where}
  `).get(...params);

  res.json({ ...cats, distribution });
});

// GET /api/admin/analytics/cross
router.get('/cross', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);
  const groupBy = req.query.group_by as string || 'course';

  const groupCol = groupBy === 'department' ? 'department' : 'course_year';

  const rows = db.prepare(`
    SELECT
      ${groupCol} as group_value,
      COALESCE(AVG(score_academic), 0) as academic_mean,
      COALESCE(AVG(score_sleep), 0) as sleep_mean,
      COALESCE(AVG(score_emotional), 0) as emotional_mean,
      COALESCE(AVG(score_social), 0) as social_mean,
      COALESCE(AVG(score_total), 0) as total_mean,
      COUNT(*) as count
    FROM responses ${where}
    GROUP BY ${groupCol}
    ORDER BY total_mean DESC
  `).all(...params);

  res.json(rows);
});

// GET /api/admin/analytics/timeline
router.get('/timeline', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);
  const granularity = req.query.granularity as string || 'day';

  let dateFormat: string;
  if (granularity === 'week') {
    dateFormat = "strftime('%Y-W%W', created_at)";
  } else if (granularity === 'month') {
    dateFormat = "strftime('%Y-%m', created_at)";
  } else {
    dateFormat = "strftime('%Y-%m-%d', created_at)";
  }

  const rows = db.prepare(`
    SELECT
      ${dateFormat} as date,
      COUNT(*) as count,
      COALESCE(AVG(score_total), 0) as mean_total,
      COALESCE(AVG(score_academic), 0) as mean_academic,
      COALESCE(AVG(score_sleep), 0) as mean_sleep,
      COALESCE(AVG(score_emotional), 0) as mean_emotional,
      COALESCE(AVG(score_social), 0) as mean_social
    FROM responses ${where}
    GROUP BY ${dateFormat}
    ORDER BY date ASC
  `).all(...params);

  res.json(rows);
});

// GET /api/admin/analytics/demographics
router.get('/demographics', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);

  const byCourse = db.prepare(`
    SELECT course_year as label, COUNT(*) as count
    FROM responses ${where}
    GROUP BY course_year ORDER BY course_year
  `).all(...params);

  const byDept = db.prepare(`
    SELECT department as label, COUNT(*) as count
    FROM responses ${where} AND department IS NOT NULL AND department != ''
    GROUP BY department ORDER BY count DESC
  `).all(...params);

  const byDate = db.prepare(`
    SELECT strftime('%Y-%m-%d', created_at) as label, COUNT(*) as count
    FROM responses ${where}
    GROUP BY strftime('%Y-%m-%d', created_at)
    ORDER BY label ASC
  `).all(...params);

  res.json({ by_course: byCourse, by_department: byDept, by_date: byDate });
});

// GET /api/admin/analytics/export/csv
router.get('/export/csv', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);
  const format = req.query.format as string || 'raw';

  if (format === 'summary') {
    const rows = db.prepare(`
      SELECT
        department, course_year,
        COUNT(*) as count,
        ROUND(AVG(score_total), 1) as avg_total,
        ROUND(AVG(score_academic), 1) as avg_academic,
        ROUND(AVG(score_sleep), 1) as avg_sleep,
        ROUND(AVG(score_emotional), 1) as avg_emotional,
        ROUND(AVG(score_social), 1) as avg_social
      FROM responses ${where}
      GROUP BY department, course_year
      ORDER BY department, course_year
    `).all(...params) as Record<string, unknown>[];

    if (rows.length === 0) { res.type('text/csv').send('No data'); return; }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="burnout-summary.csv"');
    res.send(csv);
  } else {
    const rows = db.prepare(`SELECT * FROM responses ${where} ORDER BY created_at DESC`).all(...params) as Record<string, unknown>[];
    if (rows.length === 0) { res.type('text/csv').send('No data'); return; }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="burnout-responses.csv"');
    res.send(csv);
  }
});

// GET /api/admin/analytics/responses (paginated)
router.get('/responses', (req: Request, res: Response) => {
  const db = getDb();
  const { where, params } = buildWhere(req.query as Record<string, unknown>);
  const page = parseInt(req.query.page as string || '1', 10);
  const perPage = parseInt(req.query.per_page as string || '25', 10);
  const sortBy = (req.query.sort_by as string) || 'created_at';
  const sortOrder = (req.query.sort_order as string) === 'asc' ? 'ASC' : 'DESC';

  const allowedSort = ['created_at', 'score_total', 'score_academic', 'score_sleep', 'score_emotional', 'score_social', 'course_year'];
  const safeSort = allowedSort.includes(sortBy) ? sortBy : 'created_at';

  const offset = (page - 1) * perPage;
  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM responses ${where}`).get(...params) as { cnt: number }).cnt;
  const rows = db.prepare(`
    SELECT * FROM responses ${where} ORDER BY ${safeSort} ${sortOrder} LIMIT ? OFFSET ?
  `).all(...params, perPage, offset);

  res.json({ data: rows, total, page, per_page: perPage });
});

// GET /api/admin/analytics/responses/:id (details)
router.get('/responses/:id', (req: Request, res: Response) => {
  const db = getDb();
  const response = db.prepare('SELECT * FROM responses WHERE id = ?').get(req.params.id);
  if (!response) { res.status(404).json({ error: 'Not found' }); return; }

  const answers = db.prepare(`
    SELECT ra.*, sq.question_text, sq.question_type, sq.category, sq.scale_label_low, sq.scale_label_high, sq.choices_json
    FROM response_answers ra
    JOIN survey_questions sq ON ra.question_id = sq.id
    WHERE ra.response_id = ?
    ORDER BY sq.order_index ASC
  `).all(req.params.id);

  res.json({ response, answers });
});

export default router;
