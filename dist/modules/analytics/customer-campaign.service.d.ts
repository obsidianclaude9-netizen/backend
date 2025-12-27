import { CustomerGrowth, CampaignPerformance, MarketingMetric, DateRange, TimePeriod } from './analytics.types';
export declare class CustomerCampaignService {
    /**
     * Get customer growth analytics
     */
    getCustomerGrowth(period: TimePeriod): Promise<CustomerGrowth>;
    /**
     * Get customer retention metrics
     */
    getCustomerRetention(range: DateRange): Promise<{
        totalCustomers: number;
        returningCustomers: number;
        retentionRate: number;
        avgOrderFrequency: number;
    }>;
    /**
     * Get customer segments
     */
    getCustomerSegments(range: DateRange): Promise<{
        champions: {
            count: number;
            revenue: number;
        };
        loyalCustomers: {
            count: number;
            revenue: number;
        };
        potentialLoyalists: {
            count: number;
            revenue: number;
        };
        atRisk: {
            count: number;
            revenue: number;
        };
        needsAttention: {
            count: number;
            revenue: number;
        };
    }>;
    /**
     * Get campaign performance
     */
    getCampaignPerformance(): Promise<CampaignPerformance>;
    /**
     * Get campaign funnel analytics
     */
    getCampaignFunnel(range: DateRange): Promise<{
        stages: {
            name: string;
            count: number;
            rate: number;
        }[];
    }>;
    /**
     * Get marketing metrics table
     */
    getMarketingMetrics(range: DateRange): Promise<MarketingMetric[]>;
    private getEmailStats;
    private calculateEmailStats;
    private getCustomerMetrics;
    private calculateLTV;
    private getRevenueMetrics;
    private calculateRevenueMetrics;
    private getCampaignStats;
    private calculateConversionRate;
    private getPreviousPeriod;
    private getMetricStatus;
    private getDateRange;
}
//# sourceMappingURL=customer-campaign.service.d.ts.map