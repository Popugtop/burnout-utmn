import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TAB_LABELS: Record<Tab, string> = {
  surveys: 'Surveys',
  analytics: 'Analytics',
  backups: 'Backups',
  content: 'Content',
  settings: 'Settings',
};

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
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-900 flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin onLogin={login} />;

  function switchTab(t: Tab) {
    setTab(t);
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-base-900 grid-bg font-body text-text-primary">
      <div className="border-b border-base-600 bg-base-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: logo + desktop tabs */}
          <div className="flex items-center gap-6 min-w-0">
            <span className="font-display font-bold text-lg text-gradient shrink-0">Admin Panel</span>
            {!editing && (
              <div className="hidden md:flex gap-1">
                {(['surveys', 'analytics', 'backups', 'content', 'settings'] as Tab[]).map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                      ${tab === t ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: actions + burger */}
          <div className="flex items-center gap-3">
            {admin && <span className="text-text-muted text-xs hidden sm:block">{admin.username}</span>}
            <a href="/" className="text-text-muted text-sm hover:text-text-primary transition-colors hidden sm:block">← Site</a>
            <button onClick={() => logout()} className="text-text-muted text-sm hover:text-heat-critical transition-colors hidden sm:block">
              Sign Out
            </button>

            {/* Burger — mobile only */}
            {!editing && (
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-base-700 transition-colors"
                aria-label="Toggle menu"
              >
                <motion.span animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
                  className="block w-5 h-0.5 bg-text-primary rounded-full origin-center" />
                <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }}
                  className="block w-5 h-0.5 bg-text-primary rounded-full" />
                <motion.span animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
                  className="block w-5 h-0.5 bg-text-primary rounded-full origin-center" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setMenuOpen(false)} />
            <motion.div key="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 z-40 w-64 bg-base-900 border-l border-base-600 flex flex-col pt-16 pb-8 px-4 md:hidden">
              <div className="flex flex-col gap-1 mt-4">
                {(['surveys', 'analytics', 'backups', 'content', 'settings'] as Tab[]).map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`text-left px-4 py-3 rounded-xl text-base font-medium transition-colors
                      ${tab === t ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-base-700'}`}>
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-2">
                {admin && <span className="text-text-muted text-xs px-4">{admin.username}</span>}
                <a href="/" className="px-4 py-2 text-text-muted text-sm hover:text-text-primary transition-colors">← Site</a>
                <button onClick={() => logout()} className="text-left px-4 py-2 text-sm text-heat-critical/70 hover:text-heat-critical transition-colors">
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showPasswordWarning && (
        <div className="bg-yellow-900/30 border-b border-yellow-700/40 px-6 py-2 text-center">
          <p className="text-yellow-300 text-sm">⚠️ You are using the default password. Please change it in <button onClick={() => switchTab('settings')} className="underline">Settings</button>.</p>
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
