"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
// backend/src/modules/analytics/performance.service.ts
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const analytics_types_1 = require("./analytics.types");
const date_fns_1 = require("date-fns");
class PerformanceService {
    /**
     * Get ticket performance metrics
     */
    async getTicketPerformance(period) {
        const range = this.getDateRange(period);
        // Get all tickets in range
        const tickets = await database_1.default.ticket.findMany({
            where: {
                createdAt: { gte: range.start, lte: range.end },
            },
            select: {
                status: true,
                createdAt: true,
            },
        });
        // Generate months in range
        const months = (0, date_fns_1.eachMonthOfInterval)({ start: range.start, end: range.end });
        // Group by month and status
        const monthlyData = months.map(monthDate => {
            const month = (0, date_fns_1.format)(monthDate, 'yyyy-MM');
            const monthTickets = tickets.filter(t => (0, date_fns_1.format)(t.createdAt, 'yyyy-MM') === month);
            return {
                month,
                active: monthTickets.filter(t => t.status === client_1.TicketStatus.ACTIVE).length,
                scanned: monthTickets.filter(t => t.status === client_1.TicketStatus.SCANNED).length,
                cancelled: monthTickets.filter(t => t.status === client_1.TicketStatus.CANCELLED).length,
                expired: monthTickets.filter(t => t.status === client_1.TicketStatus.EXPIRED).length,
            };
        });
        // Calculate summary
        const totalActive = tickets.filter(t => t.status === client_1.TicketStatus.ACTIVE).length;
        const totalScanned = tickets.filter(t => t.status === client_1.TicketStatus.SCANNED).length;
        const scanRate = tickets.length > 0
            ? (totalScanned / tickets.length) * 100
            : 0;
        return {
            monthly: monthlyData,
            summary: {
                totalActive,
                totalScanned,
                scanRate: parseFloat(scanRate.toFixed(2)),
            },
        };
    }
    /**
     * Get ticket trends and insights
     */
    async getTicketTrends(range) {
        const [totalTickets, statusBreakdown, avgScanTime, scanEfficiency, expiringTickets, utilizationRate,] = await Promise.all([
            this.getTotalTickets(range),
            this.getStatusBreakdown(range),
            this.getAvgScanTime(range),
            this.getScanEfficiency(range),
            this.getExpiringTickets(),
            this.getUtilizationRate(range),
        ]);
        return {
            totalTickets,
            statusBreakdown,
            avgScanTime,
            scanEfficiency,
            expiringTickets,
            utilizationRate,
        };
    }
    /**
     * Get session distribution
     */
    async getSessionDistribution(period) {
        const range = this.getDateRange(period);
        const tickets = await database_1.default.ticket.groupBy({
            by: ['gameSession'],
            where: {
                createdAt: { gte: range.start, lte: range.end },
            },
            _count: true,
            orderBy: {
                _count: {
                    gameSession: 'desc',
                },
            },
        });
        const total = tickets.reduce((sum, t) => sum + t._count, 0);
        const sessions = tickets.map(t => ({
            name: t.gameSession,
            count: t._count,
            percentage: total > 0 ? parseFloat(((t._count / total) * 100).toFixed(2)) : 0,
        }));
        return { sessions, total };
    }
    /**
     * Get session performance details
     */
    async getSessionPerformance(range) {
        const sessions = await database_1.default.ticket.groupBy({
            by: ['gameSession'],
            where: {
                createdAt: { gte: range.start, lte: range.end },
            },
            _count: true,
            _avg: {
                scanCount: true,
            },
        });
        // Get revenue per session
        const sessionRevenue = await this.getRevenueBySession(range);
        const revenueMap = new Map(sessionRevenue.map(s => [s.session, s.revenue]));
        return sessions.map(session => {
            const revenue = revenueMap.get(session.gameSession) || 0;
            const avgRevenue = session._count > 0 ? revenue / session._count : 0;
            return {
                session: session.gameSession,
                ticketsSold: session._count,
                avgScanCount: Number(session._avg.scanCount) || 0,
                totalRevenue: revenue,
                avgRevenuePerTicket: parseFloat(avgRevenue.toFixed(2)),
                scanRate: this.calculateSessionScanRate(session.gameSession, range),
            };
        });
    }
    /**
     * Get scan location analytics
     */
    async getScansByLocation(range) {
        const scans = await database_1.default.ticketScan.groupBy({
            by: ['location'],
            where: {
                scannedAt: { gte: range.start, lte: range.end },
                location: { not: null },
            },
            _count: true,
            orderBy: {
                _count: {
                    location: 'desc',
                },
            },
        });
        return scans.map(scan => ({
            location: scan.location || 'Unknown',
            count: scan._count,
        }));
    }
    /**
     * Get scan trends over time
     */
    async getScanTrends(range) {
        const scans = await database_1.default.ticketScan.findMany({
            where: {
                scannedAt: { gte: range.start, lte: range.end },
            },
            select: {
                scannedAt: true,
                allowed: true,
            },
            orderBy: { scannedAt: 'asc' },
        });
        const dailyMap = new Map();
        for (const scan of scans) {
            const day = (0, date_fns_1.format)(scan.scannedAt, 'yyyy-MM-dd');
            const current = dailyMap.get(day) || { total: 0, allowed: 0 };
            dailyMap.set(day, {
                total: current.total + 1,
                allowed: current.allowed + (scan.allowed ? 1 : 0),
            });
        }
        return Array.from(dailyMap.entries())
            .map(([date, stats]) => ({
            date,
            total: stats.total,
            allowed: stats.allowed,
            denied: stats.total - stats.allowed,
            successRate: stats.total > 0
                ? parseFloat(((stats.allowed / stats.total) * 100).toFixed(2))
                : 0,
        }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    // ===== PRIVATE HELPER METHODS =====
    async getTotalTickets(range) {
        return await database_1.default.ticket.count({
            where: {
                createdAt: { gte: range.start, lte: range.end },
            },
        });
    }
    async getStatusBreakdown(range) {
        const breakdown = await database_1.default.ticket.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: range.start, lte: range.end },
            },
            _count: true,
        });
        return breakdown.reduce((acc, item) => {
            acc[item.status.toLowerCase()] = item._count;
            return acc;
        }, {});
    }
    async getAvgScanTime(range) {
        const tickets = await database_1.default.ticket.findMany({
            where: {
                createdAt: { gte: range.start, lte: range.end },
                firstScanAt: { not: null },
            },
            select: {
                createdAt: true,
                firstScanAt: true,
            },
        });
        if (tickets.length === 0)
            return 0;
        const totalHours = tickets.reduce((sum, ticket) => {
            const hours = (ticket.firstScanAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);
        return parseFloat((totalHours / tickets.length).toFixed(2));
    }
    async getScanEfficiency(range) {
        const [total, scanned, avgScans] = await Promise.all([
            database_1.default.ticket.count({
                where: { createdAt: { gte: range.start, lte: range.end } },
            }),
            database_1.default.ticket.count({
                where: {
                    createdAt: { gte: range.start, lte: range.end },
                    scanCount: { gt: 0 },
                },
            }),
            database_1.default.ticket.aggregate({
                where: { createdAt: { gte: range.start, lte: range.end } },
                _avg: { scanCount: true },
            }),
        ]);
        return {
            utilizationRate: total > 0 ? ((scanned / total) * 100).toFixed(2) : '0.00',
            avgScansPerTicket: Number(avgScans._avg.scanCount) || 0,
        };
    }
    async getExpiringTickets() {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return await database_1.default.ticket.count({
            where: {
                status: client_1.TicketStatus.ACTIVE,
                validUntil: {
                    gte: new Date(),
                    lte: sevenDaysFromNow,
                },
            },
        });
    }
    async getUtilizationRate(range) {
        const [totalScans, totalPossibleScans] = await Promise.all([
            database_1.default.ticket.aggregate({
                where: { createdAt: { gte: range.start, lte: range.end } },
                _sum: { scanCount: true },
            }),
            database_1.default.ticket.aggregate({
                where: { createdAt: { gte: range.start, lte: range.end } },
                _sum: { maxScans: true },
            }),
        ]);
        const actual = Number(totalScans._sum.scanCount) || 0;
        const possible = Number(totalPossibleScans._sum.maxScans) || 1;
        return parseFloat(((actual / possible) * 100).toFixed(2));
    }
    async getRevenueBySession(range) {
        const tickets = await database_1.default.ticket.findMany({
            where: {
                createdAt: { gte: range.start, lte: range.end },
                order: { status: 'COMPLETED' },
            },
            include: {
                order: {
                    select: { amount: true, quantity: true },
                },
            },
        });
        const sessionMap = new Map();
        for (const ticket of tickets) {
            const revenue = Number(ticket.order.amount) / ticket.order.quantity;
            const current = sessionMap.get(ticket.gameSession) || 0;
            sessionMap.set(ticket.gameSession, current + revenue);
        }
        return Array.from(sessionMap.entries()).map(([session, revenue]) => ({
            session,
            revenue,
        }));
    }
    async calculateSessionScanRate(session, range) {
        const [total, scanned] = await Promise.all([
            database_1.default.ticket.count({
                where: {
                    gameSession: session,
                    createdAt: { gte: range.start, lte: range.end },
                },
            }),
            database_1.default.ticket.count({
                where: {
                    gameSession: session,
                    createdAt: { gte: range.start, lte: range.end },
                    status: client_1.TicketStatus.SCANNED,
                },
            }),
        ]);
        return total > 0 ? parseFloat(((scanned / total) * 100).toFixed(2)) : 0;
    }
    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        switch (period) {
            case analytics_types_1.TimePeriod.SEVEN_DAYS:
                start.setDate(now.getDate() - 7);
                break;
            case analytics_types_1.TimePeriod.THIRTY_DAYS:
                start.setDate(now.getDate() - 30);
                break;
            case analytics_types_1.TimePeriod.NINETY_DAYS:
                start.setDate(now.getDate() - 90);
                break;
            case analytics_types_1.TimePeriod.ONE_YEAR:
                start.setFullYear(now.getFullYear() - 1);
                break;
        }
        return { start, end: now };
    }
}
exports.PerformanceService = PerformanceService;
//# sourceMappingURL=performance.service.js.map