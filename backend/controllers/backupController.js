// controllers/backupController.js
'use strict';

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const extractZip = require('extract-zip');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ─── Config ────────────────────────────────────────────────────────────────────
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getDbConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  name: process.env.DB_NAME || 'superHR',
  user: process.env.DB_USER || 'postgres',
  pass: process.env.DB_PASS || '',
});

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const generateTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
};

// ─── CREATE BACKUP ─────────────────────────────────────────────────────────────
/**
 * POST /api/backup/create
 * Creates a full backup: pg_dump SQL + uploads folder → single .zip
 */
const createBackup = async (req, res) => {
  const db = getDbConfig();
  const timestamp = generateTimestamp();
  const backupName = `superHR_backup_${timestamp}`;
  const sqlFile = path.join(BACKUP_DIR, `${backupName}.sql`);
  const zipFile = path.join(BACKUP_DIR, `${backupName}.zip`);

  try {
    // 1. Run pg_dump
    console.log(`[BACKUP] Starting database dump...`);
    const pgDumpCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -F p -f "${sqlFile}"`
      : `PGPASSWORD=${db.pass} pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -F p -f "${sqlFile}"`;

    await execAsync(pgDumpCmd);
    console.log(`[BACKUP] Database dump complete: ${sqlFile}`);

    // 2. Create zip with SQL + uploads
    console.log(`[BACKUP] Creating zip archive...`);
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      // Add SQL dump
      archive.file(sqlFile, { name: 'database.sql' });

      // Add uploads folder if it exists
      if (fs.existsSync(UPLOADS_DIR)) {
        archive.directory(UPLOADS_DIR, 'uploads');
      }

      // Add metadata
      const meta = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        dbName: db.name,
        createdBy: req.user?.username || 'system',
      };
      archive.append(JSON.stringify(meta, null, 2), { name: 'backup_meta.json' });

      archive.finalize();
    });

    // 3. Clean up raw SQL file
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);

    const stats = fs.statSync(zipFile);
    console.log(`[BACKUP] Backup created: ${zipFile} (${formatBytes(stats.size)})`);

    return res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        filename: path.basename(zipFile),
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    // Cleanup partial files
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
    if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);

    console.error('[BACKUP] Error creating backup:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message,
    });
  }
};

// ─── LIST BACKUPS ──────────────────────────────────────────────────────────────
/**
 * GET /api/backup/list
 * Returns all available backup files, sorted newest first
 */
const listBackups = async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.zip') && f.startsWith('superHR_backup_'))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, count: files.length, backups: files });

  } catch (error) {
    console.error('[BACKUP] Error listing backups:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message,
    });
  }
};

// ─── DOWNLOAD BACKUP ───────────────────────────────────────────────────────────
/**
 * GET /api/backup/download/:filename
 * Streams a backup file as a download
 */
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    const stats = fs.statSync(filePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (error) {
    console.error('[BACKUP] Error downloading backup:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message,
    });
  }
};

// ─── RESTORE BACKUP ────────────────────────────────────────────────────────────
/**
 * POST /api/backup/restore/:filename
 * Restores DB and uploads from a named backup file
 */
const restoreBackup = async (req, res) => {
  const db = getDbConfig();
  const { filename } = req.params;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ success: false, message: 'Invalid filename' });
  }

  const zipFile = path.join(BACKUP_DIR, filename);
  const extractDir = path.join(BACKUP_DIR, `restore_${Date.now()}`);
  const sqlFile = path.join(extractDir, 'database.sql');

  try {
    if (!fs.existsSync(zipFile)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    // 1. Extract zip
    console.log(`[RESTORE] Extracting ${filename}...`);
    await extractZip(zipFile, { dir: extractDir });

    // 2. Verify SQL file exists
    if (!fs.existsSync(sqlFile)) {
      throw new Error('Invalid backup: missing database.sql');
    }

    // 3. Drop & recreate database
    console.log(`[RESTORE] Dropping and recreating database...`);
    const terminateCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db.name}' AND pid <> pg_backend_pid();"`
      : `PGPASSWORD=${db.pass} psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${db.name}' AND pid <> pg_backend_pid();"`;
    await execAsync(terminateCmd);

    const dropCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "DROP DATABASE IF EXISTS \\"${db.name}\\""`
      : `PGPASSWORD=${db.pass} psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "DROP DATABASE IF EXISTS \\"${db.name}\\""`;
    await execAsync(dropCmd);

    const createCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "CREATE DATABASE \\"${db.name}\\""`
      : `PGPASSWORD=${db.pass} psql -h ${db.host} -p ${db.port} -U ${db.user} -d postgres -c "CREATE DATABASE \\"${db.name}\\""`;
    await execAsync(createCmd);

    // 4. Restore SQL
    console.log(`[RESTORE] Restoring database from SQL...`);
    const psqlCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -f "${sqlFile}"`
      : `PGPASSWORD=${db.pass} psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -f "${sqlFile}"`;
    await execAsync(psqlCmd);
    console.log(`[RESTORE] Database restored successfully`);

    // 5. Restore uploads if present in backup
    const backupUploadsDir = path.join(extractDir, 'uploads');
    if (fs.existsSync(backupUploadsDir)) {
      console.log(`[RESTORE] Restoring uploads folder...`);
      // Clear existing uploads and copy from backup
      if (fs.existsSync(UPLOADS_DIR)) {
        fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
      }
      fs.cpSync(backupUploadsDir, UPLOADS_DIR, { recursive: true });
      console.log(`[RESTORE] Uploads restored successfully`);
    }

    // 6. Cleanup temp dir
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log(`[RESTORE] Restore complete from ${filename}`);
    return res.json({
      success: true,
      message: 'System restored successfully. Please restart the server.',
      restoredFrom: filename,
      restoredAt: new Date().toISOString(),
    });

  } catch (error) {
    // Cleanup temp dir
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    console.error('[RESTORE] Error restoring backup:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message,
    });
  }
};

// ─── DELETE BACKUP ─────────────────────────────────────────────────────────────
/**
 * DELETE /api/backup/:filename
 * Deletes a backup file
 */
const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    fs.unlinkSync(filePath);
    console.log(`[BACKUP] Deleted backup: ${filename}`);

    return res.json({ success: true, message: 'Backup deleted successfully' });

  } catch (error) {
    console.error('[BACKUP] Error deleting backup:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message,
    });
  }
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
/**
 * GET /api/backup/settings
 * Gets auto-backup settings
 */
const getBackupSettings = async (req, res) => {
  try {
    const { SystemSetting } = require('../models');
    
    const enabledStr = await SystemSetting.getSetting('backup.enabled', 'true');
    const time = await SystemSetting.getSetting('backup.time', '02:00');
    const retentionDaysStr = await SystemSetting.getSetting('backup.retentionDays', '7');
    
    return res.json({
      success: true,
      data: {
        enabled: enabledStr === 'true',
        time,
        retentionDays: parseInt(retentionDaysStr) || 7
      }
    });
  } catch (error) {
    console.error('[BACKUP] Error fetching settings:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch backup settings' });
  }
};

/**
 * POST /api/backup/settings
 * Updates auto-backup settings
 */
const updateBackupSettings = async (req, res) => {
  try {
    const { enabled, time, retentionDays } = req.body;
    const { SystemSetting } = require('../models');
    const { restartScheduledBackup } = require('../utils/scheduledBackup');
    const userId = req.user?.id; // from authMiddleware

    if (enabled !== undefined) {
      await SystemSetting.setSetting('backup.enabled', enabled.toString(), userId);
    }
    if (time !== undefined) {
      await SystemSetting.setSetting('backup.time', time, userId);
    }
    if (retentionDays !== undefined) {
      await SystemSetting.setSetting('backup.retentionDays', retentionDays.toString(), userId);
    }

    // Restart cron job with new settings
    await restartScheduledBackup();

    return res.json({ success: true, message: 'Backup settings updated successfully' });
  } catch (error) {
    console.error('[BACKUP] Error updating settings:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update backup settings' });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  getBackupSettings,
  updateBackupSettings,
};
