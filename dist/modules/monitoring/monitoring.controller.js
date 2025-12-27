"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebSocketStats = exports.getMetrics = exports.getHealthCheck = void 0;
const monitoring_service_1 = require("../../utils/monitoring.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const websocket_1 = require("../../config/websocket");
exports.getHealthCheck = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const metrics = await monitoring_service_1.monitoring.getSystemMetrics();
    const isHealthy = metrics.database.healthy && metrics.redis.healthy && metrics.memory.heapUsed < 1024;
    res.status(isHealthy ? 200 : 503).json({ status: isHealthy ? 'healthy' : 'unhealthy', ...metrics });
});
exports.getMetrics = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const metrics = await monitoring_service_1.monitoring.getSystemMetrics();
    res.json(metrics);
});
exports.getWebSocketStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await (0, websocket_1.getConnectionStats)();
    res.json(stats);
});
//# sourceMappingURL=monitoring.controller.js.map