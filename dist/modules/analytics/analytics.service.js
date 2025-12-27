"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
// src/modules/analytics/analytics.service.ts
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = require("../../utils/logger");
const json2csv_1 = require("json2csv");
class AnalyticsService {
    /**
     * Get revenue metrics
     */
    async getRevenueMetrics(startDate, endDate) {
        const where = {
            status: 'COMPLETED',
        };
        if (startDate || endDate) {
            where.purchaseDate = {};
            if (startDate)
                where.purchaseDate.gte = new Date(startDate);
            if (endDate)
                where.purchaseDate.lte = new Date(endDate);
        }
        const [totalRevenue, orderCount, avgOrderValue, revenueByMonth] = await Promise.all([
            database_1.default.order.aggregate({
                where,
                _sum: { amount: true },
            }),
            database_1.default.order.count({ where }),
            database_1.default.order.aggregate({
                where,
                _avg: { amount: true },
            }),
            database_1.default.$queryRaw `
        SELECT 
          TO_CHAR(purchase_date, 'YYYY-MM') as month,
          SUM(amount)::numeric as revenue,
          COUNT(*)::int as orders
        FROM orders
        WHERE status = 'COMPLETED'
        ${startDate ? client_1.Prisma.sql `AND purchase_date >= ${new Date(startDate)}::timestamp` : client_1.Prisma.empty}
        ${endDate ? client_1.Prisma.sql `AND purchase_date <= ${new Date(endDate)}::timestamp` : client_1.Prisma.empty}
        GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,
        ]);
        return {
            totalRevenue: Number(totalRevenue._sum.amount) || 0,
            orderCount,
            avgOrderValue: Number(avgOrderValue._avg.amount) || 0,
            revenueByMonth: revenueByMonth.map(m => ({
                month: m.month,
                revenue: Number(m.revenue),
                orders: m.orders,
            })),
        };
    }
    /**
     * Get ticket statistics
     */
    async getTicketStats(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [total, byStatus, scanRate, expiringCount, bySession] = await Promise.all([
            database_1.default.ticket.count({ where }),
            database_1.default.ticket.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            database_1.default.ticket.aggregate({
                where,
                _avg: { scanCount: true },
            }),
            database_1.default.ticket.count({
                where: {
                    status: 'ACTIVE',
                    validUntil: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
                    },
                },
            }),
            database_1.default.ticket.groupBy({
                by: ['gameSession'],
                where,
                _count: true,
                orderBy: { _count: { gameSession: 'desc' } },
            }),
        ]);
        const statusBreakdown = byStatus.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item._count;
            return acc;
        }, {});
        return {
            total,
            statusBreakdown,
            avgScanCount: Number(scanRate._avg.scanCount) || 0,
            expiringInWeek: expiringCount,
            byGameSession: bySession.map(s => ({
                session: s.gameSession,
                count: s._count,
            })),
        };
    }
    /**
     * Get customer statistics
     */
    async getCustomerStats(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [total, active, withOrders, topSpenders, newCustomers] = await Promise.all([
            database_1.default.customer.count({ where }),
            database_1.default.customer.count({ where: { ...where, status: 'active' } }),
            database_1.default.customer.count({ where: { ...where, totalOrders: { gt: 0 } } }),
            database_1.default.customer.findMany({
                where: { totalOrders: { gt: 0 } },
                orderBy: { totalSpent: 'desc' },
                take: 10,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    totalOrders: true,
                    totalSpent: true,
                },
            }),
            database_1.default.$queryRaw `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*)::int as count
        FROM customers
        ${startDate ? client_1.Prisma.sql `WHERE created_at >= ${new Date(startDate)}::timestamp` : client_1.Prisma.empty}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,
        ]);
        const conversionRate = total > 0 ? ((withOrders / total) * 100).toFixed(2) : '0.00';
        return {
            total,
            active,
            withOrders,
            conversionRate: parseFloat(conversionRate),
            topSpenders: topSpenders.map(c => ({
                ...c,
                totalSpent: Number(c.totalSpent),
            })),
            newByMonth: newCustomers,
        };
    }
    /**
     * Get scan statistics
     */
    async getScanStats(startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.scannedAt = {};
            if (startDate)
                where.scannedAt.gte = new Date(startDate);
            if (endDate)
                where.scannedAt.lte = new Date(endDate);
        }
        const [totalScans, allowedScans, deniedScans, scansByDay, scansByLocation] = await Promise.all([
            database_1.default.ticketScan.count({ where }),
            database_1.default.ticketScan.count({ where: { ...where, allowed: true } }),
            database_1.default.ticketScan.count({ where: { ...where, allowed: false } }),
            database_1.default.$queryRaw `
        SELECT 
          TO_CHAR(scanned_at, 'YYYY-MM-DD') as date,
          COUNT(*)::int as scans,
          SUM(CASE WHEN allowed THEN 1 ELSE 0 END)::int as allowed
        FROM ticket_scans
        ${startDate ? client_1.Prisma.sql `WHERE scanned_at >= ${new Date(startDate)}::timestamp` : client_1.Prisma.empty}
        GROUP BY TO_CHAR(scanned_at, 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT 30
      `,
            database_1.default.ticketScan.groupBy({
                by: ['location'],
                where: { ...where, location: { not: null } },
                _count: true,
                orderBy: { _count: { location: 'desc' } },
                take: 10,
            }),
        ]);
        const denialReasons = await database_1.default.ticketScan.groupBy({
            by: ['reason'],
            where: { ...where, allowed: false },
            _count: true,
            orderBy: { _count: { reason: 'desc' } },
        });
        return {
            totalScans,
            allowedScans,
            deniedScans,
            successRate: totalScans > 0 ? ((allowedScans / totalScans) * 100).toFixed(2) : '0.00',
            scansByDay,
            scansByLocation: scansByLocation.map(s => ({
                location: s.location || 'Unknown',
                count: s._count,
            })),
            denialReasons: denialReasons.map(r => ({
                reason: r.reason,
                count: r._count,
            })),
        };
    }
    /**
     * Get campaign performance
     */
    async getCampaignStats() {
        const [total, sent, avgOpenRate, avgClickRate, recent] = await Promise.all([
            database_1.default.campaign.count(),
            database_1.default.campaign.count({ where: { status: 'SENT' } }),
            database_1.default.campaign.aggregate({
                where: { status: 'SENT', sentTo: { gt: 0 } },
                _avg: {
                    openedCount: true,
                },
            }),
            database_1.default.campaign.aggregate({
                where: { status: 'SENT', sentTo: { gt: 0 } },
                _avg: {
                    clickedCount: true,
                },
            }),
            database_1.default.campaign.findMany({
                where: { status: 'SENT' },
                orderBy: { sentAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    subject: true,
                    sentTo: true,
                    openedCount: true,
                    clickedCount: true,
                    sentAt: true,
                },
            }),
        ]);
        return {
            total,
            sent,
            avgOpenRate: Number(avgOpenRate._avg.openedCount) || 0,
            avgClickRate: Number(avgClickRate._avg.clickedCount) || 0,
            recentCampaigns: recent.map(c => ({
                ...c,
                openRate: c.sentTo > 0 ? ((c.openedCount / c.sentTo) * 100).toFixed(2) : '0.00',
                clickRate: c.sentTo > 0 ? ((c.clickedCount / c.sentTo) * 100).toFixed(2) : '0.00',
            })),
        };
    }
    /**
     * Get dashboard overview
     */
    async getDashboardOverview() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const [monthRevenue, lastMonthRevenue, monthOrders, monthTickets, activeTickets, pendingOrders, totalCustomers, todayScans,] = await Promise.all([
            database_1.default.order.aggregate({
                where: {
                    status: 'COMPLETED',
                    purchaseDate: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            database_1.default.order.aggregate({
                where: {
                    status: 'COMPLETED',
                    purchaseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { amount: true },
            }),
            database_1.default.order.count({
                where: { purchaseDate: { gte: startOfMonth } },
            }),
            database_1.default.ticket.count({
                where: { createdAt: { gte: startOfMonth } },
            }),
            database_1.default.ticket.count({
                where: { status: 'ACTIVE' },
            }),
            database_1.default.order.count({
                where: { status: 'PENDING' },
            }),
            database_1.default.customer.count(),
            database_1.default.ticketScan.count({
                where: {
                    scannedAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    },
                },
            }),
        ]);
        const currentRevenue = Number(monthRevenue._sum.amount) || 0;
        const previousRevenue = Number(lastMonthRevenue._sum.amount) || 0;
        const revenueGrowth = previousRevenue > 0
            ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2)
            : '0.00';
        return {
            revenue: {
                current: currentRevenue,
                previous: previousRevenue,
                growth: parseFloat(revenueGrowth),
            },
            orders: {
                thisMonth: monthOrders,
                pending: pendingOrders,
            },
            tickets: {
                thisMonth: monthTickets,
                active: activeTickets,
            },
            customers: {
                total: totalCustomers,
            },
            scans: {
                today: todayScans,
            },
        };
    }
    /**
     * Export data to CSV
     */
    async exportData(type, startDate, endDate) {
        let data = [];
        let fields = [];
        switch (type) {
            case 'orders':
                const orders = await database_1.default.order.findMany({
                    where: this.buildDateFilter(startDate, endDate, 'purchaseDate'),
                    include: {
                        customer: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                    orderBy: { purchaseDate: 'desc' },
                });
                fields = ['orderNumber', 'customer', 'amount', 'quantity', 'status', 'purchaseDate'];
                data = orders.map(o => ({
                    orderNumber: o.orderNumber,
                    customer: `${o.customer.firstName} ${o.customer.lastName}`,
                    email: o.customer.email,
                    amount: Number(o.amount),
                    quantity: o.quantity,
                    status: o.status,
                    purchaseDate: o.purchaseDate.toISOString(),
                }));
                break;
            case 'tickets':
                const tickets = await database_1.default.ticket.findMany({
                    where: this.buildDateFilter(startDate, endDate, 'createdAt'),
                    include: {
                        order: {
                            include: {
                                customer: {
                                    select: { firstName: true, lastName: true, email: true },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                fields = ['ticketCode', 'customer', 'gameSession', 'status', 'scanCount', 'validUntil', 'createdAt'];
                data = tickets.map(t => ({
                    ticketCode: t.ticketCode,
                    customer: `${t.order.customer.firstName} ${t.order.customer.lastName}`,
                    email: t.order.customer.email,
                    gameSession: t.gameSession,
                    status: t.status,
                    scanCount: t.scanCount,
                    maxScans: t.maxScans,
                    validUntil: t.validUntil.toISOString(),
                    createdAt: t.createdAt.toISOString(),
                }));
                break;
            case 'customers':
                const customers = await database_1.default.customer.findMany({
                    where: this.buildDateFilter(startDate, endDate, 'createdAt'),
                    orderBy: { createdAt: 'desc' },
                });
                fields = ['firstName', 'lastName', 'email', 'phone', 'location', 'totalOrders', 'totalSpent', 'createdAt'];
                data = customers.map(c => ({
                    ...c,
                    totalSpent: Number(c.totalSpent),
                }));
                break;
            case 'scans':
                const scans = await database_1.default.ticketScan.findMany({
                    where: this.buildDateFilter(startDate, endDate, 'scannedAt'),
                    include: {
                        ticket: {
                            select: { ticketCode: true, gameSession: true },
                        },
                    },
                    orderBy: { scannedAt: 'desc' },
                });
                fields = ['ticketCode', 'gameSession', 'scannedBy', 'location', 'allowed', 'reason', 'scannedAt'];
                data = scans.map(s => ({
                    ticketCode: s.ticket.ticketCode,
                    gameSession: s.ticket.gameSession,
                    scannedBy: s.scannedBy,
                    location: s.location || 'N/A',
                    allowed: s.allowed ? 'Yes' : 'No',
                    reason: s.reason,
                    scannedAt: s.scannedAt.toISOString(),
                }));
                break;
            default:
                throw new Error('Invalid export type');
        }
        const parser = new json2csv_1.Parser({ fields });
        const csv = parser.parse(data);
        logger_1.logger.info(`Exported ${data.length} ${type} records`);
        return csv;
    }
    /**
     * Helper: Build date filter
     */
    buildDateFilter(startDate, endDate, field = 'createdAt') {
        const filter = {};
        if (startDate || endDate) {
            filter[field] = {};
            if (startDate)
                filter[field].gte = new Date(startDate);
            if (endDate)
                filter[field].lte = new Date(endDate);
        }
        return filter;
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map