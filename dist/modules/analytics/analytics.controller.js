"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportData = exports.getDashboardOverview = exports.getCampaignStats = exports.getScanStats = exports.getCustomerStats = exports.getTicketStats = exports.getRevenueMetrics = void 0;
const analytics_service_1 = require("./analytics.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const analyticsService = new analytics_service_1.AnalyticsService();
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
exports.getDashboardOverview = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const overview = await analyticsService.getDashboardOverview();
    res.json(overview);
});
exports.exportData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type } = req.params;
    const csv = await analyticsService.exportData(type, req.query.startDate, req.query.endDate);
    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});
//# sourceMappingURL=analytics.controller.js.map