import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database';

export interface AuthRequest extends Request {
  adminId?: string;
  sessionId?: string;
}

export function authAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const db = getDb();
  const session = db.prepare(
    "SELECT * FROM admin_sessions WHERE id = ? AND expires_at > datetime('now')"
  ).get(token) as { id: string; admin_id: string } | undefined;

  if (!session) {
    // Clean up expired session if exists
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(token);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.adminId = session.admin_id;
  req.sessionId = session.id;
  next();
}
