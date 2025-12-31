// src/jobs/backup.job.ts 
import { CronJob } from 'cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);


export const databaseBackupJob = new CronJob(
  '0 1 * * *', 
  async () => {
    try {
      logger.info('Starting database backup...');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = process.env.BACKUP_DIR || '/var/backups/jgpnr';
      const backupFile = path.join(backupDir, `backup-${timestamp}.sql.gz`);

      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // ✅ Perform PostgreSQL backup
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details
      const url = new URL(dbUrl);
      const username = url.username;
      const password = url.password;
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);

      // Run pg_dump with compression
      const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} | gzip > ${backupFile}`;
      
      await execAsync(dumpCommand);

      // Get backup file size
      const stats = await fs.stat(backupFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      logger.info('Database backup completed', {
        backupFile,
        size: `${sizeMB} MB`,
        timestamp
      });

      // Cleanup old backups (keep last 30 days)
      await cleanupOldBackups(backupDir, 30);

      // Upload to cloud storage (S3, GCS, etc.)
      if (process.env.BACKUP_UPLOAD_ENABLED === 'true') {
        await uploadBackupToCloud(backupFile);
      }

      // Verify backup integrity
      const isValid = await verifyBackup(backupFile);
      if (!isValid) {
        logger.error('Backup verification failed!');
        
      }

    } catch (error) {
      logger.error('Database backup failed', { error });
      // Send critical alert to admins
    }
  },
  null,
  true,
  'UTC'
);

async function cleanupOldBackups(backupDir: string, daysToKeep: number): Promise<void> {
  const files = await fs.readdir(backupDir);
  const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

  for (const file of files) {
    if (!file.startsWith('backup-')) continue;

    const filePath = path.join(backupDir, file);
    const stats = await fs.stat(filePath);

    if (stats.mtimeMs < cutoffDate) {
      await fs.unlink(filePath);
      logger.info('Deleted old backup', { file });
    }
  }
}

async function uploadBackupToCloud(backupFile: string): Promise<void> {
  // TODO: Implement cloud upload (AWS S3, Google Cloud Storage, etc.)
  logger.info('Cloud upload not yet implemented', { backupFile });
}

async function verifyBackup(backupFile: string): Promise<boolean> {
  try {
    // Check if file is a valid gzip
    await execAsync(`gzip -t ${backupFile}`);
    return true;
  } catch (error) {
    logger.error('Backup verification failed', { error, backupFile });
    return false;
  }
}

export const startBackupJob = () => {
  databaseBackupJob.start();
  logger.info('Database backup job started (daily at 1 AM UTC)');
};

export const stopBackupJob = () => {
  databaseBackupJob.stop();
  logger.info('Database backup job stopped');
};