import path from 'path';
import fs from 'fs';
import { getDb, resetDb } from '../database';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/burnout.db');
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');

export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export function getBackupFilename(prefix = 'burnout-backup'): string {
  const now = new Date();
  const ts = now.toISOString().replace(/:/g, '-').replace('.', '-').slice(0, 19);
  return `${prefix}-${ts}.db`;
}

export async function createBackup(prefix = 'burnout-backup'): Promise<string> {
  ensureBackupDir();
  const filename = getBackupFilename(prefix);
  const destPath = path.join(BACKUP_DIR, filename);

  const db = getDb();
  await db.backup(destPath);

  console.log(`Backup created: ${filename}`);
  return filename;
}

export function listBackups(): Array<{ filename: string; size: number; created_at: string; type: string }> {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      let type = 'auto';
      if (f.includes('manual')) type = 'manual';
      if (f.includes('pre-restore')) type = 'pre-restore';
      return {
        filename: f,
        size: stat.size,
        created_at: stat.birthtime.toISOString(),
        type,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return files;
}

export async function restoreBackup(filename: string): Promise<void> {
  // Validate filename to prevent path traversal
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error('Invalid filename');
  }

  const srcPath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(srcPath)) {
    throw new Error('Backup file not found');
  }

  // Create pre-restore backup first
  await createBackup('pre-restore');

  // Close and reset DB module
  resetDb();

  // Copy backup file over current DB
  fs.copyFileSync(srcPath, DB_PATH);

  // Reinitialize DB
  getDb();

  console.log(`Restored from backup: ${filename}`);
}

export function deleteBackup(filename: string): void {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error('Invalid filename');
  }
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }
  fs.unlinkSync(filePath);
}

export function pruneBackups(keepCount: number): void {
  const backups = listBackups();
  const autoManual = backups.filter(b => b.type !== 'pre-restore');
  const preRestore = backups.filter(b => b.type === 'pre-restore');

  // Remove oldest auto/manual backups beyond keepCount
  if (autoManual.length > keepCount) {
    const toDelete = autoManual.slice(keepCount);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, b.filename));
      } catch { /* ignore */ }
    }
  }

  // Keep last 5 pre-restore backups
  if (preRestore.length > 5) {
    const toDelete = preRestore.slice(5);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, b.filename));
      } catch { /* ignore */ }
    }
  }
}
