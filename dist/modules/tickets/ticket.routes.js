"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/tickets/ticket.routes.ts
const express_1 = require("express");
const ticketController = __importStar(require("./ticket.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const audit_1 = require("../../middleware/audit");
const ticket_schema_1 = require("./ticket.schema");
const router = (0, express_1.Router)();
// All ticket routes require authentication
router.use(auth_1.authenticateJWT);
// List & search tickets
router.get('/', (0, validate_1.validate)(ticket_schema_1.listTicketsSchema), ticketController.listTickets);
// Get ticket stats
router.get('/stats', ticketController.getTicketStats);
// Active tickets
router.get('/active', ticketController.listTickets);
// Scanned tickets
router.get('/scanned', ticketController.listTickets);
// Get single ticket
router.get('/:id', ticketController.getTicket);
// Get ticket by code
router.get('/code/:code', ticketController.getTicketByCode);
// Create tickets (Admin+)
router.post('/', auth_1.requireAdmin, (0, validate_1.validate)(ticket_schema_1.createTicketSchema), (0, audit_1.auditLog)('CREATE_TICKETS', 'TICKET'), ticketController.createTickets);
// Update ticket (Admin+)
router.patch('/:id', auth_1.requireAdmin, (0, validate_1.validate)(ticket_schema_1.updateTicketSchema), (0, audit_1.auditLog)('UPDATE_TICKET', 'TICKET'), ticketController.updateTicket);
// Cancel ticket (Admin+)
router.delete('/:id', auth_1.requireAdmin, (0, audit_1.auditLog)('CANCEL_TICKET', 'TICKET'), ticketController.cancelTicket);
// Validate ticket (All staff)
router.post('/validate', auth_1.requireStaff, (0, validate_1.validate)(ticket_schema_1.validateTicketSchema), ticketController.validateTicket);
// Scan ticket (All staff) - CRITICAL ENDPOINT
router.post('/scan', auth_1.requireStaff, (0, validate_1.validate)(ticket_schema_1.scanTicketSchema), (0, audit_1.auditLog)('SCAN_TICKET', 'TICKET'), ticketController.scanTicket);
// Scan history
router.get('/scans/history', auth_1.requireStaff, ticketController.getScanHistory);
// Ticket settings
router.get('/settings/config', auth_1.requireAdmin, ticketController.getSettings);
router.patch('/settings/config', auth_1.requireAdmin, (0, validate_1.validate)(ticket_schema_1.updateSettingsSchema), (0, audit_1.auditLog)('UPDATE_TICKET_SETTINGS', 'SETTINGS'), ticketController.updateSettings);
exports.default = router;
//# sourceMappingURL=ticket.routes.js.map