import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';
import { AnalyticsFilters, CategoryStats, QuestionSummaryItem, CrossAnalysisRow, TimelinePoint, DemographicsData, AdminResponse, ResponseDetail } from '../../../types';
import AnalyticsFiltersPanel from './AnalyticsFilters';
import StatsCards from './StatsCards';
import QuestionSummaryCard from './QuestionSummaryCard';
import CategoryBreakdown from './CategoryBreakdown';
import CrossAnalysis from './CrossAnalysis';
import DemographicsCharts from './DemographicsCharts';
import TimelineChart from './TimelineChart';
import ResponseDetailModal from './ResponseDetailModal';

const DEFAULT_FILTERS: AnalyticsFilters = {
  date_from: '', date_to: '', course_years: '', departments: '', exclude_suspicious: true,
};

function filtersToQuery(f: AnalyticsFilters): string {
  const p: string[] = [];
  if (f.date_from) p.push(`date_from=${f.date_from}`);
  if (f.date_to) p.push(`date_to=${f.date_to}`);
  if (f.course_years) p.push(`course_years=${encodeURIComponent(f.course_years)}`);
  if (f.departments) p.push(`departments=${encodeURIComponent(f.departments)}`);
  if (f.exclude_suspicious) p.push('exclude_suspicious=true');
  return p.join('&');
}

type AnalyticsSection = 'summary' | 'categories' | 'cross' | 'timeline' | 'demographics' | 'responses';

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [section, setSection] = useState<AnalyticsSection>('summary');
  const [crossGroupBy, setCrossGroupBy] = useState<'course' | 'department'>('course');

  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [summary, setSummary] = useState<QuestionSummaryItem[] | null>(null);
  const [cross, setCross] = useState<CrossAnalysisRow[] | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[] | null>(null);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [responsesData, setResponsesData] = useState<{ data: AdminResponse[]; total: number } | null>(null);
  const [responsePage, setResponsePage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const q = filtersToQuery(filters);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<CategoryStats>(`/api/admin/analytics/categories?${q}`);
      setStats(data);
    } catch {}
  }, [q]);

  const loadSection = useCallback(async () => {
    setLoading(true);
    try {
      if (section === 'summary' && !summary) {
        const data = await adminFetch<QuestionSummaryItem[]>(`/api/admin/analytics/summary?${q}`);
        setSummary(data);
      } else if (section === 'cross') {
        const data = await adminFetch<CrossAnalysisRow[]>(`/api/admin/analytics/cross?group_by=${crossGroupBy}&${q}`);
        setCross(data);
      } else if (section === 'timeline') {
        const data = await adminFetch<TimelinePoint[]>(`/api/admin/analytics/timeline?${q}`);
        setTimeline(data);
      } else if (section === 'demographics') {
        const data = await adminFetch<DemographicsData>(`/api/admin/analytics/demographics?${q}`);
        setDemographics(data);
      } else if (section === 'responses') {
        const data = await adminFetch<{ data: AdminResponse[]; total: number }>(
          `/api/admin/analytics/responses?${q}&page=${responsePage}&per_page=25&sort_by=${sortBy}&sort_order=${sortOrder}`
        );
        setResponsesData(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [section, q, crossGroupBy, responsePage, sortBy, sortOrder, summary]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setSummary(null); }, [q]);
  useEffect(() => { loadSection(); }, [loadSection]);

  async function loadDetail(id: string) {
    try {
      const data = await adminFetch<ResponseDetail>(`/api/admin/analytics/responses/${id}`);
      setDetail(data);
    } catch {}
  }

  async function deleteResponse(id: string) {
    if (!confirm('Delete this response?')) return;
    await adminFetch(`/api/admin/responses/${id}`, { method: 'DELETE' });
    setResponsesData(prev => prev ? { ...prev, data: prev.data.filter(r => r.id !== id), total: prev.total - 1 } : null);
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('desc'); }
  }

  function exportCsv(format: 'raw' | 'summary') {
    const token = sessionStorage.getItem('burnout_admin_token');
    const a = document.createElement('a');
    fetch(`/api/admin/analytics/export/csv?${q}&format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async res => {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `burnout-${format}.csv`;
      a.click();
    }).catch(() => {});
  }

  const scoreColor = (s: number) => s <= 20 ? '#34D5A0' : s <= 40 ? '#2A5A6A' : s <= 60 ? '#C47A30' : s <= 80 ? '#D55B34' : '#E84430';
  const SECTIONS: { key: AnalyticsSection; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'categories', label: 'Categories' },
    { key: 'cross', label: 'Cross Analysis' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'demographics', label: 'Demographics' },
    { key: 'responses', label: 'Responses' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => exportCsv('raw')} className="btn-secondary text-xs py-1.5 px-3">Export Raw CSV</button>
          <button onClick={() => exportCsv('summary')} className="btn-secondary text-xs py-1.5 px-3">Export Summary</button>
        </div>
      </div>

      <AnalyticsFiltersPanel filters={filters} onChange={f => { setFilters(f); setSummary(null); }} />

      {stats && <StatsCards stats={stats} />}

      <div className="flex gap-1 flex-wrap mb-2">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${section === s.key ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-text-muted text-sm animate-pulse">Loading...</div>}

      {section === 'summary' && summary && (
        <div className="grid lg:grid-cols-2 gap-4">
          {summary.map(q => <QuestionSummaryCard key={q.question_id} question={q} />)}
        </div>
      )}

      {section === 'categories' && stats && <CategoryBreakdown stats={stats} />}

      {section === 'cross' && cross && (
        <CrossAnalysis data={cross} groupBy={crossGroupBy} onGroupByChange={(g) => { setCrossGroupBy(g); setCross(null); }} />
      )}

      {section === 'timeline' && timeline && <TimelineChart data={timeline} />}

      {section === 'demographics' && demographics && <DemographicsCharts data={demographics} />}

      {section === 'responses' && responsesData && (
        <div className="card p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-base-600">
                  {[
                    { key: 'created_at', label: 'Date' },
                    { key: 'course_year', label: 'Year' },
                    { key: null, label: 'Department' },
                    { key: 'score_total', label: 'Total' },
                    { key: 'score_academic', label: 'Academic' },
                    { key: 'score_sleep', label: 'Sleep' },
                    { key: 'score_emotional', label: 'Emotional' },
                    { key: 'score_social', label: 'Social' },
                    { key: null, label: 'Time' },
                    { key: null, label: '' },
                  ].map(({ key, label }) => (
                    <th key={label} onClick={() => key && handleSort(key)}
                      className={`text-left text-text-muted text-xs pb-3 pr-3 font-normal ${key ? 'cursor-pointer hover:text-text-primary' : ''}`}>
                      {label}{key && sortBy === key ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responsesData.data.map(row => (
                  <tr key={row.id} className={`border-b border-base-700/40 hover:bg-base-800/30 ${row.is_suspicious ? 'opacity-60' : ''}`}>
                    <td className="py-2.5 pr-3 text-text-muted text-xs font-mono">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{row.course_year}</td>
                    <td className="py-2.5 pr-3 text-text-secondary truncate max-w-[100px]" title={row.department}>{row.department?.split(' ').slice(-1)[0]}</td>
                    <td className="py-2.5 pr-3 font-mono font-bold" style={{ color: scoreColor(row.score_total) }}>{Math.round(row.score_total)}%</td>
                    {[row.score_academic, row.score_sleep, row.score_emotional, row.score_social].map((s, i) => (
                      <td key={i} className="py-2.5 pr-3 font-mono text-xs text-text-muted">{Math.round(s)}%</td>
                    ))}
                    <td className="py-2.5 pr-3 text-text-muted text-xs">
                      {row.completion_time_seconds ? `${row.completion_time_seconds}s` : '—'}
                      {row.is_suspicious ? ' ⚠️' : ''}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => loadDetail(row.id)} className="text-accent text-xs hover:underline">View</button>
                        <button onClick={() => deleteResponse(row.id)} className="text-heat-critical/60 hover:text-heat-critical text-xs">×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {responsesData.total > 25 && (
            <div className="flex gap-3 justify-center pt-4">
              <button onClick={() => setResponsePage(p => Math.max(1, p-1))} disabled={responsePage === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Prev</button>
              <span className="text-text-muted text-sm py-2">Page {responsePage} of {Math.ceil(responsesData.total / 25)}</span>
              <button onClick={() => setResponsePage(p => p+1)} disabled={responsePage >= Math.ceil(responsesData.total / 25)} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}

      {section === 'responses' && responsesData?.total === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">No responses match the current filters</div>
      )}

      <ResponseDetailModal detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
