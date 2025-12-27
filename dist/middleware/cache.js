"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAllCache = exports.invalidateCache = exports.cache = void 0;
const cache_1 = __importDefault(require("../config/cache"));
const logger_1 = require("../utils/logger");
/**
 * Cache middleware for GET requests
 */
const cache = (options = {}) => {
    const { ttl = 300, // 5 minutes default
    prefix = 'api', keyGenerator, } = options;
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        try {
            // Generate cache key
            const cacheKey = keyGenerator
                ? keyGenerator(req)
                : `${prefix}:${req.path}:${JSON.stringify(req.query)}:${req.user?.userId || 'anonymous'}`;
            // Try to get from cache
            const cachedData = await cache_1.default.get(cacheKey);
            if (cachedData) {
                logger_1.logger.debug(`Cache HIT: ${cacheKey}`);
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedData));
            }
            logger_1.logger.debug(`Cache MISS: ${cacheKey}`);
            res.setHeader('X-Cache', 'MISS');
            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Cache the response
                cache_1.default.setex(cacheKey, ttl, JSON.stringify(data)).catch((err) => {
                    logger_1.logger.error('Cache set error:', err);
                });
                return originalJson(data);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache middleware error:', error);
            next(); // Continue without cache on error
        }
    };
};
exports.cache = cache;
/**
 * Invalidate cache by pattern
 */
const invalidateCache = async (pattern) => {
    try {
        const keys = await cache_1.default.keys(pattern);
        if (keys.length > 0) {
            await cache_1.default.del(...keys);
            logger_1.logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
        }
    }
    catch (error) {
        logger_1.logger.error('Cache invalidation error:', error);
    }
};
exports.invalidateCache = invalidateCache;
/**
 * Invalidate all cache
 */
const invalidateAllCache = async () => {
    try {
        await cache_1.default.flushdb();
        logger_1.logger.info('All cache invalidated');
    }
    catch (error) {
        logger_1.logger.error('Cache flush error:', error);
    }
};
exports.invalidateAllCache = invalidateAllCache;
//# sourceMappingURL=cache.js.map