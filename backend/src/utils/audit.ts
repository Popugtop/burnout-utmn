import { getDb } from '../database';
import { v4 as uuidv4 } from 'uuid';

export function addAuditLog(adminId: string, action: string, details: object | null, ipAddress: string): void {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO admin_audit_log (id, admin_id, action, details_json, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), adminId, action, details ? JSON.stringify(details) : null, ipAddress);
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}
