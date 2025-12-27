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
exports.monitoring = exports.MonitoringService = void 0;
// src/utils/monitoring.service.ts
const Sentry = __importStar(require("@sentry/node"));
const database_1 = __importDefault(require("../config/database"));
const cache_1 = __importDefault(require("../config/cache"));
class MonitoringService {
    /**
     * Check database health
     */
    async checkDatabase() {
        const start = Date.now();
        try {
            await database_1.default.$queryRaw `SELECT 1`;
            return {
                healthy: true,
                responseTime: Date.now() - start,
            };
        }
        catch (error) {
            Sentry.captureException(error);
            return {
                healthy: false,
                responseTime: Date.now() - start,
            };
        }
    }
    /**
     * Check Redis health
     */
    async checkRedis() {
        const start = Date.now();
        try {
            await cache_1.default.ping();
            return {
                healthy: true,
                responseTime: Date.now() - start,
            };
        }
        catch (error) {
            Sentry.captureException(error);
            return {
                healthy: false,
                responseTime: Date.now() - start,
            };
        }
    }
    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        const [db, cache, memory, uptime] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.getMemoryUsage(),
            process.uptime(),
        ]);
        return {
            database: db,
            redis: cache,
            memory,
            uptime: Math.floor(uptime),
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get memory usage
     */
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
        };
    }
    /**
     * Track custom metric
     */
    trackMetric(name, value, tags) {
        Sentry.metrics.gauge(name, value, { tags });
    }
    /**
     * Track performance
     */
    trackPerformance(operation, duration) {
        Sentry.metrics.distribution('operation.duration', duration, {
            tags: { operation },
        });
    }
    /**
     * Capture exception with context
     */
    captureException(error, context) {
        Sentry.captureException(error, {
            contexts: { custom: context },
        });
    }
    /**
     * Capture message
     */
    captureMessage(message, level = 'info') {
        Sentry.captureMessage(message, level);
    }
    /**
     * Set user context
     */
    setUser(userId, email) {
        Sentry.setUser({ id: userId, email });
    }
    /**
     * Clear user context
     */
    clearUser() {
        Sentry.setUser(null);
    }
    /**
     * Add breadcrumb
     */
    addBreadcrumb(message, data) {
        Sentry.addBreadcrumb({
            message,
            data,
            timestamp: Date.now() / 1000,
        });
    }
    /**
     * Start transaction for performance monitoring
     */
    startTransaction(name, op) {
        return Sentry.startTransaction({ name, op });
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoring = new MonitoringService();
//# sourceMappingURL=monitoring.service.js.map