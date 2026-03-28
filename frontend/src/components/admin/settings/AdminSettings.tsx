import { useAuth } from '../../../hooks/useAdmin';
import ChangePassword from './ChangePassword';
import AuditLog from './AuditLog';

export default function AdminSettings() {
  const { admin } = useAuth();
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Settings</h2>
        <p className="text-text-muted text-sm">Logged in as <strong className="text-text-secondary">{admin?.username}</strong></p>
      </div>
      <ChangePassword />
      <AuditLog />
    </div>
  );
}
