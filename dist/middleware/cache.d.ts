import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
    keyGenerator?: (req: Request) => string;
}
/**
 * Cache middleware for GET requests
 */
export declare const cache: (options?: CacheOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Invalidate cache by pattern
 */
export declare const invalidateCache: (pattern: string) => Promise<void>;
/**
 * Invalidate all cache
 */
export declare const invalidateAllCache: () => Promise<void>;
//# sourceMappingURL=cache.d.ts.map