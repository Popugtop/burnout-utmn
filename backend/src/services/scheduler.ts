import cron from 'node-cron';
import { createBackup, pruneBackups } from './backup';
import { getDb } from '../database';

export function startScheduler(): void {
  const backupIntervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS || '6', 10);
  const keepCount = parseInt(process.env.BACKUP_KEEP_COUNT || '20', 10);

  // Auto-backup every N hours
  const backupCronExpr = `0 */${backupIntervalHours} * * *`;
  cron.schedule(backupCronExpr, async () => {
    try {
      await createBackup('burnout-backup');
      pruneBackups(keepCount);
    } catch (e) {
      console.error('Auto-backup failed:', e);
    }
  });

  // Clean expired sessions every hour
  cron.schedule('0 * * * *', () => {
    try {
      const db = getDb();
      const result = db.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();
      if (result.changes > 0) {
        console.log(`Cleaned ${result.changes} expired sessions`);
      }
    } catch (e) {
      console.error('Session cleanup failed:', e);
    }
  });

  console.log(`Scheduler started (backup every ${backupIntervalHours}h, keep ${keepCount})`);
}
