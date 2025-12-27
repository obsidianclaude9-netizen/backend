"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = exports.listTicketsSchema = exports.validateTicketSchema = exports.scanTicketSchema = exports.updateTicketSchema = exports.createTicketSchema = void 0;
// src/modules/tickets/ticket.schema.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: zod_1.z.string().cuid('Invalid order ID'),
        gameSession: zod_1.z.string().min(1, 'Game session required').max(100),
        quantity: zod_1.z.number().int().min(1).max(50).default(1),
        validityDays: zod_1.z.number().int().min(1).max(365).optional(),
    }),
});
exports.updateTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        gameSession: zod_1.z.string().min(1).max(100).optional(),
        status: zod_1.z.nativeEnum(client_1.TicketStatus).optional(),
        validUntil: zod_1.z.string().datetime().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid ticket ID'),
    }),
});
exports.scanTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        ticketCode: zod_1.z
            .string()
            .min(1, 'Ticket code required')
            .regex(/^JGPNR-\d{4}-[A-Z0-9]{6}$/, 'Invalid ticket code format'),
        scannedBy: zod_1.z.string().min(1, 'Scanner ID required').max(100),
        location: zod_1.z.string().max(200).optional(),
    }),
});
exports.validateTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        ticketCode: zod_1.z
            .string()
            .min(1, 'Ticket code required')
            .regex(/^JGPNR-\d{4}-[A-Z0-9]{6}$/, 'Invalid ticket code format'),
    }),
});
exports.listTicketsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        status: zod_1.z.nativeEnum(client_1.TicketStatus).optional(),
        gameSession: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        orderId: zod_1.z.string().cuid().optional(),
    }),
});
exports.updateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        maxScanCount: zod_1.z.number().int().min(1).max(10).optional(),
        scanWindowDays: zod_1.z.number().int().min(1).max(365).optional(),
        validityDays: zod_1.z.number().int().min(1).max(365).optional(),
        basePrice: zod_1.z.number().positive().optional(),
        allowRefunds: zod_1.z.boolean().optional(),
        allowTransfers: zod_1.z.boolean().optional(),
        enableCategories: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=ticket.schema.js.map