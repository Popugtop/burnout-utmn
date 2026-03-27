import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { StatsResponse, HeatmapRow } from '../types';
import HeatmapGrid from '../components/HeatmapGrid';
import StatCard from '../components/StatCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollReveal from '../components/ScrollReveal';
import { DEPARTMENTS } from '../data/departments';

const PERIODS = ['Beginning of semester', 'Mid-semester', 'Exam period', 'Between semesters'];

function buildUrl(base: string, params: Record<string, string>) {
  const q = Object.entries(params).filter(([, v]) => v && v !== 'all').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return q ? `${base}?${q}` : base;
}

const PIE_COLORS = ['#34D5A0', '#2A5A6A', '#C47A30', '#D55B34', '#E84430'];

export default function Dashboard() {
  const [filters, setFilters] = useState({ year: 'all', department: 'all', period: 'all' });

  const statsUrl = buildUrl('/api/stats', filters);
  const heatmapUrl = buildUrl('/api/stats/heatmap', { year: filters.year, period: filters.period });

  const { data: stats, loading, error } = useApi<StatsResponse>(statsUrl);
  const { data: heatmap } = useApi<HeatmapRow[]>(heatmapUrl);

  const setFilter = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }));

  const pieData = stats ? [
    { name: 'Low', value: stats.distribution.low },
    { name: 'Mild', value: stats.distribution.mild },
    { name: 'Moderate', value: stats.distribution.moderate },
    { name: 'High', value: stats.distribution.high },
    { name: 'Critical', value: stats.distribution.critical },
  ] : [];

  const radarData = stats ? [
    { subject: 'Academic', score: Math.round(stats.categories.academic) },
    { subject: 'Sleep', score: Math.round(stats.categories.sleep) },
    { subject: 'Emotional', score: Math.round(stats.categories.emotional) },
    { subject: 'Social', score: Math.round(stats.categories.social) },
  ] : [];

  const barData = stats?.byCourse.map(r => ({
    course: `Year ${r.course_year}`,
    score: Math.round(r.avg_total),
    count: r.count,
  })) || [];

  const lineData = stats?.byPeriod.map(r => ({
    period: r.semester_period.split(' ').slice(0, 2).join(' '),
    score: Math.round(r.avg_total),
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-5xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary mb-10">Aggregated burnout data across UTMN</p>

        {/* Filters */}
        <div className="card p-4 mb-8 flex flex-wrap gap-4 items-center">
          <span className="text-text-muted text-sm">Filter by:</span>

          <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className="input w-auto text-sm">
            <option value="all">All years</option>
            {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>

          <select value={filters.department} onChange={e => setFilter('department', e.target.value)} className="input w-auto text-sm max-w-xs">
            <option value="all">All departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={filters.period} onChange={e => setFilter('period', e.target.value)} className="input w-auto text-sm">
            <option value="all">All periods</option>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {Object.values(filters).some(v => v !== 'all') && (
            <button onClick={() => setFilters({ year: 'all', department: 'all', period: 'all' })}
              className="text-accent text-sm hover:underline">Clear filters</button>
          )}
        </div>

        {loading && <div className="text-text-muted font-mono animate-pulse mb-8">Loading data...</div>}
        {error && !loading && (
          <div className="card p-6 mb-8 border-heat-critical/30">
            <p className="text-heat-critical font-medium mb-1">Failed to load stats</p>
            <p className="text-text-muted text-sm font-mono">{error}</p>
            <p className="text-text-muted text-sm mt-2">Make sure the backend is running on port 3000.</p>
          </div>
        )}

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Total Responses"
              value={<AnimatedCounter target={stats.total} />}
            />
            <StatCard
              label="Avg Burnout Score"
              value={<><AnimatedCounter target={Math.round(stats.average)} suffix="%" /></>}
              accent
            />
            <StatCard
              label="Most Affected Dept"
              value={<span className="text-xl">{stats.mostAffectedDepartment?.split(' ').slice(-1)[0] || '—'}</span>}
            />
            <StatCard
              label="Critical Cases"
              value={<AnimatedCounter target={stats.distribution.critical} />}
              sub="Score > 80"
            />
          </div>
        )}

        {/* Heatmap */}
        {heatmap && heatmap.length > 0 && (
          <ScrollReveal>
            <div className="card p-6 mb-8">
              <h2 className="font-display text-2xl font-semibold mb-6">Burnout Heatmap by Department</h2>
              <HeatmapGrid data={heatmap} />
            </div>
          </ScrollReveal>
        )}

        {stats && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Bar: by course year */}
            <ScrollReveal>
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold mb-6">Average Score by Year</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222940" />
                    <XAxis dataKey="course" tick={{ fill: '#8892A8', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8892A8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
                    <Bar dataKey="score" fill="#D55B34" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            {/* Radar: category profile */}
            <ScrollReveal delay={0.1}>
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold mb-6">Burnout Profile</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#222940" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#8892A8', fontSize: 12 }} />
                    <Radar dataKey="score" stroke="#D55B34" fill="#D55B34" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            {/* Pie: distribution */}
            <ScrollReveal delay={0.1}>
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold mb-6">Burnout Level Distribution</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} itemStyle={{ color: '#E8ECF4' }} labelStyle={{ color: '#E8ECF4' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            {/* Line: by period */}
            <ScrollReveal delay={0.2}>
              <div className="card p-6">
                <h2 className="font-display text-xl font-semibold mb-6">Score by Semester Period</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222940" />
                    <XAxis dataKey="period" tick={{ fill: '#8892A8', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8892A8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
                    <Line type="monotone" dataKey="score" stroke="#D55B34" strokeWidth={2} dot={{ fill: '#D55B34', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>
          </div>
        )}

        {stats && stats.total === 0 && (
          <div className="text-center py-20 text-text-muted">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-display text-xl mb-2">No data yet</p>
            <p className="text-sm">Be the first to take the survey!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
