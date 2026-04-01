import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { SurveyResult } from '../types';
import BurnoutGauge from '../components/BurnoutGauge';
import ScoreBar from '../components/ScoreBar';

interface Tip {
  id: string;
  category: string;
  title: string;
  body: string;
  source?: string | null;
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi<SurveyResult>(`/api/survey/results/${id}`);
  const { data: allTips } = useApi<Tip[]>('/api/content/tips');

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

  // 2 worst categories
  const worst = [...categories].sort((a, b) => b.score - a.score).slice(0, 2);

  // Pick up to 2 tips per worst category from DB
  const tips = worst.flatMap(cat =>
    (allTips ?? []).filter(t => t.category === cat.key).slice(0, 2)
  );

  const CATEGORY_LABELS: Record<string, string> = {
    academic: 'Academic Load',
    sleep: 'Sleep & Energy',
    emotional: 'Emotional State',
    social: 'Social & Lifestyle',
  };

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

        {/* Tips from DB */}
        {tips.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-semibold mb-1">Personalized Tips</h2>
            <p className="text-text-muted text-sm mb-5">
              Based on your highest scores in{' '}
              {worst.map(c => CATEGORY_LABELS[c.key]).join(' and ')}
            </p>
            <div className="space-y-4">
              {tips.map(tip => (
                <div key={tip.id} className="p-4 bg-base-700 rounded-xl">
                  <p className="text-text-primary text-sm font-semibold mb-1">{tip.title}</p>
                  <p className="text-text-secondary text-sm leading-relaxed">{tip.body}</p>
                  {tip.source && (
                    <p className="text-text-muted text-xs italic mt-2">{tip.source}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
