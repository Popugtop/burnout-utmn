import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { SurveyResult } from '../types';
import BurnoutGauge from '../components/BurnoutGauge';
import ScoreBar from '../components/ScoreBar';

const TIPS_BY_SCORE: Record<string, string[]> = {
  academic: [
    'Try time-boxing with the Pomodoro technique (25 min work + 5 min break).',
    'Use the Eisenhower Matrix to prioritize tasks by urgency and importance.',
  ],
  sleep: [
    'Aim for 7-9 hours and keep a consistent sleep schedule, even on weekends.',
    'Avoid screens for 30-60 minutes before bed to allow melatonin to kick in.',
  ],
  emotional: [
    'Try journaling for 15 minutes a day to process stress and worries.',
    'Practice 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s.',
  ],
  social: [
    'Schedule social activities like classes — treat them as non-negotiable.',
    'Even 20 minutes of exercise a day significantly reduces anxiety and burnout.',
  ],
};

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi<SurveyResult>(`/api/survey/results/${id}`);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-text-muted animate-pulse font-mono">Loading results...</div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-heat-critical text-center">Results not found</div>
    </div>
  );

  const categories = [
    { key: 'academic', label: 'Academic Load', score: data.score_academic },
    { key: 'sleep', label: 'Sleep & Energy', score: data.score_sleep },
    { key: 'emotional', label: 'Emotional State', score: data.score_emotional },
    { key: 'social', label: 'Social & Lifestyle', score: data.score_social },
  ];

  const worst = [...categories].sort((a, b) => b.score - a.score).slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-4xl font-bold text-center mb-2">Your Burnout Score</h1>
        <p className="text-text-muted text-center mb-12 text-sm font-mono">Anonymous result ID: {id?.slice(0, 8)}</p>

        {/* Gauge */}
        <div className="card p-10 mb-8 flex justify-center">
          <BurnoutGauge score={Math.round(data.score_total)} size={240} />
        </div>

        {/* Category breakdown */}
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold mb-6">Score Breakdown</h2>
          {categories.map(cat => (
            <ScoreBar key={cat.key} label={cat.label} score={cat.score} />
          ))}
        </div>

        {/* Tips */}
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Personalized Tips</h2>
          <div className="space-y-4">
            {worst.flatMap(cat =>
              TIPS_BY_SCORE[cat.key]?.map((tip, i) => (
                <div key={`${cat.key}-${i}`} className="flex gap-3 p-4 bg-base-700 rounded-xl">
                  <span className="text-accent mt-0.5">→</span>
                  <p className="text-text-secondary text-sm leading-relaxed">{tip}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/dashboard" className="btn-primary text-center flex-1 py-4">
            View the Dashboard
          </Link>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); }}
            className="btn-secondary text-center flex-1 py-4"
          >
            Copy Link
          </button>
        </div>
      </motion.div>
    </div>
  );
}
