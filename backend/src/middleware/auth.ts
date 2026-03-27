import { Request, Response, NextFunction } from 'express';

export function authAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminToken = 'popugtop';

  if (!token || token !== adminToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
