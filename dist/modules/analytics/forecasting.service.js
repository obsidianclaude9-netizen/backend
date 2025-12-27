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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastingService = exports.ForecastingService = void 0;
const ss = __importStar(require("simple-statistics"));
const regression = __importStar(require("regression"));
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = require("../../utils/logger");
const materialized_views_service_1 = require("../../utils/materialized-views.service");
class ForecastingService {
    async forecastRevenue(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
        const historicalData = await materialized_views_service_1.viewService.getDailyRevenue(startDate, endDate);
        if (historicalData.length < 14) {
            throw new Error('Insufficient historical data for forecasting (minimum 14 days)');
        }
        const data = historicalData.map((d, index) => ({
            x: index,
            y: d.revenue,
            date: d.date
        }));
        const regressionData = data.map(d => [d.x, d.y]);
        const linearModel = regression.linear(regressionData);
        const residuals = data.map(d => d.y - linearModel.predict(d.x)[1]);
        const standardError = ss.standardDeviation(residuals);
        const confidenceMultiplier = 1.96;
        const historical = data.map(d => ({
            date: d.date.toISOString().split('T')[0],
            actual: d.y,
            forecast: linearModel.predict(d.x)[1]
        }));
        const forecast = [];
        const lastIndex = data.length - 1;
        for (let i = 1; i <= days; i++) {
            const forecastDate = new Date(endDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            const xValue = lastIndex + i;
            const predicted = linearModel.predict(xValue)[1];
            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                forecast: Math.max(0, predicted),
                upper: Math.max(0, predicted + confidenceMultiplier * standardError),
                lower: Math.max(0, predicted - confidenceMultiplier * standardError)
            });
        }
        const errors = residuals.map(Math.abs);
        const mape = (ss.mean(errors.map((e, i) => e / data[i].y)) * 100);
        const rmse = Math.sqrt(ss.mean(residuals.map(r => r * r)));
        const slope = linearModel.equation[0];
        const trend = slope > 100 ? 'increasing' : slope < -100 ? 'decreasing' : 'stable';
        const confidence = Math.min(100, Math.max(0, 100 - mape));
        logger_1.logger.info(`Revenue forecast generated: ${days} days, MAPE: ${mape.toFixed(2)}%, Trend: ${trend}`);
        return {
            historical,
            forecast,
            accuracy: {
                mape: parseFloat(mape.toFixed(2)),
                rmse: parseFloat(rmse.toFixed(2))
            },
            trend,
            confidence: parseFloat(confidence.toFixed(2))
        };
    }
    async forecastTicketSales(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
        const historicalData = await materialized_views_service_1.viewService.getDailyRevenue(startDate, endDate);
        const data = historicalData.map((d, index) => ({
            x: index,
            y: d.ticketsSold,
            date: d.date
        }));
        return this.performForecast(data, days, endDate);
    }
    async forecastCustomerGrowth(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
        const dailyCustomers = await database_1.default.$queryRaw `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
      FROM customers
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
        const data = dailyCustomers.map((d, index) => ({
            x: index,
            y: Number(d.new_customers),
            date: d.date
        }));
        return this.performForecast(data, days, endDate);
    }
    performForecast(data, days, endDate) {
        const regressionData = data.map(d => [d.x, d.y]);
        const linearModel = regression.linear(regressionData);
        const residuals = data.map(d => d.y - linearModel.predict(d.x)[1]);
        const standardError = ss.standardDeviation(residuals);
        const historical = data.map(d => ({
            date: d.date.toISOString().split('T')[0],
            actual: d.y,
            forecast: linearModel.predict(d.x)[1]
        }));
        const forecast = [];
        const lastIndex = data.length - 1;
        for (let i = 1; i <= days; i++) {
            const forecastDate = new Date(endDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            const predicted = linearModel.predict(lastIndex + i)[1];
            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                forecast: Math.max(0, predicted),
                upper: Math.max(0, predicted + 1.96 * standardError),
                lower: Math.max(0, predicted - 1.96 * standardError)
            });
        }
        const errors = residuals.map(Math.abs);
        const mape = ss.mean(errors.map((e, i) => e / data[i].y)) * 100;
        const rmse = Math.sqrt(ss.mean(residuals.map(r => r * r)));
        const slope = linearModel.equation[0];
        const trend = slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable';
        return {
            historical,
            forecast,
            accuracy: {
                mape: parseFloat(mape.toFixed(2)),
                rmse: parseFloat(rmse.toFixed(2))
            },
            trend,
            confidence: parseFloat(Math.min(100, Math.max(0, 100 - mape)).toFixed(2))
        };
    }
}
exports.ForecastingService = ForecastingService;
exports.forecastingService = new ForecastingService();
//# sourceMappingURL=forecasting.service.js.map