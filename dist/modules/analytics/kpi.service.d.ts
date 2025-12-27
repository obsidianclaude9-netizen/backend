import { DashboardKPIs, TimePeriod } from './analytics.types';
export declare class KPIService {
    /**
     * Get all dashboard KPIs with comparison
     */
    getDashboardKPIs(period: TimePeriod): Promise<DashboardKPIs>;
    /**
     * Revenue KPI with target tracking
     */
    private getRevenueKPI;
    /**
     * Ticket sales KPI
     */
    private getTicketSalesKPI;
    /**
     * Customer growth KPI
     */
    private getCustomerKPI;
    /**
     * Scan rate KPI
     */
    private getScanRateKPI;
    /**
     * Helper: Get total revenue for period
     */
    private getTotalRevenue;
    /**
     * Helper: Get scan statistics
     */
    private getScanStats;
    /**
     * Helper: Calculate date ranges for current and previous periods
     */
    private getDateRanges;
}
//# sourceMappingURL=kpi.service.d.ts.map