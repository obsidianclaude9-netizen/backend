export declare class CacheService {
    /**
     * Get cached value
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached value
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
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map