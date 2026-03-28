import { useState } from 'react';
import { useAuth } from '../hooks/useAdmin';
import AdminLogin from '../components/admin/AdminLogin';
import SurveyList from '../components/admin/SurveyList';
import SurveyEditor from '../components/admin/SurveyEditor';
import AnalyticsDashboard from '../components/admin/analytics/AnalyticsDashboard';
import BackupsManager from '../components/admin/backups/BackupsManager';
import AdminSettings from '../components/admin/settings/AdminSettings';
import TipsEditor from '../components/admin/content/TipsEditor';
import AboutEditor from '../components/admin/content/AboutEditor';
import { Survey } from '../types';

type Tab = 'surveys' | 'analytics' | 'backups' | 'content' | 'settings';

function ContentManager() {
  const [subTab, setSubTab] = useState<'tips' | 'about'>('tips');
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Content</h2>
        <div className="flex gap-1">
          {(['tips', 'about'] as const).map(t => (
            <button key={t} onClick={() => setSubTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                ${subTab === t ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
              {t === 'tips' ? 'Tips & Resources' : 'About Page'}
            </button>
          ))}
        </div>
      </div>
      {subTab === 'tips' && <TipsEditor />}
      {subTab === 'about' && <AboutEditor />}
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated, loading, logout, admin, showPasswordWarning, login } = useAuth();
  const [tab, setTab] = useState<Tab>('surveys');
  const [editing, setEditing] = useState<Survey | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin onLogin={login} />;

  return (
    <div className="min-h-screen bg-base-900 grid-bg font-body text-text-primary">
      <div className="border-b border-base-600 bg-base-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display font-bold text-lg text-gradient">Admin Panel</span>
            {!editing && (
              <div className="flex gap-1">
                {(['surveys', 'analytics', 'backups', 'content', 'settings'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                      ${tab === t ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {admin && <span className="text-text-muted text-xs hidden sm:block">{admin.username}</span>}
            <a href="/" className="text-text-muted text-sm hover:text-text-primary transition-colors hidden sm:block">← Site</a>
            <button onClick={() => logout()} className="text-text-muted text-sm hover:text-heat-critical transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {showPasswordWarning && (
        <div className="bg-yellow-900/30 border-b border-yellow-700/40 px-6 py-2 text-center">
          <p className="text-yellow-300 text-sm">⚠️ You are using the default password. Please change it in <button onClick={() => setTab('settings')} className="underline">Settings</button>.</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'surveys' && !editing && <SurveyList onEdit={s => setEditing(s)} />}
        {tab === 'surveys' && editing && <SurveyEditor survey={editing} onBack={() => setEditing(null)} />}
        {tab === 'analytics' && <AnalyticsDashboard />}
        {tab === 'backups' && <BackupsManager />}
        {tab === 'content' && <ContentManager />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
