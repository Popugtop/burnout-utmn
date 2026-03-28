import { useState } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await adminFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setSuccess(true);
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 max-w-md">
      <h3 className="font-display text-lg font-semibold mb-5">Change Password</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">Current Password</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-2">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" placeholder="Min 8 characters" />
        </div>
        <div>
          <label className="block text-text-secondary text-sm mb-2">Confirm New Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" />
        </div>
        {error && <p className="text-heat-critical text-sm">{error}</p>}
        {success && <p className="text-heat-low text-sm">Password changed successfully!</p>}
        <button type="submit" disabled={!oldPassword || !newPassword || !confirm || loading} className="btn-primary py-2.5 disabled:opacity-40">
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
