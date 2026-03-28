import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createBackup, listBackups, deleteBackup, pruneBackups, ensureBackupDir, getBackupFilename } from '../services/backup';
import { addAuditLog } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';
import { getDb, resetDb } from '../database';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/burnout.db');
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');

// Ensure backup dir exists at module load
ensureBackupDir();

const router = Router();

const upload = multer({
  dest: BACKUP_DIR,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.db')) cb(null, true);
    else cb(new Error('Only .db files allowed'));
  },
});

// GET /api/admin/backups
router.get('/', (_req: Request, res: Response) => {
  const backups = listBackups();
  res.json(backups);
});

// POST /api/admin/backups
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const filename = await createBackup('burnout-manual');
    const keepCount = parseInt(process.env.BACKUP_KEEP_COUNT || '20', 10);
    pruneBackups(keepCount);
    if (req.adminId) {
      addAuditLog(req.adminId, 'create_backup', { filename }, req.ip || '');
    }
    res.json({ filename });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/admin/backups/upload
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const originalName = req.file.originalname;
  if (!originalName.endsWith('.db')) {
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: 'Only .db files allowed' });
    return;
  }

  ensureBackupDir();
  const newFilename = `uploaded-${getBackupFilename().replace('burnout-backup-', '')}`;
  const destPath = path.join(BACKUP_DIR, newFilename);

  fs.renameSync(req.file.path, destPath);

  if (req.adminId) {
    addAuditLog(req.adminId, 'upload_backup', { filename: newFilename, original: originalName }, req.ip || '');
  }

  res.json({ filename: newFilename });
});

// POST /api/admin/backups/:filename/restore
router.post('/:filename/restore', async (req: AuthRequest, res: Response) => {
  const { filename } = req.params;

  // Validate filename
  if (!/^[\w\-\.]+\.db$/.test(filename)) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const srcPath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(srcPath)) {
    res.status(404).json({ error: 'Backup not found' });
    return;
  }

  try {
    // Create pre-restore backup
    const preRestoreFilename = await createBackup('pre-restore');

    // Close and reset DB
    resetDb();

    // Copy backup file over current DB
    fs.copyFileSync(srcPath, DB_PATH);

    // Reinitialize DB
    getDb();

    if (req.adminId) {
      addAuditLog(req.adminId, 'restore_backup', { filename, pre_restore_backup: preRestoreFilename }, req.ip || '');
    }

    res.json({ ok: true, pre_restore_backup: preRestoreFilename });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/admin/backups/:filename
router.delete('/:filename', async (req: AuthRequest, res: Response) => {
  const { filename } = req.params;

  if (!/^[\w\-\.]+\.db$/.test(filename)) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  try {
    deleteBackup(filename);
    if (req.adminId) {
      addAuditLog(req.adminId, 'delete_backup', { filename }, req.ip || '');
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: String(e) });
  }
});

// GET /api/admin/backups/:filename/download
router.get('/:filename/download', (req: Request, res: Response) => {
  const { filename } = req.params;

  if (!/^[\w\-\.]+\.db$/.test(filename)) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Backup not found' });
    return;
  }

  res.download(filePath, filename);
});

export default router;
