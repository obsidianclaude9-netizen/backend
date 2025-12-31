// src/jobs/audit-cleanup.job.ts

import { CronJob } from 'cron';
import { AuditLogger } from '../utils/audit';
import { logger } from '../utils/logger';
import prisma from '../config/database';


export const auditCleanupJob = new CronJob(
  '0 2 * * *', 
  async () => {
    try {
      logger.info('Starting audit log cleanup...');

      
      const retentionPolicies = [
        { days: 90, description: 'Standard logs' },
        
        { days: 2555, description: 'Financial & security logs (7 years)' }
      ];

      const deletedCount = await AuditLogger.cleanupOldLogs(90);

      const [
        totalLogs,
        oldestLog,
        largestTable
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true }
        }),
        prisma.$queryRaw<any[]>`
          SELECT 
            pg_size_pretty(pg_total_relation_size('audit_logs')) as size,
            pg_total_relation_size('audit_logs') as bytes
        `
      ]);

      logger.info('Audit log cleanup completed', {
        deletedCount,
        remainingLogs: totalLogs,
        oldestLogDate: oldestLog?.createdAt,
        tableSize: largestTable[0]?.size,
        tableSizeBytes: largestTable[0]?.bytes
      });

      if (largestTable[0]?.bytes > 1_000_000_000) {
        logger.warn('Audit log table exceeding 1GB', {
          size: largestTable[0].size,
          recommendation: 'Consider archiving old logs to cold storage'
        });

      }
      const integrityCheck = await AuditLogger.verifyChainIntegrity(100);
      
      if (!integrityCheck.valid) {
        logger.error('🚨 AUDIT LOG CHAIN INTEGRITY VIOLATED', {
          checkedCount: integrityCheck.checkedCount,
          errors: integrityCheck.errors
        });

      }

    } catch (error) {
      logger.error('Audit log cleanup failed', { error });
      throw error;
    }
  },
  null, 
  true, 
  'UTC' 
);

export const startAuditCleanup = () => {
  auditCleanupJob.start();
  logger.info('Audit cleanup job started (daily at 2 AM UTC)');
};

export const stopAuditCleanup = () => {
  auditCleanupJob.stop();
  logger.info('Audit cleanup job stopped');
};