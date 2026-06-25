// utils/scheduledBackup.js
'use strict';

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Keep only the last N auto-backups to save disk space
const MAX_AUTO_BACKUPS = 7;

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const runAutoBackup = async () => {
  const db = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'superHR',
    user: process.env.DB_USER || 'postgres',
    pass: process.env.DB_PASS || '',
  };

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const backupName = `superHR_auto_${timestamp}`;
  const sqlFile = path.join(BACKUP_DIR, `${backupName}.sql`);
  const zipFile = path.join(BACKUP_DIR, `${backupName}.zip`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    console.log(`[AUTO-BACKUP] Starting scheduled backup at ${now.toISOString()}`);

    // 1. pg_dump
    const pgDumpCmd = process.platform === 'win32'
      ? `set PGPASSWORD=${db.pass}&& pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -F p -f "${sqlFile}"`
      : `PGPASSWORD=${db.pass} pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.name} -F p -f "${sqlFile}"`;

    await execAsync(pgDumpCmd);

    // 2. Zip
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFile);
      const archive = archiver('zip', { zlib: { level: 6 } }); // level 6 for speed

      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      archive.file(sqlFile, { name: 'database.sql' });
      if (fs.existsSync(UPLOADS_DIR)) {
        archive.directory(UPLOADS_DIR, 'uploads');
      }

      const meta = {
        version: '1.0',
        type: 'auto',
        createdAt: now.toISOString(),
        dbName: db.name,
        createdBy: 'scheduler',
      };
      archive.append(JSON.stringify(meta, null, 2), { name: 'backup_meta.json' });
      archive.finalize();
    });

    // 3. Cleanup raw SQL
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);

    const stats = fs.statSync(zipFile);
    console.log(`[AUTO-BACKUP] Backup created: ${backupName}.zip (${formatBytes(stats.size)})`);

    // 4. Prune old auto-backups (keep last retentionDays)
    const { SystemSetting } = require('../models');
    const retentionDaysStr = await SystemSetting.getSetting('backup.retentionDays', '7');
    const maxBackups = parseInt(retentionDaysStr) || 7;

    const autoBackups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('superHR_auto_') && f.endsWith('.zip'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    if (autoBackups.length > maxBackups) {
      const toDelete = autoBackups.slice(maxBackups);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f.name));
        console.log(`[AUTO-BACKUP] Pruned old backup: ${f.name}`);
      });
    }

  } catch (error) {
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
    console.error(`[AUTO-BACKUP] Scheduled backup failed:`, error.message);
  }
};

let currentCronJob = null;

/**
 * Start or restart the scheduled backup job reading from settings.
 */
const startScheduledBackup = async () => {
  if (currentCronJob) {
    currentCronJob.stop();
  }

  try {
    const { SystemSetting } = require('../models');
    const enabledStr = await SystemSetting.getSetting('backup.enabled', 'true');
    const enabled = enabledStr === 'true';

    if (!enabled) {
      console.log('[AUTO-BACKUP] Scheduled auto-backup is disabled in settings.');
      return;
    }

    const time = await SystemSetting.getSetting('backup.time', '02:00');
    const [hour, minute] = time.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    currentCronJob = cron.schedule(cronExpression, async () => {
      await runAutoBackup();
    });

    console.log(`[AUTO-BACKUP] Scheduled daily backup enabled (runs at ${time})`);
  } catch (error) {
    console.error('[AUTO-BACKUP] Failed to read backup settings, defaulting to 02:00 AM:', error.message);
    currentCronJob = cron.schedule('0 2 * * *', async () => {
      await runAutoBackup();
    });
  }
};

const restartScheduledBackup = async () => {
  console.log('[AUTO-BACKUP] Restarting scheduled backup due to settings change...');
  await startScheduledBackup();
};

module.exports = { startScheduledBackup, restartScheduledBackup, runAutoBackup };
