import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/burnout.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS survey_questions (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      scale_label_low TEXT,
      scale_label_high TEXT,
      choices_json TEXT,
      is_inverted INTEGER DEFAULT 0,
      scoring_map_json TEXT,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      course_year INTEGER,
      department TEXT,
      semester_period TEXT,
      score_academic REAL,
      score_sleep REAL,
      score_emotional REAL,
      score_social REAL,
      score_total REAL,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    );

    CREATE TABLE IF NOT EXISTS response_answers (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_value TEXT NOT NULL,
      normalized_score REAL NOT NULL,
      FOREIGN KEY (response_id) REFERENCES responses(id),
      FOREIGN KEY (question_id) REFERENCES survey_questions(id)
    );
  `);

  // Seed default survey if none exists
  const existing = database.prepare('SELECT COUNT(*) as cnt FROM surveys').get() as { cnt: number };
  if (existing.cnt === 0) {
    seedDefaultSurvey(database);
  }
}

function seedDefaultSurvey(database: Database.Database) {
  const surveyId = uuidv4();
  database.prepare(`
    INSERT INTO surveys (id, title, description, is_active)
    VALUES (?, ?, ?, 1)
  `).run(surveyId, 'Burnout Survey Spring 2026', 'Anonymous burnout research across UTMN. Your responses help us understand and improve student wellbeing.');

  const questions = [
    // Academic Load
    { category: 'academic', text: 'How often do you feel overwhelmed by academic tasks?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    { category: 'academic', text: 'How many hours per day do you spend on studying outside of classes?', type: 'choice', choices: ['<1h','1-3h','3-5h','5-7h','7+h'], scoring: {'<1h':0,'1-3h':25,'3-5h':50,'5-7h':75,'7+h':100}, inverted: 0 },
    { category: 'academic', text: 'Do you feel that your efforts in studying are adequately rewarded?', type: 'scale_1_5', low: 'Strongly Disagree', high: 'Strongly Agree', inverted: 1 },
    // Sleep & Energy
    { category: 'sleep', text: 'How many hours of sleep do you get on average?', type: 'choice', choices: ['<4h','4-5h','5-6h','6-7h','7-8h','8+h'], scoring: {'<4h':100,'4-5h':80,'5-6h':60,'6-7h':30,'7-8h':10,'8+h':0}, inverted: 0 },
    { category: 'sleep', text: 'How often do you feel physically exhausted during the day?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    { category: 'sleep', text: 'Do you have trouble falling asleep because of academic worries?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    // Emotional State
    { category: 'emotional', text: 'How often do you feel emotionally drained after a study day?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    { category: 'emotional', text: 'Do you feel detached or cynical about your studies?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    { category: 'emotional', text: 'How often do you experience anxiety about upcoming deadlines or exams?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    // Social & Lifestyle
    { category: 'social', text: 'How often do you sacrifice social activities for studying?', type: 'scale_1_5', low: 'Never', high: 'Always', inverted: 0 },
    { category: 'social', text: 'Do you feel you have enough time for hobbies and personal interests?', type: 'scale_1_5', low: 'Strongly Disagree', high: 'Strongly Agree', inverted: 1 },
    { category: 'social', text: 'How would you rate your overall well-being this semester?', type: 'scale_1_5', low: 'Very Poor', high: 'Excellent', inverted: 1 },
  ];

  const insertQ = database.prepare(`
    INSERT INTO survey_questions
      (id, survey_id, order_index, category, question_text, question_type,
       scale_label_low, scale_label_high, choices_json, is_inverted, scoring_map_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  questions.forEach((q, i) => {
    insertQ.run(
      uuidv4(), surveyId, i + 1, q.category, q.text, q.type,
      q.low || null, q.high || null,
      'choices' in q ? JSON.stringify(q.choices) : null,
      q.inverted,
      'scoring' in q ? JSON.stringify(q.scoring) : null
    );
  });
}
