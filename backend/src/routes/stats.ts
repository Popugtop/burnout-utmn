import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/stats/count
router.get('/count', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM responses').get() as { count: number };
  res.json({ count: result.count });
});

// GET /api/stats
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { year, department, period } = req.query;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];
  if (year && year !== 'all') { where += ' AND course_year = ?'; params.push(Number(year)); }
  if (department && department !== 'all') { where += ' AND department = ?'; params.push(String(department)); }
  if (period && period !== 'all') { where += ' AND semester_period = ?'; params.push(String(period)); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM responses ${where}`).get(...params) as { count: number }).count;
  const avgRow = db.prepare(`SELECT AVG(score_total) as avg FROM responses ${where}`).get(...params) as { avg: number };

  const byDept = db.prepare(`
    SELECT department, AVG(score_total) as avg_total, COUNT(*) as count
    FROM responses ${where}
    GROUP BY department
    ORDER BY avg_total DESC
  `).all(...params);

  const byCourse = db.prepare(`
    SELECT course_year, AVG(score_total) as avg_total, COUNT(*) as count
    FROM responses ${where}
    GROUP BY course_year
    ORDER BY course_year ASC
  `).all(...params);

  const byPeriod = db.prepare(`
    SELECT semester_period, AVG(score_total) as avg_total, COUNT(*) as count
    FROM responses ${where}
    GROUP BY semester_period
  `).all(...params);

  // Distribution
  const distribution = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN score_total <= 20 THEN 1 ELSE 0 END), 0) as low,
      COALESCE(SUM(CASE WHEN score_total > 20 AND score_total <= 40 THEN 1 ELSE 0 END), 0) as mild,
      COALESCE(SUM(CASE WHEN score_total > 40 AND score_total <= 60 THEN 1 ELSE 0 END), 0) as moderate,
      COALESCE(SUM(CASE WHEN score_total > 60 AND score_total <= 80 THEN 1 ELSE 0 END), 0) as high,
      COALESCE(SUM(CASE WHEN score_total > 80 THEN 1 ELSE 0 END), 0) as critical
    FROM responses ${where}
  `).get(...params);

  // Category averages
  const categories = db.prepare(`
    SELECT
      COALESCE(AVG(score_academic), 0) as academic,
      COALESCE(AVG(score_sleep), 0) as sleep,
      COALESCE(AVG(score_emotional), 0) as emotional,
      COALESCE(AVG(score_social), 0) as social
    FROM responses ${where}
  `).get(...params) as { academic: number; sleep: number; emotional: number; social: number };

  const mostAffectedDept = byDept[0] as { department: string } | undefined;

  res.json({
    total,
    average: avgRow.avg || 0,
    mostAffectedDepartment: mostAffectedDept?.department || null,
    distribution,
    byDepartment: byDept,
    byCourse,
    byPeriod,
    categories,
  });
});

// GET /api/stats/heatmap
router.get('/heatmap', (req: Request, res: Response) => {
  const db = getDb();
  const { year, period } = req.query;

  let where = "WHERE department IS NOT NULL AND department != ''";
  const params: (string | number)[] = [];
  if (year && year !== 'all') { where += ' AND course_year = ?'; params.push(Number(year)); }
  if (period && period !== 'all') { where += ' AND semester_period = ?'; params.push(String(period)); }

  const rows = db.prepare(`
    SELECT department,
      AVG(score_academic) as academic,
      AVG(score_sleep) as sleep,
      AVG(score_emotional) as emotional,
      AVG(score_social) as social,
      AVG(score_total) as total,
      COUNT(*) as count
    FROM responses ${where}
    GROUP BY department
    ORDER BY total DESC
  `).all(...params);

  res.json(rows);
});

export default router;
