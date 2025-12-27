"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/analytics/analytics.routes.ts 
const express_1 = require("express");
const analyticsController = __importStar(require("./analytics.controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const cache_1 = require("../../middleware/cache");
const rateLimit_1 = require("../../middleware/rateLimit");
const analytics_schema_1 = require("./analytics.schema");
const forecastingController = __importStar(require("./forecasting.controller"));
const excelExportController = __importStar(require("./excel-export.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT, auth_1.requireAdmin);
// ===== DASHBOARD KPIs =====
router.get('/kpi', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300, prefix: 'analytics:kpi' }), analyticsController.getDashboardKPIs);
// ===== REVENUE ANALYTICS =====
router.get('/revenue/overview', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getRevenueOverview);
router.get('/revenue/breakdown', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getRevenueBreakdown);
router.get('/revenue/targets', (0, cache_1.cache)({ ttl: 600 }), analyticsController.getRevenueTargets);
// ===== TICKET PERFORMANCE =====
router.get('/tickets/performance', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getTicketPerformance);
router.get('/tickets/trends', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getTicketTrends);
// ===== SESSION ANALYTICS =====
router.get('/sessions/distribution', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 600 }), analyticsController.getSessionDistribution);
router.get('/sessions/performance', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getSessionPerformance);
// ===== CUSTOMER ANALYTICS =====
router.get('/customers/growth', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getCustomerGrowth);
router.get('/customers/retention', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 600 }), analyticsController.getCustomerRetention);
router.get('/customers/segments', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 600 }), analyticsController.getCustomerSegments);
// ===== CAMPAIGN ANALYTICS =====
router.get('/campaigns/performance', (0, cache_1.cache)({ ttl: 300 }), analyticsController.getCampaignPerformance);
router.get('/campaigns/funnel', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getCampaignFunnel);
// ===== MARKETING METRICS =====
router.get('/marketing/metrics', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getMarketingMetrics);
// ===== SCAN ANALYTICS =====
router.get('/scans/trends', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 300 }), analyticsController.getScanTrends);
router.get('/scans/locations', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 600 }), analyticsController.getScansByLocation);
// ===== COMPARISON & FORECASTING =====
router.get('/compare', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 600 }), analyticsController.comparePeriods);
router.get('/forecast', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 3600 }), // 1 hour cache
analyticsController.getForecast);
// ===== EXISTING ENDPOINTS (Keep for backward compatibility) =====
router.get('/dashboard', analyticsController.getDashboardOverview);
router.get('/revenue', analyticsController.getRevenueMetrics);
router.get('/tickets', analyticsController.getTicketStats);
router.get('/customers', analyticsController.getCustomerStats);
router.get('/scans', analyticsController.getScanStats);
router.get('/campaigns', analyticsController.getCampaignStats);
// ===== EXPORTS =====
router.post('/export/:type', rateLimit_1.exportLimiter, (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), analyticsController.exportData);
router.post('/export/custom', rateLimit_1.exportLimiter, analyticsController.exportCustomReport);
router.get('/forecast/revenue', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 3600 }), forecastingController.forecastRevenue);
router.get('/forecast/tickets', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 3600 }), forecastingController.forecastTicketSales);
router.get('/forecast/customers', (0, validate_1.validate)(analytics_schema_1.analyticsQuerySchema), (0, cache_1.cache)({ ttl: 3600 }), forecastingController.forecastCustomerGrowth);
router.post('/export/excel', rateLimit_1.exportLimiter, excelExportController.exportAnalyticsExcel);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map