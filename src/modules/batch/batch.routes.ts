// src/modules/batch/batch.routes.ts
import { Router } from 'express';
import * as batchController from './batch.controller';
import { authenticateJWT, requireAdmin } from '../../middleware/auth';
import { auditLog } from '../../middleware/audit';
import { csrfProtection } from '../../middleware/csrf';

const router = Router();
router.use(authenticateJWT, csrfProtection,  requireAdmin);

router.post('/tickets/create',csrfProtection,  auditLog('BULK_CREATE_TICKETS', 'BATCH'), batchController.bulkCreateTickets);
router.post('/tickets/cancel',csrfProtection,  auditLog('BULK_CANCEL_TICKETS', 'BATCH'), batchController.bulkCancelTickets);
router.post('/tickets/update-sessions',csrfProtection,  auditLog('BULK_UPDATE_SESSIONS', 'BATCH'), batchController.bulkUpdateSessions);
router.post('/customers/import',csrfProtection,  auditLog('BULK_IMPORT_CUSTOMERS', 'BATCH'), batchController.bulkImportCustomers);
router.post('/emails/send',csrfProtection,  auditLog('BULK_SEND_EMAILS', 'BATCH'), batchController.bulkSendEmails);

export default router;