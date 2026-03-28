import AnimatedCounter from '../../AnimatedCounter';
import { CategoryStats } from '../../../types';

interface Props {
  stats: CategoryStats;
  previousMean?: number;
}

export default function StatsCards({ stats, previousMean }: Props) {
  const trend = previousMean !== undefined ? stats.total_mean - previousMean : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card p-5">
        <p className="text-text-muted text-xs mb-1">Total Responses</p>
        <p className="font-display text-3xl font-bold"><AnimatedCounter target={stats.count} /></p>
      </div>
      <div className="card p-5">
        <p className="text-text-muted text-xs mb-1">Avg Burnout Score</p>
        <div className="flex items-end gap-2">
          <p className="font-display text-3xl font-bold text-accent"><AnimatedCounter target={Math.round(stats.total_mean)} suffix="%" /></p>
          {trend !== null && (
            <span className={`text-sm mb-1 ${trend > 0 ? 'text-heat-critical' : 'text-heat-low'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(trend))}%
            </span>
          )}
        </div>
      </div>
      <div className="card p-5">
        <p className="text-text-muted text-xs mb-1">Critical Cases</p>
        <p className="font-display text-3xl font-bold text-heat-critical"><AnimatedCounter target={stats.distribution?.critical || 0} /></p>
        <p className="text-text-muted text-xs mt-1">Score &gt; 80</p>
      </div>
      <div className="card p-5">
        <p className="text-text-muted text-xs mb-1">Distribution</p>
        <div className="flex gap-0.5 mt-2 h-6">
          {[
            { key: 'low', color: '#34D5A0', val: stats.distribution?.low || 0 },
            { key: 'mild', color: '#2A5A6A', val: stats.distribution?.mild || 0 },
            { key: 'moderate', color: '#C47A30', val: stats.distribution?.moderate || 0 },
            { key: 'high', color: '#D55B34', val: stats.distribution?.high || 0 },
            { key: 'critical', color: '#E84430', val: stats.distribution?.critical || 0 },
          ].map(({ key, color, val }) => {
            const pct = stats.count > 0 ? (val / stats.count) * 100 : 0;
            return pct > 0 ? (
              <div key={key} style={{ width: `${pct}%`, backgroundColor: color }} className="rounded-sm" title={`${key}: ${val}`} />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
