"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueService = void 0;
// backend/src/modules/analytics/revenue.service.ts
const database_1 = __importDefault(require("../../config/database"));
const analytics_types_1 = require("./analytics.types");
const logger_1 = require("../../utils/logger");
const date_fns_1 = require("date-fns");
class RevenueService {
    /**
     * Get revenue overview with monthly breakdown
     */
    async getRevenueOverview(period) {
        const range = this.getDateRange(period);
        // Get monthly revenue data
        const orders = await database_1.default.order.findMany({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: range.start, lte: range.end },
            },
            select: {
                amount: true,
                purchaseDate: true,
            },
            orderBy: { purchaseDate: 'asc' },
        });
        // Get targets for the period
        const monthsInRange = (0, date_fns_1.eachMonthOfInterval)({ start: range.start, end: range.end });
        const targetMonths = monthsInRange.map(m => (0, date_fns_1.format)(m, 'yyyy-MM'));
        const targets = await database_1.default.revenueTarget.findMany({
            where: { month: { in: targetMonths } },
        });
        const targetMap = new Map(targets.map(t => [t.month, Number(t.target)]));
        // Group by month
        const monthlyMap = new Map();
        for (const order of orders) {
            const month = (0, date_fns_1.format)(order.purchaseDate, 'yyyy-MM');
            const current = monthlyMap.get(month) || 0;
            monthlyMap.set(month, current + Number(order.amount));
        }
        // Build monthly data points
        const monthly = monthsInRange.map(monthDate => {
            const month = (0, date_fns_1.format)(monthDate, 'yyyy-MM');
            const value = monthlyMap.get(month) || 0;
            const target = targetMap.get(month);
            return { month, value, target };
        });
        // Calculate totals
        const total = Array.from(monthlyMap.values()).reduce((sum, val) => sum + val, 0);
        const average = monthly.length > 0 ? total / monthly.length : 0;
        const peak = monthly.reduce((max, curr) => (curr.value > max.value ? curr : max), { month: '', value: 0 });
        return {
            monthly,
            total,
            average: parseFloat(average.toFixed(2)),
            peak,
        };
    }
    /**
     * Get detailed revenue breakdown
     */
    async getRevenueBreakdown(range) {
        const [totalRevenue, orderCount, avgOrderValue, bySession, byCustomerSegment, dailyTrend,] = await Promise.all([
            this.getTotalRevenue(range),
            this.getOrderCount(range),
            this.getAvgOrderValue(range),
            this.getRevenueBySession(range),
            this.getRevenueByCustomerSegment(range),
            this.getDailyRevenueTrend(range),
        ]);
        return {
            summary: {
                totalRevenue,
                orderCount,
                avgOrderValue,
            },
            bySession,
            byCustomerSegment,
            dailyTrend,
        };
    }
    /**
     * Get revenue vs targets
     */
    async getRevenueTargets(year) {
        const targetYear = year || new Date().getFullYear();
        const targets = await database_1.default.revenueTarget.findMany({
            where: {
                month: {
                    startsWith: targetYear.toString(),
                },
            },
            orderBy: { month: 'asc' },
        });
        // Calculate achievement percentages
        return targets.map(target => {
            const targetValue = Number(target.target);
            const actualValue = Number(target.actual);
            return {
                month: target.month,
                target: targetValue,
                actual: actualValue,
                achievement: targetValue > 0
                    ? (actualValue / targetValue) * 100
                    : 0,
                status: this.getTargetStatus(actualValue, targetValue),
            };
        });
    }
    /**
     * Update revenue target
     */
    async setRevenueTarget(month, target) {
        return await database_1.default.revenueTarget.upsert({
            where: { month },
            update: { target },
            create: { month, target },
        });
    }
    /**
     * Update actual revenue for a month (called after orders completed)
     */
    async updateActualRevenue(month) {
        const start = new Date(`${month}-01`);
        const end = (0, date_fns_1.endOfMonth)(start);
        const result = await database_1.default.order.aggregate({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
        });
        const actual = Number(result._sum.amount) || 0;
        await database_1.default.revenueTarget.upsert({
            where: { month },
            update: { actual },
            create: {
                month,
                target: 0, // Will be set manually
                actual,
            },
        });
        logger_1.logger.info(`Updated actual revenue for ${month}: ${actual}`);
        return actual;
    }
    // ===== PRIVATE HELPER METHODS =====
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
    async getOrderCount(range) {
        return await database_1.default.order.count({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: range.start, lte: range.end },
            },
        });
    }
    async getAvgOrderValue(range) {
        const result = await database_1.default.order.aggregate({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: range.start, lte: range.end },
            },
            _avg: { amount: true },
        });
        return Number(result._avg.amount) || 0;
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
        return Array.from(sessionMap.entries())
            .map(([session, revenue]) => ({ session, revenue }))
            .sort((a, b) => b.revenue - a.revenue);
    }
    async getRevenueByCustomerSegment(range) {
        const customers = await database_1.default.customer.findMany({
            where: {
                orders: {
                    some: {
                        status: 'COMPLETED',
                        purchaseDate: { gte: range.start, lte: range.end },
                    },
                },
            },
            include: {
                orders: {
                    where: {
                        status: 'COMPLETED',
                        purchaseDate: { gte: range.start, lte: range.end },
                    },
                    select: { amount: true },
                },
            },
        });
        // Segment by total spent
        const segments = {
            high: { count: 0, revenue: 0 }, // >50k
            medium: { count: 0, revenue: 0 }, // 10k-50k
            low: { count: 0, revenue: 0 }, // <10k
        };
        for (const customer of customers) {
            const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.amount), 0);
            if (totalSpent > 50000) {
                segments.high.count++;
                segments.high.revenue += totalSpent;
            }
            else if (totalSpent >= 10000) {
                segments.medium.count++;
                segments.medium.revenue += totalSpent;
            }
            else {
                segments.low.count++;
                segments.low.revenue += totalSpent;
            }
        }
        return segments;
    }
    async getDailyRevenueTrend(range) {
        const orders = await database_1.default.order.findMany({
            where: {
                status: 'COMPLETED',
                purchaseDate: { gte: range.start, lte: range.end },
            },
            select: {
                amount: true,
                purchaseDate: true,
            },
            orderBy: { purchaseDate: 'asc' },
        });
        const dailyMap = new Map();
        for (const order of orders) {
            const day = (0, date_fns_1.format)(order.purchaseDate, 'yyyy-MM-dd');
            const current = dailyMap.get(day) || 0;
            dailyMap.set(day, current + Number(order.amount));
        }
        return Array.from(dailyMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));
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
    getTargetStatus(actual, target) {
        if (target === 0)
            return 'warning';
        const percentage = (actual / target) * 100;
        if (percentage >= 100)
            return 'success';
        if (percentage >= 80)
            return 'warning';
        return 'danger';
    }
}
exports.RevenueService = RevenueService;
//# sourceMappingURL=revenue.service.js.map