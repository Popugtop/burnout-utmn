import { CategoryStats } from '../../../types';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props { stats: CategoryStats; }

function scoreColor(score: number) {
  if (score <= 20) return '#34D5A0';
  if (score <= 40) return '#2A5A6A';
  if (score <= 60) return '#C47A30';
  if (score <= 80) return '#D55B34';
  return '#E84430';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono" style={{ color: scoreColor(score) }}>{Math.round(score)}%</span>
      </div>
      <div className="bg-base-700 rounded-full h-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
      </div>
    </div>
  );
}

export default function CategoryBreakdown({ stats }: Props) {
  const radarData = [
    { subject: 'Academic', score: Math.round(stats.academic_mean) },
    { subject: 'Sleep', score: Math.round(stats.sleep_mean) },
    { subject: 'Emotional', score: Math.round(stats.emotional_mean) },
    { subject: 'Social', score: Math.round(stats.social_mean) },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold mb-5">Category Scores</h3>
        <div className="space-y-4">
          <ScoreBar label="Academic Load" score={stats.academic_mean} />
          <ScoreBar label="Sleep & Energy" score={stats.sleep_mean} />
          <ScoreBar label="Emotional State" score={stats.emotional_mean} />
          <ScoreBar label="Social & Lifestyle" score={stats.social_mean} />
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold mb-2">Burnout Profile</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#222940" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8892A8', fontSize: 12 }} />
            <Radar dataKey="score" stroke="#D55B34" fill="#D55B34" fillOpacity={0.25} />
            <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
