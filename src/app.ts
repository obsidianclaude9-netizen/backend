import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configureSecurityHeaders } from './middleware/security-headers';
import path from 'path';
import cookieParser from 'cookie-parser';
import { validateRequestSignature } from './middleware/request-signing';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/validate';
import { authenticate, authorizeFileAccess } from './middleware/auth';
import { csrfProtection, getCsrfToken, csrfErrorHandler, autoCSRFProtection } from './middleware/csrf';
import rateLimit from 'express-rate-limit';
import * as paymentController from './modules/payment/payment.controller';
import * as orderController from './modules/orders/order.controller';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { 
  apiLimiter, 
  authLimiter, 
  paymentLimiter,
  orderLimiter,
  fileDownloadLimiter,
} from './middleware/rateLimit';

import { initializeSentry, getSentryMiddleware } from './config/monitoring';
import { logger } from './utils/logger';

import authRoutes from './modules/auth/auth.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import orderRoutes from './modules/orders/order.routes';
import customerRoutes from './modules/customers/customer.routes';
import emailRoutes from './modules/email/email.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import subscriberRoutes from './modules/subscribers/subscriber.routes';
import settingsRoutes from './modules/settings/settings.routes';
import advancedSettingsRoutes from './modules/settings/advancedSettings.routes';
import batchRoutes from './modules/batch/batch.routes';
import monitoringRoutes from './modules/monitoring/monitoring.routes';
import paymentRoutes from './modules/payment/payment.routes';
import auditRoutes from './modules/audit/audit.routes';
import { startAuditCleanup, stopAuditCleanup } from './jobs/audit-cleanup.job';

const app = express();

const API_VERSION = 'v1';

initializeSentry(app);
const sentryMiddleware = getSentryMiddleware();

if (process.env.TRUST_PROXY === 'true') {
  const trustedProxies = process.env.TRUSTED_PROXY_IPS?.split(',').map(ip => ip.trim()) || ['127.0.0.1', '::1'];
  app.set('trust proxy', (ip: string) => {
    const isTrusted = trustedProxies.includes(ip);
    if (!isTrusted) {
      logger.warn(`Untrusted proxy attempt: ${ip}`);
    }
    return isTrusted;
  });
  logger.info(`Trust proxy enabled for: ${trustedProxies.join(', ')}`);
} else {
  app.set('trust proxy', false);
}

app.use(requestIdMiddleware);
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    logger.warn('Webhook rate limit exceeded');
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
});

const csrfTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many CSRF token requests',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/payments/webhook', express.raw({ 
  type: 'application/json',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  hidePoweredBy: true,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

configureSecurityHeaders(app);

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`, {
        allowedOrigins,
        requestOrigin: origin
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Request-Signature', 'X-Request-Timestamp', 'X-Request-Nonce', 'X-Signature-Algorithm'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
}));

app.use(express.json({ 
  limit: '10mb',
  strict: true,
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000,
}));

app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(sanitizeInput);

app.use(autoCSRFProtection);

startAuditCleanup();

app.get('/api/csrf-token', csrfTokenLimiter, getCsrfToken);

app.post('/api/payments/webhook', 
  webhookLimiter,
  paymentController.handleWebhook
);

app.use('/api/auth', authLimiter, authRoutes);

app.use('/api', apiLimiter);

app.post(
  `/api/${API_VERSION}/orders/:id/refund`,
  authenticate,
  validateRequestSignature({ maxAge: 2 * 60 * 1000 }),
  csrfProtection,
  orderController.refundOrder
);

app.post(
  `/api/${API_VERSION}/orders/:id/confirm-payment`,
  authenticate,
  validateRequestSignature({ 
    maxAge: 2 * 60 * 1000,
    includeQuery: true,
    requiredHeaders: ['content-type', 'user-agent']
  }),
  csrfProtection,
  orderController.confirmPayment
);

app.use(`/api/${API_VERSION}/orders`, 
  authenticate, 
  csrfProtection, 
  orderLimiter, 
  orderRoutes
);

app.use(`/api/${API_VERSION}/payments`, 
  authenticate, 
  csrfProtection, 
  paymentLimiter, 
  paymentRoutes
);

app.use(`/api/${API_VERSION}/tickets`, 
  authenticate, 
  csrfProtection, 
  ticketRoutes
);

app.use(`/api/${API_VERSION}/customers`, 
  authenticate, 
  csrfProtection, 
  customerRoutes
);

app.use(`/api/${API_VERSION}/email`, 
  authenticate, 
  csrfProtection, 
  emailRoutes
);

app.use(`/api/${API_VERSION}/batch`, 
  authenticate, 
  csrfProtection, 
  batchRoutes
);

app.use(`/api/${API_VERSION}/analytics`, 
  authenticate, 
  analyticsRoutes
);

app.use(`/api/${API_VERSION}/notifications`, 
  authenticate, 
  notificationRoutes
);

app.use(`/api/${API_VERSION}/subscribers`, 
  authenticate, 
  subscriberRoutes
);

app.use(`/api/${API_VERSION}/settings`, 
  authenticate, 
  settingsRoutes
);

app.use(`/api/${API_VERSION}/settings/advanced`, 
  authenticate, 
  advancedSettingsRoutes
);

app.use(`/api/${API_VERSION}/monitoring`, 
  authenticate, 
  monitoringRoutes
);

app.use(`/api/${API_VERSION}/audit`, 
  authenticate, 
  auditRoutes
);

app.use('/uploads/qrcodes', 
  authenticate, 
  authorizeFileAccess, 
  fileDownloadLimiter,
  (_req, res, next) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(path.join(__dirname, '../uploads/qrcodes'), {
    maxAge: 0,
    dotfiles: 'deny',
    index: false,
  })
);

app.use('/uploads/documents', 
  authenticate, 
  authorizeFileAccess, 
  fileDownloadLimiter,
  (_req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'private, no-cache');
    next();
  },
  express.static(path.join(__dirname, '../uploads/documents'), {
    maxAge: 0,
    dotfiles: 'deny',
    index: false,
  })
);

app.use('/uploads/avatars', 
  authenticate, 
  authorizeFileAccess,
  fileDownloadLimiter,
  (_req, res, next) => {
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(path.join(__dirname, '../uploads/avatars'), {
    maxAge: 0,
    dotfiles: 'deny',
    index: false,
  })
);

app.use('/uploads/*', (_req, res) => {
  logger.warn('Unauthorized uploads access attempt', {
    path: _req.path,
    ip: _req.ip
  });
  res.status(403).json({ error: 'Access denied' });
});

app.use(notFoundHandler);

app.use(sentryMiddleware.errorHandler);

app.use(csrfErrorHandler);

app.use((err: Error & { statusCode?: number; code?: string }, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Application error:', {
    error: err.message,
    statusCode: err.statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;
  
  const message = statusCode >= 500 && !isDev 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    ...(isDev && { 
      stack: err.stack,
      code: err.code 
    }),
  });
});

app.use(errorHandler);

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  try {
    stopAuditCleanup();
    
    setTimeout(() => {
      logger.info('Graceful shutdown complete');
      process.exit(0);
    }, 10000);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
});

export default app;