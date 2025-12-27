export declare class CacheService {
    private readonly DEFAULT_TTL;
    /**
     * Get cached value (with database fallback for analytics)
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached value (dual write to Redis and DB for analytics)
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Delete cached value
     */
    delete(key: string): Promise<void>;
    /**
     * Delete by pattern
     */
    deletePattern(pattern: string): Promise<void>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get or set (cache-aside pattern)
     */
    getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Increment counter
     */
    increment(key: string, amount?: number): Promise<number>;
    /**
     * Set expiration
     */
    expire(key: string, seconds: number): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        redisKeys: number;
        dbCacheRecords: number;
        expiredRecords: number;
    }>;
    /**
     * Cleanup expired cache entries
     */
    cleanupExpired(): Promise<number>;
    /**
     * Generate cache key for analytics
     */
    generateAnalyticsKey(endpoint: string, params: Record<string, any>): string;
    /**
     * Invalidate all analytics cache
     */
    invalidateAllAnalytics(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map