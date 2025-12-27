"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheStats = exports.invalidateCache = exports.exportCustomReport = exports.exportData = exports.getCampaignStats = exports.getScanStats = exports.getCustomerStats = exports.getTicketStats = exports.getRevenueMetrics = exports.getDashboardOverview = exports.getForecast = exports.comparePeriods = exports.getScansByLocation = exports.getScanTrends = exports.getMarketingMetrics = exports.getCampaignFunnel = exports.getCampaignPerformance = exports.getCustomerSegments = exports.getCustomerRetention = exports.getCustomerGrowth = exports.getSessionPerformance = exports.getSessionDistribution = exports.getTicketTrends = exports.getTicketPerformance = exports.updateActualRevenue = exports.setRevenueTarget = exports.getRevenueTargets = exports.getRevenueBreakdown = exports.getRevenueOverview = exports.getDashboardKPIs = void 0;
const errorHandler_1 = require("../../middleware/errorHandler");
const kpi_service_1 = require("./kpi.service");
const revenue_service_1 = require("./revenue.service");
const performance_service_1 = require("./performance.service");
const customer_campaign_service_1 = require("./customer-campaign.service");
const analytics_service_1 = require("./analytics.service");
const cache_service_1 = require("../../utils/cache.service");
const analytics_types_1 = require("./analytics.types");
const logger_1 = require("../../utils/logger");
const kpiService = new kpi_service_1.KPIService();
const revenueService = new revenue_service_1.RevenueService();
const performanceService = new performance_service_1.PerformanceService();
const customerCampaignService = new customer_campaign_service_1.CustomerCampaignService();
const analyticsService = new analytics_service_1.AnalyticsService();
// ===== KPI ENDPOINTS =====
exports.getDashboardKPIs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || analytics_types_1.TimePeriod.THIRTY_DAYS;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('kpi', { period });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => kpiService.getDashboardKPIs(period), 300 // 5 minutes
    );
    res.json(data);
});
// ===== REVENUE ENDPOINTS =====
exports.getRevenueOverview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || analytics_types_1.TimePeriod.THIRTY_DAYS;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('revenue:overview', { period });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => revenueService.getRevenueOverview(period), 300);
    res.json(data);
});
exports.getRevenueBreakdown = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('revenue:breakdown', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => revenueService.getRevenueBreakdown(range), 300);
    res.json(data);
});
exports.getRevenueTargets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('revenue:targets', { year });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => revenueService.getRevenueTargets(year), 600 // 10 minutes
    );
    res.json(data);
});
exports.setRevenueTarget = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { month, target } = req.body;
    const result = await revenueService.setRevenueTarget(month, target);
    // Invalidate cache
    await cache_service_1.cacheService.deletePattern('analytics:revenue:*');
    res.json(result);
});
exports.updateActualRevenue = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { month } = req.params;
    const actual = await revenueService.updateActualRevenue(month);
    // Invalidate cache
    await cache_service_1.cacheService.deletePattern('analytics:revenue:*');
    res.json({ month, actual });
});
// ===== TICKET PERFORMANCE ENDPOINTS =====
exports.getTicketPerformance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || analytics_types_1.TimePeriod.THIRTY_DAYS;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('tickets:performance', { period });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getTicketPerformance(period), 300);
    res.json(data);
});
exports.getTicketTrends = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('tickets:trends', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getTicketTrends(range), 300);
    res.json(data);
});
// ===== SESSION ENDPOINTS =====
exports.getSessionDistribution = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || analytics_types_1.TimePeriod.THIRTY_DAYS;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('sessions:distribution', { period });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getSessionDistribution(period), 600 // 10 minutes
    );
    res.json(data);
});
exports.getSessionPerformance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('sessions:performance', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getSessionPerformance(range), 300);
    res.json(data);
});
// ===== CUSTOMER ENDPOINTS =====
exports.getCustomerGrowth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const period = req.query.period || analytics_types_1.TimePeriod.THIRTY_DAYS;
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('customers:growth', { period });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getCustomerGrowth(period), 300);
    res.json(data);
});
exports.getCustomerRetention = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('customers:retention', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getCustomerRetention(range), 600);
    res.json(data);
});
exports.getCustomerSegments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('customers:segments', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getCustomerSegments(range), 600);
    res.json(data);
});
// ===== CAMPAIGN ENDPOINTS =====
exports.getCampaignPerformance = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const cacheKey = 'analytics:campaigns:performance';
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getCampaignPerformance(), 300);
    res.json(data);
});
exports.getCampaignFunnel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('campaigns:funnel', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getCampaignFunnel(range), 300);
    res.json(data);
});
// ===== MARKETING METRICS =====
exports.getMarketingMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('marketing:metrics', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => customerCampaignService.getMarketingMetrics(range), 300);
    res.json(data);
});
// ===== SCAN ANALYTICS =====
exports.getScanTrends = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('scans:trends', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getScanTrends(range), 300);
    res.json(data);
});
exports.getScansByLocation = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const range = {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date(),
    };
    const cacheKey = cache_service_1.cacheService.generateAnalyticsKey('scans:locations', {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
    });
    const data = await cache_service_1.cacheService.getOrSet(cacheKey, () => performanceService.getScansByLocation(range), 600);
    res.json(data);
});
// ===== COMPARISON & FORECASTING =====
exports.comparePeriods = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPeriod, previousPeriod, metric } = req.query;
    // Implementation would compare two periods
    // This is a placeholder for the comparison logic
    res.json({
        message: 'Period comparison endpoint',
        currentPeriod,
        previousPeriod,
        metric,
    });
});
exports.getForecast = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period, metric } = req.query;
    // Implementation would use historical data for forecasting
    // This is a placeholder for forecasting logic
    res.json({
        message: 'Forecasting endpoint',
        period,
        metric,
    });
});
// ===== EXISTING ENDPOINTS (Backward Compatibility) =====
exports.getDashboardOverview = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const overview = await analyticsService.getDashboardOverview();
    res.json(overview);
});
exports.getRevenueMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const metrics = await analyticsService.getRevenueMetrics(req.query.startDate, req.query.endDate);
    res.json(metrics);
});
exports.getTicketStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await analyticsService.getTicketStats(req.query.startDate, req.query.endDate);
    res.json(stats);
});
exports.getCustomerStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await analyticsService.getCustomerStats(req.query.startDate, req.query.endDate);
    res.json(stats);
});
exports.getScanStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await analyticsService.getScanStats(req.query.startDate, req.query.endDate);
    res.json(stats);
});
exports.getCampaignStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await analyticsService.getCampaignStats();
    res.json(stats);
});
// ===== EXPORT ENDPOINTS =====
exports.exportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type } = req.params;
    const csv = await analyticsService.exportData(type, req.query.startDate, req.query.endDate);
    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});
exports.exportCustomReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { metrics, format, startDate, endDate } = req.body;
    logger_1.logger.info('Custom report export requested', { metrics, format });
    // Implementation would generate custom reports based on selected metrics
    res.json({
        message: 'Custom report generation',
        metrics,
        format,
        dateRange: { startDate, endDate },
    });
});
// ===== CACHE MANAGEMENT =====
exports.invalidateCache = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { pattern } = req.body;
    if (pattern) {
        await cache_service_1.cacheService.deletePattern(`analytics:${pattern}*`);
    }
    else {
        await cache_service_1.cacheService.invalidateAllAnalytics();
    }
    logger_1.logger.info('Analytics cache invalidated', { pattern });
    res.json({ message: 'Cache invalidated successfully' });
});
exports.getCacheStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await cache_service_1.cacheService.getStats();
    res.json(stats);
});
//# sourceMappingURL=analytics.controller.js.map