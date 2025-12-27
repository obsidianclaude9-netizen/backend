"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
// src/modules/tickets/ticket.service.ts
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const monitoring_service_1 = require("../../utils/monitoring.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const ticket_utils_1 = require("../../utils/ticket.utils");
const logger_1 = require("../../utils/logger");
class TicketService {
    async createTickets(data) {
        const order = await database_1.default.order.findUnique({
            where: { id: data.orderId },
            include: { customer: true },
        });
        if (!order) {
            throw new errorHandler_1.AppError(404, 'Order not found');
        }
        const settings = await this.getSettings();
        const tickets = [];
        const quantity = data.quantity || 1;
        for (let i = 0; i < quantity; i++) {
            const ticketCode = (0, ticket_utils_1.generateTicketCode)();
            const validUntil = (0, ticket_utils_1.addDays)(new Date(), data.validityDays || settings.validityDays);
            const ticket = await database_1.default.ticket.create({
                data: {
                    ticketCode,
                    orderId: data.orderId,
                    gameSession: data.gameSession,
                    validUntil,
                    maxScans: settings.maxScanCount,
                    scanWindow: settings.scanWindowDays,
                    status: client_1.TicketStatus.ACTIVE,
                },
            });
            try {
                const qrPath = await (0, ticket_utils_1.generateQRCode)(ticketCode, {
                    orderId: order.id,
                    customerId: order.customerId,
                    gameSession: data.gameSession,
                    validUntil,
                });
                await database_1.default.ticket.update({
                    where: { id: ticket.id },
                    data: { qrCodePath: qrPath },
                });
            }
            catch (error) {
                logger_1.logger.error('QR generation failed for ticket:', ticket.id, error);
            }
            tickets.push(ticket);
        }
        logger_1.logger.info(`Created ${quantity} tickets for order ${data.orderId}`);
        return tickets;
    }
    async listTickets(filters) {
        // Implementation from previous artifact
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.gameSession)
            where.gameSession = { contains: filters.gameSession, mode: 'insensitive' };
        if (filters.search)
            where.ticketCode = { contains: filters.search, mode: 'insensitive' };
        if (filters.orderId)
            where.orderId = filters.orderId;
        const [tickets, total] = await Promise.all([
            database_1.default.ticket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    order: {
                        include: {
                            customer: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            }),
            database_1.default.ticket.count({ where }),
        ]);
        return {
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getTicket(ticketId) {
        const ticket = await database_1.default.ticket.findUnique({
            where: { id: ticketId },
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
                scanHistory: {
                    orderBy: { scannedAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!ticket) {
            throw new errorHandler_1.AppError(404, 'Ticket not found');
        }
        return ticket;
    }
    async getTicketByCode(ticketCode) {
        const ticket = await database_1.default.ticket.findUnique({
            where: { ticketCode },
            include: {
                order: {
                    include: {
                        customer: true,
                    },
                },
                scanHistory: {
                    orderBy: { scannedAt: 'desc' },
                },
            },
        });
        if (!ticket) {
            throw new errorHandler_1.AppError(404, 'Ticket not found');
        }
        return ticket;
    }
    async updateTicket(ticketId, data) {
        const ticket = await database_1.default.ticket.update({
            where: { id: ticketId },
            data,
        });
        logger_1.logger.info(`Ticket updated: ${ticket.ticketCode}`);
        return ticket;
    }
    async cancelTicket(ticketId) {
        const ticket = await database_1.default.ticket.update({
            where: { id: ticketId },
            data: { status: client_1.TicketStatus.CANCELLED },
        });
        logger_1.logger.info(`Ticket cancelled: ${ticket.ticketCode}`);
        return ticket;
    }
    async validateTicket(data) {
        const ticket = await database_1.default.ticket.findUnique({
            where: { ticketCode: data.ticketCode },
        });
        if (!ticket) {
            return {
                valid: false,
                reason: 'Ticket not found',
                ticket: null,
            };
        }
        if (ticket.status === client_1.TicketStatus.CANCELLED) {
            return {
                valid: false,
                reason: 'Ticket has been cancelled',
                ticket,
            };
        }
        if (ticket.status === client_1.TicketStatus.EXPIRED) {
            return {
                valid: false,
                reason: 'Ticket has expired',
                ticket,
            };
        }
        if ((0, ticket_utils_1.isTicketExpired)(ticket.validUntil)) {
            await database_1.default.ticket.update({
                where: { id: ticket.id },
                data: { status: client_1.TicketStatus.EXPIRED },
            });
            return {
                valid: false,
                reason: 'Ticket validity period has expired',
                ticket,
            };
        }
        if (ticket.scanCount >= ticket.maxScans) {
            return {
                valid: false,
                reason: `Maximum scan limit (${ticket.maxScans}) reached`,
                ticket,
            };
        }
        if (ticket.firstScanAt && ticket.scanCount > 0) {
            const daysSinceFirst = (0, ticket_utils_1.daysBetween)(ticket.firstScanAt, new Date());
            if (daysSinceFirst > ticket.scanWindow) {
                return {
                    valid: false,
                    reason: `Scan window of ${ticket.scanWindow} days has expired`,
                    ticket,
                };
            }
            const remainingDays = ticket.scanWindow - daysSinceFirst;
            return {
                valid: true,
                reason: `Valid (${remainingDays} days remaining in scan window)`,
                ticket,
                remainingScans: ticket.maxScans - ticket.scanCount,
                remainingDays,
            };
        }
        return {
            valid: true,
            reason: 'Valid (first scan)',
            ticket,
            remainingScans: ticket.maxScans - ticket.scanCount,
        };
    }
    async scanTicket(data) {
        const validation = await this.validateTicket({
            ticketCode: data.ticketCode,
        });
        const scanRecord = await database_1.default.ticketScan.create({
            data: {
                ticketId: validation.ticket.id,
                scannedBy: data.scannedBy,
                location: data.location,
                allowed: validation.valid,
                reason: validation.reason,
            },
        });
        if (validation.valid) {
            const updateData = {
                scanCount: { increment: 1 },
                lastScanAt: new Date(),
            };
            if (!validation.ticket.firstScanAt) {
                updateData.firstScanAt = new Date();
            }
            if (validation.ticket.scanCount + 1 >= validation.ticket.maxScans) {
                updateData.status = client_1.TicketStatus.SCANNED;
            }
            await database_1.default.ticket.update({
                where: { id: validation.ticket.id },
                data: updateData,
            });
            logger_1.logger.info(`Ticket scanned: ${data.ticketCode} by ${data.scannedBy}`);
        }
        else {
            logger_1.logger.warn(`Scan denied: ${data.ticketCode} - ${validation.reason}`);
        }
        const start = Date.now();
        try {
            const result = await this.validateTicket({ ticketCode: data.ticketCode });
            monitoring_service_1.monitoring.addBreadcrumb('Ticket scanned', {
                ticketCode: data.ticketCode,
                valid: result.valid,
            });
            monitoring_service_1.monitoring.trackPerformance('scanTicket', Date.now() - start);
            return result;
        }
        catch (error) {
            monitoring_service_1.monitoring.captureException(error, {
                operation: 'scanTicket',
                ticketCode: data.ticketCode,
            });
            throw error;
        }
        return {
            ...validation,
            scanId: scanRecord.id,
            scannedAt: scanRecord.scannedAt,
        };
    }
    async getScanHistory(_filters) {
        const where = {};
        if (_filters.ticketId) {
            where.ticketId = _filters.ticketId;
        }
        const scans = await database_1.default.ticketScan.findMany({
            where,
            take: _filters.limit || 100,
            orderBy: { scannedAt: 'desc' },
            include: {
                ticket: {
                    select: {
                        ticketCode: true,
                        gameSession: true,
                    },
                },
            },
        });
        return scans;
    }
    async getTicketStats() {
        const [total, active, scanned, cancelled, expired] = await Promise.all([
            database_1.default.ticket.count(),
            database_1.default.ticket.count({ where: { status: client_1.TicketStatus.ACTIVE } }),
            database_1.default.ticket.count({ where: { status: client_1.TicketStatus.SCANNED } }),
            database_1.default.ticket.count({ where: { status: client_1.TicketStatus.CANCELLED } }),
            database_1.default.ticket.count({ where: { status: client_1.TicketStatus.EXPIRED } }),
        ]);
        const scanRate = total > 0 ? ((scanned / total) * 100).toFixed(2) : '0.00';
        return {
            total,
            active,
            scanned,
            cancelled,
            expired,
            scanRate: parseFloat(scanRate),
        };
    }
    async getSettings() {
        let settings = await database_1.default.ticketSettings.findUnique({
            where: { id: 1 },
        });
        if (!settings) {
            settings = await database_1.default.ticketSettings.create({
                data: {
                    id: 1,
                    maxScanCount: 2,
                    scanWindowDays: 14,
                    validityDays: 30,
                    basePrice: 2500,
                },
            });
        }
        return settings;
    }
    async updateSettings(data) {
        const settings = await database_1.default.ticketSettings.upsert({
            where: { id: 1 },
            update: data,
            create: {
                id: 1,
                ...data,
            },
        });
        logger_1.logger.info('Ticket settings updated');
        return settings;
    }
}
exports.TicketService = TicketService;
//# sourceMappingURL=ticket.service.js.map