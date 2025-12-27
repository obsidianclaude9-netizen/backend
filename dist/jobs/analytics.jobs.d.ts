import { Worker, Queue } from 'bullmq';
export declare const analyticsQueue: Queue<any, any, string>;
/**
 * Schedule cache warming for all periods
 */
export declare const scheduleCacheWarming: () => Promise<void>;
/**
 * Schedule daily revenue target updates
 */
export declare const scheduleRevenueTargetUpdates: () => Promise<void>;
/**
 * Schedule cleanup of expired cache
 */
export declare const scheduleCleanup: () => Promise<void>;
/**
 * Analytics Worker
 */
export declare const analyticsWorker: Worker<any, any, string>;
/**
 * Initialize all analytics jobs
 */
export declare const initializeAnalyticsJobs: () => Promise<void>;
//# sourceMappingURL=analytics.jobs.d.ts.map