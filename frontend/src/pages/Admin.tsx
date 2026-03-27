import { useState } from 'react';
import { getAdminToken, clearAdminToken } from '../hooks/useAdmin';
import AdminLogin from '../components/admin/AdminLogin';
import SurveyList from '../components/admin/SurveyList';
import SurveyEditor from '../components/admin/SurveyEditor';
import ResponsesTable from '../components/admin/ResponsesTable';
import { Survey } from '../types';

type Tab = 'surveys' | 'responses';

export default function Admin() {
  const [authed, setAuthed] = useState(!!getAdminToken());
  const [tab, setTab] = useState<Tab>('surveys');
  const [editing, setEditing] = useState<Survey | null>(null);

  function handleUnauth() {
    clearAdminToken();
    setAuthed(false);
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-base-900 grid-bg font-body text-text-primary">
      {/* Admin header */}
      <div className="border-b border-base-600 bg-base-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display font-bold text-lg text-gradient">Admin Panel</span>
            {!editing && (
              <div className="flex gap-1">
                {(['surveys', 'responses'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                      ${tab === t ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleUnauth} className="text-text-muted text-sm hover:text-heat-critical transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'surveys' && !editing && (
          <SurveyList onEdit={s => setEditing(s)} />
        )}
        {tab === 'surveys' && editing && (
          <SurveyEditor survey={editing} onBack={() => setEditing(null)} />
        )}
        {tab === 'responses' && <ResponsesTable />}
      </div>
    </div>
  );
}
