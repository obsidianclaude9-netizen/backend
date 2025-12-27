"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KPIService = void 0;
// backend/src/modules/analytics/kpi.service.ts
const database_1 = __importDefault(require("../../config/database"));
const analytics_types_1 = require("./analytics.types");
class KPIService {
    /**
     * Get all dashboard KPIs with comparison
     */
    async getDashboardKPIs(period) {
        const ranges = this.getDateRanges(period);
        const [revenue, tickets, customers, scanRate] = await Promise.all([
            this.getRevenueKPI(ranges.current, ranges.previous),
            this.getTicketSalesKPI(ranges.current, ranges.previous),
            this.getCustomerKPI(ranges.current, ranges.previous),
            this.getScanRateKPI(ranges.current, ranges.previous),
        ]);
        return { revenue, ticketSales: tickets, customers, scanRate };
    }
    /**
     * Revenue KPI with target tracking
     */
    async getRevenueKPI(current, previous) {
        const [currentRevenue, previousRevenue] = await Promise.all([
            this.getTotalRevenue(current),
            this.getTotalRevenue(previous),
        ]);
        const change = currentRevenue - previousRevenue;
        const changePercent = previousRevenue > 0
            ? (change / previousRevenue) * 100
            : 0;
        // Calculate target (e.g., 10% growth)
        const target = previousRevenue * 1.1;
        const targetPercent = target > 0 ? (currentRevenue / target) * 100 : 0;
        return {
            current: currentRevenue,
            previous: previousRevenue,
            change,
            changePercent: parseFloat(changePercent.toFixed(2)),
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            target,
            targetPercent: parseFloat(targetPercent.toFixed(2)),
        };
    }
    /**
     * Ticket sales KPI
     */
    async getTicketSalesKPI(current, previous) {
        const [currentCount, previousCount] = await Promise.all([
            database_1.default.ticket.count({
                where: { createdAt: { gte: current.start, lte: current.end } },
            }),
            database_1.default.ticket.count({
                where: { createdAt: { gte: previous.start, lte: previous.end } },
            }),
        ]);
        const change = currentCount - previousCount;
        const changePercent = previousCount > 0
            ? (change / previousCount) * 100
            : 0;
        return {
            current: currentCount,
            previous: previousCount,
            change,
            changePercent: parseFloat(changePercent.toFixed(2)),
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        };
    }
    /**
     * Customer growth KPI
     */
    async getCustomerKPI(current, previous) {
        const [currentCount, previousCount] = await Promise.all([
            database_1.default.customer.count({
                where: { createdAt: { gte: current.start, lte: current.end } },
            }),
            database_1.default.customer.count({
                where: { createdAt: { gte: previous.start, lte: previous.end } },
            }),
        ]);
        const change = currentCount - previousCount;
        const changePercent = previousCount > 0
            ? (change / previousCount) * 100
            : 0;
        return {
            current: currentCount,
            previous: previousCount,
            change,
            changePercent: parseFloat(changePercent.toFixed(2)),
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        };
    }
    /**
     * Scan rate KPI
     */
    async getScanRateKPI(current, previous) {
        const [currentStats, previousStats] = await Promise.all([
            this.getScanStats(current),
            this.getScanStats(previous),
        ]);
        const change = currentStats.rate - previousStats.rate;
        return {
            current: currentStats.rate,
            previous: previousStats.rate,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(change.toFixed(2)), // Already a percentage
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            scannedCount: currentStats.scanned,
            totalCount: currentStats.total,
        };
    }
    /**
     * Helper: Get total revenue for period
     */
    async getTotalRevenue(range) {
        const result = await database_1.default.order.aggregate({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: range.start, lte: range.end },
            },
            _sum: { amount: true },
        });
        return Number(result._sum.amount) || 0;
    }
    /**
     * Helper: Get scan statistics
     */
    async getScanStats(range) {
        const [total, scanned] = await Promise.all([
            database_1.default.ticket.count({
                where: { createdAt: { gte: range.start, lte: range.end } },
            }),
            database_1.default.ticket.count({
                where: {
                    createdAt: { gte: range.start, lte: range.end },
                    status: 'SCANNED',
                },
            }),
        ]);
        const rate = total > 0 ? (scanned / total) * 100 : 0;
        return {
            total,
            scanned,
            rate: parseFloat(rate.toFixed(2)),
        };
    }
    /**
     * Helper: Calculate date ranges for current and previous periods
     */
    getDateRanges(period) {
        const now = new Date();
        const current = { start: new Date(), end: now };
        const previous = { start: new Date(), end: new Date() };
        switch (period) {
            case analytics_types_1.TimePeriod.SEVEN_DAYS:
                current.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previous.start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                previous.end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case analytics_types_1.TimePeriod.THIRTY_DAYS:
                current.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                previous.start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                previous.end = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case analytics_types_1.TimePeriod.NINETY_DAYS:
                current.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                previous.start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                previous.end = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case analytics_types_1.TimePeriod.ONE_YEAR:
                current.start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                previous.start = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                previous.end = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }
        return { current, previous };
    }
}
exports.KPIService = KPIService;
//# sourceMappingURL=kpi.service.js.map