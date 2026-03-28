import { Router, Request, Response } from 'express';
import { getDb } from '../database';
import { normalizeScore, computeCategoryScores } from '../utils/scoring';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/survey/active
router.get('/active', (req: Request, res: Response) => {
  const db = getDb();
  const survey = db.prepare('SELECT * FROM surveys WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get();
  if (!survey) {
    res.status(404).json({ error: 'No active survey' });
    return;
  }
  const s = survey as { id: string; title: string; description: string };
  const questions = db.prepare(
    'SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_index ASC'
  ).all(s.id);
  res.json({ survey, questions });
});

// POST /api/survey/submit
router.post('/submit', (req: Request, res: Response) => {
  const db = getDb();
  const { survey_id, course_year, department, answers } = req.body as {
    survey_id: string;
    course_year: number;
    department: string;
    answers: Array<{ question_id: string; value: string }>;
  };

  if (!survey_id || !answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const survey = db.prepare('SELECT id FROM surveys WHERE id = ?').get(survey_id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }

  const responseId = uuidv4();
  const enrichedAnswers: Array<{ category: string; normalized_score: number }> = [];

  const insertAnswer = db.prepare(`
    INSERT INTO response_answers (id, response_id, question_id, answer_value, normalized_score)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertResponse = db.prepare(`
    INSERT INTO responses (id, survey_id, course_year, department,
      score_academic, score_sleep, score_emotional, score_social, score_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Pre-compute scores before the transaction so we can insert response first
  const getQuestion = db.prepare('SELECT * FROM survey_questions WHERE id = ?');
  for (const answer of answers) {
    const question = getQuestion.get(answer.question_id) as {
      id: string; category: string; question_type: string; is_inverted: number; scoring_map_json: string | null;
    } | undefined;
    if (!question) continue;
    enrichedAnswers.push({ category: question.category, normalized_score: normalizeScore(question, answer.value) });
  }
  const scores = computeCategoryScores(enrichedAnswers);

  const transaction = db.transaction(() => {
    // Insert response FIRST so response_answers FK (response_id) is satisfied
    insertResponse.run(
      responseId, survey_id, course_year, department,
      scores.academic, scores.sleep, scores.emotional, scores.social, scores.total
    );
    for (const answer of answers) {
      const question = getQuestion.get(answer.question_id) as {
        id: string; category: string; question_type: string; is_inverted: number; scoring_map_json: string | null;
      } | undefined;
      if (!question) continue;
      insertAnswer.run(uuidv4(), responseId, answer.question_id, answer.value, normalizeScore(question, answer.value));
    }
  });

  transaction();
  res.json({ id: responseId, scores });
});

// GET /api/survey/results/:id
router.get('/results/:id', (req: Request, res: Response) => {
  const db = getDb();
  const response = db.prepare('SELECT * FROM responses WHERE id = ?').get(req.params.id);
  if (!response) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(response);
});

export default router;
