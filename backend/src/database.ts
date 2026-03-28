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
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details_json TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

  // Add new columns to responses table if they don't exist yet
  const alterColumns = [
    `ALTER TABLE responses ADD COLUMN ip_hash TEXT`,
    `ALTER TABLE responses ADD COLUMN fingerprint TEXT`,
    `ALTER TABLE responses ADD COLUMN is_suspicious INTEGER DEFAULT 0`,
    `ALTER TABLE responses ADD COLUMN completion_time_seconds INTEGER`,
  ];
  for (const sql of alterColumns) {
    try { database.exec(sql); } catch { /* column already exists */ }
  }

  // Tips table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      source TEXT,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS about_sections (
      id TEXT PRIMARY KEY,
      section_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      meta_json TEXT,
      order_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS about_sources (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      year INTEGER,
      title TEXT NOT NULL,
      publication TEXT,
      order_index INTEGER DEFAULT 0
    );
  `);

  const existingTips = database.prepare('SELECT COUNT(*) as cnt FROM tips').get() as { cnt: number };
  if (existingTips.cnt === 0) { seedTips(database); }

  const existingSections = database.prepare('SELECT COUNT(*) as cnt FROM about_sections').get() as { cnt: number };
  if (existingSections.cnt === 0) { seedAbout(database); }

  // Seed default survey if none exists
  const existing = database.prepare('SELECT COUNT(*) as cnt FROM surveys').get() as { cnt: number };
  if (existing.cnt === 0) {
    seedDefaultSurvey(database);
  }

  // Seed default admin if none exists
  const existingAdmins = database.prepare('SELECT COUNT(*) as cnt FROM admins').get() as { cnt: number };
  if (existingAdmins.cnt === 0) {
    seedDefaultAdmin(database);
  }
}

export function resetDb(): void {
  if (db) {
    try { db.close(); } catch {}
    db = undefined as unknown as Database.Database;
  }
}

function seedTips(database: Database.Database) {
  const insert = database.prepare(
    'INSERT INTO tips (id, category, title, body, source, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const tips = [
    ['t1','academic','Pomodoro Technique','Work in 25-minute focused sprints followed by a 5-minute break. After four sprints, take a longer 15-30 minute break. This prevents cognitive fatigue and maintains concentration.','Cirillo, F. (1992). The Pomodoro Technique.',1],
    ['t2','academic','Eisenhower Matrix','Categorize tasks by urgency and importance. Focus on important-but-not-urgent tasks — they prevent crises and build long-term success. Say no to tasks that are neither important nor urgent.','Covey, S. R. (1989). The 7 Habits of Highly Effective People.',2],
    ['t3','academic','Learn to Say No','Overcommitting is a leading cause of burnout. Practice politely declining extra assignments, clubs, or social invitations that exceed your current capacity.',null,3],
    ['t4','sleep','Sleep Hygiene Basics','Keep a consistent sleep schedule — even on weekends. Avoid caffeine after 2 PM. Keep your bedroom cool and dark. These habits can improve sleep quality by up to 30%.','Walker, M. (2017). Why We Sleep. Scribner.',4],
    ['t5','sleep','Screens Before Bed','Blue light from screens suppresses melatonin production by up to 50%. Stop using devices 30-60 minutes before bed, or use night mode / blue-light glasses.','Chang, A. M. et al. (2015). PNAS, 112(4), 1232-1237.',5],
    ['t6','sleep','Strategic Napping','A 10-20 minute nap in the early afternoon can restore alertness and improve performance. Avoid naps longer than 30 minutes or after 3 PM to protect nighttime sleep.','Mednick, S. C. et al. (2003). Nature Neuroscience.',6],
    ['t7','emotional','Journaling for Stress Relief',"Writing about stressful events for 15-20 minutes per day reduces rumination and helps process emotions. It doesn't need structure — just let thoughts flow onto paper.",'Pennebaker, J. W. (1997). Journal of Clinical Psychology.',7],
    ['t8','emotional','4-7-8 Breathing','Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This activates the parasympathetic nervous system, reducing anxiety within minutes. Repeat 3-4 cycles.','Weil, A. (2015). Spontaneous Happiness. Little, Brown.',8],
    ['t9','emotional','When to Seek Help','If burnout symptoms persist for more than two weeks — fatigue, apathy, anxiety, difficulty concentrating — consider speaking to a counselor or therapist. Seeking help is a sign of strength.',null,9],
    ['t10','social','Schedule Social Time','Treat social activities like mandatory classes — put them in your calendar. Regular positive social interactions are one of the strongest predictors of wellbeing and academic resilience.','Holt-Lunstad, J. et al. (2015). Perspectives on Psychological Science.',10],
    ['t11','social','Exercise as a Reset',"Just 20-30 minutes of moderate aerobic exercise releases BDNF and endorphins, improving mood, focus, and stress resilience. It's more effective than many pharmaceutical interventions for mild anxiety.",'Ratey, J. J. (2008). Spark. Little, Brown.',11],
    ['t12','social','Digital Detox','Designate one hour per day as phone-free. Social media creates social comparison that amplifies burnout. Reducing passive scrolling is associated with significant improvements in mood.','Hunt, M. G. et al. (2018). Journal of Social and Clinical Psychology.',12],
  ];
  for (const t of tips) insert.run(...t);
}

function seedAbout(database: Database.Database) {
  const insertSection = database.prepare(
    'INSERT INTO about_sections (id, section_key, title, body, meta_json, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertSource = database.prepare(
    'INSERT INTO about_sources (id, author, year, title, publication, order_index) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertSection.run(uuidv4(), 'page_meta', 'About', JSON.stringify({ subtitle: 'Research project at Tyumen State University' }), null, 0);

  insertSection.run(uuidv4(), 'project', 'About the Project',
    'Burnout Map is an anonymous student wellbeing research initiative at UTMN. Our goal is to visualize the distribution and patterns of academic burnout across different institutes, year groups, and semester periods — and to give each student a personalized understanding of their own burnout risk.\n\nAll data is collected anonymously. No personally identifiable information is stored. Survey responses are aggregated and displayed only as statistical summaries.',
    null, 1
  );

  insertSection.run(uuidv4(), 'methodology', 'Methodology',
    'The Burnout Score is calculated from 12 questions across four dimensions: Academic Load, Sleep & Energy, Emotional State, and Social & Lifestyle. Each answer is normalized to a 0-100 scale (0 = no burnout, 100 = maximum burnout). Category scores are averaged to produce the total score.',
    JSON.stringify({
      dimensions: [
        { label: 'Academic Load', desc: 'Workload, perceived reward, overwhelm' },
        { label: 'Sleep & Energy', desc: 'Sleep duration, fatigue, academic worry at night' },
        { label: 'Emotional State', desc: 'Emotional exhaustion, cynicism, anxiety' },
        { label: 'Social & Lifestyle', desc: 'Social sacrifice, hobbies, overall wellbeing' },
      ]
    }),
    2
  );

  const sources = [
    ['Maslach, C., & Leiter, M. P.', 1997, 'The Truth About Burnout', 'Jossey-Bass.'],
    ['Walker, M.', 2017, 'Why We Sleep', 'Scribner.'],
    ['Ratey, J. J.', 2008, 'Spark: The Revolutionary New Science of Exercise and the Brain', 'Little, Brown.'],
    ['Holt-Lunstad, J. et al.', 2015, 'Loneliness and Social Isolation as Risk Factors for Mortality', 'Perspectives on Psychological Science, 10(2), 227-237.'],
    ['Chang, A. M. et al.', 2015, 'Evening use of light-emitting eReaders negatively affects sleep', 'PNAS, 112(4), 1232-1237.'],
    ['Pennebaker, J. W.', 1997, 'Writing about emotional experiences as a therapeutic process', 'Psychological Science, 8(3), 162-166.'],
    ['Hunt, M. G. et al.', 2018, 'No More FOMO: Limiting Social Media Decreases Loneliness and Depression', 'Journal of Social and Clinical Psychology, 37(10).'],
  ];
  sources.forEach((s, i) => insertSource.run(uuidv4(), s[0], s[1], s[2], s[3], i + 1));
}

function seedDefaultAdmin(database: Database.Database) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcrypt');
  const username = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'changeme';
  const passwordHash = bcrypt.hashSync(password, 12);
  const id = uuidv4();
  database.prepare(
    'INSERT INTO admins (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)'
  ).run(id, username, passwordHash, 'Administrator');
  console.log('⚠️  Default admin created. Change password immediately!');
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
