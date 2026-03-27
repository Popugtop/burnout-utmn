import { useState, useEffect } from 'react';
import { adminFetch } from '../../hooks/useAdmin';
import { SurveyResult } from '../../types';

interface ResponsesData {
  total: number;
  rows: SurveyResult[];
}

function scoreColor(score: number): string {
  if (score <= 20) return '#34D5A0';
  if (score <= 40) return '#2A5A6A';
  if (score <= 60) return '#C47A30';
  if (score <= 80) return '#D55B34';
  return '#E84430';
}

export default function ResponsesTable() {
  const [data, setData] = useState<ResponsesData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p = page) {
    setLoading(true);
    try {
      const d = await adminFetch<ResponsesData>(`/api/admin/responses?page=${p}&limit=50`);
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  async function exportCsv() {
    const token = sessionStorage.getItem('burnout_admin_token');
    window.open(`/api/admin/responses/export?_token=${token}`, '_blank');
    // Actually need auth header — use fetch
    const res = await fetch('/api/admin/responses/export', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'responses.csv'; a.click();
  }

  async function deleteRow(id: string) {
    if (!confirm('Delete this response?')) return;
    await adminFetch(`/api/admin/responses/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-semibold">
          Responses {data ? <span className="text-text-muted text-lg">({data.total})</span> : null}
        </h2>
        <button onClick={exportCsv} className="btn-secondary text-sm py-2 px-5">Export CSV</button>
      </div>

      {loading && <div className="text-text-muted animate-pulse text-sm">Loading...</div>}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-base-600">
                {['Date', 'Year', 'Department', 'Total', 'Academic', 'Sleep', 'Emotional', 'Social', ''].map(h => (
                  <th key={h} className="text-left text-text-muted text-xs pb-3 pr-4 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.id} className="border-b border-base-700/50 hover:bg-base-800/50">
                  <td className="py-3 pr-4 text-text-muted text-xs font-mono">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="py-3 pr-4 text-text-secondary">{row.course_year}</td>
                  <td className="py-3 pr-4 text-text-secondary truncate max-w-[120px]" title={row.department}>{row.department?.split(' ').slice(-1)[0]}</td>
                  <td className="py-3 pr-4 font-mono font-medium" style={{ color: scoreColor(row.score_total) }}>
                    {Math.round(row.score_total)}%
                  </td>
                  {[row.score_academic, row.score_sleep, row.score_emotional, row.score_social].map((s, i) => (
                    <td key={i} className="py-3 pr-4 text-text-muted font-mono text-xs">{Math.round(s)}%</td>
                  ))}
                  <td className="py-3">
                    <button onClick={() => deleteRow(row.id)} className="text-heat-critical/60 hover:text-heat-critical text-xs">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total === 0 && (
        <div className="text-text-muted text-sm py-8 text-center">No responses yet</div>
      )}

      {data && data.total > 50 && (
        <div className="flex gap-3 justify-center pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Prev</button>
          <span className="text-text-muted text-sm py-2">Page {page} of {Math.ceil(data.total / 50)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 50)}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
