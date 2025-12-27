"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const cache_1 = __importDefault(require("../config/cache"));
class CacheService {
    /**
     * Get cached value
     */
    async get(key) {
        const data = await cache_1.default.get(key);
        return data ? JSON.parse(data) : null;
    }
    /**
     * Set cached value
     */
    async set(key, value, ttl) {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await cache_1.default.setex(key, ttl, serialized);
        }
        else {
            await cache_1.default.set(key, serialized);
        }
    }
    /**
     * Delete cached value
     */
    async delete(key) {
        await cache_1.default.del(key);
    }
    /**
     * Delete by pattern
     */
    async deletePattern(pattern) {
        const keys = await cache_1.default.keys(pattern);
        if (keys.length > 0) {
            await cache_1.default.del(...keys);
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
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        // Fetch data
        const data = await fetcher();
        // Store in cache
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
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map