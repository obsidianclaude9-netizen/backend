import { TicketPerformance, SessionDistribution, DateRange, TimePeriod } from './analytics.types';
export declare class PerformanceService {
    /**
     * Get ticket performance metrics
     */
    getTicketPerformance(period: TimePeriod): Promise<TicketPerformance>;
    /**
     * Get ticket trends and insights
     */
    getTicketTrends(range: DateRange): Promise<{
        totalTickets: number;
        statusBreakdown: Record<string, number>;
        avgScanTime: number;
        scanEfficiency: {
            utilizationRate: string;
            avgScansPerTicket: number;
        };
        expiringTickets: number;
        utilizationRate: number;
    }>;
    /**
     * Get session distribution
     */
    getSessionDistribution(period: TimePeriod): Promise<SessionDistribution>;
    /**
     * Get session performance details
     */
    getSessionPerformance(range: DateRange): Promise<{
        session: string;
        ticketsSold: number;
        avgScanCount: number;
        totalRevenue: number;
        avgRevenuePerTicket: number;
        scanRate: Promise<number>;
    }[]>;
    /**
     * Get scan location analytics
     */
    getScansByLocation(range: DateRange): Promise<{
        location: string;
        count: number;
    }[]>;
    /**
     * Get scan trends over time
     */
    getScanTrends(range: DateRange): Promise<{
        date: string;
        total: number;
        allowed: number;
        denied: number;
        successRate: number;
    }[]>;
    private getTotalTickets;
    private getStatusBreakdown;
    private getAvgScanTime;
    private getScanEfficiency;
    private getExpiringTickets;
    private getUtilizationRate;
    private getRevenueBySession;
    private calculateSessionScanRate;
    private getDateRange;
}
//# sourceMappingURL=performance.service.d.ts.map