import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApi, apiPost } from '../hooks/useApi';
import { SurveyQuestion, SurveyAnswer } from '../types';
import SurveyQuestionUI from '../components/SurveyQuestion';
import { DEPARTMENTS } from '../data/departments';

interface ActiveSurvey {
  survey: { id: string; title: string; description: string };
  questions: SurveyQuestion[];
}

const YEARS = ['1st', '2nd', '3rd', '4th', '5+'];

function LangToggle({ lang, onChange }: { lang: 'en' | 'ru'; onChange: (l: 'en' | 'ru') => void }) {
  return (
    <div className="flex items-center gap-1 bg-base-800 border border-base-600 rounded-lg p-0.5">
      {(['en', 'ru'] as const).map(l => (
        <button key={l} onClick={() => onChange(l)}
          className={`px-3 py-1 rounded text-sm font-medium uppercase tracking-wide transition-colors
            ${lang === l ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Survey() {
  const { data, loading, error } = useApi<ActiveSurvey>('/api/survey/active');
  const navigate = useNavigate();

  const [step, setStep] = useState<'meta' | 'questions' | 'submitting'>('meta');
  const [meta, setMeta] = useState({ course_year: '', department: '' });
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<'en' | 'ru'>('en');

  const metaValid = meta.course_year && meta.department;

  // Check if any question has Russian translation
  const hasRu = data?.questions.some(q => q.question_text_ru) ?? false;

  async function submit() {
    if (!data) return;
    setStep('submitting');
    try {
      const payload: SurveyAnswer[] = data.questions.map(q => ({
        question_id: q.id,
        value: answers[q.id] || '',
      }));
      const result = await apiPost<{ id: string }>('/api/survey/submit', {
        survey_id: data.survey.id,
        course_year: YEARS.indexOf(meta.course_year) + 1,
        department: meta.department,
        answers: payload,
      });
      navigate(`/results/${result.id}`);
    } catch {
      setStep('questions');
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-text-muted animate-pulse font-mono">Loading survey...</div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-heat-critical text-center">
        <p className="text-xl mb-2">Could not load survey</p>
        <p className="text-text-muted text-sm">Make sure the backend is running</p>
      </div>
    </div>
  );

  const questions = data.questions;
  const currentQ = questions[qIndex];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Lang toggle — shown when Russian translations exist */}
        {hasRu && (
          <div className="flex justify-end mb-6">
            <LangToggle lang={lang} onChange={setLang} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'meta' && (
            <motion.div key="meta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h1 className="font-display text-3xl font-bold mb-2">{data.survey.title}</h1>
              <p className="text-text-secondary mb-8">{data.survey.description}</p>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {lang === 'ru' ? 'На каком курсе вы учитесь?' : 'What year are you in?'}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {YEARS.map(y => (
                      <button key={y} onClick={() => setMeta(m => ({ ...m, course_year: y }))}
                        className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
                          ${meta.course_year === y ? 'border-accent bg-accent-light text-text-primary' : 'border-base-600 text-text-secondary hover:border-accent/50'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    {lang === 'ru' ? 'Институт / Подразделение' : 'Department / Institute'}
                  </label>
                  <select value={meta.department} onChange={e => setMeta(m => ({ ...m, department: e.target.value }))}
                    className="input">
                    <option value="">{lang === 'ru' ? 'Выберите институт...' : 'Select department...'}</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={() => setStep('questions')} disabled={!metaValid} className="btn-primary w-full py-4 text-lg disabled:opacity-40">
                {lang === 'ru' ? 'Начать опрос' : 'Start Survey'}
              </button>
            </motion.div>
          )}

          {step === 'questions' && currentQ && (
            <SurveyQuestionUI
              key={qIndex}
              question={currentQ}
              current={qIndex + 1}
              total={questions.length}
              value={answers[currentQ.id] || ''}
              lang={lang}
              onChange={val => setAnswers(a => ({ ...a, [currentQ.id]: val }))}
              onNext={() => {
                if (qIndex < questions.length - 1) setQIndex(i => i + 1);
                else submit();
              }}
              onPrev={() => {
                if (qIndex === 0) setStep('meta');
                else setQIndex(i => i - 1);
              }}
            />
          )}

          {step === 'submitting' && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <p className="text-text-secondary font-mono">
                {lang === 'ru' ? 'Обрабатываем ответы...' : 'Processing your responses...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
