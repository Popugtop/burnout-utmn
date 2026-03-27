import { useState, useEffect } from 'react';
import { adminFetch } from '../../hooks/useAdmin';
import { Survey } from '../../types';

interface Props {
  onEdit: (survey: Survey) => void;
}

export default function SurveyList({ onEdit }: Props) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetch<Survey[]>('/api/admin/surveys');
      setSurveys(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!newTitle.trim()) return;
    setError('');
    try {
      await adminFetch('/api/admin/surveys', { method: 'POST', body: JSON.stringify({ title: newTitle }) });
      setNewTitle('');
      setCreating(false);
      load();
    } catch (e) {
      setError(String(e));
    }
  }

  async function activate(id: string) {
    await adminFetch(`/api/admin/surveys/${id}/activate`, { method: 'PUT' });
    load();
  }

  async function deleteSurvey(id: string, count: number) {
    if (count > 0) { alert('Cannot delete survey with responses.'); return; }
    if (!confirm('Delete this survey?')) return;
    await adminFetch(`/api/admin/surveys/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="text-text-muted animate-pulse p-4">Loading surveys...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-semibold">Surveys</h2>
        <button onClick={() => setCreating(!creating)} className="btn-primary text-sm py-2 px-5">
          + New Survey
        </button>
      </div>

      {creating && (
        <div className="card p-4 space-y-3">
          <div className="flex gap-3">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="input" placeholder="Survey title..." autoFocus
              onKeyDown={e => e.key === 'Enter' && create()} />
            <button onClick={create} className="btn-primary text-sm px-5">Create</button>
            <button onClick={() => { setCreating(false); setError(''); }} className="btn-secondary text-sm px-4">Cancel</button>
          </div>
          {error && <p className="text-heat-critical text-sm">{error}</p>}
        </div>
      )}

      {surveys.map(survey => (
        <div key={survey.id} className={`card p-5 flex items-center justify-between gap-4
          ${survey.is_active ? 'border-accent/40' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-display font-semibold truncate">{survey.title}</h3>
              {survey.is_active ? (
                <span className="bg-success/20 text-success text-xs px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
              ) : (
                <span className="bg-base-700 text-text-muted text-xs px-2 py-0.5 rounded-full flex-shrink-0">Archived</span>
              )}
            </div>
            <p className="text-text-muted text-xs font-mono">
              {survey.response_count || 0} responses · Created {new Date(survey.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(survey)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
            {!survey.is_active && (
              <button onClick={() => activate(survey.id)} className="text-xs py-1.5 px-3 bg-success/20 hover:bg-success/30 text-success rounded-lg transition-colors">
                Activate
              </button>
            )}
            <button onClick={() => deleteSurvey(survey.id, survey.response_count || 0)} className="btn-danger text-xs py-1.5 px-3">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
