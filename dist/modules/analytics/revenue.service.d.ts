import { RevenueOverview, DateRange, TimePeriod } from './analytics.types';
export declare class RevenueService {
    /**
     * Get revenue overview with monthly breakdown
     */
    getRevenueOverview(period: TimePeriod): Promise<RevenueOverview>;
    /**
     * Get detailed revenue breakdown
     */
    getRevenueBreakdown(range: DateRange): Promise<{
        summary: {
            totalRevenue: number;
            orderCount: number;
            avgOrderValue: number;
        };
        bySession: {
            session: string;
            revenue: number;
        }[];
        byCustomerSegment: {
            high: {
                count: number;
                revenue: number;
            };
            medium: {
                count: number;
                revenue: number;
            };
            low: {
                count: number;
                revenue: number;
            };
        };
        dailyTrend: {
            date: string;
            revenue: number;
        }[];
    }>;
    /**
     * Get revenue vs targets
     */
    getRevenueTargets(year?: number): Promise<{
        month: string;
        target: number;
        actual: number;
        achievement: number;
        status: "warning" | "success" | "danger";
    }[]>;
    /**
     * Update revenue target
     */
    setRevenueTarget(month: string, target: number): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        target: import("@prisma/client/runtime/library").Decimal;
        month: string;
        actual: import("@prisma/client/runtime/library").Decimal;
    }>;
    /**
     * Update actual revenue for a month (called after orders completed)
     */
    updateActualRevenue(month: string): Promise<number>;
    private getTotalRevenue;
    private getOrderCount;
    private getAvgOrderValue;
    private getRevenueBySession;
    private getRevenueByCustomerSegment;
    private getDailyRevenueTrend;
    private getDateRange;
    private getTargetStatus;
}
//# sourceMappingURL=revenue.service.d.ts.map