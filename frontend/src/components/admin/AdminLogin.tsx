import { useState } from 'react';
import { setAdminToken, adminFetch } from '../../hooks/useAdmin';

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAdminToken(token);
    try {
      await adminFetch('/api/admin/surveys');
      onLogin();
    } catch {
      setError('Invalid password. Please try again.');
      setToken('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-900 grid-bg px-6">
      <div className="card p-10 w-full max-w-md">
        <h1 className="font-display text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-text-muted text-sm mb-8">Burnout Map — UTMN</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">Admin Password</label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="input"
              placeholder="Enter admin token..."
              autoFocus
            />
          </div>
          {error && <p className="text-heat-critical text-sm">{error}</p>}
          <button type="submit" disabled={!token || loading} className="btn-primary w-full py-3 disabled:opacity-40">
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
