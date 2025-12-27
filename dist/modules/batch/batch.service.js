"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
// src/modules/batch/batch.service.ts
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
const ticket_service_1 = require("../tickets/ticket.service");
const ticket_utils_1 = require("../../utils/ticket.utils");
const websocket_1 = require("../../config/websocket");
const ticketService = new ticket_service_1.TicketService();
class BatchService {
    /**
     * Bulk create tickets
     */
    async bulkCreateTickets(data) {
        if (data.quantity < 1 || data.quantity > 500) {
            throw new errorHandler_1.AppError(400, 'Quantity must be between 1 and 500');
        }
        const order = await database_1.default.order.findUnique({
            where: { id: data.orderId },
            include: { customer: true },
        });
        if (!order) {
            throw new errorHandler_1.AppError(404, 'Order not found');
        }
        const settings = await ticketService.getSettings();
        if (!settings) {
            throw new errorHandler_1.AppError(500, 'Failed to load ticket settings');
        }
        const tickets = [];
        // Create tickets in batches of 50
        const batchSize = 50;
        const batches = Math.ceil(data.quantity / batchSize);
        for (let i = 0; i < batches; i++) {
            const batchCount = Math.min(batchSize, data.quantity - i * batchSize);
            const batchTickets = [];
            for (let j = 0; j < batchCount; j++) {
                batchTickets.push({
                    ticketCode: (0, ticket_utils_1.generateTicketCode)(),
                    orderId: data.orderId,
                    gameSession: data.gameSession,
                    validUntil: (0, ticket_utils_1.addDays)(new Date(), data.validityDays || settings.validityDays),
                    maxScans: settings.maxScanCount,
                    scanWindow: settings.scanWindowDays,
                    status: client_1.TicketStatus.ACTIVE,
                });
            }
            tickets.push(...batchTickets);
            logger_1.logger.info(`Created batch ${i + 1}/${batches} (${batchCount} tickets)`);
        }
        (0, websocket_1.emitToAdmins)('batch:complete', {
            type: 'bulk_create_tickets',
            count: tickets.length,
            orderId: data.orderId,
        });
        logger_1.logger.info(`Bulk created ${tickets.length} tickets for order ${data.orderId}`);
        return {
            created: tickets.length,
            tickets: tickets.slice(0, 10), // Return first 10 for preview
        };
    }
    /**
     * Bulk cancel tickets
     */
    async bulkCancelTickets(ticketIds) {
        if (ticketIds.length < 1 || ticketIds.length > 500) {
            throw new errorHandler_1.AppError(400, 'Must provide between 1 and 500 ticket IDs');
        }
        // Verify tickets exist and are cancellable
        const tickets = await database_1.default.ticket.findMany({
            where: {
                id: { in: ticketIds },
                status: { in: [client_1.TicketStatus.ACTIVE] },
            },
        });
        if (tickets.length === 0) {
            throw new errorHandler_1.AppError(400, 'No valid tickets to cancel');
        }
        // Get IDs of valid tickets
        const validTicketIds = tickets.map((t) => t.id);
        // Cancel in transaction
        const result = await database_1.default.ticket.updateMany({
            where: { id: { in: validTicketIds } },
            data: { status: client_1.TicketStatus.CANCELLED },
        });
        (0, websocket_1.emitToAdmins)('batch:complete', {
            type: 'bulk_cancel_tickets',
            count: result.count,
        });
        logger_1.logger.info(`Bulk cancelled ${result.count} tickets`);
        return {
            cancelled: result.count,
            requested: ticketIds.length,
        };
    }
    /**
     * Bulk update ticket sessions
     */
    async bulkUpdateSessions(ticketIds, newSession) {
        if (ticketIds.length < 1 || ticketIds.length > 500) {
            throw new errorHandler_1.AppError(400, 'Must provide between 1 and 500 ticket IDs');
        }
        const result = await database_1.default.ticket.updateMany({
            where: { id: { in: ticketIds } },
            data: { gameSession: newSession },
        });
        logger_1.logger.info(`Bulk updated ${result.count} ticket sessions to ${newSession}`);
        return {
            updated: result.count,
            newSession,
        };
    }
    /**
     * Bulk import customers from CSV
     */
    async bulkImportCustomers(customers) {
        if (customers.length < 1 || customers.length > 1000) {
            throw new errorHandler_1.AppError(400, 'Must provide between 1 and 1000 customers');
        }
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [],
        };
        for (const customer of customers) {
            try {
                // Check if customer exists
                const existing = await database_1.default.customer.findUnique({
                    where: { email: customer.email },
                });
                if (existing) {
                    // Update existing
                    await database_1.default.customer.update({
                        where: { email: customer.email },
                        data: customer,
                    });
                    results.updated++;
                }
                else {
                    // Create new
                    await database_1.default.customer.create({
                        data: customer,
                    });
                    results.created++;
                }
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    email: customer.email,
                    error: error.message,
                });
            }
        }
        logger_1.logger.info(`Bulk imported customers: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
        return results;
    }
    /**
     * Bulk send emails
     */
    async bulkSendEmails(data) {
        if (data.customerIds.length < 1 || data.customerIds.length > 1000) {
            throw new errorHandler_1.AppError(400, 'Must provide between 1 and 1000 customer IDs');
        }
        const customers = await database_1.default.customer.findMany({
            where: {
                id: { in: data.customerIds },
                status: 'active',
            },
            select: { id: true, email: true, firstName: true },
        });
        if (customers.length === 0) {
            throw new errorHandler_1.AppError(400, 'No valid customers found');
        }
        // Queue emails
        const { emailQueue } = require('../../config/queue');
        for (const customer of customers) {
            await emailQueue.add('single-email', {
                to: customer.email,
                subject: data.subject,
                html: data.body.replace('{firstName}', customer.firstName),
            });
        }
        logger_1.logger.info(`Queued ${customers.length} emails`);
        return {
            queued: customers.length,
            requested: data.customerIds.length,
        };
    }
    /**
     * Get batch operation status
     */
    async getBatchStatus(batchId) {
        // Implementation depends on how you track batch operations
        // Could use Redis or database table
        const cacheService = require('../../utils/cache.service').cacheService;
        const status = await cacheService.get(`batch:${batchId}`);
        if (!status) {
            throw new errorHandler_1.AppError(404, 'Batch operation not found');
        }
        return status;
    }
}
exports.BatchService = BatchService;
//# sourceMappingURL=batch.service.js.map