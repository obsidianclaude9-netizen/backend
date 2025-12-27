"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewService = exports.MaterializedViewService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("./logger");
class MaterializedViewService {
    /**
     * Refresh all materialized views
     */
    async refreshAllViews() {
        const start = Date.now();
        try {
            await database_1.default.$executeRaw `SELECT refresh_analytics_views()`;
            const duration = Date.now() - start;
            logger_1.logger.info(`Materialized views refreshed in ${duration}ms`);
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh materialized views:', error);
            throw error;
        }
    }
    /**
     * Get daily revenue from materialized view
     */
    async getDailyRevenue(startDate, endDate) {
        const data = await database_1.default.$queryRaw `
      SELECT 
        date,
        revenue::numeric as revenue,
        order_count,
        unique_customers,
        avg_order_value::numeric as avg_order_value,
        tickets_sold
      FROM analytics_daily_revenue
      WHERE date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date DESC
    `;
        return data.map(row => ({
            date: row.date,
            revenue: Number(row.revenue),
            orderCount: row.order_count,
            uniqueCustomers: row.unique_customers,
            avgOrderValue: Number(row.avg_order_value),
            ticketsSold: row.tickets_sold
        }));
    }
    /**
     * Get monthly revenue from materialized view
     */
    async getMonthlyRevenue(months) {
        const limit = months || 12;
        const data = await database_1.default.$queryRaw `
      SELECT 
        month,
        revenue::numeric as revenue,
        order_count,
        unique_customers,
        avg_order_value::numeric as avg_order_value,
        tickets_sold
      FROM analytics_monthly_revenue
      ORDER BY month DESC
      LIMIT ${limit}
    `;
        return data.map(row => ({
            month: row.month,
            revenue: Number(row.revenue),
            orderCount: row.order_count,
            uniqueCustomers: row.unique_customers,
            avgOrderValue: Number(row.avg_order_value),
            ticketsSold: row.tickets_sold
        }));
    }
    /**
     * Get session performance from materialized view
     */
    async getSessionPerformance() {
        const data = await database_1.default.$queryRaw `
      SELECT 
        game_session,
        total_tickets,
        scanned_tickets,
        scan_rate::numeric as scan_rate,
        avg_revenue_per_ticket::numeric as avg_revenue_per_ticket,
        total_revenue::numeric as total_revenue,
        first_ticket_date,
        last_ticket_date
      FROM analytics_session_performance
      ORDER BY total_revenue DESC
    `;
        return data.map(row => ({
            gameSession: row.game_session,
            totalTickets: row.total_tickets,
            scannedTickets: row.scanned_tickets,
            scanRate: Number(row.scan_rate),
            avgRevenuePerTicket: Number(row.avg_revenue_per_ticket),
            totalRevenue: Number(row.total_revenue),
            firstTicketDate: row.first_ticket_date,
            lastTicketDate: row.last_ticket_date
        }));
    }
    /**
     * Get customer segments from materialized view
     */
    async getCustomerSegments() {
        const data = await database_1.default.$queryRaw `
      SELECT 
        segment,
        COUNT(*) as count,
        SUM(total_spent)::numeric as total_revenue,
        AVG(total_spent)::numeric as avg_spent
      FROM analytics_customer_segments
      GROUP BY segment
      ORDER BY total_revenue DESC
    `;
        return data.map(row => ({
            segment: row.segment,
            count: Number(row.count),
            totalRevenue: Number(row.total_revenue),
            avgSpent: Number(row.avg_spent)
        }));
    }
    /**
     * Get scan statistics from materialized view
     */
    async getScanStats(startDate, endDate) {
        const data = await database_1.default.$queryRaw `
      SELECT 
        date,
        total_scans,
        allowed_scans,
        denied_scans,
        success_rate::numeric as success_rate,
        location
      FROM analytics_scan_stats
      WHERE date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date DESC, location
    `;
        return data.map(row => ({
            date: row.date,
            totalScans: row.total_scans,
            allowedScans: row.allowed_scans,
            deniedScans: row.denied_scans,
            successRate: Number(row.success_rate),
            location: row.location || 'Unknown'
        }));
    }
}
exports.MaterializedViewService = MaterializedViewService;
exports.viewService = new MaterializedViewService();
//# sourceMappingURL=materialized-views.service.js.map