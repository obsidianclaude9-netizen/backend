export declare class AnalyticsService {
    /**
     * Get revenue metrics
     */
    getRevenueMetrics(startDate?: string, endDate?: string): Promise<{
        totalRevenue: number;
        orderCount: number;
        avgOrderValue: number;
        revenueByMonth: {
            month: string;
            revenue: number;
            orders: number;
        }[];
    }>;
    /**
     * Get ticket statistics
     */
    getTicketStats(startDate?: string, endDate?: string): Promise<{
        total: number;
        statusBreakdown: Record<string, number>;
        avgScanCount: number;
        expiringInWeek: number;
        byGameSession: {
            session: string;
            count: number;
        }[];
    }>;
    /**
     * Get customer statistics
     */
    getCustomerStats(startDate?: string, endDate?: string): Promise<{
        total: number;
        active: number;
        withOrders: number;
        conversionRate: number;
        topSpenders: {
            totalSpent: number;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            totalOrders: number;
        }[];
        newByMonth: {
            month: string;
            count: number;
        }[];
    }>;
    /**
     * Get scan statistics
     */
    getScanStats(startDate?: string, endDate?: string): Promise<{
        totalScans: number;
        allowedScans: number;
        deniedScans: number;
        successRate: string;
        scansByDay: {
            date: string;
            scans: number;
            allowed: number;
        }[];
        scansByLocation: {
            location: string;
            count: number;
        }[];
        denialReasons: {
            reason: string;
            count: number;
        }[];
    }>;
    /**
     * Get campaign performance
     */
    getCampaignStats(): Promise<{
        total: number;
        sent: number;
        avgOpenRate: number;
        avgClickRate: number;
        recentCampaigns: {
            openRate: string;
            clickRate: string;
            id: string;
            subject: string;
            sentTo: number;
            openedCount: number;
            clickedCount: number;
            sentAt: Date | null;
        }[];
    }>;
    /**
     * Get dashboard overview
     */
    getDashboardOverview(): Promise<{
        revenue: {
            current: number;
            previous: number;
            growth: number;
        };
        orders: {
            thisMonth: number;
            pending: number;
        };
        tickets: {
            thisMonth: number;
            active: number;
        };
        customers: {
            total: number;
        };
        scans: {
            today: number;
        };
    }>;
    /**
     * Export data to CSV
     */
    exportData(type: string, startDate?: string, endDate?: string): Promise<string>;
    /**
     * Helper: Build date filter
     */
    private buildDateFilter;
}
//# sourceMappingURL=analytics.service.d.ts.map