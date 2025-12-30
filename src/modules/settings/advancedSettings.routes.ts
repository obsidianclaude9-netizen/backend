import { Router } from 'express';
import * as settingsController from './advancedSettings.controller';
import { validate } from '../../middleware/validate';
import { authenticateJWT, requireSuperAdmin } from '../../middleware/auth';
import { auditLog } from '../../middleware/audit';
import {
  updateRegionalSettingsSchema,
  updateOperatingHoursSchema,
  updateEmailFooterSchema,
  updatePaymentGatewaySchema,
  updateTransactionSettingsSchema,
  updateNotificationPreferencesSchema,
} from './advancedSettings.schema';
import { csrfProtection } from '../../middleware/csrf';
const router = Router();
router.use(authenticateJWT, requireSuperAdmin);

// Get all settings
router.get('/all', settingsController.getAllSettings);

// Regional settings
router.patch(
  '/regional',
  validate(updateRegionalSettingsSchema),
  csrfProtection, 
  auditLog('UPDATE_REGIONAL_SETTINGS', 'SETTINGS'),
  settingsController.updateRegionalSettings
);

// Operating hours
router.patch(
  '/operating-hours',
  validate(updateOperatingHoursSchema),
  csrfProtection, 
  auditLog('UPDATE_OPERATING_HOURS', 'SETTINGS'),
  settingsController.updateOperatingHours
);

// Email footer
router.patch(
  '/email-footer',
  validate(updateEmailFooterSchema),
  csrfProtection, 
  auditLog('UPDATE_EMAIL_FOOTER', 'SETTINGS'),
  settingsController.updateEmailFooter
);

// Payment gateway
router.patch(
  '/payment-gateway',
  validate(updatePaymentGatewaySchema),
  csrfProtection, 
  auditLog('UPDATE_PAYMENT_GATEWAY', 'SETTINGS'),
  settingsController.updatePaymentGateway
);

// Transaction settings
router.patch(
  '/transaction',
  validate(updateTransactionSettingsSchema),
  csrfProtection, 
  auditLog('UPDATE_TRANSACTION_SETTINGS', 'SETTINGS'),
  settingsController.updateTransactionSettings
);

// Notification preferences
router.patch(
  '/notifications',
  validate(updateNotificationPreferencesSchema),
  csrfProtection, 
  auditLog('UPDATE_NOTIFICATION_PREFERENCES', 'SETTINGS'),
  settingsController.updateNotificationPreferences
);

// Login activity & sessions
router.get('/login-activity', settingsController.getLoginActivities);
router.get('/sessions', settingsController.getActiveSessions);
router.delete('/sessions/:sessionId',csrfProtection,  settingsController.terminateSession);
router.delete('/sessions',csrfProtection,  settingsController.terminateAllSessions);

export default router;
