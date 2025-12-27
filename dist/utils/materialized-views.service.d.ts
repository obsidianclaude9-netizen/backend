export declare class MaterializedViewService {
    /**
     * Refresh all materialized views
     */
    refreshAllViews(): Promise<void>;
    /**
     * Get daily revenue from materialized view
     */
    getDailyRevenue(startDate: Date, endDate: Date): Promise<{
        date: Date;
        revenue: number;
        orderCount: number;
        uniqueCustomers: number;
        avgOrderValue: number;
        ticketsSold: number;
    }[]>;
    /**
     * Get monthly revenue from materialized view
     */
    getMonthlyRevenue(months?: number): Promise<{
        month: string;
        revenue: number;
        orderCount: number;
        uniqueCustomers: number;
        avgOrderValue: number;
        ticketsSold: number;
    }[]>;
    /**
     * Get session performance from materialized view
     */
    getSessionPerformance(): Promise<{
        gameSession: string;
        totalTickets: number;
        scannedTickets: number;
        scanRate: number;
        avgRevenuePerTicket: number;
        totalRevenue: number;
        firstTicketDate: Date;
        lastTicketDate: Date;
    }[]>;
    /**
     * Get customer segments from materialized view
     */
    getCustomerSegments(): Promise<{
        segment: string;
        count: number;
        totalRevenue: number;
        avgSpent: number;
    }[]>;
    /**
     * Get scan statistics from materialized view
     */
    getScanStats(startDate: Date, endDate: Date): Promise<{
        date: Date;
        totalScans: number;
        allowedScans: number;
        deniedScans: number;
        successRate: number;
        location: string;
    }[]>;
}
export declare const viewService: MaterializedViewService;
//# sourceMappingURL=materialized-views.service.d.ts.map