// src/modules/auth/auth.routes.ts - FIXED
import { Router, Request } from 'express';
import * as authController from './auth.controller';
import * as twoFactorController from './twoFactor.controller';
import { validate } from '../../middleware/validate';
import { authenticateJWT, requireSuperAdmin } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { auditLog } from '../../middleware/audit';
import rateLimit from 'express-rate-limit';
import {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  forgotPasswordSchema, 
  resetPasswordSchema, 
} from './auth.schema';

const router = Router();


const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  skipSuccessfulRequests: false,
  message: 'Too many password change attempts',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many 2FA attempts',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

const emailRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 5, 
  
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    return `email-reset:${email.toLowerCase()}`;
  },

  handler: (req: Request, res: Response) => {
    logger.error('Excessive password reset attempts for single email', {
      email: req.body?.email,
      ip: req.ip
    });

    res.status(429).json({
      error: 'Too many reset attempts for this email',
      message: 'Please contact support if you need assistance',
      retryAfter: 86400
    });
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  skipSuccessfulRequests: false, 
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const ip = req.ip || 'unknown';
    return `${ip}:${email.toLowerCase()}`;
  },

  handler: (req: Request, res: Response) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'Please wait before requesting another password reset',
      retryAfter: 3600 // seconds
    });
  },

  skip: (req: Request) => {
    const internalIPs = process.env.INTERNAL_IPS?.split(',') || [];
    return internalIPs.includes(req.ip || '');
  }
});


router.post(
  '/login',
  authLimiter, // 5 attempts per 15 minutes
  validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.use(authenticateJWT);

router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);

// Profile update
router.patch(
  '/profile',
  validate(updateUserSchema),
  authController.updateProfile
);

// 2FA routes with rate limiting
router.post(
  '/2fa/generate',
  twoFactorLimiter,
  auditLog('GENERATE_2FA', 'AUTH'),
  twoFactorController.generateSecret
);


router.post(
  '/2fa/enable',
  twoFactorLimiter,
  auditLog('ENABLE_2FA', 'AUTH'),
  twoFactorController.enableTwoFactor
);

router.post(
  '/2fa/verify',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
  }),
  twoFactorLimiter, 
  twoFactorController.verifyToken
);

router.post(
  '/2fa/disable',
  passwordLimiter,
  auditLog('DISABLE_2FA', 'AUTH'),
  twoFactorController.disableTwoFactor
);

router.post(
  '/2fa/regenerate-codes',
  passwordLimiter,
  auditLog('REGENERATE_2FA_CODES', 'AUTH'),
  twoFactorController.regenerateBackupCodes
);

router.get('/users', requireSuperAdmin, authController.listUsers);
router.get('/users/:id', requireSuperAdmin, authController.getUser);

router.post(
  '/users',
  requireSuperAdmin,
  validate(createUserSchema),
  auditLog('CREATE_USER', 'USER'),
  authController.createUser
);

router.patch(
  '/users/:id',
  requireSuperAdmin,
  validate(updateUserSchema),
  auditLog('UPDATE_USER', 'USER'),
  authController.updateUser
);

router.patch(
  '/users/:id/password',
  passwordLimiter, // CRITICAL: Prevent brute force
  validate(changePasswordSchema),
  auditLog('CHANGE_PASSWORD', 'USER'),
  authController.changePassword
);

router.post(
  '/users/:id/reactivate',
  requireSuperAdmin,
  auditLog('REACTIVATE_USER', 'USER'),
  authController.reactivateUser
);

router.delete(
  '/users/:id',
  requireSuperAdmin,
  auditLog('DELETE_USER', 'USER'),
  authController.deleteUser
);

router.delete(
  '/users/:id/deactivate',
  requireSuperAdmin,
  auditLog('DEACTIVATE_USER', 'USER'),
  authController.deactivateUser
);

router.post(
  '/forgot-password',
  passwordResetLimiter, 
  validate(forgotPasswordSchema),
  authController.requestPasswordReset
);
router.post(
  '/reset-password',
  emailRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword 
);
export default router;