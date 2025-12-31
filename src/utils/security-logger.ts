// src/utils/security-logger.ts 

import { logger } from './logger';
import { emailQueue } from '../config/queue';
import redis from '../config/cache';

interface SecurityEvent {
  type: 'FAILED_2FA' | 'BULK_DELETE' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_FILE_UPLOAD' | 
        'RATE_LIMIT_EXCEEDED' | 'IDOR_ATTEMPT' | 'CSRF_VIOLATION' | 'SQL_INJECTION_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  targetResource?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class SecurityLogger {
  private readonly ALERT_THRESHOLD = {
    FAILED_2FA: 5,              
    RATE_LIMIT_EXCEEDED: 3,     
    IDOR_ATTEMPT: 2,            
    SQL_INJECTION_ATTEMPT: 1,   
  };

  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to Winston
    logger.warn('🔒 SECURITY EVENT', {
      ...event,
      timestamp: new Date().toISOString()
    });

    // Track in Redis for threshold monitoring
    if (event.userId || event.ipAddress) {
      const key = `security:${event.type}:${event.userId || event.ipAddress}`;
      const count = await redis.incr(key);
      await redis.expire(key, 3600); // 1 hour window

      // Check if threshold exceeded
      const threshold = this.ALERT_THRESHOLD[event.type as keyof typeof this.ALERT_THRESHOLD] || 10;
      
      if (count >= threshold) {
        await this.triggerSecurityAlert(event, count);
      }
    }

    // Immediate alert for critical events
    if (event.severity === 'CRITICAL') {
      await this.triggerSecurityAlert(event, 1);
    }
  }

  /**
   * Send security alert to admins
   */
  private async triggerSecurityAlert(event: SecurityEvent, count: number): Promise<void> {
    logger.error('🚨 SECURITY ALERT TRIGGERED', {
      ...event,
      occurrenceCount: count
    });

    try {
      await emailQueue.add('security-alert', {
        to: process.env.SECURITY_EMAIL || process.env.ADMIN_EMAIL || 'admin@jgpnr.com',
        subject: `🚨 Security Alert: ${event.type}`,
        eventType: event.type,
        severity: event.severity,
        count,
        userId: event.userId,
        details: event.details,
        ipAddress: event.ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to send security alert email', { error });
    }
  }

  async logFailedTwoFactor(userId: string, ipAddress?: string, attemptNumber?: number): Promise<void> {
    await this.logSecurityEvent({
      type: 'FAILED_2FA',
      severity: attemptNumber && attemptNumber > 3 ? 'HIGH' : 'MEDIUM',
      userId,
      ipAddress,
      details: { attemptNumber }
    });
  }

  async logIDORAttempt(
    userId: string,
    resourceType: string,
    resourceId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'IDOR_ATTEMPT',
      severity: 'HIGH',
      userId,
      targetResource: `${resourceType}:${resourceId}`,
      ipAddress,
      details: { resourceType, resourceId }
    });
  }

  async logSuspiciousFileUpload(
    userId: string,
    filename: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUSPICIOUS_FILE_UPLOAD',
      severity: 'HIGH',
      userId,
      ipAddress,
      details: { filename, reason }
    });
  }

  async logBulkDelete(
    userId: string,
    resourceType: string,
    count: number,
    ipAddress?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'BULK_DELETE',
      severity: count > 100 ? 'HIGH' : 'MEDIUM',
      userId,
      ipAddress,
      details: { resourceType, count }
    });
  }

  async logSQLInjectionAttempt(
    userId: string | undefined,
    query: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'SQL_INJECTION_ATTEMPT',
      severity: 'CRITICAL',
      userId,
      ipAddress,
      details: { suspiciousQuery: query.substring(0, 200) }
    });
  }
}

export const securityLogger = new SecurityLogger();