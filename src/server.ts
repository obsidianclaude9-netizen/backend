import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { logger } from './utils/logger';
import { createTransporter } from './config/email';
import { initializeWebSocket, closeWebSocket } from './config/websocket';
import { initializeSentry } from './config/monitoring';
import { initializeStorage, cleanupTempFiles } from './config/storage';
import prisma from './config/database';
import { emailWorker, campaignWorker } from './jobs/email.jobs';
import { reportWorker, initializeScheduler } from './jobs/scheduler.jobs';
import { analyticsWorker, initializeAnalyticsJobs } from './jobs/analytics.jobs';
import { scheduleViewRefresh } from './jobs/view-refresh.job';
import { destroyNonceStore } from './middleware/request-signing';
import cron from 'node-cron';

const PORT = process.env.PORT || 5000;

let isShuttingDown = false;

function sanitizeError(error: any): any {
  if (!error) return error;
  
  const sensitivePatterns = [
    /jwt_secret/gi,
    /password/gi,
    /secret/gi,
    /api[_-]?key/gi,
    /token/gi,
    /encryption[_-]?key/gi,
  ];
  
  let message = error.message || String(error);
  let stack = error.stack || '';
  
  sensitivePatterns.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
    stack = stack.replace(pattern, '[REDACTED]');
  });
  
  return {
    message,
    name: error.name,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
  };
}

function validateEnvironment(): void {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'QR_ENCRYPTION_KEY',
    'FILE_ENCRYPTION_KEY',
    'REDIS_HOST',
    'REDIS_PORT',
    'PAYSTACK_SECRET_KEY',
    'REQUEST_SIGNING_SECRET',
  ];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      errors.push(`Missing required variable: ${varName}`);
    }
  }
  
  if (errors.length > 0) {
    logger.error('Environment validation failed - missing variables:', { count: errors.length });
    throw new Error(`Missing required environment variables:\n${errors.join('\n')}`);
  }
  
  const secrets = [
    { name: 'JWT_SECRET', minLength: 32 },
    { name: 'JWT_REFRESH_SECRET', minLength: 32 },
    { name: 'REQUEST_SIGNING_SECRET', minLength: 32 },
  ];
  
  for (const { name, minLength } of secrets) {
    const value = process.env[name]!;
    
    if (value.length < minLength) {
      errors.push(`${name} must be at least ${minLength} characters (current: ${value.length})`);
    }
    
    const placeholders = [
      'your_jwt_secret_key_here',
      'your_secret_here',
      'changeme',
      'secret',
      'password123',
    ];
    
    if (placeholders.some(p => value.toLowerCase().includes(p))) {
      errors.push(`${name} appears to be a placeholder value`);
    }
    
    if (/^(.)\1+$/.test(value)) {
      errors.push(`${name} contains only repeated characters`);
    }
  }
  
  const qrKey = process.env.QR_ENCRYPTION_KEY!;
  if (!/^[0-9a-fA-F]{64}$/.test(qrKey)) {
    errors.push('QR_ENCRYPTION_KEY must be 64 character hex string (use: openssl rand -hex 32)');
  }
  
  if (process.env.QR_ENCRYPTION_KEY_V2) {
    const qrKeyV2 = process.env.QR_ENCRYPTION_KEY_V2;
    if (!/^[0-9a-fA-F]{64}$/.test(qrKeyV2)) {
      errors.push('QR_ENCRYPTION_KEY_V2 must be 64 character hex string');
    }
    if (qrKeyV2 === qrKey) {
      errors.push('QR_ENCRYPTION_KEY_V2 must be different from QR_ENCRYPTION_KEY');
    }
  }
  
  const fileKey = process.env.FILE_ENCRYPTION_KEY!;
  if (!/^[0-9a-fA-F]{64}$/.test(fileKey)) {
    errors.push('FILE_ENCRYPTION_KEY must be 64 character hex string (use: openssl rand -hex 32)');
  }
  
  const signingSecret = process.env.REQUEST_SIGNING_SECRET!;
  if (!/^[0-9a-fA-F]{64,}$/.test(signingSecret)) {
    errors.push('REQUEST_SIGNING_SECRET should be hex string (use: openssl rand -hex 64)');
  }
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14');
  if (isNaN(rounds) || rounds < 12 || rounds > 16) {
    errors.push('BCRYPT_ROUNDS must be between 12 and 16');
  }
  
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const origins = corsOrigin.split(',').map(o => o.trim());
    for (const origin of origins) {
      try {
        new URL(origin);
      } catch {
        errors.push(`Invalid CORS origin: ${origin}`);
      }
    }
  }
  
  const smtpPort = parseInt(process.env.SMTP_PORT!);
  if (isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    errors.push('SMTP_PORT must be a valid port number (1-65535)');
  }
  
  const redisPort = parseInt(process.env.REDIS_PORT!);
  if (isNaN(redisPort) || redisPort < 1 || redisPort > 65535) {
    errors.push('REDIS_PORT must be a valid port number (1-65535)');
  }
  
  if (errors.length > 0) {
    logger.error('Environment validation failed:', { errorCount: errors.length });
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  const duration = Date.now() - startTime;
  logger.info('✓ Environment validation passed', { durationMs: duration });
}

function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!process.env.SENTRY_DSN) {
    errors.push('SENTRY_DSN must be set in production');
  }
  
  const corsOrigin = process.env.CORS_ORIGIN || '';
  if (corsOrigin.includes('localhost') || corsOrigin.includes('127.0.0.1')) {
    errors.push('CORS_ORIGIN should not include localhost in production');
  }
  
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '14');
  if (bcryptRounds < 14) {
    errors.push('BCRYPT_ROUNDS should be at least 14 in production');
  }
  
  if (process.env.TRUST_PROXY !== 'true') {
    warnings.push('TRUST_PROXY is not enabled - IP addresses may be incorrect behind a proxy');
  }
  
  if (!process.env.COOKIE_SECRET) {
    errors.push('COOKIE_SECRET must be set in production');
  }
  
  // Additional production checks
  if (!process.env.RATE_LIMIT_MAX) {
    warnings.push('RATE_LIMIT_MAX not set - using default rate limiting');
  }
  
  if (!process.env.SESSION_TIMEOUT) {
    warnings.push('SESSION_TIMEOUT not set - using default session timeout');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    errors.push('NODE_ENV must be explicitly set to "production"');
  }
  
  if (warnings.length > 0) {
    logger.warn('Production configuration warnings:', { warnings });
  }
  
  if (errors.length > 0) {
    logger.error('Production configuration validation failed:', { errorCount: errors.length });
    throw new Error(`Production configuration incomplete:\n${errors.join('\n')}`);
  }
  
  logger.info('✓ Production configuration validated');
}

async function performHealthChecks(): Promise<void> {
  const checks: Array<{ name: string; check: () => Promise<void> }> = [
    {
      name: 'Database',
      check: async () => {
        await prisma.$queryRaw`SELECT 1`;
      }
    },
  ];
  
  const results = await Promise.allSettled(
    checks.map(async ({ name, check }) => {
      try {
        await check();
        logger.info(`✓ ${name} health check passed`);
      } catch (error) {
        logger.error(`✗ ${name} health check failed`, sanitizeError(error));
        throw error;
      }
    })
  );
  
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    throw new Error(`${failed.length} health check(s) failed`);
  }
}

const startServer = async () => {
  const startupStartTime = Date.now();
  
  try {
    logger.info('Starting server initialization...');
    
    const timings: Record<string, number> = {};
    
    let stepStart = Date.now();
    initializeSentry(app);
    timings.sentry = Date.now() - stepStart;
    logger.info('✓ Sentry initialized', { durationMs: timings.sentry });

    stepStart = Date.now();
    initializeStorage();
    timings.storage = Date.now() - stepStart;
    logger.info('✓ Storage initialized', { durationMs: timings.storage });

    stepStart = Date.now();
    await prisma.$connect();
    timings.database = Date.now() - stepStart;
    logger.info('✓ Database connected', { durationMs: timings.database });

    stepStart = Date.now();
    await createTransporter();
    timings.smtp = Date.now() - stepStart;
    logger.info('✓ SMTP transporter initialized', { durationMs: timings.smtp });

    stepStart = Date.now();
    await initializeScheduler();
    timings.scheduler = Date.now() - stepStart;
    logger.info('✓ Report scheduler initialized', { durationMs: timings.scheduler });

    stepStart = Date.now();
    await initializeAnalyticsJobs();
    timings.analytics = Date.now() - stepStart;
    logger.info('✓ Analytics jobs initialized', { durationMs: timings.analytics });

    stepStart = Date.now();
    scheduleViewRefresh();
    timings.viewRefresh = Date.now() - stepStart;
    logger.info('✓ Materialized view refresh scheduled', { durationMs: timings.viewRefresh });

    stepStart = Date.now();
    cron.schedule('0 2 * * *', () => {
      logger.info('Running scheduled temp file cleanup...');
      cleanupTempFiles();
    });
    timings.cronSetup = Date.now() - stepStart;
    logger.info('✓ Temp file cleanup scheduled (daily at 2 AM)', { durationMs: timings.cronSetup });

    const httpServer = http.createServer(app);

    stepStart = Date.now();
    await initializeWebSocket(httpServer);
    timings.websocket = Date.now() - stepStart;
    logger.info('✓ WebSocket server initialized', { durationMs: timings.websocket });

    stepStart = Date.now();
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(PORT, () => {
        resolve();
      });
      
      httpServer.on('error', (error) => {
        reject(error);
      });
    });
    timings.httpServer = Date.now() - stepStart;

    stepStart = Date.now();
    await performHealthChecks();
    timings.healthChecks = Date.now() - stepStart;
    logger.info('✓ Health checks passed', { durationMs: timings.healthChecks });

    const totalStartupTime = Date.now() - startupStartTime;
    
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`⏱️  Startup time: ${totalStartupTime}ms`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    logger.info(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
    logger.info(`📁 File uploads: ${process.env.UPLOADS_DIR || './uploads'}`);
    logger.info(`💳 Payment: Paystack${process.env.FLUTTERWAVE_SECRET_KEY ? ' + Flutterwave' : ''}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Startup timings:', timings);
    }

    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) {
        logger.warn(`${signal} received during shutdown, ignoring...`);
        return;
      }
      
      isShuttingDown = true;
      logger.info(`${signal} received, initiating graceful shutdown...`);

      const shutdownTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, 15000);

      try {
        httpServer.close(async () => {
          logger.info('✓ HTTP server closed');
        });

        await closeWebSocket();
        logger.info('✓ WebSocket server closed');

        destroyNonceStore();
        logger.info('✓ Nonce store cleaned up');

        await Promise.all([
          emailWorker.close(),
          campaignWorker.close(),
          reportWorker.close(),
          analyticsWorker.close(),
        ]);
        logger.info('✓ Queue workers closed');

        await prisma.$disconnect();
        logger.info('✓ Database disconnected');

        clearTimeout(shutdownTimeout);
        logger.info('✓ Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', sanitizeError(error));
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', sanitizeError(error));
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    error: sanitizeError(reason),
    promiseInfo: 'Promise rejected without handler'
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', sanitizeError(error));
  process.exit(1);
});

try {
  validateEnvironment();
  validateProductionConfig();
  startServer();
} catch (error) {
  logger.error('Startup validation failed:', sanitizeError(error));
  process.exit(1);
}