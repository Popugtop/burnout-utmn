import { CrossAnalysisRow } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: CrossAnalysisRow[];
  groupBy: 'course' | 'department';
  onGroupByChange: (g: 'course' | 'department') => void;
}

function heatColor(score: number) {
  if (score <= 20) return 'bg-green-900/40 text-green-300';
  if (score <= 40) return 'bg-teal-900/40 text-teal-300';
  if (score <= 60) return 'bg-yellow-900/40 text-yellow-300';
  if (score <= 80) return 'bg-orange-900/40 text-orange-300';
  return 'bg-red-900/40 text-red-300';
}

export default function CrossAnalysis({ data, groupBy, onGroupByChange }: Props) {
  const chartData = data.map(row => ({
    name: groupBy === 'course' ? `Year ${row.group_value}` : String(row.group_value).split(' ').slice(-1)[0],
    Academic: Math.round(row.academic_mean),
    Sleep: Math.round(row.sleep_mean),
    Emotional: Math.round(row.emotional_mean),
    Social: Math.round(row.social_mean),
  }));

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold">Cross Analysis</h3>
        <div className="flex gap-1">
          {(['course', 'department'] as const).map(g => (
            <button key={g} onClick={() => onGroupByChange(g)}
              className={`px-3 py-1 rounded text-xs capitalize transition-colors ${groupBy === g ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}>
              By {g}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222940" />
          <XAxis dataKey="name" tick={{ fill: '#8892A8', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#8892A8', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8892A8' }} />
          <Bar dataKey="Academic" fill="#D55B34" radius={[3,3,0,0]} />
          <Bar dataKey="Sleep" fill="#2A5A6A" radius={[3,3,0,0]} />
          <Bar dataKey="Emotional" fill="#C47A30" radius={[3,3,0,0]} />
          <Bar dataKey="Social" fill="#34D5A0" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-base-600">
              <th className="text-left text-text-muted pb-2 pr-4">Group</th>
              <th className="text-right text-text-muted pb-2 pr-4">Academic</th>
              <th className="text-right text-text-muted pb-2 pr-4">Sleep</th>
              <th className="text-right text-text-muted pb-2 pr-4">Emotional</th>
              <th className="text-right text-text-muted pb-2 pr-4">Social</th>
              <th className="text-right text-text-muted pb-2 pr-4">Total</th>
              <th className="text-right text-text-muted pb-2">n</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-base-700/40">
                <td className="py-2 pr-4 text-text-secondary">{groupBy === 'course' ? `Year ${row.group_value}` : row.group_value}</td>
                {[row.academic_mean, row.sleep_mean, row.emotional_mean, row.social_mean, row.total_mean].map((s, j) => (
                  <td key={j} className={`py-2 pr-4 text-right font-mono font-medium rounded ${heatColor(s)}`}>{Math.round(s)}</td>
                ))}
                <td className="py-2 text-right text-text-muted">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
