"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastCustomerGrowth = exports.forecastTicketSales = exports.forecastRevenue = void 0;
const errorHandler_1 = require("../../middleware/errorHandler");
const forecasting_service_1 = require("./forecasting.service");
const cache_service_1 = require("../../utils/cache.service");
const errorHandler_2 = require("../../middleware/errorHandler");
exports.forecastRevenue = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    if (days < 1 || days > 90) {
        throw new errorHandler_2.AppError(400, 'Days must be between 1 and 90');
    }
    const cacheKey = `forecast:revenue:${days}`;
    const forecast = await cache_service_1.cacheService.getOrSet(cacheKey, () => forecasting_service_1.forecastingService.forecastRevenue(days), 3600 // Cache for 1 hour
    );
    res.json(forecast);
});
exports.forecastTicketSales = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    if (days < 1 || days > 90) {
        throw new errorHandler_2.AppError(400, 'Days must be between 1 and 90');
    }
    const cacheKey = `forecast:tickets:${days}`;
    const forecast = await cache_service_1.cacheService.getOrSet(cacheKey, () => forecasting_service_1.forecastingService.forecastTicketSales(days), 3600);
    res.json(forecast);
});
exports.forecastCustomerGrowth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    if (days < 1 || days > 90) {
        throw new errorHandler_2.AppError(400, 'Days must be between 1 and 90');
    }
    const cacheKey = `forecast:customers:${days}`;
    const forecast = await cache_service_1.cacheService.getOrSet(cacheKey, () => forecasting_service_1.forecastingService.forecastCustomerGrowth(days), 3600);
    res.json(forecast);
});
//# sourceMappingURL=forecasting.controller.js.map