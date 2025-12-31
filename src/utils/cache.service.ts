import redis from '../config/cache';
import prisma from '../config/database';
import { logger } from './logger';
import { monitoring } from './monitoring.service';
import crypto from 'crypto';

export class CacheService {
  private readonly DEFAULT_TTL = 300;
  private isRedisHealthy = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeHealthCheck();
  }

  private initializeHealthCheck() {
    this.checkRedisHealth();

    this.healthCheckInterval = setInterval(() => {
      this.checkRedisHealth();
    }, 30000);
  }

  private async checkRedisHealth() {
    try {
      await redis.ping();
      if (!this.isRedisHealthy) {
        logger.info('Redis connection restored');
      }
      this.isRedisHealthy = true;
    } catch (error) {
      if (this.isRedisHealthy) {
        logger.error('Redis connection lost');
      }
      this.isRedisHealthy = false;
    }
  }

  isHealthy(): boolean {
    return this.isRedisHealthy;
  }

  private async safeRedisOperation<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.isRedisHealthy) {
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      logger.error('Redis operation failed:', error);
      this.isRedisHealthy = false;
      return fallback;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    if (this.isRedisHealthy) {
      try {
        const data = await redis.get(key);
        if (data) {
          monitoring.trackCacheHit('redis', key);
          return JSON.parse(data);
        }
      } catch (error) {
        logger.error(`Redis get failed for ${key}:`, error);
        monitoring.captureException(error as Error, { operation: 'cache.get', key });
        this.isRedisHealthy = false;
      }
    }

    if (key.startsWith('analytics:')) {
      try {
        const dbCache = await prisma.analyticsCache.findUnique({
          where: { 
            cacheKey: key,
            expiresAt: { gt: new Date() },
          },
        });

        if (dbCache) {
          monitoring.trackCacheHit('database', key);
          return dbCache.data as T;
        }
      } catch (dbError) {
        logger.error(`DB cache get failed for ${key}:`, dbError);
        monitoring.captureException(dbError as Error, { operation: 'db-cache.get', key });
      }
    }

    monitoring.trackCacheMiss(key);
    return null;
  }
  
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    if (ttl !== undefined && (ttl < 0 || ttl > 86400 * 7)) {
      throw new Error('TTL must be between 0 and 604800 seconds (7 days)');
    }

    try {
      const serialized = JSON.stringify(value);
      const effectiveTTL = ttl || this.DEFAULT_TTL;

      const redisSuccess = await this.safeRedisOperation(
        () => redis.setex(key, effectiveTTL, serialized).then(() => true),
        false
      );

      if (key.startsWith('analytics:')) {
        const expiresAt = new Date(Date.now() + effectiveTTL * 1000);
        
        try {
          await prisma.analyticsCache.upsert({
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
        } catch (dbError) {
          logger.error(`DB cache write failed for ${key}:`, dbError);
        }
      }

      return redisSuccess;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    try {
      const redisSuccess = await this.safeRedisOperation(
        () => redis.del(key).then(() => true),
        false
      );

      if (key.startsWith('analytics:')) {
        try {
          await prisma.analyticsCache.delete({
            where: { cacheKey: key },
          }).catch(() => {});
        } catch {
        }
      }

      return redisSuccess;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    this.validatePattern(pattern);

    const exactPrefix = pattern.endsWith('*')
      ? pattern.slice(0, -1)
      : pattern;

    let deletedCount = 0;

    try {
      if (this.isRedisHealthy) {
        let cursor = '0';
        const keys: string[] = [];

        do {
          const [nextCursor, foundKeys] = await redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
          );
          cursor = nextCursor;
          keys.push(...foundKeys);
        } while (cursor !== '0');

        if (keys.length > 0) {
          if (keys.length > 10000) {
            throw new Error('Pattern matches too many keys (>10000)');
          }

          const pipeline = redis.pipeline();
          keys.forEach(key => pipeline.del(key));
          await pipeline.exec();
          deletedCount = keys.length;
        }
      }

      const dbResult = await prisma.analyticsCache.deleteMany({
        where: {
          cacheKey: {
            startsWith: exactPrefix
          }
        }
      });

      deletedCount += dbResult.count;

      logger.info('Cache pattern deleted', {
        pattern,
        exactPrefix,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.error('Cache pattern deletion error:', error);
      throw error;
    }
  }

  private validateKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    if (key.length > 250) {
      return false;
    }

    if (!/^[a-zA-Z0-9:_\-./]+$/.test(key)) {
      return false;
    }

    return true;
  }

  private validatePattern(pattern: string): void {
    const ALLOWED_PREFIXES = [
      'analytics',
      'api',
      'blacklist',
      'lockout',
      'rl',
      'cache',
      'session',
      'nonce'
    ];

    if (!/^[a-zA-Z0-9:_\-]+\*?$/.test(pattern)) {
      throw new Error('Invalid cache pattern format');
    }

    if (pattern.length > 100) {
      throw new Error('Cache pattern too long');
    }

    if (pattern.includes('*') && !pattern.endsWith('*')) {
      throw new Error('Wildcard only allowed at end');
    }

    const exactPrefix = pattern.endsWith('*')
      ? pattern.slice(0, -1)
      : pattern;

    const prefix = exactPrefix.split(':')[0];

    if (!ALLOWED_PREFIXES.includes(prefix)) {
      throw new Error(`Cache prefix '${prefix}' not allowed`);
    }

    if (exactPrefix.split(':').length < 2) {
      throw new Error('Cache pattern too broad');
    }
  }

  async del(key: string): Promise<boolean> {
    return await this.delete(key);
  }

  async flush(): Promise<boolean> {
    try {
      const redisSuccess = await this.safeRedisOperation(
        () => redis.flushdb().then(() => true),
        false
      );

      await prisma.analyticsCache.deleteMany({});
      
      logger.warn('All cache flushed');
      return redisSuccess;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.validateKey(key)) {
      return false;
    }

    return await this.safeRedisOperation(
      () => redis.exists(key).then(result => result === 1),
      false
    );
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    
    const lockKey = `lock:${key}`;
    const lockValue = crypto.randomBytes(16).toString('hex');
    const lockTTL = 10;
    
    let lockAcquired = false;
    
    try {
      lockAcquired = await this.safeRedisOperation(
        async () => {
          const result = await redis.set(
            lockKey, 
            lockValue, 
            'EX',
            lockTTL,
            'NX'
          );
          return result === 'OK';
        },
        false
      );
      
      if (!lockAcquired) {
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
          const retry = await this.get<T>(key);
          if (retry !== null) return retry;
        }
        
        logger.warn(`Failed to acquire lock for ${key}, proceeding without lock`);
      }
      
      const data = await fetcher();
      await this.set(key, data, ttl);
      return data;
      
    } catch (error) {
      logger.error(`getOrSet failed for ${key}:`, error);
      throw error;
    } finally {
      if (lockAcquired) {
        try {
          const currentLock = await redis.get(lockKey);
          if (currentLock === lockValue) {
            await redis.del(lockKey);
          }
        } catch (error) {
          logger.error(`Failed to release lock for ${key}:`, error);
        }
      }
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    if (amount < 1 || amount > 1000000) {
      throw new Error('Increment amount must be between 1 and 1000000');
    }

    return await this.safeRedisOperation(
      () => redis.incrby(key, amount),
      0
    );
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.validateKey(key)) {
      throw new Error('Invalid cache key format');
    }

    if (seconds < 1 || seconds > 86400 * 7) {
      throw new Error('TTL must be between 1 and 604800 seconds');
    }

    return await this.safeRedisOperation(
      () => redis.expire(key, seconds).then(() => true),
      false
    );
  }

  async ttl(key: string): Promise<number> {
    if (!this.validateKey(key)) {
      return -1;
    }

    return await this.safeRedisOperation(
      () => redis.ttl(key),
      -1
    );
  }

  async getStats(): Promise<{
    redisHealthy: boolean;
    redisKeys: number;
    dbCacheRecords: number;
    expiredRecords: number;
  }> {
    try {
      const redisKeys = await this.safeRedisOperation(
        () => redis.dbsize(),
        0
      );

      const [dbCache, expired] = await Promise.all([
        prisma.analyticsCache.count(),
        prisma.analyticsCache.count({
          where: { expiresAt: { lt: new Date() } },
        }),
      ]);

      return {
        redisHealthy: this.isRedisHealthy,
        redisKeys,
        dbCacheRecords: dbCache,
        expiredRecords: expired,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { 
        redisHealthy: this.isRedisHealthy,
        redisKeys: 0, 
        dbCacheRecords: 0, 
        expiredRecords: 0 
      };
    }
  }

  async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.analyticsCache.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      logger.info(`Cleaned up ${result.count} expired cache entries`);
      return result.count;
    } catch (error) {
      logger.error('Cache cleanup error:', error);
      return 0;
    }
  }

  generateAnalyticsKey(
    endpoint: string,
    params: Record<string, any>
  ): string {
    const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => {
        const sanitizedKey = String(k).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const sanitizedValue = String(params[k]).replace(/[^a-zA-Z0-9_\-]/g, '_');
        return `${sanitizedKey}:${sanitizedValue}`;
      })
      .join('|');
    
    const key = `analytics:${sanitizedEndpoint}:${sortedParams}`;
    
    if (key.length > 250) {
      const hash = crypto.createHash('sha256').update(sortedParams).digest('hex').slice(0, 32);
      return `analytics:${sanitizedEndpoint}:${hash}`;
    }
    
    return key;
  }

  async invalidateAllAnalytics(): Promise<void> {
    await this.deletePattern('analytics:*');
    logger.info('All analytics cache invalidated');
  }

  async flushAll(): Promise<boolean> {
    try {
      const redisSuccess = await this.safeRedisOperation(
        () => redis.flushall().then(() => true),
        false
      );

      await prisma.analyticsCache.deleteMany({});
      
      logger.warn('All cache flushed');
      return redisSuccess;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    if (keys.length === 0) return [];

    if (keys.length > 1000) {
      throw new Error('Too many keys for mget (max 1000)');
    }

    for (const key of keys) {
      if (!this.validateKey(key)) {
        throw new Error(`Invalid key format: ${key}`);
      }
    }

    const results = await this.safeRedisOperation(
      () => redis.mget(...keys),
      keys.map(() => null)
    );

    return results.map(data => {
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    });
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (entries.length === 0) return true;

    if (entries.length > 1000) {
      throw new Error('Too many entries for mset (max 1000)');
    }

    try {
      const pipeline = redis.pipeline();

      for (const { key, value, ttl } of entries) {
        if (!this.validateKey(key)) {
          throw new Error(`Invalid key format: ${key}`);
        }

        const serialized = JSON.stringify(value);
        const effectiveTTL = ttl || this.DEFAULT_TTL;
        pipeline.setex(key, effectiveTTL, serialized);
      }

      await this.safeRedisOperation(
        () => pipeline.exec().then(() => true),
        false
      );

      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

export const cacheService = new CacheService();