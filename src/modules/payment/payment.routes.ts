// src/modules/payment/payment.routes.ts
import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authenticateJWT, requireStaff } from '../../middleware/auth';
import { paymentLimiter } from '../../middleware/rateLimit';
import { auditLog } from '../../middleware/audit';
import rateLimit from 'express-rate-limit';
import logger from '../../utils/logger';

const router = Router();

const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, 
    message: 'Too many webhook requests',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip || 'unknown';
    },
    skip: (req) => {
      const paystackIPs = [
        '52.31.139.75',
        '52.49.173.169',
        '52.214.14.220',
      ];
      return paystackIPs.includes(req.ip || '');
    },
    handler: (req, res) => {
      logger.error('Webhook rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(429).json({
        error: 'Too many webhook requests',
        message: 'Rate limit exceeded',
      });
    },
  });

router.post('/webhook', webhookLimiter, paymentController.handleWebhook);

router.use(authenticateJWT, requireStaff);

router.post(
  '/initialize/:orderId',
  paymentLimiter, 
  auditLog('INITIALIZE_PAYMENT', 'PAYMENT'),
  paymentController.initializePayment
);

router.get(
  '/verify/:reference',
  paymentLimiter,
  auditLog('VERIFY_PAYMENT', 'PAYMENT'),
  paymentController.verifyPayment
);

export default router;