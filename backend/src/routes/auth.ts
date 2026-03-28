import { Router, Request, Response } from 'express';
import { getDb } from '../database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { authAdmin, AuthRequest } from '../middleware/auth';
import { addAuditLog } from '../utils/audit';

const router = Router();

function getClientIp(req: Request): string {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  return ip === '::1' ? '127.0.0.1' : ip.replace(/^::ffff:/, '');
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as {
    id: string; username: string; password_hash: string; display_name: string;
  } | undefined;

  const ip = getClientIp(req);

  if (!admin) {
    // Dummy compare to prevent timing attack
    await bcrypt.compare(password, '$2b$12$invalidhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    addAuditLog('system', 'failed_login', { username }, ip);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    addAuditLog(admin.id, 'failed_login', { username }, ip);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const sessionTtlHours = parseInt(process.env.SESSION_TTL_HOURS || '24', 10);
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + sessionTtlHours * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(
    'INSERT INTO admin_sessions (id, admin_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, admin.id, expiresAt, ip, req.headers['user-agent'] || '');

  db.prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);
  addAuditLog(admin.id, 'login', null, ip);

  res.json({
    token: sessionId,
    admin: {
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name,
    },
    showPasswordWarning: admin.username === (process.env.ADMIN_DEFAULT_USERNAME || 'admin'),
  });
});

// POST /api/auth/logout
router.post('/logout', authAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(req.sessionId);
  if (req.adminId) {
    addAuditLog(req.adminId, 'logout', null, getClientIp(req));
  }
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', authAdmin, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const admin = db.prepare('SELECT id, username, display_name, last_login_at FROM admins WHERE id = ?').get(req.adminId) as {
    id: string; username: string; display_name: string; last_login_at: string;
  } | undefined;

  if (!admin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json(admin);
});

// PUT /api/auth/change-password
router.put('/change-password', authAdmin, async (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body as { old_password?: string; new_password?: string };

  if (!old_password || !new_password) {
    res.status(400).json({ error: 'old_password and new_password required' });
    return;
  }
  if (new_password.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' });
    return;
  }
  if (old_password === new_password) {
    res.status(400).json({ error: 'New password must be different from current' });
    return;
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.adminId) as {
    id: string; password_hash: string;
  } | undefined;

  if (!admin) {
    res.status(404).json({ error: 'Admin not found' });
    return;
  }

  const valid = await bcrypt.compare(old_password, admin.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = await bcrypt.hash(new_password, 12);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, admin.id);

  // Invalidate all other sessions
  db.prepare('DELETE FROM admin_sessions WHERE admin_id = ? AND id != ?').run(admin.id, req.sessionId);

  addAuditLog(admin.id, 'change_password', null, getClientIp(req));

  res.json({ ok: true });
});

export default router;
