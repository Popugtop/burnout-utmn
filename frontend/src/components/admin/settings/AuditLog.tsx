import { useState, useEffect } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';
import { AuditLogEntry } from '../../../types';

const ACTION_COLORS: Record<string, string> = {
  login: 'text-heat-low',
  logout: 'text-text-muted',
  failed_login: 'text-heat-critical',
  change_password: 'text-yellow-400',
  create_backup: 'text-accent',
  restore_backup: 'text-yellow-400',
  delete_backup: 'text-heat-critical',
  upload_backup: 'text-accent',
  activate_survey: 'text-accent',
  delete_response: 'text-heat-critical',
};

function DetailCell({ json }: { json: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!json) return <span className="text-text-muted/40">—</span>;

  let pretty = json;
  try {
    pretty = JSON.stringify(JSON.parse(json), null, 2);
  } catch { /* leave as-is */ }

  function copy() {
    navigator.clipboard.writeText(pretty).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-left font-mono text-xs text-text-muted hover:text-text-secondary transition-colors max-w-[180px] truncate block"
        title="Click to expand"
      >
        {JSON.stringify(JSON.parse(json))}
      </button>
      {expanded && (
        <div className="absolute z-20 left-0 top-full mt-1 w-80 card p-3 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-muted text-xs">Details</span>
            <button onClick={copy} className="text-xs text-accent hover:underline">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap break-all overflow-auto max-h-48">
            {pretty}
          </pre>
          <button onClick={() => setExpanded(false)} className="mt-2 text-text-muted text-xs hover:text-text-primary">Close</button>
        </div>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [data, setData] = useState<{ total: number; rows: AuditLogEntry[] } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const d = await adminFetch<{ total: number; rows: AuditLogEntry[] }>(`/api/admin/audit-log?page=${page}`);
        setData(d);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Activity Log</h3>
      {loading && <div className="text-text-muted text-sm animate-pulse">Loading...</div>}
      {data && (
        <>
          <div className="card overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-600">
                  {['Time', 'Admin', 'Action', 'Details', 'IP'].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs p-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map(row => (
                  <tr key={row.id} className="border-b border-base-700/40 hover:bg-base-800/30">
                    <td className="p-3 text-text-muted text-xs font-mono whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-text-secondary text-xs whitespace-nowrap">
                      {row.username || row.admin_id.slice(0, 8)}
                    </td>
                    <td className={`p-3 text-xs font-medium whitespace-nowrap ${ACTION_COLORS[row.action] || 'text-text-secondary'}`}>
                      {row.action}
                    </td>
                    <td className="p-3 relative">
                      <DetailCell json={row.details_json} />
                    </td>
                    <td className="p-3 text-text-muted text-xs font-mono whitespace-nowrap">
                      {row.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total > 50 && (
            <div className="flex gap-3 justify-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Prev</button>
              <span className="text-text-muted text-sm py-2">Page {page} of {Math.ceil(data.total / 50)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 50)}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
