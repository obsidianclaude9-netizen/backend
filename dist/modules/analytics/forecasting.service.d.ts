export interface ForecastDataPoint {
    date: string;
    actual?: number;
    forecast?: number;
    upper?: number;
    lower?: number;
}
export interface ForecastResult {
    historical: ForecastDataPoint[];
    forecast: ForecastDataPoint[];
    accuracy: {
        mape: number;
        rmse: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
}
export declare class ForecastingService {
    forecastRevenue(days?: number): Promise<ForecastResult>;
    forecastTicketSales(days?: number): Promise<ForecastResult>;
    forecastCustomerGrowth(days?: number): Promise<ForecastResult>;
    private performForecast;
}
export declare const forecastingService: ForecastingService;
//# sourceMappingURL=forecasting.service.d.ts.map