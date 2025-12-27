import { Worker, Queue } from 'bullmq';
export declare const scheduledReportsQueue: Queue<any, any, string>;
/**
 * Schedule daily revenue report
 */
export declare const scheduleDailyRevenueReport: () => Promise<void>;
/**
 * Schedule weekly summary report
 */
export declare const scheduleWeeklySummaryReport: () => Promise<void>;
/**
 * Schedule monthly detailed report
 */
export declare const scheduleMonthlyReport: () => Promise<void>;
/**
 * Report worker
 */
export declare const reportWorker: Worker<any, any, string>;
export declare const initializeScheduler: () => Promise<void>;
//# sourceMappingURL=scheduler.jobs.d.ts.map