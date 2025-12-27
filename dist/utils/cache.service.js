"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
// backend/src/utils/cache.service.ts
const cache_1 = __importDefault(require("../config/cache"));
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("./logger");
class CacheService {
    DEFAULT_TTL = 300; // 5 minutes
    /**
     * Get cached value (with database fallback for analytics)
     */
    async get(key) {
        try {
            // Try Redis first
            const data = await cache_1.default.get(key);
            if (data) {
                logger_1.logger.debug(`Cache HIT (Redis): ${key}`);
                return JSON.parse(data);
            }
            // Fallback to database cache for analytics
            if (key.startsWith('analytics:')) {
                const dbCache = await database_1.default.analyticsCache.findUnique({
                    where: {
                        cacheKey: key,
                        expiresAt: { gt: new Date() },
                    },
                });
                if (dbCache) {
                    logger_1.logger.debug(`Cache HIT (DB): ${key}`);
                    // Warm up Redis
                    await cache_1.default.setex(key, this.DEFAULT_TTL, JSON.stringify(dbCache.data));
                    return dbCache.data;
                }
            }
            logger_1.logger.debug(`Cache MISS: ${key}`);
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    /**
     * Set cached value (dual write to Redis and DB for analytics)
     */
    async set(key, value, ttl) {
        try {
            const serialized = JSON.stringify(value);
            const effectiveTTL = ttl || this.DEFAULT_TTL;
            // Always write to Redis
            await cache_1.default.setex(key, effectiveTTL, serialized);
            // Write to DB for analytics (persistent cache)
            if (key.startsWith('analytics:')) {
                const expiresAt = new Date(Date.now() + effectiveTTL * 1000);
                await database_1.default.analyticsCache.upsert({
                    where: { cacheKey: key },
                    update: {
                        data: value,
                        expiresAt,
                    },
                    create: {
                        cacheKey: key,
                        data: value,
                        expiresAt,
                    },
                });
            }
            logger_1.logger.debug(`Cache SET: ${key} (TTL: ${effectiveTTL}s)`);
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', error);
            throw error;
        }
    }
    /**
     * Delete cached value
     */
    async delete(key) {
        try {
            await cache_1.default.del(key);
            if (key.startsWith('analytics:')) {
                await database_1.default.analyticsCache.delete({
                    where: { cacheKey: key },
                }).catch(() => {
                    // Ignore if not found
                });
            }
            logger_1.logger.debug(`Cache DELETE: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', error);
        }
    }
    /**
     * Delete by pattern
     */
    async deletePattern(pattern) {
        try {
            const keys = await cache_1.default.keys(pattern);
            if (keys.length > 0) {
                await cache_1.default.del(...keys);
                logger_1.logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
            }
            // Clean DB cache
            if (pattern.startsWith('analytics:')) {
                const likePattern = pattern.replace('*', '%');
                await database_1.default.$executeRawUnsafe(`DELETE FROM analytics_cache WHERE cache_key LIKE $1`, likePattern);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache pattern delete error:', error);
        }
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        return (await cache_1.default.exists(key)) === 1;
    }
    /**
     * Get or set (cache-aside pattern)
     */
    async getOrSet(key, fetcher, ttl) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const data = await fetcher();
        await this.set(key, data, ttl);
        return data;
    }
    /**
     * Increment counter
     */
    async increment(key, amount = 1) {
        return await cache_1.default.incrby(key, amount);
    }
    /**
     * Set expiration
     */
    async expire(key, seconds) {
        await cache_1.default.expire(key, seconds);
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const [redisKeys, dbCache, expired] = await Promise.all([
                cache_1.default.dbsize(),
                database_1.default.analyticsCache.count(),
                database_1.default.analyticsCache.count({
                    where: { expiresAt: { lt: new Date() } },
                }),
            ]);
            return {
                redisKeys,
                dbCacheRecords: dbCache,
                expiredRecords: expired,
            };
        }
        catch (error) {
            logger_1.logger.error('Cache stats error:', error);
            return { redisKeys: 0, dbCacheRecords: 0, expiredRecords: 0 };
        }
    }
    /**
     * Cleanup expired cache entries
     */
    async cleanupExpired() {
        try {
            const result = await database_1.default.analyticsCache.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });
            logger_1.logger.info(`Cleaned up ${result.count} expired cache entries`);
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Cache cleanup error:', error);
            return 0;
        }
    }
    /**
     * Generate cache key for analytics
     */
    generateAnalyticsKey(endpoint, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(k => `${k}:${params[k]}`)
            .join('|');
        return `analytics:${endpoint}:${sortedParams}`;
    }
    /**
     * Invalidate all analytics cache
     */
    async invalidateAllAnalytics() {
        await this.deletePattern('analytics:*');
        logger_1.logger.info('All analytics cache invalidated');
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map