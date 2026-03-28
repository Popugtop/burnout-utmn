import { useState, useEffect } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';
import { BackupEntry } from '../../../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupsManager() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await adminFetch<BackupEntry[]>('/api/admin/backups');
      setBackups(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createBackup() {
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const data = await adminFetch<{ filename: string }>('/api/admin/backups', { method: 'POST' });
      setMessage(`Backup created: ${data.filename}`);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  }

  async function restoreBackup(filename: string) {
    if (!confirm(`Restore from "${filename}"?\n\nThis will replace all current data. A backup of the current state will be created automatically.`)) return;
    setRestoring(filename);
    setError('');
    setMessage('');
    try {
      const data = await adminFetch<{ ok: boolean; pre_restore_backup: string }>(`/api/admin/backups/${encodeURIComponent(filename)}/restore`, { method: 'POST' });
      setMessage(`Restored successfully. Pre-restore backup: ${data.pre_restore_backup}`);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setRestoring(null);
    }
  }

  async function deleteBackup(filename: string) {
    if (!confirm(`Delete backup "${filename}"?`)) return;
    try {
      await adminFetch(`/api/admin/backups/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      setBackups(prev => prev.filter(b => b.filename !== filename));
    } catch (e) {
      setError(String(e));
    }
  }

  function downloadBackup(filename: string) {
    const token = sessionStorage.getItem('burnout_admin_token');
    fetch(`/api/admin/backups/${encodeURIComponent(filename)}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async res => {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.db')) { setError('Only .db files allowed'); return; }
    setUploading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('burnout_admin_token');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/backups/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { filename: string };
      setMessage(`Uploaded: ${data.filename}`);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const typeColor = (t: string) => t === 'pre-restore' ? 'text-yellow-400' : t === 'manual' ? 'text-accent' : 'text-text-muted';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Backups</h2>
        <div className="flex gap-2">
          <label className={`btn-secondary text-sm py-2 px-4 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? 'Uploading...' : 'Upload Backup'}
            <input type="file" accept=".db" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          <button onClick={createBackup} disabled={creating} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Backup Now'}
          </button>
        </div>
      </div>

      {message && <div className="card p-3 border-accent/30 text-accent text-sm">{message}</div>}
      {error && <div className="card p-3 border-heat-critical/30 text-heat-critical text-sm">{error}</div>}

      {loading && <div className="text-text-muted text-sm animate-pulse">Loading backups...</div>}

      {!loading && backups.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">No backups yet</div>
      )}

      {backups.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-600">
                <th className="text-left text-text-muted text-xs p-4 font-normal">Filename</th>
                <th className="text-left text-text-muted text-xs p-4 font-normal">Type</th>
                <th className="text-right text-text-muted text-xs p-4 font-normal">Size</th>
                <th className="text-left text-text-muted text-xs p-4 font-normal">Created</th>
                <th className="text-right text-text-muted text-xs p-4 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(backup => (
                <tr key={backup.filename} className="border-b border-base-700/40 hover:bg-base-800/30">
                  <td className="p-4 font-mono text-xs text-text-secondary">{backup.filename}</td>
                  <td className={`p-4 text-xs capitalize ${typeColor(backup.type)}`}>{backup.type}</td>
                  <td className="p-4 text-right text-text-muted text-xs">{formatSize(backup.size)}</td>
                  <td className="p-4 text-text-muted text-xs">{new Date(backup.created_at).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => restoreBackup(backup.filename)} disabled={restoring === backup.filename}
                        className="text-accent text-xs hover:underline disabled:opacity-50">
                        {restoring === backup.filename ? 'Restoring...' : 'Restore'}
                      </button>
                      <button onClick={() => downloadBackup(backup.filename)} className="text-text-muted text-xs hover:text-text-primary">Download</button>
                      <button onClick={() => deleteBackup(backup.filename)} className="text-heat-critical/60 hover:text-heat-critical text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
