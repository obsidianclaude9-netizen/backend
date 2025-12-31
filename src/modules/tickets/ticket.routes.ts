// src/modules/tickets/ticket.routes.ts
import { Router } from 'express';
import * as ticketController from './ticket.controller';
import { validate } from '../../middleware/validate';
import { authenticateJWT, requireAdmin, requireStaff } from '../../middleware/auth';
import { auditLog } from '../../middleware/audit';
import { authorizeResource } from '../../middleware/authorization';
import {
  createTicketSchema,
  updateTicketSchema,
  scanTicketSchema,
  validateTicketSchema,
  listTicketsSchema,
  updateSettingsSchema,
} from './ticket.schema';

const router = Router();


router.use(authenticateJWT);

router.get(
  '/',
  validate(listTicketsSchema),
  ticketController.listTickets
);

router.get('/stats', ticketController.getTicketStats);

router.get('/active', ticketController.listTickets);

router.get('/scanned', ticketController.listTickets);

router.get('/:id', authorizeResource('ticket', 'id'), ticketController.getTicket);

router.get('/code/:code', ticketController.getTicketByCode);

router.post(
  '/',
  requireAdmin,
  validate(createTicketSchema),
  auditLog('CREATE_TICKETS', 'TICKET'),
  ticketController.createTickets
);

router.patch(
  '/:id',
  requireAdmin,
  validate(updateTicketSchema),
  auditLog('UPDATE_TICKET', 'TICKET'),
  ticketController.updateTicket
);

router.delete(
  '/:id',
  requireAdmin,
  auditLog('CANCEL_TICKET', 'TICKET'),
  ticketController.cancelTicket
);

router.post(
  '/validate',
  requireStaff,
  validate(validateTicketSchema),
  ticketController.validateTicket
);

router.post(
  '/scan',
  requireStaff,
  validate(scanTicketSchema),
  auditLog('SCAN_TICKET', 'TICKET'),
  ticketController.scanTicket
);

router.get(
  '/scans/history',
  requireStaff,
  ticketController.getScanHistory
);

router.get('/settings/config', requireAdmin, ticketController.getSettings);

router.patch(
  '/settings/config',
  requireAdmin,
  validate(updateSettingsSchema),
  auditLog('UPDATE_TICKET_SETTINGS', 'SETTINGS'),
  ticketController.updateSettings
);

export default router;