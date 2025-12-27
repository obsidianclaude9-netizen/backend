import * as Sentry from '@sentry/node';
export declare class MonitoringService {
    /**
     * Check database health
     */
    checkDatabase(): Promise<{
        healthy: boolean;
        responseTime: number;
    }>;
    /**
     * Check Redis health
     */
    checkRedis(): Promise<{
        healthy: boolean;
        responseTime: number;
    }>;
    /**
     * Get system metrics
     */
    getSystemMetrics(): Promise<{
        database: {
            healthy: boolean;
            responseTime: number;
        };
        redis: {
            healthy: boolean;
            responseTime: number;
        };
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
        };
        uptime: number;
        timestamp: string;
    }>;
    /**
     * Get memory usage
     */
    private getMemoryUsage;
    /**
     * Track custom metric
     */
    trackMetric(name: string, value: number, tags?: Record<string, string>): void;
    /**
     * Track performance
     */
    trackPerformance(operation: string, duration: number): void;
    /**
     * Capture exception with context
     */
    captureException(error: Error, context?: Record<string, any>): void;
    /**
     * Capture message
     */
    captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
    /**
     * Set user context
     */
    setUser(userId: string, email: string): void;
    /**
     * Clear user context
     */
    clearUser(): void;
    /**
     * Add breadcrumb
     */
    addBreadcrumb(message: string, data?: Record<string, any>): void;
    /**
     * Start transaction for performance monitoring
     */
    startTransaction(name: string, op: string): Sentry.Transaction;
}
export declare const monitoring: MonitoringService;
//# sourceMappingURL=monitoring.service.d.ts.map