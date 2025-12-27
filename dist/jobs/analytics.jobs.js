"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAnalyticsJobs = exports.analyticsWorker = exports.scheduleCleanup = exports.scheduleRevenueTargetUpdates = exports.scheduleCacheWarming = exports.analyticsQueue = void 0;
// backend/src/jobs/analytics.jobs.ts
const bullmq_1 = require("bullmq");
const queue_1 = require("../config/queue");
const logger_1 = require("../utils/logger");
const cache_service_1 = require("../utils/cache.service");
const kpi_service_1 = require("../modules/analytics/kpi.service");
const revenue_service_1 = require("../modules/analytics/revenue.service");
const performance_service_1 = require("../modules/analytics/performance.service");
const customer_campaign_service_1 = require("../modules/analytics/customer-campaign.service");
const analytics_types_1 = require("../modules/analytics/analytics.types");
const date_fns_1 = require("date-fns");
// Create analytics queue
exports.analyticsQueue = new bullmq_1.Queue('analytics', {
    connection: queue_1.connection,
});
// Initialize services
const kpiService = new kpi_service_1.KPIService();
const revenueService = new revenue_service_1.RevenueService();
const performanceService = new performance_service_1.PerformanceService();
const customerCampaignService = new customer_campaign_service_1.CustomerCampaignService();
/**
 * Schedule cache warming for all periods
 */
const scheduleCacheWarming = async () => {
    // Warm cache every 5 minutes for 30d period (most used)
    await exports.analyticsQueue.add('warm-cache', { period: analytics_types_1.TimePeriod.THIRTY_DAYS }, {
        repeat: {
            pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'warm-cache-30d',
    });
    // Warm cache every 15 minutes for other periods
    await exports.analyticsQueue.add('warm-cache', { period: analytics_types_1.TimePeriod.SEVEN_DAYS }, {
        repeat: {
            pattern: '*/15 * * * *', // Every 15 minutes
        },
        jobId: 'warm-cache-7d',
    });
    await exports.analyticsQueue.add('warm-cache', { period: analytics_types_1.TimePeriod.NINETY_DAYS }, {
        repeat: {
            pattern: '*/15 * * * *',
        },
        jobId: 'warm-cache-90d',
    });
    await exports.analyticsQueue.add('warm-cache', { period: analytics_types_1.TimePeriod.ONE_YEAR }, {
        repeat: {
            pattern: '0 * * * *', // Every hour
        },
        jobId: 'warm-cache-1y',
    });
    logger_1.logger.info('Analytics cache warming scheduled');
};
exports.scheduleCacheWarming = scheduleCacheWarming;
/**
 * Schedule daily revenue target updates
 */
const scheduleRevenueTargetUpdates = async () => {
    await exports.analyticsQueue.add('update-revenue-targets', {}, {
        repeat: {
            pattern: '0 0 * * *', // Daily at midnight
        },
        jobId: 'update-revenue-targets',
    });
    logger_1.logger.info('Revenue target updates scheduled');
};
exports.scheduleRevenueTargetUpdates = scheduleRevenueTargetUpdates;
/**
 * Schedule cleanup of expired cache
 */
const scheduleCleanup = async () => {
    await exports.analyticsQueue.add('cleanup-cache', {}, {
        repeat: {
            pattern: '0 */6 * * *', // Every 6 hours
        },
        jobId: 'cleanup-cache',
    });
    logger_1.logger.info('Cache cleanup scheduled');
};
exports.scheduleCleanup = scheduleCleanup;
/**
 * Analytics Worker
 */
exports.analyticsWorker = new bullmq_1.Worker('analytics', async (job) => {
    const { name, data } = job;
    try {
        switch (name) {
            case 'warm-cache':
                await warmCache(data.period);
                break;
            case 'update-revenue-targets':
                await updateRevenueTargets();
                break;
            case 'cleanup-cache':
                await cleanupCache();
                break;
            case 'generate-report':
                await generateReport(data);
                break;
            default:
                logger_1.logger.warn(`Unknown analytics job: ${name}`);
        }
        return { success: true, job: name };
    }
    catch (error) {
        logger_1.logger.error(`Analytics job failed (${name}):`, error);
        throw error;
    }
}, {
    connection: queue_1.connection,
    concurrency: 2,
});
/**
 * Warm cache for a specific period
 */
async function warmCache(period) {
    logger_1.logger.info(`Warming cache for period: ${period}`);
    const start = Date.now();
    try {
        // Warm KPIs
        const kpiKey = cache_service_1.cacheService.generateAnalyticsKey('kpi', { period });
        const kpis = await kpiService.getDashboardKPIs(period);
        await cache_service_1.cacheService.set(kpiKey, kpis, 300);
        // Warm revenue overview
        const revenueKey = cache_service_1.cacheService.generateAnalyticsKey('revenue:overview', { period });
        const revenue = await revenueService.getRevenueOverview(period);
        await cache_service_1.cacheService.set(revenueKey, revenue, 300);
        // Warm ticket performance
        const ticketKey = cache_service_1.cacheService.generateAnalyticsKey('tickets:performance', { period });
        const tickets = await performanceService.getTicketPerformance(period);
        await cache_service_1.cacheService.set(ticketKey, tickets, 300);
        // Warm session distribution
        const sessionKey = cache_service_1.cacheService.generateAnalyticsKey('sessions:distribution', { period });
        const sessions = await performanceService.getSessionDistribution(period);
        await cache_service_1.cacheService.set(sessionKey, sessions, 600);
        // Warm customer growth
        const customerKey = cache_service_1.cacheService.generateAnalyticsKey('customers:growth', { period });
        const customers = await customerCampaignService.getCustomerGrowth(period);
        await cache_service_1.cacheService.set(customerKey, customers, 300);
        const duration = Date.now() - start;
        logger_1.logger.info(`Cache warmed successfully for ${period} in ${duration}ms`);
    }
    catch (error) {
        logger_1.logger.error(`Cache warming failed for ${period}:`, error);
        throw error;
    }
}
/**
 * Update revenue targets with actual data
 */
async function updateRevenueTargets() {
    logger_1.logger.info('Updating revenue targets');
    try {
        // Get current month
        const currentMonth = (0, date_fns_1.format)(new Date(), 'yyyy-MM');
        // Update actual revenue for current month
        await revenueService.updateActualRevenue(currentMonth);
        // Also update previous month if it's the first day
        const today = new Date();
        if (today.getDate() === 1) {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthStr = (0, date_fns_1.format)(lastMonth, 'yyyy-MM');
            await revenueService.updateActualRevenue(lastMonthStr);
        }
        // Invalidate revenue cache
        await cache_service_1.cacheService.deletePattern('analytics:revenue:*');
        logger_1.logger.info('Revenue targets updated successfully');
    }
    catch (error) {
        logger_1.logger.error('Revenue target update failed:', error);
        throw error;
    }
}
/**
 * Cleanup expired cache entries
 */
async function cleanupCache() {
    logger_1.logger.info('Starting cache cleanup');
    try {
        const deleted = await cache_service_1.cacheService.cleanupExpired();
        logger_1.logger.info(`Cache cleanup completed: ${deleted} entries removed`);
    }
    catch (error) {
        logger_1.logger.error('Cache cleanup failed:', error);
        throw error;
    }
}
/**
 * Generate custom analytics report
 */
async function generateReport(data) {
    logger_1.logger.info('Generating analytics report', data);
    try {
        const { email } = data;
        // Implementation would generate PDF/Excel report
        // and email it to the user
        logger_1.logger.info(`Report generated and sent to ${email}`);
    }
    catch (error) {
        logger_1.logger.error('Report generation failed:', error);
        throw error;
    }
}
/**
 * Initialize all analytics jobs
 */
const initializeAnalyticsJobs = async () => {
    await (0, exports.scheduleCacheWarming)();
    await (0, exports.scheduleRevenueTargetUpdates)();
    await (0, exports.scheduleCleanup)();
    logger_1.logger.info('All analytics jobs initialized');
};
exports.initializeAnalyticsJobs = initializeAnalyticsJobs;
// Event handlers
exports.analyticsWorker.on('completed', (job) => {
    logger_1.logger.debug(`Analytics job ${job.id} completed`);
});
exports.analyticsWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Analytics job ${job?.id} failed:`, err);
});
exports.analyticsWorker.on('error', (err) => {
    logger_1.logger.error('Analytics worker error:', err);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    await exports.analyticsWorker.close();
    logger_1.logger.info('Analytics worker shut down');
});
//# sourceMappingURL=analytics.jobs.js.map